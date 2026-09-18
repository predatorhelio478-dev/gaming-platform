const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
    {
        actorType: {
            type: String,
            enum: [
                "admin",
                "user",
                "system",
            ],
            required: true,
            lowercase: true,
            trim: true,
        },

        actorModel: {
            type: String,
            enum: [
                "Admin",
                "User",
                null,
            ],
            default: null,
        },

        actorId: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: "actorModel",
            default: null,
        },

        action: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },

        module: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },

        category: {
            type: String,
            default: null,
            trim: true,
            lowercase: true,
        },

        key: {
            type: String,
            default: null,
            trim: true,
            lowercase: true,
        },

        oldValue: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },

        newValue: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },

        ipAddress: {
            type: String,
            default: null,
            trim: true,
        },

        userAgent: {
            type: String,
            default: null,
            trim: true,
        },

        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);


// ==========================================================
// INDEXES
// ==========================================================

auditLogSchema.index({
    actorId: 1,
    createdAt: -1,
});

auditLogSchema.index({
    module: 1,
    createdAt: -1,
});

auditLogSchema.index({
    category: 1,
    createdAt: -1,
});

auditLogSchema.index({
    action: 1,
    createdAt: -1,
});

auditLogSchema.index({
    createdAt: -1,
});


// ==========================================================
// MODEL
// ==========================================================

module.exports =
    mongoose.model(
        "AuditLog",
        auditLogSchema
    );