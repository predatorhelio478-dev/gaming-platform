const mongoose = require("mongoose");

const withdrawalRequestSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        amount: {
            type: Number,
            required: true,
            min: 0,
        },

        payoutMethod: {
            type: String,
            default: "bank_transfer",
            trim: true,
        },

        payoutDetails: {
            type: String,
            required: true,
            trim: true,
        },

        status: {
            type: String,
            enum: [
                "pending",
                "approved",
                "rejected",
            ],
            default: "pending",
            index: true,
        },

        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
            default: null,
        },

        reviewNotes: {
            type: String,
            default: "",
        },

        reviewedAt: {
            type: Date,
            default: null,
        },

        transactionId: {
            type: String,
            default: null,
        },

        /*
         * ==========================================
         * RAZORPAYX AUTOMATIC PAYOUT
         * (null/unset for manual-mode requests)
         * ==========================================
         */

        mode: {
            type: String,
            enum: ["manual", "automatic"],
            default: "manual",
        },

        // Structured payout target - kept alongside the
        // existing free-text payoutDetails (still the
        // human-readable display string manual review uses).
        upiId: {
            type: String,
            default: null,
            trim: true,
        },

        bankAccountNumber: {
            type: String,
            default: null,
            trim: true,
        },

        bankIfsc: {
            type: String,
            default: null,
            trim: true,
        },

        razorpayContactId: {
            type: String,
            default: null,
        },

        razorpayFundAccountId: {
            type: String,
            default: null,
        },

        // No `default: null` here deliberately - the sparse
        // unique index below only excludes documents where the
        // field is genuinely ABSENT, not ones explicitly set to
        // null. A `default: null` would make every manual-mode
        // request store an explicit null and collide on the
        // unique index the moment a second one is created.
        razorpayPayoutId: {
            type: String,
        },

        // Raw RazorpayX lifecycle status - separate from
        // `status` above (the outcome: is the hold finalized
        // or released). "unknown" means the create-payout API
        // call's outcome couldn't be determined (timeout/
        // network error) and needs admin reconciliation.
        gatewayStatus: {
            type: String,
            enum: [
                "queued",
                "pending",
                "processing",
                "processed",
                "reversed",
                "cancelled",
                "rejected",
                "failed",
                "unknown",
                null,
            ],
            default: null,
        },

        // Sanitized subset of Razorpay's payout response only.
        gatewayResponse: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

withdrawalRequestSchema.index({
    user: 1,
    status: 1,
});

/*
 * Idempotency at the gateway level: the same RazorpayX
 * payout can never back two WithdrawalRequest rows.
 */
withdrawalRequestSchema.index(
    { razorpayPayoutId: 1 },
    { unique: true, sparse: true }
);

module.exports = mongoose.model(
    "WithdrawalRequest",
    withdrawalRequestSchema
);
