const emailTemplateService = require("../services/emailTemplateService");
const { createAuditLog } = require("../services/auditLogService");


const getRequestContext = (req) => ({

    ipAddress:
        req.ip ||
        req.headers["x-forwarded-for"] ||
        req.socket?.remoteAddress ||
        null,

    userAgent:
        req.headers["user-agent"] || null,

});


const listTemplates = async (req, res) => {

    try {

        const templates = await emailTemplateService.listTemplates();

        return res.status(200).json({ success: true, data: templates });

    } catch (error) {

        console.error("Admin List Email Templates Error:", error);

        return res.status(500).json({ success: false, message: "Unable to fetch email templates." });

    }

};


const getTemplate = async (req, res) => {

    try {

        const template = await emailTemplateService.getTemplate(req.params.key);

        if (!template) {

            return res.status(404).json({ success: false, message: "Email template not found." });

        }

        return res.status(200).json({ success: true, data: template });

    } catch (error) {

        console.error("Admin Get Email Template Error:", error);

        return res.status(500).json({ success: false, message: "Unable to fetch email template." });

    }

};


const updateTemplate = async (req, res) => {

    try {

        const template = await emailTemplateService.updateTemplate(
            req.params.key,
            req.body || {},
            req.admin?._id
        );

        await createAuditLog({
            actorType: "admin",
            actorId: req.admin?._id || null,
            action: "email_template.updated",
            module: "email_templates",
            key: template.key,
            ...getRequestContext(req),
        }).catch(() => {});

        return res.status(200).json({ success: true, message: "Email template updated.", data: template });

    } catch (error) {

        return res.status(400).json({ success: false, message: error.message || "Unable to update email template." });

    }

};


const previewTemplate = async (req, res) => {

    try {

        const preview = await emailTemplateService.previewTemplate(req.params.key);

        return res.status(200).json({ success: true, data: preview });

    } catch (error) {

        return res.status(400).json({ success: false, message: error.message || "Unable to preview email template." });

    }

};


module.exports = {
    listTemplates,
    getTemplate,
    updateTemplate,
    previewTemplate,
};
