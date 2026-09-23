const mongoose =
    require("mongoose");

const createRound =
    require("./roundManager");

const generateResult =
    require("./resultGenerator");

const timer =
    require("./timer");

const GameHistory =
    require("../../models/GameHistory");

const GameRound =
    require("../../models/GameRound");

const Bet =
    require("../../models/Bet");

const walletService =
    require("../../services/walletService");

const payoutManager =
    require("./payoutManager");

const {
    getIO,
} = require("../../socket/socket");

const notificationService =
    require("../../services/notificationService");

const {
    createAuditLog,
} = require("../../services/auditLogService");


let currentRound = null;

let gameStatus = "stopped";

let pausedRemainingSeconds = null;

let roundTimerActive = false;

let isStartingRound = false;

let gameRunning = false;

let gamePaused = false;

let emergencyStopped = false;

let isProcessingRound = false;


// ==========================================
// SOCKET BROADCAST
// ==========================================

const broadcastGameState = () => {

    try {

        const io = getIO();


        const data = {

            status:
                emergencyStopped
                    ? "stopped"
                    : gamePaused
                        ? "paused"
                        : gameRunning
                            ? (
                                currentRound?.status ||
                                "betting"
                            )
                            : "stopped",

            round:
                currentRound,

            remainingSeconds:
                gamePaused
                    ? (
                        pausedRemainingSeconds ??
                        timer.getCountdown()
                    )
                    : timer.getCountdown(),

        };


        io.to(
            "color_prediction"
        ).emit(
            "game_status",
            data
        );


        io.to(
            "admin_game_monitor"
        ).emit(
            "game_status",
            data
        );

    } catch (error) {

        console.error(
            "Broadcast Game State Error:",
            error.message
        );

    }

};

// ==========================================
// GET GAME STATUS
// ==========================================

const getGameStatus = () => {

    const status =
        emergencyStopped
            ? "stopped"
            : gamePaused
                ? "paused"
                : gameRunning
                    ? "running"
                    : "stopped";

    return {

        status,

        running:
            status === "running",

        paused:
            status === "paused",

        stopped:
            status === "stopped",

        emergencyStopped,

        round:
            currentRound,

        remainingSeconds:
            status === "paused"
                ? (
                    pausedRemainingSeconds ??
                    timer.getCountdown()
                )
                : timer.getCountdown(),

    };
};


// ==========================================
// START ROUND
// ==========================================

const startRound = async () => {

    try {

        if (isStartingRound) {

            return;

        }


        if (!gameRunning) {

            return;

        }


        if (gamePaused) {

            return;

        }


        if (emergencyStopped) {

            return;

        }


        if (isProcessingRound) {

            return;

        }

        gameStatus = "running";
        gamePaused = false;
        pausedRemainingSeconds = null;
        isStartingRound = true;


        /*
         * Create round
         */

        currentRound =
            await createRound();


        isStartingRound = false;


        console.log(
            `Round ${currentRound.roundNumber} Started`
        );


        /*
         * Notify players + admin
         */

        try {

            const io = getIO();


            io.to(
                "color_prediction"
            ).emit(
                "new_round",
                {
                    round:
                        currentRound,

                    remainingSeconds:
                        Math.max(
                            Math.ceil(
                                (
                                    currentRound.endTime.getTime() -
                                    Date.now()
                                ) / 1000
                            ),
                            0
                        ),
                }
            );


            io.to(
                "admin_game_monitor"
            ).emit(
                "new_round",
                {
                    round:
                        currentRound,

                    remainingSeconds:
                        Math.max(
                            Math.ceil(
                                (
                                    currentRound.endTime.getTime() -
                                    Date.now()
                                ) / 1000
                            ),
                            0
                        ),
                }
            );

        } catch (error) {

            console.error(
                "Socket New Round Error:",
                error.message
            );

        }


        /*
         * Start Timer
         */

        const roundDuration =
            Math.max(
                Math.ceil(
                    (
                        currentRound.endTime.getTime() -
                        currentRound.startTime.getTime()
                    ) / 1000
                ),
                1
            );


        timer.startTimer(
            roundDuration,
            processRound
        );


        broadcastGameState();

    } catch (error) {

        isStartingRound = false;

        console.error(
            "Game Engine Error:",
            error.message
        );

    }

};


