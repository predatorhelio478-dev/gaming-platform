const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
    {
        category: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            enum: [
                "general",
                "payment",
                "game",
                "user",
                "notification",
                "security",
                "legal",
                "system",
            ],
        },

        key: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },

        value: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },

        type: {
            type: String,
            enum: [
                "string",
                "number",
                "boolean",
                "object",
                "array",
            ],
            required: true,
        },

        description: {
            type: String,
            default: "",
            trim: true,
        },

        isPublic: {
            type: Boolean,
            default: false,
        },

        isSensitive: {
            type: Boolean,
            default: false,
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

/*
|--------------------------------------------------------------------------
| Unique Setting
|--------------------------------------------------------------------------
|
| Same key can exist in different categories,
| but duplicate key inside the same category is not allowed.
|
*/

settingSchema.index(
    {
        category: 1,
        key: 1,
    },
    {
        unique: true,
    }
);

module.exports = mongoose.model("Setting", settingSchema);