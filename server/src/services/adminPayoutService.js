const mongoose = require("mongoose");

const Payout = require("../models/Payout");
const User = require("../models/User");
const GameRound = require("../models/GameRound");
const Transaction = require("../models/Transaction");

const payoutService = require("./payoutService");


// ==========================================
// GET ADMIN PAYOUTS
// ==========================================

const getPayouts = async ({
    page = 1,
    limit = 20,
    search = "",
    status = "all",
} = {}) => {

    page = Math.max(
        Number(page) || 1,
        1
    );

    limit = Math.min(
        Math.max(
            Number(limit) || 20,
            1
        ),
        100
    );


    const skip =
        (page - 1) * limit;


    /*
     * ==========================================
     * BASE FILTER
     * ==========================================
     */

    const filter = {};


    /*
     * ==========================================
     * STATUS FILTER
     * ==========================================
     */

    const allowedStatuses = [
        "pending",
        "processing",
        "paid",
        "failed",
        "cancelled",
        "reversed",
        "manual_review",
    ];


    if (
        status &&
        status !== "all" &&
        allowedStatuses.includes(
            status
        )
    ) {

        filter.status =
            status;

    }


    /*
     * ==========================================
     * SEARCH
     * ==========================================
     *
     * Search:
     *
     * Username
     * Email
     * Full Name
     * Round Number
     * Transaction ID
     * Payout ID
     * Bet ID
     *
     * ==========================================
     */

    if (
        search &&
        search.trim()
    ) {

        const searchText =
            search.trim();


        const searchRegex =
            new RegExp(
                searchText,
                "i"
            );


        const [
            users,
            rounds,
        ] = await Promise.all([

            User.find({

                $or: [

                    {
                        username:
                            searchRegex,
                    },

                    {
                        email:
                            searchRegex,
                    },

                    {
                        fullName:
                            searchRegex,
                    },

                ],

            })
                .select("_id")
                .lean(),


            Number.isFinite(
                Number(searchText)
            )
                ? GameRound.find({

                    roundNumber:
                        Number(
                            searchText
                        ),

                })
                    .select("_id")
                    .lean()

                : [],

        ]);


        const userIds =
            users.map(
                (user) =>
                    user._id
            );


        const roundIds =
            rounds.map(
                (round) =>
                    round._id
            );


        const orConditions = [];


        /*
         * User matches
         */

        if (
            userIds.length > 0
        ) {

            orConditions.push({

                user: {
                    $in:
                        userIds,
                },

            });

        }


        /*
         * Round matches
         */

        if (
            roundIds.length > 0
        ) {

            orConditions.push({

                round: {
                    $in:
                        roundIds,
                },

            });

        }


        /*
         * Transaction ID
         */

        orConditions.push({

            transactionId:
                searchRegex,

        });


        /*
         * Payout ObjectId
         */

        if (
            mongoose.Types.ObjectId.isValid(
                searchText
            )
        ) {

            const objectId =
                new mongoose.Types.ObjectId(
                    searchText
                );


            orConditions.push({

                _id:
                    objectId,

            });


            orConditions.push({

                bet:
                    objectId,

            });

        }


        /*
         * Make sure $or is never empty.
         */

        if (
            orConditions.length > 0
        ) {

            filter.$or =
                orConditions;

        }

    }


    /*
     * ==========================================
     * FETCH PAYOUTS
     * ==========================================
     */

    const [
        payouts,
        total,
    ] = await Promise.all([

        Payout.find(filter)

            .populate(
                "user",
                "username fullName email mobile"
            )

            .populate(
                "bet",
                "color amount result payout createdAt updatedAt"
            )

            .populate(
                "round",
                "roundNumber gameType status result startTime endTime"
            )

            .sort({
                createdAt:
                    -1,
            })

            .skip(skip)

            .limit(limit)

            .lean(),


        Payout.countDocuments(
            filter
        ),

    ]);


    /*
     * ==========================================
     * CALCULATE REFUNDS
     * ==========================================
     *
     * IMPORTANT:
     *
     * One payout can have multiple transactions:
     *
     * win
     * payout_reverse
     * refund
     * payout_restore
     *
     * Therefore payout itself is NOT unique
     * inside Transaction.payout.
     *
     * We only calculate completed/successful
     * refund transactions here.
     *
     * ==========================================
     */

    const payoutIds =
        payouts.map(
            (payout) =>
                payout._id
        );


    let refundMap = {};


    if (
        payoutIds.length > 0
    ) {

        const refundSummary =
            await Transaction.aggregate([

                {
                    $match: {

                        payout: {
                            $in:
                                payoutIds,
                        },

                        type:
                            "refund",

                        status:
                            "success",

                    },
                },


                {
                    $group: {

                        _id:
                            "$payout",

                        refundedAmount: {
                            $sum:
                                "$amount",
                        },

                    },
                },

            ]);


        refundMap =
            refundSummary.reduce(
                (
                    accumulator,
                    item
                ) => {

                    accumulator[
                        String(
                            item._id
                        )
                    ] =
                        Number(
                            item.refundedAmount ||
                            0
                        );

                    return accumulator;

                },
                {}
            );

    }


    /*
     * ==========================================
     * SUMMARY
     * ==========================================
     */

    const summaryResult =
        await Payout.aggregate([

            {
                $match:
                    filter,
            },

            {
                $group: {

                    _id:
                        null,

                    totalPayouts: {
                        $sum:
                            1,
                    },

                    totalBetAmount: {
                        $sum:
                            "$betAmount",
                    },

                    totalPayoutAmount: {
                        $sum:
                            "$payoutAmount",
                    },

                },

            },

        ]);


    const summary =
        summaryResult[0] || {

            totalPayouts:
                0,

            totalBetAmount:
                0,

            totalPayoutAmount:
                0,

        };


    /*
     * ==========================================
     * FORMAT RESPONSE
     * ==========================================
     */

    const data =
        payouts.map(
            (payout) => {

                const payoutId =
                    String(
                        payout._id
                    );


                const originalPayoutAmount =
                    Number(
                        payout.payoutAmount ||
                        0
                    );


                /*
                 * Total successfully refunded
                 */

                const refundedAmount =
                    Math.max(

                        Number(
                            refundMap[
                            payoutId
                            ] ||
                            0
                        ),

                        0

                    );


                /*
                 * Never allow refunded amount
                 * to exceed original payout amount.
                 */

                const safeRefundedAmount =
                    Math.min(

                        refundedAmount,

                        originalPayoutAmount

                    );


                /*
                 * Remaining refundable amount
                 */

                const remainingRefundable =
                    Math.max(

                        originalPayoutAmount -
                        safeRefundedAmount,

                        0

                    );


                return {

                    _id:
                        payout._id,


                    user:
                        payout.user
                            ? {

                                _id:
                                    payout.user
                                        ._id,

                                username:
                                    payout.user
                                        .username,

                                fullName:
                                    payout.user
                                        .fullName,

                                email:
                                    payout.user
                                        .email,

                                mobile:
                                    payout.user
                                        .mobile,

                            }
                            : null,


                    bet:
                        payout.bet
                            ? {

                                _id:
                                    payout.bet
                                        ._id,

                                color:
                                    payout.bet
                                        .color,

                                amount:
                                    payout.bet
                                        .amount,

                                result:
                                    payout.bet
                                        .result,

                                payout:
                                    payout.bet
                                        .payout,

                                createdAt:
                                    payout.bet
                                        .createdAt,

                                updatedAt:
                                    payout.bet
                                        .updatedAt,

                            }
                            : null,


                    round:
                        payout.round
                            ? {

                                _id:
                                    payout.round
                                        ._id,

                                roundNumber:
                                    payout.round
                                        .roundNumber,

                                gameType:
                                    payout.round
                                        .gameType,

                                status:
                                    payout.round
                                        .status,

                                result:
                                    payout.round
                                        .result,

                                startTime:
                                    payout.round
                                        .startTime,

                                endTime:
                                    payout.round
                                        .endTime,

                            }
                            : null,


                    /*
                     * ==========================================
                     * PAYOUT AMOUNTS
                     * ==========================================
                     */

                    betAmount:
                        Number(
                            payout.betAmount ||
                            0
                        ),


                    winningColor:
                        payout.winningColor ||
                        payout.round?.result ||
                        null,


                    payoutAmount:
                        originalPayoutAmount,


                    /*
                     * ==========================================
                     * REFUND INFORMATION
                     * ==========================================
                     *
                     * These fields are important for
                     * Refund User modal.
                     *
                     * ==========================================
                     */

                    refundedAmount:
                        safeRefundedAmount,


                    remainingRefundable:
                        remainingRefundable,


                    /*
                     * ==========================================
                     * PAYOUT STATUS
                     * ==========================================
                     */

                    status:
                        payout.status ||
                        "pending",


                    transactionId:
                        payout.transactionId ||
                        null,


                    failureReason:
                        payout.failureReason ||
                        "",


                    processedAt:
                        payout.processedAt ||
                        null,


                    retryCount:
                        Number(
                            payout.retryCount ||
                            0
                        ),


                    remark:
                        payout.remark ||
                        "",


                    createdAt:
                        payout.createdAt,


                    updatedAt:
                        payout.updatedAt,


                    time:
                        payout.processedAt ||
                        payout.updatedAt ||
                        payout.createdAt,

                };

            }
        );


    /*
     * ==========================================
     * PAGINATION
     * ==========================================
     */

    const totalPages =
        Math.ceil(
            total /
            limit
        );


    return {

        data,

        pagination: {

            page,

            limit,

            total,

            totalPages,

            hasNextPage:
                page <
                totalPages,

            hasPreviousPage:
                page >
                1,

        },


        summary: {

            totalPayouts:
                Number(
                    summary.totalPayouts ||
                    0
                ),

            totalBetAmount:
                Number(
                    summary.totalBetAmount ||
                    0
                ),

            totalPayoutAmount:
                Number(
                    summary.totalPayoutAmount ||
                    0
                ),

        },

    };

};