// ==========================================
// GET PER-COLOR BET TOTALS FOR A ROUND
// ==========================================
//
// Reads directly from the Bet collection (the authoritative
// source, not a running counter) so the totals used to pick
// the winning color always reflect every bet actually placed.
// Safe to call only once betting is locked (see processRound
// below) - betService.placeBet() itself rejects any bet once
// the round's status is no longer "betting", so no bet can be
// placed for this round after this point.
// ==========================================

const getColorTotals = async (
    roundId
) => {

    const rows =
        await Bet.aggregate([

            {
                $match: {
                    round: roundId,
                },
            },

            {
                $group: {
                    _id: "$color",
                    total: { $sum: "$amount" },
                },
            },

        ]);


    const totals = {
        red: 0,
        green: 0,
        blue: 0,
    };


    for (const row of rows) {

        if (
            Object.prototype.hasOwnProperty.call(
                totals,
                row._id
            )
        ) {

            totals[row._id] = row.total;

        }

    }


    return totals;

};


// ==========================================
// FINALIZE ROUND SETTLEMENT
// ==========================================
//
// Shared tail of a round's lifecycle: pay out every bet,
// mark the round completed, record history, notify clients.
// Used both by the normal timer-driven processRound() below
// AND by recoverOrphanedRound() when a round's result was
// already durably saved before a crash - payoutService is
// idempotent (safe to call again on an already-partially-paid
// round: it synchronizes already-paid bets instead of paying
// them twice), so resuming here after an interruption is safe.
// ==========================================

const finalizeRoundSettlement = async (
    round,
    result
) => {

    const payoutResult =
        await payoutManager.processPayout(
            round._id,
            result
        );

    round.status =
        "completed";

    await round.save();


    /*
     * GameHistory has no unique constraint on roundNumber, so
     * guard against a duplicate entry in the (normally
     * unreachable, since this only runs for rounds not yet
     * "completed") case where this exact round's history was
     * somehow already recorded.
     */

    const alreadyRecorded =
        await GameHistory.findOne({
            roundNumber: round.roundNumber,
        });

    if (!alreadyRecorded) {

        await GameHistory.create({

            roundNumber:
                round.roundNumber,

            result,

            totalPlayers:
                round.totalBets,

            totalBetAmount:
                round.totalAmount,

            totalPayout:
                payoutResult.totalPayout,

        });

    }


    console.log(
        `Round ${round.roundNumber} Completed`
    );

    console.log(
        `Total Bets: ${payoutResult.totalBets}`
    );

    console.log(
        `Winning Bets: ${payoutResult.winningBets}`
    );

    console.log(
        `Total Payout: ${payoutResult.totalPayout}`
    );


    /*
     * Send result to players + admin
     */

    try {

        const io = getIO();


        const resultData = {

            roundNumber:
                round.roundNumber,

            result,

            totalBets:
                payoutResult.totalBets,

            winningBets:
                payoutResult.winningBets,

            totalPayout:
                payoutResult.totalPayout,

        };


        io.to(
            "color_prediction"
        ).emit(
            "round_result",
            resultData
        );


        io.to(
            "admin_game_monitor"
        ).emit(
            "round_result",
            resultData
        );

    } catch (error) {

        console.error(
            "Socket Result Error:",
            error.message
        );

    }


    return payoutResult;

};


// ==========================================
// REFUND ALL PENDING BETS FOR A ROUND
// ==========================================
//
// Used when a round is cancelled/voided before a valid result
// was ever officially finalized (persisted). Refunds every
// still-"pending" bet's stake back to whichever wallet pool it
// was staked from, exactly once - each bet is refunded inside
// its own transaction that atomically (a) compare-and-swaps the
// bet from "pending" to "voided" and (b) credits the wallet, so
// the two can never diverge. If this function (or the whole
// process) is interrupted and re-run later, any bet already
// flipped to "voided" is simply skipped by the query below -
// there is no window where a bet can be credited twice, and no
// window where it can be marked "voided" without being credited
// (both happen in one committed transaction, or neither does).
// ==========================================

