const gameService = require("../services/gameService");
const gameEngine = require("../game/engine/gameEngine");

// ==========================================================
// LIVE STATUS (public, no auth)
// ==========================================================
//
// REST equivalent of the "game_state" socket event, plus the
// latest completed round. Exists so a client without a working
// Socket.IO connection can poll this endpoint and reconstruct
// "new_round"/"timer"/"game_status"/"betting_closed"/
// "round_result" by diffing successive responses. Reads the
// same gameEngine/gameService state the socket layer already
// uses - no game/round/payout logic is duplicated here.
// ==========================================================

exports.status = async (req, res) => {

    try {

        const gameStatus = gameEngine.getGameStatus();

        const [latestHistory] = await gameService.getHistory(1);

        res.json({

            success: true,

            round: gameStatus.round,

            remainingSeconds: gameStatus.remainingSeconds,

            status: gameStatus.status,

            paused: gameStatus.paused,

            stopped: gameStatus.stopped,

            running: gameStatus.running,

            emergencyStopped: gameStatus.emergencyStopped,

            lastResult: latestHistory
                ? {
                    roundNumber: latestHistory.roundNumber,
                    result: latestHistory.result,
                    totalPlayers: latestHistory.totalPlayers,
                    totalBetAmount: latestHistory.totalBetAmount,
                    totalPayout: latestHistory.totalPayout,
                }
                : null,

        });

    }

    catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

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