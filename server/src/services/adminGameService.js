const gameEngine = require("../game/engine/gameEngine");

const Bet = require("../models/Bet");
const GameRound = require("../models/GameRound");
const GameHistory = require("../models/GameHistory");


// ==========================================
// ADMIN GAME SERVICE
// ==========================================

class AdminGameService {

    /*
     * ------------------------------------------
     * GET GAME STATUS
     * ------------------------------------------
     */

    async getGameStatus() {

        /*
         * --------------------------------------
         * Current Round
         * --------------------------------------
         */

        const currentRound =
            typeof gameEngine.getCurrentRound === "function"
                ? gameEngine.getCurrentRound()
                : null;


        /*
         * --------------------------------------
         * Current Timer
         * --------------------------------------
         */

        const remainingSeconds =
            typeof gameEngine.getTimer === "function"
                ? gameEngine.getTimer()
                : 0;


        /*
         * --------------------------------------
         * Database Round
         *
         * We use DB as the source of truth
         * for betting statistics.
         * --------------------------------------
         */

        let dbRound = null;


        if (currentRound?._id) {

            dbRound =
                await GameRound.findById(
                    currentRound._id
                );

        }


        /*
         * Fallback:
         *
         * If engine round is unavailable,
         * find latest active round.
         */

        if (!dbRound) {

            dbRound =
                await GameRound.findOne({
                    status: {
                        $in: [
                            "betting",
                            "locked",
                        ],
                    },
                })
                    .sort({
                        roundNumber: -1,
                    });

        }


        /*
         * --------------------------------------
         * Default Statistics
         * --------------------------------------
         */

        let totalPlayers = 0;

        let totalBets = 0;

        let totalBetAmount = 0;

        let totalPayout = 0;


        let distribution = {
            red: 0,
            green: 0,
            blue: 0,
        };


        /*
         * --------------------------------------
         * Current Round Bets
         * --------------------------------------
         */

        if (dbRound) {

            const roundBets =
                await Bet.find({
                    round: dbRound._id,
                }).select(
                    "user color amount payout result"
                );


            /*
             * Total Bets
             */

            totalBets =
                roundBets.length;


            /*
             * Total Players
             *
             * Unique users only.
             */

            const uniquePlayers =
                new Set(
                    roundBets.map(
                        (bet) =>
                            String(bet.user)
                    )
                );


            totalPlayers =
                uniquePlayers.size;


            /*
             * Total Bet Amount
             */

            totalBetAmount =
                roundBets.reduce(
                    (total, bet) =>
                        total +
                        Number(bet.amount || 0),
                    0
                );


            /*
             * Total Payout
             */

            totalPayout =
                roundBets.reduce(
                    (total, bet) =>
                        total +
                        Number(bet.payout || 0),
                    0
                );


            /*
             * Color Distribution
             */

            distribution.red =
                roundBets
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


            distribution.green =
                roundBets
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


            distribution.blue =
                roundBets
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

        }


        /*
         * --------------------------------------
         * Last Completed Result
         * --------------------------------------
         */

        const lastHistory =
            await GameHistory.findOne()
                .sort({
                    createdAt: -1,
                });


        /*
         * --------------------------------------
         * Game Status
         * --------------------------------------
         */

        let gameStatus = "stopped";


        if (dbRound) {

            if (
                dbRound.status === "betting"
            ) {

                gameStatus =
                    "betting";

            } else if (
                dbRound.status === "locked"
            ) {

                gameStatus =
                    "locked";

            } else {

                gameStatus =
                    dbRound.status;
            }

        }


        /*
         * --------------------------------------
         * Return Complete Dashboard Data
         * --------------------------------------
         */

        return {

            running:
                Boolean(currentRound),

            paused: false,

            stopped:
                !currentRound,

            status:
                gameStatus,


            round: dbRound
                ? {
                    _id:
                        dbRound._id,

                    roundNumber:
                        dbRound.roundNumber,

                    status:
                        dbRound.status,

                    result:
                        dbRound.result || null,

                    totalBets:
                        totalBets,

                    totalAmount:
                        totalBetAmount,

                    startTime:
                        dbRound.startTime || null,

                    endTime:
                        dbRound.endTime || null,
                }
                : null,


            remainingSeconds:
                Number(
                    remainingSeconds || 0
                ),


            statistics: {

                totalPlayers,

                totalBets,

                totalBetAmount,

                totalPayout,

            },


            distribution,


            lastResult:
                lastHistory?.result ||
                null,


            lastRoundNumber:
                lastHistory?.roundNumber ||
                null,

        };

    }


