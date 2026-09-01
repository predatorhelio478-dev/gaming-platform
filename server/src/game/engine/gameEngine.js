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

const payoutManager =
    require("./payoutManager");

const {
    getIO,
} = require("../../socket/socket");


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
                        30,
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
                        30,
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

        timer.startTimer(
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
         * Generate result
         */

        const result =
            generateResult();


        console.log(
            `Round ${currentRound.roundNumber} Result: ${result}`
        );


        /*
         * Save result
         */

        currentRound.result =
            result;


        /*
         * Process payouts
         */

        const payoutResult =
            await payoutManager.processPayout(
                currentRound._id,
                result
            );


        /*
         * Complete round
         */

        currentRound.status =
            "completed";


        await currentRound.save();


        /*
         * Save history
         */

        await GameHistory.create({

            roundNumber:
                currentRound.roundNumber,

            result,

            totalPlayers:
                currentRound.totalBets,

            totalBetAmount:
                currentRound.totalAmount,

            totalPayout:
                payoutResult.totalPayout,

        });


        console.log(
            `Round ${currentRound.roundNumber} Completed`
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
                    currentRound.roundNumber,

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
// START GAME
// ==========================================

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


    await startRound();


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
     * Lock current round if present
     */

    if (currentRound) {

        currentRound.status =
            "locked";

        await currentRound.save();

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