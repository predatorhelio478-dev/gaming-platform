const gameService = require("../services/gameService");

exports.currentRound = async (req, res) => {

    try {

        const round = await gameService.getCurrentRound();

        res.json({

            success: true,

            round

        });

    }

    catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

exports.history = async (req, res) => {

    try {

        const history = await gameService.getHistory();

        res.json({

            success: true,

            history

        });

    }

    catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

// ==========================================================
// PAGINATED HISTORY ("View Full History")
// ==========================================================

exports.historyPaginated = async (req, res) => {

    try {

        const { page, limit } = req.query;

        const result = await gameService.getHistoryPaginated({ page, limit });

        res.json({

            success: true,

            rounds: result.rounds,

            total: result.total,

            page: result.page,

            limit: result.limit,

            totalPages: result.totalPages,

        });

    }

    catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};