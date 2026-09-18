const mongoose = require("mongoose");

/*
 * ==========================================
 * EMAIL TEMPLATE
 * ==========================================
 *
 * `subject`/`body` are admin-editable plain text containing
 * {{placeholder}} variables. `body` is the MESSAGE CONTENT
 * only (a paragraph or two) - it is always rendered inside the
 * shared professional HTML shell (logo/header/footer/CTA
 * button), never as a full standalone HTML document, so every
 * system email stays visually consistent no matter what an
 * admin edits here. Both fields are HTML-escaped before
 * substitution/sending, so admin-entered text can never inject
 * markup/scripts into an outgoing email.
 *
 * `variables` is the ALLOWLIST of placeholder names valid for
 * this specific template - emailTemplateService only ever
 * substitutes a placeholder that is both requested by the
 * calling code AND present in this list, so a template can
 * never end up interpolating a variable (e.g. a password/
 * token/secret) that the sending code didn't explicitly and
 * deliberately provide for that exact email.
 */

const emailTemplateSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            default: "",
            trim: true,
        },

        subject: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },

        body: {
            type: String,
            required: true,
            maxlength: 6000,
        },

        ctaText: {
            type: String,
            default: "",
            trim: true,
            maxlength: 60,
        },

        ctaUrlVariable: {
            // Which allowed variable (if any) supplies the CTA
            // link's URL - never a raw admin-entered URL, so a
            // compromised admin account can't repoint every
            // email's button at an arbitrary phishing domain
            // without also changing code. e.g. "site_url".
            type: String,
            default: "",
            trim: true,
        },

        variables: {
            type: [String],
            default: [],
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

module.exports = mongoose.model("EmailTemplate", emailTemplateSchema);
