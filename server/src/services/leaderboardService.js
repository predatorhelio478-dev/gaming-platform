const Wallet = require("../models/Wallet");

/*
 * ==========================================
 * LEADERBOARD (rank by net betting profit)
 * ==========================================
 *
 * Ranking is computed entirely server-side from
 * Wallet.totalWin - Wallet.totalBet (the actual earnings
 * concept this project tracks) - never trust/accept a
 * client-supplied rank or amount. The projection below NEVER
 * includes the numeric profit, balance, totalWin or totalBet -
 * only rank + username - so even a compromised/careless
 * frontend can't leak another user's financial data, because
 * the API response itself never contains it.
 * ==========================================
 */

const getLeaderboard = async ({ page = 1, limit = 20 } = {}) => {

    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const safePage = Math.max(Number(page) || 1, 1);

    // Shared prefix so the paginated rows and the total count
    // are always counting/ranking over the exact same set of
    // eligible wallets (real bettors, active non-deleted users).
    const basePipeline = [

        { $match: { totalBet: { $gt: 0 } } },

        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "userDoc",
            },
        },

        { $unwind: "$userDoc" },

        {
            $match: {
                "userDoc.isDeleted": { $ne: true },
                "userDoc.status": { $ne: "blocked" },
            },
        },

        {
            $addFields: {
                netProfit: { $subtract: ["$totalWin", "$totalBet"] },
            },
        },

    ];

    const [rows, totalResult] = await Promise.all([

        Wallet.aggregate([

            ...basePipeline,

            { $sort: { netProfit: -1, _id: 1 } },

            { $skip: (safePage - 1) * safeLimit },

            { $limit: safeLimit },

            {
                // Deliberately minimal - no netProfit, balance,
                // totalWin, or totalBet leaves this stage.
                $project: {
                    _id: 0,
                    username: "$userDoc.username",
                },
            },

        ]),

        Wallet.aggregate([
            ...basePipeline,
            { $count: "total" },
        ]),

    ]);

    const total = totalResult[0]?.total || 0;

    const data = rows.map((row, index) => ({
        rank: (safePage - 1) * safeLimit + index + 1,
        username: row.username,
    }));

    return {
        data,
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.max(Math.ceil(total / safeLimit), 1),
    };

};

module.exports = { getLeaderboard };
