const EmailTemplate = require("../models/EmailTemplate");
const emailService = require("./emailService");
const { escapeHtml, textToHtmlParagraphs } = require("./emailShellService");


// ==========================================================
// SUBSTITUTE {{placeholders}} - only variables BOTH supplied
// by the caller AND declared in this template's own allowlist
// are ever substituted; anything else is silently stripped.
// Values are HTML-escaped before insertion.
// ==========================================================

const substitute = (str, variables, allowedVars) => {

    return String(str || "").replace(/\{\{\s*(\w+)\s*\}\}/g, (match, varName) => {

        if (!allowedVars.has(varName)) {
            return "";
        }

        const value = variables[varName];

        if (value === undefined || value === null) {
            return "";
        }

        return escapeHtml(String(value));

    });

};


// ==========================================================
// SEND USING A DB TEMPLATE (falls back to a caller-supplied
// default subject/text if the template is missing/disabled,
// so a deleted/disabled template can never silently break a
// critical flow like password reset).
// ==========================================================

const sendTemplatedEmail = async ({
    key,
    to,
    variables = {},
    fallbackSubject,
    fallbackText,
}) => {

    const template =
        await EmailTemplate.findOne({ key, isActive: true }).lean();

    if (!template) {

        if (fallbackSubject && fallbackText) {

            return emailService.sendEmailBestEffort(
                { to, subject: fallbackSubject, text: fallbackText },
                `Email (${key}, no active template)`
            );

        }

        console.warn(`[emailTemplateService] Template "${key}" not found/inactive and no fallback provided - email not sent.`);

        return;

    }

    const allowedVars = new Set(template.variables || []);

    const subject = substitute(template.subject, variables, allowedVars) || fallbackSubject || template.name;

    const bodyHtml = textToHtmlParagraphs(
        substitute(template.body, variables, allowedVars)
    );

    const ctaUrl =
        template.ctaUrlVariable && allowedVars.has(template.ctaUrlVariable)
            ? variables[template.ctaUrlVariable] || ""
            : "";

    emailService.sendEmailBestEffort(
        {
            to,
            subject,
            html: bodyHtml,
            heading: subject,
            ctaText: template.ctaText || "",
            ctaUrl,
            // Plain-text fallback for clients that prefer it -
            // strip nothing sensitive since this is the exact
            // same substituted content as the HTML body.
            text: substitute(template.body, variables, allowedVars),
        },
        `Templated email (${key})`
    );

};


// ==========================================================
// ADMIN: LIST / GET / UPDATE
// ==========================================================

const listTemplates = async () => {

    return await EmailTemplate.find({}).sort({ name: 1 }).lean();

};

const getTemplate = async (key) => {

    return await EmailTemplate.findOne({ key }).lean();

};

const updateTemplate = async (key, updates, adminId) => {

    const template = await EmailTemplate.findOne({ key });

    if (!template) {
        throw new Error("Email template not found.");
    }

    if (updates.subject !== undefined) {

        const cleanSubject = String(updates.subject || "").trim();

        if (!cleanSubject) {
            throw new Error("Subject is required.");
        }

        template.subject = cleanSubject;

    }

    if (updates.body !== undefined) {

        const cleanBody = String(updates.body || "").trim();

        if (!cleanBody) {
            throw new Error("Body is required.");
        }

        template.body = cleanBody;

    }

    if (updates.ctaText !== undefined) {
        template.ctaText = String(updates.ctaText || "").trim();
    }

    if (updates.isActive !== undefined) {
        template.isActive = Boolean(updates.isActive);
    }

    template.updatedBy = adminId || null;

    await template.save();

    return template;

};


// ==========================================================
// ADMIN: PREVIEW (renders with sample values for every
// allowed variable - never touches real user data)
// ==========================================================

const previewTemplate = async (key) => {

    const template = await EmailTemplate.findOne({ key }).lean();

    if (!template) {
        throw new Error("Email template not found.");
    }

    const allowedVars = new Set(template.variables || []);

    const sampleVariables = {};

    for (const varName of allowedVars) {
        sampleVariables[varName] = `[${varName}]`;
    }

    const subject = substitute(template.subject, sampleVariables, allowedVars);

    const bodyHtml = textToHtmlParagraphs(
        substitute(template.body, sampleVariables, allowedVars)
    );

    const { buildEmailHtml } = require("./emailShellService");

    const html = await buildEmailHtml({
        heading: subject,
        bodyHtml,
        ctaText: template.ctaText || "",
        ctaUrl: template.ctaUrlVariable ? "#" : "",
    });

    return { subject, html };

};


module.exports = {
    sendTemplatedEmail,
    listTemplates,
    getTemplate,
    updateTemplate,
    previewTemplate,
};
