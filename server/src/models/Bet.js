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

        /*
         * Which wallet pool funded this bet.
         * "real" money, "test" (welcome credit,
         * never withdrawable), or "bonus" (referral
         * bonus, bet-only, partially convertible on win).
         */
        walletMode: {
            type: String,
            enum: [
                "real",
                "test",
                "bonus",
            ],
            default: "real",
        },

        /*
         * Server-computed split for "real" mode bets: up to 30%
         * of `amount` may be funded from bonusBalance, the rest
         * from real balance. Both default to 0 for "test" mode
         * and legacy "bonus" mode bets (which are funded 100%
         * from a single pool and don't use this split). Stored
         * on the bet itself so settlement (win/lose) and any
         * later audit can always see exactly how the bet was
         * funded, without recomputing from a possibly-changed
         * bonus balance.
         */
        bonusAmount: {
            type: Number,
            default: 0,
        },

        realAmount: {
            type: Number,
            default: 0,
        },

        result: {
            type: String,
            enum: [
                "pending",
                "won",
                "lost",
                "voided",
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

/*
 * One bet per user per round, enforced at the DB level too -
 * not just via betService's findOne-then-create check, which
 * is vulnerable to a race between two concurrent requests.
 */
betSchema.index(
    {
        user: 1,
        round: 1,
    },
    {
        unique: true,
    }
);

module.exports = mongoose.model(
    "Bet",
    betSchema
);