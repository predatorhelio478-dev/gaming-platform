const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
    {
        name: {
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
            trim: true,
            default: "",
        },

        password: {
            type: String,
            required: true,
            select: false,
        },

        emailVerified: {
            type: Boolean,
            default: false,
        },

        phoneVerified: {
            type: Boolean,
            default: false,
        },

        role: {
            type: String,
            enum: [
                "super_admin",
                "admin",
                "operator",
            ],
            default: "admin",
        },

        // Permanent delete: the document is kept (audit logs keep
        // resolving actorId) but anonymized, locked out and
        // hidden from every list - see
        // adminManagementService.deleteAdmin.
        isDeleted: {
            type: Boolean,
            default: false,
        },

        deletedAt: {
            type: Date,
            default: null,
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        lastLogin: {
            type: Date,
            default: null,
        },

        /*
         * Progressive login lockout (see
         * server/src/utils/loginLockout.js).
         */
        failedLoginAttempts: {
            type: Number,
            default: 0,
        },

        lockoutUntil: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Admin", adminSchema);