const mongoose =
    require("mongoose");

const Bet =
    require("../models/Bet");

const GameRound =
    require("../models/GameRound");

const Payout =
    require("../models/Payout");

const User =
    require("../models/User");

const walletService =
    require("./walletService");

const settingsService =
    require("./settingsService");

const referralService =
    require("./referralService");

const gameEngine =
    require("../game/engine/gameEngine");

const {
    getIO,
} = require("../socket/socket");


// ==========================================================
// ALLOWED COLORS
// ==========================================================

const ALLOWED_COLORS = [
    "red",
    "green",
    "blue",
];


// ==========================================================
// ALLOWED WALLET MODES
// ==========================================================

const ALLOWED_WALLET_MODES = [
    "real",
    "test",
    "bonus",
];


// ==========================================================
// WALLET POOL FOR A GIVEN MODE
// ==========================================================
//
// "real" uses the canonical balance field directly via
// walletService.debit/credit; "test"/"bonus" go through
// the pool-aware debitPool/creditPool and never fall back
// to another pool if that one is short.
// ==========================================================

const POOL_BY_MODE = {
    test: "testBalance",
    bonus: "bonusBalance",
};


// ==========================================================
// BONUS BET-FUNDING CAP (30% of the bet amount)
// ==========================================================
//
// Fixed platform rule, not admin-configurable (unlike
// bonus_conversion_rate, which is a different, pre-existing
// setting governing how much of a WIN converts pools - see
// payoutService.js). For every "real"-mode bet, at most this
// fraction of the bet amount may be funded from bonusBalance;
// the remainder always comes from real balance. If the user's
// bonus balance is smaller than the cap, only what's available
// is used and the rest comes from real balance.
// ==========================================================

const BONUS_BET_CAP_RATIO = 0.3;


// ==========================================================
// COMPUTE BONUS / REAL SPLIT FOR A GIVEN AMOUNT
// ==========================================================
//
// Server-authoritative - never trusts any client-supplied
// split. bonusUsed is rounded to 2dp and capped at both the
// 30% ceiling and the user's actual available bonus balance;
// realUsed is the exact remainder (amount - bonusUsed), so the
// two legs always sum back to `amount` with no rounding drift.
// ==========================================================

const computeBonusSplit = (
    amount,
    availableBonusBalance
) => {

    const maxBonusAllowed =
        Math.round(
            amount *
            BONUS_BET_CAP_RATIO *
            100
        ) / 100;

    const bonusUsed =
        Math.max(
            Math.min(
                maxBonusAllowed,
                Number(availableBonusBalance) || 0
            ),
            0
        );

    const realUsed =
        Math.round(
            (amount - bonusUsed) *
            100
        ) / 100;

    return {
        bonusUsed,
        realUsed,
    };

};


// ==========================================================
// BET INCREASE CUTOFF (seconds before betting closes)
// ==========================================================
//
// Server-authoritative - computed strictly from the round's
// own endTime (set by the game engine), never from any
// client-supplied timer/clock value.
// ==========================================================

const BET_INCREASE_LOCK_SECONDS = 5;


// ==========================================================
// EMIT CURRENT ROUND STATS
// ==========================================================