const refundRoundBets = async (
    round
) => {

    const pendingBets =
        await Bet.find({
            round: round._id,
            result: "pending",
        });

    for (const bet of pendingBets) {

        const session =
            await mongoose.startSession();

        try {

            session.startTransaction();

            const claimedBet =
                await Bet.findOneAndUpdate(
                    {
                        _id: bet._id,
                        round: round._id,
                        result: "pending",
                    },
                    {
                        result: "voided",
                    },
                    {
                        session,
                        new: true,
                    }
                );

            if (!claimedBet) {

                /*
                 * Already refunded by a previous pass - nothing
                 * left to do for this bet.
                 */

                await session.abortTransaction();

                continue;

            }

            const remark =
                `Refund - Round ${round.roundNumber} cancelled (no result finalized)`;

            if (claimedBet.walletMode === "real") {

                await walletService.credit(
                    claimedBet.user,
                    claimedBet.amount,
                    "refund",
                    remark,
                    { session }
                );

            } else {

                await walletService.creditPool(
                    claimedBet.user,
                    claimedBet.amount,
                    "refund",
                    remark,
                    claimedBet.walletMode === "test"
                        ? "testBalance"
                        : "bonusBalance",
                    { session }
                );

            }

            await session.commitTransaction();

        } catch (error) {

            if (session.inTransaction()) {

                await session.abortTransaction();

            }

            console.error(
                `Refund Error for bet ${bet._id}:`,
                error.message
            );

        } finally {

            await session.endSession();

        }

    }

    return pendingBets.length;

};


// ==========================================
// PROCESS ROUND
// ==========================================

const processRound = async () => {

    if (isProcessingRound) {

        return;

    }


    isProcessingRound = true;


    try {

        if (!currentRound) {

            isProcessingRound = false;

            return;

        }


        if (!gameRunning) {

            isProcessingRound = false;

            return;

        }


        /*
         * Lock betting
         */

        console.log(
            `Round ${currentRound.roundNumber} Betting Closed`
        );


        currentRound.status =
            "locked";


        await currentRound.save();


        broadcastGameState();


        /*
         * Notify players
         */

        try {

            const io = getIO();


            io.to(
                "color_prediction"
            ).emit(
                "betting_closed",
                {
                    roundNumber:
                        currentRound.roundNumber,
                }
            );


            io.to(
                "admin_game_monitor"
            ).emit(
                "betting_closed",
                {
                    roundNumber:
                        currentRound.roundNumber,
                }
            );

        } catch (error) {

            console.error(
                "Socket Betting Closed Error:",
                error.message
            );

        }


        /*
         * Generate result - server-authoritative: the winning
         * color is always whichever color has the LOWEST total
         * bet amount for this round (ties broken randomly among
         * only the tied colors). Computed strictly from bets
         * already persisted in the DB after betting was locked
         * above - no client/frontend input is ever involved.
         */

        const colorTotals =
            await getColorTotals(
                currentRound._id
            );

        const {
            result,
            lowestAmount,
            tiedColors,
        } = generateResult(colorTotals);


        console.log(
            `Round ${currentRound.roundNumber} Bet Totals - ` +
            `Red: ${colorTotals.red}, Green: ${colorTotals.green}, Blue: ${colorTotals.blue}`
        );

        console.log(
            `Round ${currentRound.roundNumber} Result: ${result}` +
            (
                tiedColors.length > 1
                    ? ` (tie-break among: ${tiedColors.join(", ")} @ ${lowestAmount})`
                    : ""
            )
        );


        /*
         * Audit log (system-generated, durable record for
         * admin/audit/debugging) - aggregate bet totals and the
         * selected color only, never user-identifying or
         * financial-account data.
         */

        createAuditLog({
            actorType: "system",
            action: "game.round_result_settled",
            module: "game",
            key: String(currentRound.roundNumber),
            metadata: {
                roundId: String(currentRound._id),
                roundNumber: currentRound.roundNumber,
                colorTotals,
                lowestAmount,
                selectedColor: result,
                tieBreak: tiedColors.length > 1,
                tiedColors,
            },
        }).catch((error) => {

            console.error(
                "Round Result Audit Log Error:",
                error.message
            );

        });


        /*
         * Persist the result immediately - this is the durable
         * "officially finalized" checkpoint crash-recovery keys
         * off of (see recoverOrphanedRound below). Anything that
         * happens after this save can be safely resumed rather
         * than refunded if the process is interrupted.
         */

        currentRound.result =
            result;

        await currentRound.save();


        /*
         * Process payouts, complete the round, record history,
         * notify clients.
         */

        await finalizeRoundSettlement(
            currentRound,
            result
        );


        isProcessingRound = false;


        /*
         * Automatically start next round
         */

        if (
            gameRunning &&
            !gamePaused &&
            !emergencyStopped
        ) {

            setTimeout(
                () => {

                    startRound();

                },
                3000
            );

        }

    } catch (error) {

        isProcessingRound = false;

        isStartingRound = false;


        console.error(
            "Round Processing Error:",
            error.message
        );

    }

};


