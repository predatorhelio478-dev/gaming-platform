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
                "void",
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

        // Total time (ms) this round's timer spent frozen by an
        // admin pause or Maintenance Mode. endTime is pushed
        // forward by the same amount on resume, so the real
        // betting window is (endTime - startTime - pausedMs).
        pausedMs: {
            type: Number,
            default: 0,
        },

        // Set while this round's timer is frozen (admin pause or
        // Maintenance Mode), cleared on resume. Lets crash
        // recovery restore a frozen round with exactly the time
        // it had left (endTime - frozenAt) instead of treating
        // its passed endTime as an expired betting window.
        frozenAt: {
            type: Date,
            default: null,
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