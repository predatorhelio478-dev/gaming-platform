const mongoose = require("mongoose");

const payoutRefundSchema = new mongoose.Schema(
    {
        payout: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Payout",
            required: true,
            index: true,
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        amount: {
            type: Number,
            required: true,
            min: 0.01,
        },

        reason: {
            type: String,
            required: true,
            trim: true,
        },

        transactionId: {
            type: String,
            default: null,
            index: true,
        },

        status: {
            type: String,
            enum: [
                "pending",
                "processing",
                "completed",
                "failed",
                "cancelled",
            ],
            default: "completed",
            index: true,
        },

        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        remark: {
            type: String,
            default: "",
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model(
    "PayoutRefund",
    payoutRefundSchema
);