const Bet = require("../models/Bet");
const GameRound = require("../models/GameRound");
const User = require("../models/User");
const walletService = require("./walletService");
const gameEngine =
    require("../game/engine/gameEngine");

const {
    getIO,
} = require("../socket/socket");


const ALLOWED_COLORS = [
    "red",
    "green",
    "blue",
];

const MIN_BET_AMOUNT = 10;
const MAX_BET_AMOUNT = 10000;


/*
 * ==========================================
 * EMIT CURRENT ROUND STATS
 * ==========================================
 */

const emitCurrentRoundStats = async (roundId) => {

    try {

        /*
         * Get all bets for current round.
         */

        const bets = await Bet.find({
            round: roundId,
        }).lean();


        /*
         * Calculate statistics.
         */

        const totalBets =
            bets.length;


        const uniquePlayers =
            new Set(
                bets.map(
                    (bet) =>
                        String(bet.user)
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


        /*
         * Color-wise exposure.
         */

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


        /*
         * Send to admin monitoring room.
         */

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
         * Stats failure must NEVER
         * break bet placement.
         */

        console.error(
            "Admin Stats Socket Error:",
            error.message
        );

        return null;

    }

};


class BetService {

    async placeBet(
        userId,
        color,
        amount
    ) {

        /*
    * --------------------------------
    * 0. CHECK USER ACCOUNT STATUS
    * --------------------------------
    */

        const user =
            await User.findById(
                userId
            ).select(
                "status"
            );


        if (!user) {

            throw new Error(
                "User not found"
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

        /*
         * --------------------------------
         * 1. Validate Color
         * --------------------------------
         */

        if (
            !ALLOWED_COLORS.includes(
                color
            )
        ) {

            throw new Error(
                "Invalid color selected"
            );

        }


        /*
         * --------------------------------
         * 2. Validate Amount
         * --------------------------------
         */

        if (
            typeof amount !== "number" ||
            !Number.isFinite(amount)
        ) {

            throw new Error(
                "Invalid bet amount"
            );

        }


        if (
            amount <
            MIN_BET_AMOUNT
        ) {

            throw new Error(
                `Minimum bet amount is ${MIN_BET_AMOUNT}`
            );

        }


        if (
            amount >
            MAX_BET_AMOUNT
        ) {

            throw new Error(
                `Maximum bet amount is ${MAX_BET_AMOUNT}`
            );

        }

        /*
        * --------------------------------
        * GAME STATE CHECK
        * --------------------------------
        */

        if (!gameEngine.isRunning()) {

            throw new Error(
                "Game is currently stopped. Betting is unavailable."
            );

        }


        if (gameEngine.isPaused()) {

            throw new Error(
                "Game is currently paused. Betting is temporarily unavailable."
            );

        }


        /*
         * --------------------------------
         * 3. Find Current Betting Round
         * --------------------------------
         */

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
                "No active betting round"
            );

        }


        /*
         * --------------------------------
         * 4. Check Round Timer
         * --------------------------------
         */

        const currentTime =
            new Date();


        if (
            currentTime >=
            round.endTime
        ) {

            round.status =
                "locked";


            await round.save();


            throw new Error(
                "Betting time has ended"
            );

        }


        /*
         * --------------------------------
         * 5. Prevent Duplicate Bet
         * --------------------------------
         */

        const existingBet =
            await Bet.findOne({

                user:
                    userId,

                round:
                    round._id,

            });


        if (existingBet) {

            throw new Error(
                "You already placed a bet in this round"
            );

        }


        /*
         * --------------------------------
         * 6. Deduct Wallet
         * --------------------------------
         */

        await walletService.debit(

            userId,

            amount,

            "bet",

            `Color Prediction - ${color} - Round ${round.roundNumber}`

        );


        /*
         * --------------------------------
         * 7. Create Bet
         * --------------------------------
         */

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

                    result:
                        "pending",

                    payout:
                        0,

                });

        } catch (error) {

            /*
             * Refund if bet creation fails.
             */

            await walletService.credit(

                userId,

                amount,

                "refund",

                `Bet Refund - Round ${round.roundNumber}`

            );


            throw error;

        }


        /*
         * --------------------------------
         * 8. Update Round Statistics
         * --------------------------------
         */

        round.totalBets += 1;

        round.totalAmount += amount;


        await round.save();


        /*
         * --------------------------------
         * 9. Emit LIVE ADMIN STATS
         * --------------------------------
         */

        await emitCurrentRoundStats(
            round._id
        );


        /*
         * --------------------------------
         * 10. Return Bet
         * --------------------------------
         */

        return bet;

    }


    /*
     * ==========================================
     * GET USER BET HISTORY
     * ==========================================
     */

    async getUserBets(
        userId,
        limit = 20
    ) {

        const bets =
            await Bet.find({

                user:
                    userId,

            })
                .populate(
                    "round",
                    "roundNumber result status"
                )
                .sort({

                    createdAt:
                        -1,

                })
                .limit(
                    Number(limit)
                );


        return bets;

    }

}


module.exports = new BetService();

module.exports.emitCurrentRoundStats =
    emitCurrentRoundStats;