// ==========================================
// RECOVER ORPHANED ROUND
// ==========================================
//
// Runs on every startGame() call - both on every server boot
// AND whenever an admin resumes after stopping the game - so a
// GameRound left in "betting"/"locked" with no engine watching
// it (from a crash, a deploy restart, or an admin stop) is
// always safely resolved before any new round is started.
// MongoDB (the GameRound doc's persisted status/result/endTime)
// is the sole source of truth here - nothing about a round's
// fate is inferred from in-memory state that a restart would
// have already wiped.
//
// Three cases, decided purely from what is durably persisted:
//
//   1) Still genuinely within its original betting window
//      (status "betting", endTime still in the future) - a
//      restart mid-round is not a failure. Resume this exact
//      round in place with the remaining time on its timer;
//      no bets are touched, nothing is refunded.
//
//   2) A result was already durably saved before the
//      interruption (see the early currentRound.save() in
//      processRound) - the round WAS officially finalized in
//      the sense that matters (betting closed, outcome
//      decided). Resume settlement exactly like a normal
//      completion. payoutService is idempotent, so any bets
//      already paid before the crash are safely skipped, never
//      double-paid.
//
//   3) Betting closed (by the timer or an admin action) and no
//      result was ever persisted - this round did not reach a
//      valid, officially finalized outcome. Refund every
//      pending bet's stake exactly once (see refundRoundBets)
//      and void the round.
//
// Returns true if an existing round is still active and the
// caller should NOT start a new one; false otherwise.
// ==========================================

const recoverOrphanedRound = async () => {

    try {

        const orphanedRound =
            await GameRound.findOne({
                status: {
                    $in: ["betting", "locked"],
                },
            }).sort({
                roundNumber: -1,
            });

        if (!orphanedRound) {

            return false;

        }

        const now =
            Date.now();


        /*
         * Case 2: a result was already durably persisted.
         */

        if (orphanedRound.result) {

            console.warn(
                `Recovering round #${orphanedRound.roundNumber} - result already finalized (${orphanedRound.result}), resuming settlement.`
            );

            await finalizeRoundSettlement(
                orphanedRound,
                orphanedRound.result
            );

            return false;

        }


        /*
         * Case 1: still genuinely within its original betting
         * window - nothing has actually gone wrong.
         */

        if (
            orphanedRound.status === "betting" &&
            orphanedRound.endTime &&
            orphanedRound.endTime.getTime() > now
        ) {

            const remainingSeconds =
                Math.max(
                    Math.ceil(
                        (orphanedRound.endTime.getTime() - now) / 1000
                    ),
                    1
                );

            console.warn(
                `Recovering round #${orphanedRound.roundNumber} - still within its betting window (${remainingSeconds}s left), resuming in place.`
            );

            currentRound =
                orphanedRound;

            gameStatus =
                "running";

            timer.startTimer(
                remainingSeconds,
                processRound
            );

            broadcastGameState();

            return true;

        }


        /*
         * Case 3: betting closed with no finalized result -
         * refund every pending bet's stake exactly once, then
         * void the round.
         */

        const previousStatus =
            orphanedRound.status;

        console.warn(
            `Recovering round #${orphanedRound.roundNumber} left in "${previousStatus}" with no finalized result - refunding and voiding.`
        );

        const refundedCount =
            await refundRoundBets(
                orphanedRound
            );

        orphanedRound.status = "void";

        await orphanedRound.save();

        notificationService
            .notifyAdmins(
                "system",
                "Round voided on recovery",
                `Round #${orphanedRound.roundNumber} was left in "${previousStatus}" with no finalized result (crash, restart or admin stop) and has been voided. ${refundedCount} pending bet(s) were refunded.`,
                { roundId: String(orphanedRound._id), roundNumber: orphanedRound.roundNumber, refundedBets: refundedCount }
            )
            .catch(() => {});

        return false;

    } catch (error) {

        console.error(
            "Recover Orphaned Round Error:",
            error.message
        );

        return false;

    }

};


