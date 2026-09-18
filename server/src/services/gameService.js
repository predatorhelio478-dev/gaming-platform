const GameRound = require("../models/GameRound");

class GameService {

    async getCurrentRound() {

        return await GameRound.findOne({

            status: "betting"

        }).sort({

            createdAt: -1

        });

    }

    async getHistory(limit = 20) {

        return await GameRound

            .find({

                status: "completed"

            })

            .sort({

                roundNumber: -1

            })

            .limit(limit);

    }

    // ==========================================================
    // PAGINATED HISTORY (for "View Full History")
    // ==========================================================

    async getHistoryPaginated({ page = 1, limit = 20 } = {}) {

        const safeLimit =
            Math.min(Math.max(Number(limit) || 20, 1), 100);

        const safePage =
            Math.max(Number(page) || 1, 1);

        const filter = {
            status: "completed",
        };

        const [rounds, total] = await Promise.all([

            GameRound.find(filter)
                .select("roundNumber result status startTime endTime createdAt")
                .sort({ roundNumber: -1 })
                .skip((safePage - 1) * safeLimit)
                .limit(safeLimit)
                .lean(),

            GameRound.countDocuments(filter),

        ]);

        return {
            rounds,
            total,
            page: safePage,
            limit: safeLimit,
            totalPages: Math.max(Math.ceil(total / safeLimit), 1),
        };

    }

}

module.exports = new GameService();