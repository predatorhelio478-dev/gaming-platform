const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },

        balance: {
            type: Number,
            default: 0,
            min: 0,
        },

        winningBalance: {
            type: Number,
            default: 0,
            min: 0,
        },

        bonusBalance: {
            type: Number,
            default: 0,
            min: 0,
        },

        lockedBalance: {
            type: Number,
            default: 0,
            min: 0,
        },

        totalDeposit: {
            type: Number,
            default: 0,
        },

        totalWithdraw: {
            type: Number,
            default: 0,
        },

        totalBet: {
            type: Number,
            default: 0,
        },

        totalWin: {
            type: Number,
            default: 0,
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Wallet", walletSchema);