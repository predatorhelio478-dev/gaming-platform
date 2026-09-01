const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      unique: true,
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
    },

    /*
     * A payout can have multiple financial
     * transactions over its lifecycle:
     *
     * win
     * payout_reverse
     * refund
     * payout_restore
     *
     * Therefore payout MUST NOT be unique.
     */
    payout: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payout",
      sparse: true,
      index: true,
    },

    type: {
      type: String,

      enum: [
        "deposit",
        "withdraw",
        "bet",
        "win",
        "refund",
        "payout_reverse",
        "payout_restore",
        "bonus",
        "admin_credit",
        "admin_debit",
      ],

      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    previousBalance: {
      type: Number,
      default: 0,
    },

    currentBalance: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,

      enum: [
        "pending",
        "success",
        "failed",
      ],

      default: "success",
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

module.exports =
  mongoose.model(
    "Transaction",
    transactionSchema
  );