const startGame = async () => {

    if (gameRunning) {

        if (gamePaused) {

            return resumeGame();

        }


        return {

            success: true,

            message:
                "Game is already running.",

        };

    }


    emergencyStopped = false;

    gamePaused = false;

    gameRunning = true;

    gameStatus = "running";

    pausedRemainingSeconds = null;


    console.log(
        "Game Engine Started By Admin"
    );


    const resumedExistingRound =
        await recoverOrphanedRound();


    if (!resumedExistingRound) {

        await startRound();

    }


    return {

        success: true,

        status: "running",

    };

};


// ==========================================
// PAUSE GAME
// ==========================================

const pauseGame = async () => {

    if (!gameRunning) {

        throw new Error(
            "Game is not running."
        );

    }


    if (gamePaused) {

        return {

            success: true,

            status: "paused",

            message:
                "Game is already paused.",

        };

    }


    gamePaused = true;

    gameStatus = "paused";

    pausedRemainingSeconds =
        timer.getCountdown();


    /*
     * Pause timer
     */

    timer.pauseTimer();


    /*
     * IMPORTANT:
     *
     * Do NOT change GameRound.status
     * to "paused".
     *
     * "paused" is a game-engine state.
     */

    broadcastGameState();


    console.log(
        "Game Paused By Admin"
    );


    return {

        success: true,

        status: "paused",

        round:
            currentRound,

        remainingSeconds:
            timer.getCountdown(),

    };

};


// ==========================================
// RESUME GAME
// ==========================================

const resumeGame = async () => {

    if (!gameRunning) {

        throw new Error(
            "Game is not running."
        );

    }


    if (!gamePaused) {

        return {

            success: true,

            status: "running",

            message:
                "Game is already running.",

        };

    }


    gamePaused = false;

    gameStatus = "running";


    /*
     * Restore betting
     */

    if (currentRound) {

        currentRound.status =
            "betting";

        await currentRound.save();

    }


    /*
     * Resume timer
     */

    timer.resumeTimer();


    broadcastGameState();


    console.log(
        "Game Resumed By Admin"
    );


    return {

        success: true,

        status: "running",

        round:
            currentRound,

        remainingSeconds:
            timer.getCountdown(),

    };

};


// ==========================================
// STOP GAME
// ==========================================

const stopGame = async () => {

    if (!gameRunning) {

        return {

            success: true,

            status: "stopped",

            message:
                "Game is already stopped.",

        };

    }


    gameRunning = false;

    gamePaused = false;

    gameStatus = "stopped";

    pausedRemainingSeconds = null;


    /*
     * Stop timer
     */

    timer.stopTimer();


    /*
     * Lock current round
     */

    if (currentRound) {

        currentRound.status =
            "locked";

        await currentRound.save();

    }


    broadcastGameState();


    console.log(
        "Game Stopped By Admin"
    );


    return {

        success: true,

        status: "stopped",

        round:
            currentRound,

    };

};


// ==========================================
// EMERGENCY STOP
// ==========================================