const emitCurrentRoundStats = async (
    roundId
) => {

    try {

        // ==================================================
        // GET BETS
        // ==================================================

        const bets =
            await Bet.find({
                round: roundId,
            }).lean();


        // ==================================================
        // BASIC STATISTICS
        // ==================================================

        const totalBets =
            bets.length;


        const uniquePlayers =
            new Set(
                bets.map(
                    (bet) =>
                        String(
                            bet.user
                        )
                )
            ).size;


        const totalBetAmount =
            bets.reduce(
                (total, bet) =>
                    total +
                    Number(
                        bet.amount || 0
                    ),
                0
            );


        const totalPayout =
            bets.reduce(
                (total, bet) =>
                    total +
                    Number(
                        bet.payout || 0
                    ),
                0
            );


        // ==================================================
        // COLOR EXPOSURE
        // ==================================================

        const redAmount =
            bets
                .filter(
                    (bet) =>
                        bet.color === "red"
                )
                .reduce(
                    (total, bet) =>
                        total +
                        Number(
                            bet.amount || 0
                        ),
                    0
                );


        const greenAmount =
            bets
                .filter(
                    (bet) =>
                        bet.color === "green"
                )
                .reduce(
                    (total, bet) =>
                        total +
                        Number(
                            bet.amount || 0
                        ),
                    0
                );


        const blueAmount =
            bets
                .filter(
                    (bet) =>
                        bet.color === "blue"
                )
                .reduce(
                    (total, bet) =>
                        total +
                        Number(
                            bet.amount || 0
                        ),
                    0
                );


        // ==================================================
        // SOCKET
        // ==================================================

        const io =
            getIO();


        io.to(
            "admin_game_monitor"
        ).emit(
            "admin_round_stats",
            {

                roundId,

                totalPlayers:
                    uniquePlayers,

                totalBets,

                totalBetAmount,

                totalPayout,

                colors: {

                    red:
                        redAmount,

                    green:
                        greenAmount,

                    blue:
                        blueAmount,

                },

            }
        );


        return {

            totalPlayers:
                uniquePlayers,

            totalBets,

            totalBetAmount,

            totalPayout,

            colors: {

                red:
                    redAmount,

                green:
                    greenAmount,

                blue:
                    blueAmount,

            },

        };

    } catch (error) {

        /*
         * Statistics failure must NEVER
         * break bet placement.
         */

        console.error(
            "Admin Stats Socket Error:",
            error.message
        );


        return null;

    }

};


// ==========================================================
// BET SERVICE
// ==========================================================

class BetService {

    // ======================================================
    // PLACE BET
    // ======================================================

