const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    mobile: {
      type: String,
      default: "",
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    status: {
      type: String,
      enum: ["active", "blocked"],
      default: "active",
    },

    /*
     * Legacy generic flag - kept so existing reads don't
     * break, but no longer authoritative for anything new.
     * Use emailVerified/mobileVerified instead, which are
     * only ever set by a successful OTP verification
     * (otpService), never directly by an admin/user request.
     */
    isVerified: {
      type: Boolean,
      default: false,
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    mobileVerified: {
      type: Boolean,
      default: false,
    },

    referralCode: {
      type: String,
      unique: true,
      sparse: true,
    },

    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /*
     * Set once the referrer's bonus has been paid out
     * for this user, so it can never be paid twice.
     */
    referralQualified: {
      type: Boolean,
      default: false,
    },

    /*
     * Soft delete. Financial/audit/bet/referral records
     * always reference the user by ObjectId and are never
     * touched by this - only login/access is blocked.
     */
    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    /*
     * Permanent delete = a strict superset of isDeleted
     * (login/access is blocked exactly the same way) PLUS the
     * account's identifying PII has been anonymized in place.
     * The document itself is never removed - every financial/
     * bet/transaction/audit/support record keeps referencing
     * this same _id, so historical data stays fully intact
     * and correctly attributed; only the account's own name/
     * email/mobile/username/password become unrecoverable.
     */
    isPermanentlyDeleted: {
      type: Boolean,
      default: false,
    },

    permanentlyDeletedAt: {
      type: Date,
      default: null,
    },

    lastLogin: {
      type: Date,
      default: null,
    },

    /*
     * Progressive login lockout (see server/src/utils/loginLockout.js).
     * failedLoginAttempts resets to 0 on any successful login.
     * lockoutUntil is null when not currently locked out.
     */
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },

    lockoutUntil: {
      type: Date,
      default: null,
    },

    /*
     * Per-user opt-out for email/SMS notification delivery.
     * In-app notifications are never gated by these - only
     * whether an email/SMS is additionally sent for them.
     */
    notificationPreferences: {
      email: {
        type: Boolean,
        default: true,
      },
      sms: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);