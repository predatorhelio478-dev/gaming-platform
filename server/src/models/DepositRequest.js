const mongoose = require("mongoose");

const depositRequestSchema = new mongoose.Schema(
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

        method: {
            type: String,
            default: "other",
            trim: true,
        },

        referenceId: {
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
         * RAZORPAY (populated only when initiatedVia
         * === "razorpay"; manual deposits leave these null)
         * ==========================================
         */

        initiatedVia: {
            type: String,
            enum: ["manual", "razorpay"],
            default: "manual",
        },

        // No `default: null` on these two deliberately - the
        // sparse unique indexes below only exclude documents
        // where the field is genuinely ABSENT, not ones
        // explicitly set to null. A `default: null` would make
        // every manual deposit store an explicit null and
        // collide on the unique index the moment a second one
        // is created.
        razorpayOrderId: {
            type: String,
        },

        razorpayPaymentId: {
            type: String,
        },

        // Which Razorpay mode (test/live) this specific order
        // was actually created under - pinned for the life of
        // this request so a later admin mode change can never
        // cause it to be verified/refunded against the wrong
        // mode's credentials. Absent on rows created before
        // this field existed; callers fall back to the
        // currently active mode for those.
        razorpayMode: {
            type: String,
            enum: ["test", "live", null],
            default: null,
        },

        razorpaySignature: {
            type: String,
            default: null,
            select: false,
        },

        // Raw lifecycle status from Razorpay - separate from
        // `status` above (which is the outcome: has the
        // wallet been credited or not). "created" -> order
        // made, checkout not yet completed; "attempted" ->
        // payment attempted but not yet confirmed;
        // "paid"/"failed" -> terminal.
        gatewayStatus: {
            type: String,
            enum: ["created", "attempted", "paid", "failed"],
            default: null,
        },

        // Sanitized subset only (method, captured amount,
        // email/contact as Razorpay has them) - never the
        // full raw payload, and never secrets.
        gatewayResponse: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },

        razorpayRefundId: {
            type: String,
            default: null,
        },

        refundStatus: {
            type: String,
            enum: ["pending", "processed", "failed", null],
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

/*
 * A user can't submit the same payment reference twice.
 * (Duplicate-deposit-request protection at the DB level,
 * not just an application-level check.)
 */
depositRequestSchema.index(
    { user: 1, referenceId: 1 },
    { unique: true }
);

/*
 * Idempotency at the gateway level: the same Razorpay order/
 * payment can never back two DepositRequest rows.
 */
depositRequestSchema.index(
    { razorpayOrderId: 1 },
    { unique: true, sparse: true }
);

depositRequestSchema.index(
    { razorpayPaymentId: 1 },
    { unique: true, sparse: true }
);

module.exports = mongoose.model(
    "DepositRequest",
    depositRequestSchema
);
