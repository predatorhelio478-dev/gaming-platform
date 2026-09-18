const leaderboardService = require("../services/leaderboardService");

const getLeaderboard = async (req, res) => {

    try {

        const { page, limit } = req.query;

        const result = await leaderboardService.getLeaderboard({ page, limit });

        return res.status(200).json({
            success: true,
            data: result.data,
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
        });

    } catch (error) {

        console.error("Leaderboard Error:", error);

        return res.status(500).json({ success: false, message: "Unable to fetch leaderboard." });

    }

};

module.exports = { getLeaderboard };
