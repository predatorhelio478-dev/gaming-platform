const mongoose = require("mongoose");

const GameRound = require("../models/GameRound");
const Bet = require("../models/Bet");
const adminRoundService = require("../services/adminRoundService");

// ==========================================
// GET ADMIN ROUND LIST
// ==========================================

exports.getRounds = async (req, res) => {
    try {
        /*
         * ------------------------------------------
         * PAGINATION
         * ------------------------------------------
         */

        const page = Math.max(
            Number.parseInt(
                req.query.page || "1",
                10
            ),
            1
        );

        const limit = Math.min(
            Math.max(
                Number.parseInt(
                    req.query.limit || "20",
                    10
                ),
                1
            ),
            100
        );

        const skip =
            (page - 1) * limit;


        /*
         * ------------------------------------------
         * FILTERS
         * ------------------------------------------
         */

        const search = String(
            req.query.search || ""
        ).trim();

        const status = String(
            req.query.status || "all"
        )
            .trim()
            .toLowerCase();

        const result = String(
            req.query.result || "all"
        )
            .trim()
            .toLowerCase();


        const match = {};


        /*
         * ------------------------------------------
         * STATUS FILTER
         * ------------------------------------------
         */

        if (
            status &&
            status !== "all"
        ) {
            match.status = status;
        }


        /*
         * ------------------------------------------
         * RESULT FILTER
         * ------------------------------------------
         */

        if (
            result &&
            result !== "all"
        ) {
            match.result = result;
        }


        /*
         * ------------------------------------------
         * SEARCH ROUND NUMBER
         * ------------------------------------------
         *
         * Round number is Number, so convert
         * numeric search into exact match.
         *
         */

        if (search) {

            const roundNumber =
                Number(search);


            if (
                Number.isFinite(
                    roundNumber
                )
            ) {

                match.roundNumber =
                    roundNumber;

            } else {

                /*
                 * Search value is not a valid
                 * round number.
                 *
                 * Force zero results.
                 */

                match.roundNumber = {
                    $in: [],
                };

            }

        }


        /*
         * ------------------------------------------
         * BASE ROUND QUERY
         * ------------------------------------------
         */

        const roundsPipeline = [
            {
                $match: match,
            },

            {
                $sort: {
                    roundNumber: -1,
                },
            },

            {
                $skip: skip,
            },

            {
                $limit: limit,
            },

            /*
             * Join bets belonging to round.
             */

            {
                $lookup: {
                    from: "bets",
                    localField: "_id",
                    foreignField: "round",
                    as: "bets",
                },
            },

            /*
             * Player count.
             */

            {
                $addFields: {
                    playerCount: {
                        $size: {
                            $setUnion: [
                                {
                                    $map: {
                                        input:
                                            "$bets",
                                        as: "bet",
                                        in: "$$bet.user",
                                    },
                                },
                                [],
                            ],
                        },
                    },

                    payoutTotal: {
                        $sum: {
                            $map: {
                                input:
                                    "$bets",
                                as: "bet",
                                in: {
                                    $ifNull: [
                                        "$$bet.payout",
                                        0,
                                    ],
                                },
                            },
                        },
                    },
                },
            },

            /*
             * Do not return all bets in round
             * listing response.
             */

            {
                $project: {
                    bets: 0,
                },
            },
        ];


        const rounds =
            await GameRound.aggregate(
                roundsPipeline
            );


        /*
         * ------------------------------------------
         * TOTAL COUNT
         * ------------------------------------------
         */

        const total =
            await GameRound.countDocuments(
                match
            );


        /*
         * ------------------------------------------
         * FILTERED SUMMARY
         * ------------------------------------------
         */

        const summaryPipeline = [
            {
                $match: match,
            },

            {
                $lookup: {
                    from: "bets",
                    localField: "_id",
                    foreignField: "round",
                    as: "bets",
                },
            },

            {
                $addFields: {
                    playerCount: {
                        $size: {
                            $setUnion: [
                                {
                                    $map: {
                                        input:
                                            "$bets",
                                        as: "bet",
                                        in: "$$bet.user",
                                    },
                                },
                                [],
                            ],
                        },
                    },

                    payoutTotal: {
                        $sum: {
                            $map: {
                                input:
                                    "$bets",
                                as: "bet",
                                in: {
                                    $ifNull: [
                                        "$$bet.payout",
                                        0,
                                    ],
                                },
                            },
                        },
                    },
                },
            },

            {
                $group: {
                    _id: null,

                    totalRounds: {
                        $sum: 1,
                    },

                    totalPlayers: {
                        $sum: "$playerCount",
                    },

                    totalBets: {
                        $sum: {
                            $ifNull: [
                                "$totalBets",
                                0,
                            ],
                        },
                    },

                    totalAmount: {
                        $sum: {
                            $ifNull: [
                                "$totalAmount",
                                0,
                            ],
                        },
                    },

                    totalPayout: {
                        $sum: "$payoutTotal",
                    },
                },
            },
        ];


        const summaryResult =
            await GameRound.aggregate(
                summaryPipeline
            );


        const summary =
            summaryResult[0] || {
                totalRounds: 0,
                totalPlayers: 0,
                totalBets: 0,
                totalAmount: 0,
                totalPayout: 0,
            };


        /*
         * ------------------------------------------
         * RESPONSE
         * ------------------------------------------
         */

        return res.json({
            success: true,

            data: rounds,

            pagination: {
                page,
                limit,
                total,
                totalPages:
                    Math.ceil(
                        total / limit
                    ),
                hasNextPage:
                    page <
                    Math.ceil(
                        total / limit
                    ),
                hasPreviousPage:
                    page > 1,
            },

            summary: {
                totalRounds:
                    summary.totalRounds ||
                    0,

                totalPlayers:
                    summary.totalPlayers ||
                    0,

                totalBets:
                    summary.totalBets ||
                    0,

                totalAmount:
                    summary.totalAmount ||
                    0,

                totalPayout:
                    summary.totalPayout ||
                    0,
            },
        });
    } catch (error) {
        console.error(
            "Admin Get Rounds Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to fetch rounds.",
        });
    }
};

// ==========================================
// GET ADMIN ROUND DETAIL
// ==========================================

exports.getRoundDetail = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Round ID is required.",
            });
        }

        /*
         * Round detail service
         */

        const round =
            await adminRoundService.getRoundDetail(id);

        return res.status(200).json({
            success: true,
            data: round,
        });

    } catch (error) {
        console.error(
            "Admin Get Round Detail Error:",
            error
        );

        if (
            error.message ===
            "Round not found."
        ) {
            return res.status(404).json({
                success: false,
                message: error.message,
            });
        }

        if (
            error.message ===
            "Invalid round ID."
        ) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Unable to fetch round details.",
        });
    }
};