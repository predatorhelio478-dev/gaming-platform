const mongoose = require("mongoose");

/*
 * ==========================================
 * SUPPORT TICKET
 * ==========================================
 *
 * Conversation history is append-only (messages are never
 * edited/removed) and the ticket document itself is never
 * hard-deleted - closing/resolving only changes `status`, so
 * support history survives even after a user is deactivated
 * (the `user` ref stays valid; auth just blocks that user's
 * own future logins/API calls, not historical records).
 */

const REFERENCE_TYPES = [
    "deposit",
    "withdrawal",
    "transaction",
    "payout",
    "bet",
    "round",
];

const CATEGORIES = [
    "payment",
    "deposit",
    "withdrawal",
    "betting",
    "wallet",
    "referral",
    "account",
    "verification",
    "technical",
    "other",
];

const PRIORITIES = ["low", "normal", "high", "urgent"];

const STATUSES = ["open", "pending", "replied", "resolved", "closed"];


const messageSchema = new mongoose.Schema(
    {
        senderType: {
            type: String,
            enum: ["user", "admin"],
            required: true,
        },

        // Not a refPath - senderType alone tells us which
        // collection this points to (User or Admin), and
        // both id spaces are ObjectIds either way. Kept as
        // plain ObjectId rather than refPath to avoid an
        // extra dynamic-population footgun on an append-only
        // embedded array that's rarely populated wholesale.
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },

        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000,
        },

        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        _id: true,
    }
);


const referenceSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: REFERENCE_TYPES,
            required: true,
        },

        refId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
    },
    {
        _id: false,
    }
);


const supportTicketSchema = new mongoose.Schema(
    {
        ticketNumber: {
            type: String,
            required: true,
            unique: true,
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        subject: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150,
        },

        category: {
            type: String,
            enum: CATEGORIES,
            default: "other",
            index: true,
        },

        priority: {
            type: String,
            enum: PRIORITIES,
            default: "normal",
            index: true,
        },

        status: {
            type: String,
            enum: STATUSES,
            default: "open",
            index: true,
        },

        assignedAdmin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
            default: null,
            index: true,
        },

        references: {
            type: [referenceSchema],
            default: [],
        },

        messages: {
            type: [messageSchema],
            default: [],
        },

        lastMessageAt: {
            type: Date,
            default: Date.now,
            index: true,
        },

        lastMessageBySenderType: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },

        // Reset to 0 whenever the user views the ticket;
        // incremented on every admin message. Shared
        // (not per-admin) for adminUnreadCount, mirroring the
        // Phase 8 shared-admin-notification-row model.
        userUnreadCount: {
            type: Number,
            default: 0,
        },

        adminUnreadCount: {
            type: Number,
            default: 0,
        },

        resolvedAt: {
            type: Date,
            default: null,
        },

        closedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

supportTicketSchema.index({ status: 1, updatedAt: -1 });
supportTicketSchema.index({ priority: 1, updatedAt: -1 });
supportTicketSchema.index({ assignedAdmin: 1, status: 1 });
supportTicketSchema.index({ user: 1, updatedAt: -1 });
supportTicketSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model("SupportTicket", supportTicketSchema);

module.exports.CATEGORIES = CATEGORIES;
module.exports.PRIORITIES = PRIORITIES;
module.exports.STATUSES = STATUSES;
module.exports.REFERENCE_TYPES = REFERENCE_TYPES;
