const mongoose = require("mongoose");

const payoutSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        bet: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Bet",
            required: true,
            unique: true,
            index: true,
        },

        round: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "GameRound",
            required: true,
            index: true,
        },

        betAmount: {
            type: Number,
            required: true,
            min: 0,
        },

        winningColor: {
            type: String,
            enum: [
                "red",
                "green",
                "blue",
            ],
            required: true,
        },

        payoutAmount: {
            type: Number,
            required: true,
            min: 0,
        },

        status: {
            type: String,
            enum: [
                "pending",
                "processing",
                "paid",
                "failed",
                "cancelled",
                "reversed",
                "manual_review",
            ],
            default: "pending",
            index: true,
        },

        transactionId: {
            type: String,
            default: null,
            index: true,
        },

        failureReason: {
            type: String,
            default: "",
        },

        processedAt: {
            type: Date,
            default: null,
        },

        retryCount: {
            type: Number,
            default: 0,
            min: 0,
        },

        remark: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model(
    "Payout",
    payoutSchema
);