    async placeBet(
        userId,
        color,
        amount,
        mode = "real"
    ) {

        // ==================================================
        // -1. VALIDATE WALLET MODE
        // ==================================================

        if (
            !ALLOWED_WALLET_MODES.includes(
                mode
            )
        ) {

            throw new Error(
                "Invalid wallet mode."
            );

        }

        // ==================================================
        // 0. CHECK USER
        // ==================================================

        const user =
            await User.findById(
                userId
            ).select(
                "status"
            );


        if (!user) {

            throw new Error(
                "User not found."
            );

        }


        if (
            user.status ===
            "blocked"
        ) {

            throw new Error(
                "Your account has been blocked."
            );

        }


        // ==================================================
        // 1. GET GAME SETTINGS
        // ==================================================

        const gameSettings =
            await settingsService.getValues(
                "game",
                [
                    "games_enabled",
                    "minimum_bet",
                    "maximum_bet",
                ]
            );


        const gamesEnabled =
            gameSettings.games_enabled
            ?? true;


        const minimumBet =
            Number(
                gameSettings.minimum_bet
            );


        const maximumBet =
            Number(
                gameSettings.maximum_bet
            );


        // ==================================================
        // 2. CHECK GAME ENABLED
        // ==================================================

        if (
            gamesEnabled !== true
        ) {

            throw new Error(
                "Games are currently disabled. Betting is unavailable."
            );

        }


        // ==================================================
        // 3. VALIDATE COLOR
        // ==================================================

        if (
            typeof color !== "string"
        ) {

            throw new Error(
                "Invalid color selected."
            );

        }


        color =
            color
                .trim()
                .toLowerCase();


        if (
            !ALLOWED_COLORS.includes(
                color
            )
        ) {

            throw new Error(
                "Invalid color selected."
            );

        }


        // ==================================================
        // 4. VALIDATE AMOUNT
        // ==================================================

        if (
            typeof amount !== "number" ||
            !Number.isFinite(amount)
        ) {

            throw new Error(
                "Invalid bet amount."
            );

        }


        if (
            !Number.isFinite(
                minimumBet
            ) ||
            !Number.isFinite(
                maximumBet
            )
        ) {

            throw new Error(
                "Game betting limits are not configured correctly."
            );

        }


        if (
            minimumBet >
            maximumBet
        ) {

            throw new Error(
                "Game betting limits are configured incorrectly."
            );

        }


        // ==================================================
        // 5. MINIMUM BET
        // ==================================================

        if (
            amount <
            minimumBet
        ) {

            throw new Error(
                `Minimum bet amount is ${minimumBet}.`
            );

        }


        // ==================================================
        // 6. MAXIMUM BET
        // ==================================================

        if (
            amount >
            maximumBet
        ) {

            throw new Error(
                `Maximum bet amount is ${maximumBet}.`
            );

        }


        // ==================================================
        // 7. GAME ENGINE STATE
        // ==================================================

        if (
            !gameEngine.isRunning()
        ) {

            throw new Error(
                "Game is currently stopped. Betting is unavailable."
            );

        }


        if (
            gameEngine.isPaused()
        ) {

            throw new Error(
                "Game is currently paused. Betting is temporarily unavailable."
            );

        }


        // ==================================================
        // 8. FIND CURRENT BETTING ROUND
        // ==================================================

        const round =
            await GameRound.findOne({

                status:
                    "betting",

            }).sort({

                roundNumber:
                    -1,

            });


        if (!round) {

            throw new Error(
                "No active betting round."
            );

        }


        // ==================================================
        // 9. CHECK ROUND TIMER
        // ==================================================

        const currentTime =
            new Date();


        if (
            currentTime >=
            round.endTime
        ) {

            /*
             * Defensive check only - do NOT mutate
             * round.status here. gameEngine/timer are the
             * sole owners of round-state transitions; a
             * second writer here raced with the engine's
             * own lock-on-timeout and could clobber it.
             */

            throw new Error(
                "Betting time has ended."
            );

        }


        // ==================================================
        // 10. CHECK GAME STATE AGAIN
        // ==================================================

        if (
            round.status !==
            "betting"
        ) {

            throw new Error(
                "Betting is currently closed."
            );

        }


        // ==================================================
        // 11. PREVENT DUPLICATE BET
        // ==================================================

        const existingBet =
            await Bet.findOne({

                user:
                    userId,

                round:
                    round._id,

            });


        if (existingBet) {

            throw new Error(
                "You already placed a bet in this round."
            );

        }


        // ==================================================
        // 12. DEBIT WALLET (pool matching the chosen mode)
        // ==================================================
        //
        // "real" mode now automatically blends bonusBalance
        // (up to BONUS_BET_CAP_RATIO of the bet amount) with
        // real balance - see computeBonusSplit(). Both legs are
        // debited atomically inside one MongoDB transaction so
        // a failure on either leg rolls back both (no partial
        // deduction). "bonus" mode (100% bonus funding) is no
        // longer offered for new bets - it's superseded by the
        // automatic blend - but is left in ALLOWED_WALLET_MODES
        // so historical "bonus"-mode bets already in the
        // database keep settling correctly.
        // ==================================================

        const remark =
            `Color Prediction - ${color} - Round ${round.roundNumber}`;


        if (mode === "bonus") {

            throw new Error(
                "Bonus mode is no longer available on its own. Bonus balance is now automatically applied (up to 30%) to real-money bets."
            );

        }


        let bonusUsed = 0;

        let realUsed = amount;


        if (mode === "real") {

            const wallet =
                await walletService.getWallet(
                    userId
                );

            const availableBonus =
                Number(
                    wallet?.bonusBalance || 0
                );

            const split =
                computeBonusSplit(
                    amount,
                    availableBonus
                );

            bonusUsed =
                split.bonusUsed;

            realUsed =
                split.realUsed;


            const debitSession =
                await mongoose.startSession();


            try {

                debitSession.startTransaction();


                if (bonusUsed > 0) {

                    await walletService.debitPool(
                        userId,
                        bonusUsed,
                        "bet",
                        `${remark} (Bonus portion)`,
                        "bonusBalance",
                        { session: debitSession }
                    );

                }


                await walletService.debit(
                    userId,
                    realUsed,
                    "bet",
                    `${remark} (Real money portion)`,
                    { session: debitSession }
                );


                await debitSession.commitTransaction();


            } catch (error) {

                await debitSession.abortTransaction();

                throw error;

            } finally {

                await debitSession.endSession();

            }

        } else {

            await walletService.debitPool(
                userId,
                amount,
                "bet",
                remark,
                POOL_BY_MODE[mode]
            );

        }


        // ==================================================
        // 13. CREATE BET
        // ==================================================

        let bet;


        try {

            bet =
                await Bet.create({

                    user:
                        userId,

                    round:
                        round._id,

                    color,

                    amount,

                    walletMode:
                        mode,

                    bonusAmount:
                        mode === "real"
                            ? bonusUsed
                            : 0,

                    realAmount:
                        mode === "real"
                            ? realUsed
                            : 0,

                    result:
                        "pending",

                    payout:
                        0,

                });

        } catch (error) {

            // ==============================================
            // REFUND WALLET (same pool(s) it was debited from)
            // ==============================================

            try {

                const refundRemark =
                    `Bet Refund - Round ${round.roundNumber}`;


                if (mode === "real") {

                    const refundSession =
                        await mongoose.startSession();


                    try {

                        refundSession.startTransaction();


                        if (bonusUsed > 0) {

                            await walletService.creditPool(
                                userId,
                                bonusUsed,
                                "refund",
                                `${refundRemark} (Bonus portion)`,
                                "bonusBalance",
                                { session: refundSession }
                            );

                        }


                        await walletService.credit(
                            userId,
                            realUsed,
                            "refund",
                            `${refundRemark} (Real money portion)`,
                            { session: refundSession }
                        );


                        await refundSession.commitTransaction();


                    } catch (innerRefundError) {

                        await refundSession.abortTransaction();

                        throw innerRefundError;

                    } finally {

                        await refundSession.endSession();

                    }

                } else {

                    await walletService.creditPool(
                        userId,
                        amount,
                        "refund",
                        refundRemark,
                        POOL_BY_MODE[mode]
                    );

                }

            } catch (refundError) {

                console.error(
                    "Bet Refund Error:",
                    refundError.message
                );

            }


            /*
             * Two concurrent requests both passed the
             * findOne pre-check above; the unique index
             * on {user, round} is what actually stopped
             * the double bet. Surface the same friendly
             * message as the pre-check.
             */

            if (error?.code === 11000) {

                throw new Error(
                    "You already placed a bet in this round."
                );

            }


            throw error;

        }


        // ==================================================
        // 14. UPDATE ROUND STATISTICS
        // ==================================================

        round.totalBets += 1;

        round.totalAmount += amount;


        await round.save();


        // ==================================================
        // 15. EMIT ADMIN STATS
        // ==================================================

        await emitCurrentRoundStats(
            round._id
        );


        // ==================================================
        // 15b. REFERRAL QUALIFICATION (real-mode bets only)
        // ==================================================
        //
        // Best-effort / non-blocking - must never affect the
        // outcome of bet placement itself.

        if (mode === "real") {

            referralService
                .qualifyReferral(userId)
                .catch(() => {});

        }


        // ==================================================
        // 16. RETURN BET
        // ==================================================

        return bet;

    }


