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

        /*
         * Fully separate, non-withdrawable ledger for
         * the one-time TEST welcome credit. Never mixed
         * with `balance` (real money) or converted to it.
         */
        testBalance: {
            type: Number,
            default: 0,
            min: 0,
        },

        /*
         * One-time-grant guard for the TEST welcome
         * credit so it is never issued more than once
         * per user.
         */
        testBalanceGranted: {
            type: Boolean,
            default: false,
        },

        /*
         * One-time-grant guard for the referral signup bonus
         * (credited to a NEW user who registered using someone
         * else's valid referral code) so it can never be
         * credited more than once per user.
         */
        referralSignupBonusGranted: {
            type: Boolean,
            default: false,
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