const mongoose = require("mongoose");

/*
 * ==========================================
 * OTP VERIFICATION
 * ==========================================
 *
 * One active OTP per (user, channel, purpose). The OTP
 * itself is never stored raw - only a bcrypt hash. The
 * `expiresAt` TTL index lets MongoDB clean up expired/used
 * records automatically, satisfying the "cleanup/expiry"
 * requirement without a cron job.
 */

const otpVerificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            // Not a strict ref (see actorModel) - Mongoose only
            // uses `ref` as a populate() hint, never enforced
            // on write, so this stays a plain ObjectId match
            // regardless of which collection it actually points
            // into.
            ref: "User",
            required: true,
            index: true,
        },

        // Which collection `user` actually points into. Every
        // existing call site omits this and gets "User" by
        // default - password-reset for admins is the only
        // caller that passes "Admin".
        actorModel: {
            type: String,
            enum: ["User", "Admin"],
            default: "User",
        },

        channel: {
            type: String,
            enum: ["email", "mobile"],
            required: true,
        },

        // The email address / mobile number this OTP was sent to
        // (captured at request time so a later profile change
        // can't retroactively alter what was actually verified).
        target: {
            type: String,
            required: true,
            trim: true,
        },

        purpose: {
            type: String,
            enum: [
                "verify_email",
                "verify_mobile",
                "change_email",
                "change_mobile",
                "reset_password",
            ],
            required: true,
        },

        otpHash: {
            type: String,
            required: true,
        },

        attempts: {
            type: Number,
            default: 0,
        },

        maxAttempts: {
            type: Number,
            required: true,
        },

        lastSentAt: {
            type: Date,
            required: true,
        },

        consumedAt: {
            type: Date,
            default: null,
        },

        expiresAt: {
            type: Date,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

otpVerificationSchema.index(
    { user: 1, channel: 1, purpose: 1 },
    { unique: true }
);

// TTL cleanup - MongoDB removes the document some time after
// expiresAt has passed (0 second delay = as soon as possible).
otpVerificationSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
);

module.exports = mongoose.model(
    "OtpVerification",
    otpVerificationSchema
);