/*
|--------------------------------------------------------------------------
| RETRY PAYOUT
|--------------------------------------------------------------------------
*/

const retryPayout = async (
    payoutId,
    adminId = null
) => {

    return await payoutService.retryPayout(
        payoutId,
        adminId
    );

};


/*
|--------------------------------------------------------------------------
| MANUAL REVIEW
|--------------------------------------------------------------------------
*/

const markManualReview = async (
    payoutId,
    reason = "",
    adminId = null
) => {

    return await payoutService.markManualReview(
        payoutId,
        reason,
        adminId
    );

};


/*
|--------------------------------------------------------------------------
| CANCEL PAYOUT
|--------------------------------------------------------------------------
*/

const cancelPayout = async (
    payoutId,
    reason = "",
    adminId = null
) => {

    return await payoutService.cancelPayout(
        payoutId,
        reason,
        adminId
    );

};


/*
|--------------------------------------------------------------------------
| REVERSE PAYOUT
|--------------------------------------------------------------------------
*/

const reversePayout = async (
    payoutId,
    reason = "",
    adminId = null
) => {

    return await payoutService.reversePayout(
        payoutId,
        reason,
        adminId
    );

};


/*
|--------------------------------------------------------------------------
| REFUND PAYOUT
|--------------------------------------------------------------------------
*/

const refundPayout = async (
    payoutId,
    amount,
    reason = "",
    adminId = null
) => {

    return await payoutService.refundPayout(
        payoutId,
        amount,
        reason,
        adminId
    );

};


/*
|--------------------------------------------------------------------------
| RESTORE PAYOUT
|--------------------------------------------------------------------------
*/

const restorePayout = async (
    payoutId,
    reason = "",
    adminId = null
) => {

    return await payoutService.restorePayout(
        payoutId,
        reason,
        adminId
    );

};


/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

module.exports = {

    getPayouts,

    retryPayout,

    markManualReview,

    cancelPayout,

    reversePayout,

    refundPayout,

    restorePayout,

};