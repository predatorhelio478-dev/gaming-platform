const mongoose = require("mongoose");

/*
 * ==========================================
 * FAQ CATEGORY
 * ==========================================
 *
 * `icon` is a plain string key (never rendered as HTML/JS) -
 * the frontend maps a small allowlist of known keys to actual
 * icon components and falls back to a generic icon for any
 * unrecognized value, so admin input can never inject
 * arbitrary markup/code via this field.
 */

const faqCategorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 80,
        },

        icon: {
            type: String,
            default: "help-circle",
            trim: true,
            maxlength: 40,
        },

        order: {
            type: Number,
            default: 0,
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

faqCategorySchema.index({ order: 1 });

module.exports = mongoose.model("FaqCategory", faqCategorySchema);
