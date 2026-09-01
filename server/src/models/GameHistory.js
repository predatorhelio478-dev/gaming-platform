const mongoose = require("mongoose");

const gameHistorySchema = new mongoose.Schema(
    {
        roundNumber: {
            type: Number,
            required: true,
        },

        gameType: {
            type: String,
            default: "color_prediction",
        },

        result: {
            type: String,
            enum: [
                "red",
                "green",
                "blue",
            ],
            required: true,
        },

        totalPlayers: {
            type: Number,
            default: 0,
        },

        totalBetAmount: {
            type: Number,
            default: 0,
        },

        totalPayout: {
            type: Number,
            default: 0,
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model(
    "GameHistory",
    gameHistorySchema
);