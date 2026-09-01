const mongoose = require("mongoose");

const betSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        round: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "GameRound",
            required: true,
        },

        color: {
            type: String,
            enum: [
                "red",
                "green",
                "blue",
            ],
            required: true,
        },

        amount: {
            type: Number,
            required: true,
        },

        result: {
            type: String,
            enum: [
                "pending",
                "won",
                "lost",
            ],
            default: "pending",
        },

        payout: {
            type: Number,
            default: 0,
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model(
    "Bet",
    betSchema
);