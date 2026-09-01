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

}

module.exports = new GameService();