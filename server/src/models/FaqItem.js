const mongoose = require("mongoose");

const faqItemSchema = new mongoose.Schema(
    {
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FaqCategory",
            required: true,
            index: true,
        },

        question: {
            type: String,
            required: true,
            trim: true,
            maxlength: 300,
        },

        answer: {
            type: String,
            required: true,
            trim: true,
            maxlength: 4000,
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

faqItemSchema.index({ category: 1, order: 1 });

module.exports = mongoose.model("FaqItem", faqItemSchema);