    // ======================================================
    // INCREASE EXISTING BET (same color only)
    // ======================================================
    //
    // Only allowed while more than BET_INCREASE_LOCK_SECONDS
    // remain before the round's own (server-set) endTime.
    // Debits ONLY the additional amount, and atomically
    // increments the existing Bet document's amount inside a
    // single MongoDB transaction - if either the wallet debit
    // or the bet update fails, both roll back together, so a
    // failed increase can never leave a dangling deduction or
    // a corrupted bet amount. The max-bet-limit check and the
    // increment itself are combined into ONE atomic
    // findOneAndUpdate condition so concurrent increase
    // requests can never race past the limit or lose an
    // update.
    // ======================================================

    async increaseBet(
        userId,
        color,
        additionalAmount
    ) {

        // ==================================================
        // 0. CHECK USER
        // ==================================================

        const user =
            await User.findById(
                userId
            ).select(
                "status"
            );


        if (!user) {

            throw new Error(
                "User not found."
            );

        }


        if (
            user.status ===
            "blocked"
        ) {

            throw new Error(
                "Your account has been blocked."
            );

        }


        // ==================================================
        // 1. GET GAME SETTINGS
        // ==================================================

        const gameSettings =
            await settingsService.getValues(
                "game",
                [
                    "games_enabled",
                    "minimum_bet",
                    "maximum_bet",
                ]
            );


        const gamesEnabled =
            gameSettings.games_enabled
            ?? true;


        const maximumBet =
            Number(
                gameSettings.maximum_bet
            );


        if (
            gamesEnabled !== true
        ) {

            throw new Error(
                "Games are currently disabled. Betting is unavailable."
            );

        }


        if (
            !Number.isFinite(
                maximumBet
            )
        ) {

            throw new Error(
                "Game betting limits are not configured correctly."
            );

        }


        // ==================================================
        // 2. VALIDATE COLOR
        // ==================================================

        if (
            typeof color !== "string"
        ) {

            throw new Error(
                "Invalid color selected."
            );

        }


        color =
            color
                .trim()
                .toLowerCase();


        if (
            !ALLOWED_COLORS.includes(
                color
            )
        ) {

            throw new Error(
                "Invalid color selected."
            );

        }


        // ==================================================
        // 3. VALIDATE ADDITIONAL AMOUNT
        // ==================================================

        const additional =
            Number(
                additionalAmount
            );


        if (
            !Number.isFinite(
                additional
            ) ||
            additional <= 0
        ) {

            throw new Error(
                "Invalid increase amount."
            );

        }


        // ==================================================
        // 4. GAME ENGINE STATE
        // ==================================================

        if (
            !gameEngine.isRunning()
        ) {

            throw new Error(
                "Game is currently stopped. Betting is unavailable."
            );

        }


        if (
            gameEngine.isPaused()
        ) {

            throw new Error(
                "Game is currently paused. Betting is temporarily unavailable."
            );

        }


        // ==================================================
        // 5. FIND CURRENT BETTING ROUND
        // ==================================================

        const round =
            await GameRound.findOne({

                status:
                    "betting",

            }).sort({

                roundNumber:
                    -1,

            });


        if (!round) {

            throw new Error(
                "No active betting round."
            );

        }


        // ==================================================
        // 6. SERVER-AUTHORITATIVE TIMING CHECK
        // ==================================================
        //
        // Never trust a client-supplied timer/clock value -
        // computed strictly from round.endTime (set by the
        // game engine) versus the server's own current time.
        // ==================================================

        const currentTime =
            new Date();


        if (
            currentTime >=
            round.endTime
        ) {

            throw new Error(
                "Betting time has ended."
            );

        }


        const millisecondsRemaining =
            round.endTime.getTime() -
            currentTime.getTime();


        if (
            millisecondsRemaining <=
            BET_INCREASE_LOCK_SECONDS * 1000
        ) {

            throw new Error(
                `Bet increases are only allowed while more than ${BET_INCREASE_LOCK_SECONDS} seconds remain before betting closes.`
            );

        }


        // ==================================================
        // 7. CHECK ROUND STATUS AGAIN
        // ==================================================

        if (
            round.status !==
            "betting"
        ) {

            throw new Error(
                "Betting is currently closed."
            );

        }


        // ==================================================
        // 8. FIND EXISTING BET (same color only)
        // ==================================================

        const existingBet =
            await Bet.findOne({

                user:
                    userId,

                round:
                    round._id,

            });


        if (!existingBet) {

            throw new Error(
                "You have not placed a bet in this round yet. Place a bet first."
            );

        }


        if (
            existingBet.result !==
            "pending"
        ) {

            throw new Error(
                "This bet has already been settled and can no longer be modified."
            );

        }


        if (
            existingBet.color !==
            color
        ) {

            throw new Error(
                `You can only increase your bet on the color you already selected (${existingBet.color}).`
            );

        }


        // ==================================================
        // 9. VALIDATE RESULTING TOTAL AGAINST MAX BET
        // ==================================================
        //
        // The actual enforcement happens atomically inside the
        // findOneAndUpdate below (step 11) - this is only a
        // fast, friendly pre-check so a doomed request fails
        // before touching the wallet.
        // ==================================================

        const currentAmount =
            Number(
                existingBet.amount || 0
            );


        if (
            currentAmount +
            additional >
            maximumBet
        ) {

            throw new Error(
                `Maximum bet amount is ${maximumBet}. You can increase by at most ${Math.max(maximumBet - currentAmount, 0)} more.`
            );

        }


        // ==================================================
        // 10. DEBIT + ATOMIC BET UPDATE (single transaction)
        // ==================================================

        const mode =
            existingBet.walletMode ||
            "real";


        const remark =
            `Color Prediction - bet increase - ${color} - Round ${round.roundNumber}`;


        const session =
            await mongoose.startSession();


        let updatedBet;


        let bonusUsed = 0;

        let realUsed = additional;


        try {

            session.startTransaction();


            if (mode === "real") {

                // ==========================================
                // BONUS/REAL SPLIT (this increment only)
                // ==========================================
                //
                // Same 30% cap applied to the incremental
                // amount, based on the bonus balance currently
                // available - keeps the cumulative bonusAmount
                // on the bet at or below 30% of its total
                // amount, since every increment (including the
                // original placeBet) individually respects the
                // cap.
                // ==========================================

                const wallet =
                    await walletService.getWallet(
                        userId,
                        { session }
                    );

                const availableBonus =
                    Number(
                        wallet?.bonusBalance || 0
                    );

                const split =
                    computeBonusSplit(
                        additional,
                        availableBonus
                    );

                bonusUsed =
                    split.bonusUsed;

                realUsed =
                    split.realUsed;


                if (bonusUsed > 0) {

                    await walletService.debitPool(
                        userId,
                        bonusUsed,
                        "bet",
                        `${remark} (Bonus portion)`,
                        "bonusBalance",
                        { session }
                    );

                }


                await walletService.debit(
                    userId,
                    realUsed,
                    "bet",
                    `${remark} (Real money portion)`,
                    { session }
                );

            } else {

                await walletService.debitPool(
                    userId,
                    additional,
                    "bet",
                    remark,
                    POOL_BY_MODE[mode],
                    { session }
                );

            }


            // ==============================================
            // ATOMIC CONDITIONAL INCREMENT
            // ==============================================
            //
            // The condition (still pending, still the same
            // color, and current amount + additional still
            // within the max-bet limit) is checked and applied
            // in ONE indivisible operation, so two concurrent
            // increase requests can never both slip past the
            // max-bet limit, and neither can silently overwrite
            // the other's increment (each $inc is additive, not
            // a read-then-write).
            // ==============================================

            updatedBet =
                await Bet.findOneAndUpdate(
                    {
                        _id:
                            existingBet._id,

                        user:
                            userId,

                        round:
                            round._id,

                        color,

                        result:
                            "pending",

                        amount: {
                            $lte:
                                maximumBet -
                                additional,
                        },
                    },
                    {
                        $inc: {
                            amount:
                                additional,

                            ...(mode === "real"
                                ? {
                                    bonusAmount:
                                        bonusUsed,

                                    realAmount:
                                        realUsed,
                                }
                                : {}),
                        },
                    },
                    {
                        session,
                        new: true,
                    }
                );


            if (!updatedBet) {

                throw new Error(
                    "Unable to increase bet - it may have already been settled, or the increase would exceed the maximum bet amount."
                );

            }


            await session.commitTransaction();


        } catch (error) {

            if (
                session.inTransaction()
            ) {

                await session.abortTransaction();

            }


            throw error;


        } finally {

            await session.endSession();

        }


        // ==================================================
        // 11. UPDATE ROUND STATISTICS
        // ==================================================

        round.totalAmount +=
            additional;


        await round.save();


        // ==================================================
        // 12. EMIT ADMIN STATS
        // ==================================================

        await emitCurrentRoundStats(
            round._id
        );


        // ==================================================
        // 13. RETURN UPDATED BET
        // ==================================================

        return updatedBet;

    }


