const mongoose = require("mongoose");

const GameRound =
    require("../models/GameRound");

const Bet =
    require("../models/Bet");


// ==========================================
// GET ROUND DETAIL
// ==========================================

const getRoundDetail = async (
    roundId
) => {

    /*
     * --------------------------------------
     * VALIDATE ID
     * --------------------------------------
     */

    if (
        !mongoose.Types.ObjectId.isValid(
            roundId
        )
    ) {
        throw new Error(
            "Invalid round ID."
        );
    }


    /*
     * --------------------------------------
     * GET ROUND
     * --------------------------------------
     */

    const round =
        await GameRound.findById(
            roundId
        ).lean();


    if (!round) {
        throw new Error(
            "Round not found."
        );
    }


    /*
     * --------------------------------------
     * GET BETS
     * --------------------------------------
     */

    const bets =
        await Bet.find({
            round: round._id,
        })
            .populate(
                "user",
                "username fullName email"
            )
            .sort({
                createdAt: -1,
            })
            .lean();


    /*
     * --------------------------------------
     * CALCULATE SUMMARY
     * --------------------------------------
     */

    const uniqueUsers =
        new Set();

    let totalAmount = 0;

    let totalPayout = 0;

    let wonBets = 0;

    let lostBets = 0;

    let pendingBets = 0;


    const colorTotals = {
        red: 0,
        green: 0,
        blue: 0,
    };


    /*
     * --------------------------------------
     * FORMAT BETS
     * --------------------------------------
     */

    const formattedBets =
        bets.map((bet) => {

            /*
             * Unique users
             */

            if (bet.user?._id) {
                uniqueUsers.add(
                    String(
                        bet.user._id
                    )
                );
            }


            /*
             * Amount
             */

            const amount =
                Number(
                    bet.amount || 0
                );


            /*
             * Payout
             */

            const payout =
                Number(
                    bet.payout || 0
                );


            totalAmount += amount;

            totalPayout += payout;


            /*
             * Result
             */

            if (
                bet.result === "won"
            ) {
                wonBets++;
            } else if (
                bet.result === "lost"
            ) {
                lostBets++;
            } else {
                pendingBets++;
            }


            /*
             * Color totals
             */

            if (
                colorTotals[
                bet.color
                ] !== undefined
            ) {
                colorTotals[
                    bet.color
                ] += amount;
            }


            return {
                _id: bet._id,

                user: bet.user
                    ? {
                        _id:
                            bet.user._id,

                        username:
                            bet.user.username ||
                            null,

                        fullName:
                            bet.user.fullName ||
                            null,

                        email:
                            bet.user.email ||
                            null,
                    }
                    : null,

                color:
                    bet.color,

                amount,

                result:
                    bet.result,

                payout,

                createdAt:
                    bet.createdAt,

                updatedAt:
                    bet.updatedAt,
            };

        });


    /*
     * --------------------------------------
     * RETURN
     * --------------------------------------
     */

    return {

        round: {
            _id:
                round._id,

            roundNumber:
                round.roundNumber,

            gameType:
                round.gameType,

            status:
                round.status,

            startTime:
                round.startTime,

            endTime:
                round.endTime,

            result:
                round.result,

            totalBets:
                round.totalBets,

            totalAmount:
                round.totalAmount,

            createdAt:
                round.createdAt,

            updatedAt:
                round.updatedAt,
        },


        summary: {

            players:
                uniqueUsers.size,

            totalBets:
                formattedBets.length,

            totalAmount,

            totalPayout,

            wonBets,

            lostBets,

            pendingBets,

            colorTotals,
        },


        bets:
            formattedBets,

    };

};


module.exports = {
    getRoundDetail,
};