const emergencyStop = async () => {

    gameRunning = false;
    gamePaused = false;
    gameStatus = "stopped";
    pausedRemainingSeconds = null;
    emergencyStopped = true;


    /*
     * Immediately stop timer
     */

    timer.stopTimer();


    /*
     * Immediately lock betting
     */

    if (currentRound) {

        currentRound.status =
            "locked";

        await currentRound.save();

    }


    /*
     * Notify clients
     */

    try {

        const io = getIO();


        io.to(
            "color_prediction"
        ).emit(
            "emergency_stop",
            {
                message:
                    "Game temporarily stopped by administrator.",
            }
        );


        io.to(
            "admin_game_monitor"
        ).emit(
            "emergency_stop",
            {
                message:
                    "Game temporarily stopped by administrator.",
            }
        );

    } catch (error) {

        console.error(
            "Emergency Socket Error:",
            error.message
        );

    }


    broadcastGameState();


    console.log(
        "EMERGENCY STOP ACTIVATED"
    );


    return {

        success: true,

        status: "emergency_stopped",

    };

};


// ==========================================
// START NEW ROUND
// ==========================================

const startNewRound = async () => {

    if (!gameRunning) {

        throw new Error(
            "Game is not running."
        );

    }


    /*
     * Stop current timer
     */

    timer.stopTimer();


    /*
     * Settle the round being abandoned, if any - createRound()
     * (called via startRound() below) force-completes any
     * round still not "completed"/"void" with no payout at all,
     * so this MUST be fully resolved first or its bets would be
     * silently stranded (never paid, never refunded, and no
     * longer reachable by crash recovery once "completed").
     */

    if (currentRound) {

        if (currentRound.result) {

            /*
             * A result was already determined for this round -
             * finish settling it properly rather than abandoning
             * it mid-flight.
             */

            await finalizeRoundSettlement(
                currentRound,
                currentRound.result
            );

        } else if (
            currentRound.status !== "completed" &&
            currentRound.status !== "void"
        ) {

            /*
             * No result was ever finalized for this round -
             * refund every pending bet's stake, then void it.
             */

            await refundRoundBets(
                currentRound
            );

            currentRound.status =
                "void";

            await currentRound.save();

        }

    }


    gamePaused = false;

    emergencyStopped = false;

    gameRunning = true;

    gameStatus = "running";

    pausedRemainingSeconds = null;


    /*
     * Start a fresh round
     */

    await startRound();


    return {

        success: true,

        status: "running",

        round:
            currentRound,

    };

};


// ==========================================
// VOID CURRENT ROUND
// ==========================================

const voidCurrentRound = async () => {

    if (!currentRound) {

        throw new Error(
            "No current round."
        );

    }


    timer.stopTimer();


    /*
     * No result was ever finalized for this round - refund
     * every pending bet's stake before voiding it. (If a
     * result was already determined, leave bets untouched -
     * voiding at that point is an explicit admin override, not
     * a cancellation, and refunding could let a losing bet
     * dodge its outcome or shortchange a winner.)
     */

    if (!currentRound.result) {

        await refundRoundBets(
            currentRound
        );

    }


    currentRound.status =
        "void";

    pausedRemainingSeconds = null;


    await currentRound.save();


    broadcastGameState();


    return {

        success: true,

        status: "void",

        round:
            currentRound,

    };

};


// ==========================================
// GET CURRENT ROUND
// ==========================================

const getCurrentRound = () => {

    return currentRound;

};


// ==========================================
// GET TIMER
// ==========================================

const getTimer = () => {

    return timer.getCountdown();

};


// ==========================================
// GET GAME FLAGS
// ==========================================

const isRunning = () => {

    return gameRunning;

};


const isPaused = () => {

    return gamePaused;

};


const isStopped = () => {

    return !gameRunning;

};


// ==========================================
// EXPORT
// ==========================================

module.exports = {

    /*
     * Existing
     */

    startGameEngine:
        startGame,

    getCurrentRound,

    getTimer,

    getGameStatus,


    /*
     * Admin controls
     */

    startGame,

    pauseGame,

    resumeGame,

    stopGame,

    emergencyStop,

    startNewRound,

    voidCurrentRound,


    /*
     * Status
     */

    isRunning,

    isPaused,

    isStopped,

};