    // ======================================================
    // GET USER BET HISTORY
    // ======================================================

    async getUserBets(
        userId,
        { page = 1, limit = 20, color, result, search, dateFrom, dateTo } = {}
    ) {

        const safeLimit =
            Math.min(Math.max(Number(limit) || 20, 1), 100);

        const safePage =
            Math.max(Number(page) || 1, 1);

        const filter = {
            user: userId,
        };


        // ==================================================
        // COLOR FILTER
        // ==================================================

        const cleanColor =
            String(color || "all").trim().toLowerCase();

        if (
            cleanColor !== "all" &&
            ALLOWED_COLORS.includes(cleanColor)
        ) {
            filter.color = cleanColor;
        }


        // ==================================================
        // RESULT FILTER
        // ==================================================

        const cleanResult =
            String(result || "all").trim().toLowerCase();

        if (
            cleanResult !== "all" &&
            ["pending", "won", "lost", "voided"].includes(cleanResult)
        ) {
            filter.result = cleanResult;
        }


        // ==================================================
        // DATE RANGE FILTER
        // ==================================================

        if (dateFrom || dateTo) {

            filter.createdAt = {};

            if (dateFrom) {

                const from = new Date(dateFrom);

                if (!Number.isNaN(from.getTime())) {
                    filter.createdAt.$gte = from;
                }

            }

            if (dateTo) {

                const to = new Date(dateTo);

                if (!Number.isNaN(to.getTime())) {

                    to.setHours(23, 59, 59, 999);

                    filter.createdAt.$lte = to;

                }

            }

            if (Object.keys(filter.createdAt).length === 0) {
                delete filter.createdAt;
            }

        }


        // ==================================================
        // SEARCH BY ROUND NUMBER (exact match, same
        // convention as the Admin Rounds search - a
        // non-numeric or unmatched search forces zero
        // results rather than silently ignoring the filter)
        // ==================================================

        const cleanSearch =
            String(search || "").trim();

        if (cleanSearch) {

            const parsedRoundNumber =
                Number(cleanSearch);

            if (Number.isFinite(parsedRoundNumber)) {

                const matchingRound =
                    await GameRound.findOne({
                        roundNumber: parsedRoundNumber,
                    })
                        .select("_id")
                        .lean();

                filter.round =
                    matchingRound
                        ? matchingRound._id
                        : { $in: [] };

            } else {

                filter.round = { $in: [] };

            }

        }


        const [bets, total] =
            await Promise.all([

                Bet.find(filter)
                    .populate(
                        "round",
                        "roundNumber result status"
                    )
                    .sort({
                        createdAt: -1,
                    })
                    .skip((safePage - 1) * safeLimit)
                    .limit(safeLimit)
                    .lean(),

                Bet.countDocuments(filter),

            ]);


        // ==================================================
        // ATTACH PAYOUT STATUS (only ever exists for bets
        // that actually won - safe fields only, no internal
        // stack traces/secrets)
        // ==================================================

        const betIds =
            bets.map((bet) => bet._id);

        const payouts =
            betIds.length > 0
                ? await Payout.find({ bet: { $in: betIds } })
                    .select("bet status payoutAmount retryCount failureReason processedAt createdAt updatedAt")
                    .lean()
                : [];

        const payoutByBetId =
            new Map(
                payouts.map((payout) => [String(payout.bet), payout])
            );

        const betsWithPayout =
            bets.map((bet) => {

                const payout =
                    payoutByBetId.get(String(bet._id));

                if (!payout) {

                    return { ...bet, payoutInfo: null };

                }

                return {

                    ...bet,

                    payoutInfo: {

                        status: payout.status,

                        payoutAmount: payout.payoutAmount,

                        attempts:
                            payout.status === "paid" ||
                                payout.status === "manual_review"
                                ? Math.max(Number(payout.retryCount || 0), 0) + 1
                                : Number(payout.retryCount || 0),

                        // User-safe reason only - never the raw
                        // internal error/stack trace.
                        reason:
                            payout.status === "manual_review" ||
                                payout.status === "failed"
                                ? "Your payout is delayed due to a technical/payment processing issue. Our team has been notified and your winnings are safe - they will be credited shortly."
                                : "",

                        processedAt: payout.processedAt || null,

                        updatedAt: payout.updatedAt,

                    },

                };

            });


        return {

            bets: betsWithPayout,

            total,

            page: safePage,

            totalPages: Math.max(Math.ceil(total / safeLimit), 1),

        };

    }

}


// ==========================================================
// EXPORT
// ==========================================================

module.exports =
    new BetService();


// ==========================================================
// EXPORT ADMIN STATS HELPER
// ==========================================================

module.exports.emitCurrentRoundStats =
    emitCurrentRoundStats;