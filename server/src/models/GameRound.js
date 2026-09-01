const mongoose = require("mongoose");

const gameRoundSchema = new mongoose.Schema(
    {
        roundNumber: {
            type: Number,
            required: true,
            unique: true,
        },

        gameType: {
            type: String,
            default: "color_prediction",
        },

        status: {
            type: String,
            enum: [
                "waiting",
                "betting",
                "locked",
                "completed",
            ],
            default: "betting",
        },

        startTime: {
            type: Date,
            required: true,
        },

        endTime: {
            type: Date,
            required: true,
        },

        result: {
            type: String,
            enum: [
                "red",
                "green",
                "blue",
            ],
            default: null,
        },

        totalBets: {
            type: Number,
            default: 0,
        },

        totalAmount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model(
    "GameRound",
    gameRoundSchema
);