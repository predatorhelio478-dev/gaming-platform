const mongoose = require("mongoose");

/*
 * ==========================================
 * NOTIFICATION
 * ==========================================
 *
 * `audience: "user"` rows always carry a `user` (the
 * recipient). `audience: "admin"` rows are a single shared
 * row visible to every admin - `user` stays null for those.
 */

const notificationSchema = new mongoose.Schema(
    {
        audience: {
            type: String,
            enum: ["user", "admin"],
            required: true,
            index: true,
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true,
        },

        type: {
            type: String,
            required: true,
            trim: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        message: {
            type: String,
            required: true,
            trim: true,
        },

        data: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },

        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },

        readAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ audience: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
