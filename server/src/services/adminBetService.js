const mongoose = require("mongoose");

const Bet = require("../models/Bet");


// ==========================================
// GET ADMIN BETS
// ==========================================

const getBets = async ({
    page = 1,
    limit = 20,
    search = "",
    color = "all",
    result = "all",
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
     * FILTER
     * ==========================================
     */

    const filter = {};


    /*
     * Color
     */

    if (
        color &&
        color !== "all"
    ) {
        filter.color = color;
    }


    /*
     * Result
     */

    if (
        result &&
        result !== "all"
    ) {
        filter.result = result;
    }


    /*
     * Search
     *
     * User username/email and
     * round number are supported.
     */

    let searchUserIds = [];


    if (
        search &&
        search.trim()
    ) {

        const User =
            mongoose.model("User");


        const searchRegex =
            new RegExp(
                search.trim(),
                "i"
            );


        const users =
            await User.find({
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
                .lean();


        searchUserIds =
            users.map(
                (user) =>
                    user._id
            );


        /*
         * If search is a valid ObjectId,
         * also allow direct user search.
         */

        if (
            mongoose.Types.ObjectId.isValid(
                search.trim()
            )
        ) {

            searchUserIds.push(
                new mongoose.Types.ObjectId(
                    search.trim()
                )
            );

        }


        /*
         * Search round number.
         */

        const GameRound =
            mongoose.model(
                "GameRound"
            );


        const roundNumber =
            Number(
                search.trim()
            );


        let roundIds = [];


        if (
            Number.isFinite(
                roundNumber
            )
        ) {

            const rounds =
                await GameRound.find({
                    roundNumber,
                })
                    .select("_id")
                    .lean();


            roundIds =
                rounds.map(
                    (round) =>
                        round._id
                );

        }


        /*
         * Nothing matched.
         */

        if (
            searchUserIds.length === 0 &&
            roundIds.length === 0
        ) {

            return {
                data: [],
                pagination: {
                    page,
                    limit,
                    total: 0,
                    totalPages: 0,
                    hasNextPage: false,
                    hasPreviousPage:
                        page > 1,
                },
                summary: {
                    totalBets: 0,
                    totalAmount: 0,
                    totalPayout: 0,
                    wonBets: 0,
                    lostBets: 0,
                    pendingBets: 0,
                },
            };

        }


        filter.$or = [];


        if (
            searchUserIds.length
        ) {

            filter.$or.push({
                user: {
                    $in:
                        searchUserIds,
                },
            });

        }


        if (
            roundIds.length
        ) {

            filter.$or.push({
                round: {
                    $in:
                        roundIds,
                },
            });

        }

    }


    /*
     * ==========================================
     * FETCH BETS
     * ==========================================
     */

    const [
        bets,
        total,
    ] = await Promise.all([

        Bet.find(filter)
            .populate(
                "user",
                "username fullName email"
            )
            .populate(
                "round",
                "roundNumber status result startTime endTime"
            )
            .sort({
                createdAt: -1,
            })
            .skip(skip)
            .limit(limit)
            .lean(),

        Bet.countDocuments(
            filter
        ),

    ]);


    /*
     * ==========================================
     * SUMMARY
     * ==========================================
     *
     * Summary is calculated from the
     * complete filtered dataset.
     */

    const summaryResult =
        await Bet.aggregate([

            {
                $match: filter,
            },

            {
                $group: {
                    _id: null,

                    totalBets: {
                        $sum: 1,
                    },

                    totalAmount: {
                        $sum: "$amount",
                    },

                    totalPayout: {
                        $sum: "$payout",
                    },

                    wonBets: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: [
                                        "$result",
                                        "won",
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },

                    lostBets: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: [
                                        "$result",
                                        "lost",
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },

                    pendingBets: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: [
                                        "$result",
                                        "pending",
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },

        ]);


    const summary =
        summaryResult[0] || {
            totalBets: 0,
            totalAmount: 0,
            totalPayout: 0,
            wonBets: 0,
            lostBets: 0,
            pendingBets: 0,
        };


    /*
     * ==========================================
     * FORMAT RESPONSE
     * ==========================================
     */

    const data =
        bets.map(
            (bet) => ({
                _id:
                    bet._id,

                user:
                    bet.user
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

                round:
                    bet.round
                        ? {
                            _id:
                                bet.round._id,

                            roundNumber:
                                bet.round
                                    .roundNumber,

                            status:
                                bet.round
                                    .status,

                            result:
                                bet.round
                                    .result,

                            startTime:
                                bet.round
                                    .startTime,

                            endTime:
                                bet.round
                                    .endTime,
                        }
                        : null,

                color:
                    bet.color,

                amount:
                    Number(
                        bet.amount || 0
                    ),

                result:
                    bet.result,

                payout:
                    Number(
                        bet.payout || 0
                    ),

                createdAt:
                    bet.createdAt,

                updatedAt:
                    bet.updatedAt,
            })
        );


    const totalPages =
        Math.ceil(
            total / limit
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
                page > 1,
        },

        summary: {
            totalBets:
                summary.totalBets ||
                0,

            totalAmount:
                summary.totalAmount ||
                0,

            totalPayout:
                summary.totalPayout ||
                0,

            wonBets:
                summary.wonBets ||
                0,

            lostBets:
                summary.lostBets ||
                0,

            pendingBets:
                summary.pendingBets ||
                0,
        },

    };
};


module.exports = {
    getBets,
};