    /*
     * ------------------------------------------
     * START GAME
     * ------------------------------------------
     */

    async startGame(admin) {

        this.ensureAdmin(admin);

        if (
            typeof gameEngine.startGame !==
            "function"
        ) {

            throw new Error(
                "Game engine start control is not configured yet."
            );

        }

        const result =
            await gameEngine.startGame();

        return {
            action: "start",
            result,
        };

    }


    /*
     * ------------------------------------------
     * PAUSE GAME
     * ------------------------------------------
     */

    async pauseGame(admin) {

        this.ensureAdmin(admin);

        if (
            typeof gameEngine.pauseGame !==
            "function"
        ) {

            throw new Error(
                "Game engine pause control is not configured yet."
            );

        }

        const result =
            await gameEngine.pauseGame();

        return {
            action: "pause",
            result,
        };

    }


    /*
     * ------------------------------------------
     * RESUME GAME
     * ------------------------------------------
     */

    async resumeGame(admin) {

        this.ensureAdmin(admin);

        if (
            typeof gameEngine.resumeGame !==
            "function"
        ) {

            throw new Error(
                "Game engine resume control is not configured yet."
            );

        }

        const result =
            await gameEngine.resumeGame();

        return {
            action: "resume",
            result,
        };

    }


    /*
     * ------------------------------------------
     * STOP GAME
     * ------------------------------------------
     */

    async stopGame(admin) {

        this.ensureAdmin(admin);

        if (
            typeof gameEngine.stopGame !==
            "function"
        ) {

            throw new Error(
                "Game engine stop control is not configured yet."
            );

        }

        const result =
            await gameEngine.stopGame();

        return {
            action: "stop",
            result,
        };

    }


    /*
     * ------------------------------------------
     * EMERGENCY STOP
     * ------------------------------------------
     */

    async emergencyStop(admin) {

        this.ensureAdmin(admin);

        if (
            typeof gameEngine.emergencyStop !==
            "function"
        ) {

            throw new Error(
                "Game engine emergency-stop control is not configured yet."
            );

        }

        const result =
            await gameEngine.emergencyStop();

        return {
            action: "emergency_stop",
            result,
        };

    }


    /*
     * ------------------------------------------
     * START NEW ROUND
     * ------------------------------------------
     */

    async startNewRound(admin) {

        this.ensureAdmin(admin);

        if (
            typeof gameEngine.startNewRound !==
            "function"
        ) {

            throw new Error(
                "Manual new-round control is not configured yet."
            );

        }

        const result =
            await gameEngine.startNewRound();

        return {
            action: "new_round",
            result,
        };

    }


    /*
     * ------------------------------------------
     * VOID CURRENT ROUND
     * ------------------------------------------
     */

    async voidCurrentRound(admin) {

        this.ensureAdmin(admin);

        if (
            typeof gameEngine.voidCurrentRound !==
            "function"
        ) {

            throw new Error(
                "Round void/refund control is not configured yet."
            );

        }

        const result =
            await gameEngine.voidCurrentRound();

        return {
            action: "void_round",
            result,
        };

    }


    /*
     * ------------------------------------------
     * ADMIN VALIDATION
     * ------------------------------------------
     */

    ensureAdmin(admin) {

        if (!admin) {

            throw new Error(
                "Administrator authentication required."
            );

        }


        if (!admin.isActive) {

            throw new Error(
                "Administrator account is disabled."
            );

        }


        const allowedRoles = [
            "super_admin",
            "admin",
            "operator",
        ];


        if (
            !allowedRoles.includes(
                admin.role
            )
        ) {

            throw new Error(
                "You do not have permission to control the game."
            );

        }

    }

}


module.exports =
    new AdminGameService();