const faqService = require("../services/faqService");
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


// ==========================================================
// CATEGORIES
// ==========================================================

const listCategories = async (req, res) => {

    try {

        const categories = await faqService.getAdminCategories();

        return res.status(200).json({ success: true, data: categories });

    } catch (error) {

        console.error("Admin FAQ List Categories Error:", error);

        return res.status(500).json({ success: false, message: "Unable to fetch FAQ categories." });

    }

};


const createCategory = async (req, res) => {

    try {

        const category = await faqService.createCategory(req.body || {});

        await createAuditLog({
            actorType: "admin",
            actorId: req.admin?._id || null,
            action: "faq.category_created",
            module: "faq",
            key: String(category._id),
            newValue: category.name,
            ...getRequestContext(req),
        }).catch(() => {});

        return res.status(201).json({ success: true, message: "FAQ category created.", data: category });

    } catch (error) {

        return res.status(400).json({ success: false, message: error.message || "Unable to create FAQ category." });

    }

};


const updateCategory = async (req, res) => {

    try {

        const category = await faqService.updateCategory(req.params.id, req.body || {});

        await createAuditLog({
            actorType: "admin",
            actorId: req.admin?._id || null,
            action: "faq.category_updated",
            module: "faq",
            key: String(category._id),
            ...getRequestContext(req),
        }).catch(() => {});

        return res.status(200).json({ success: true, message: "FAQ category updated.", data: category });

    } catch (error) {

        return res.status(400).json({ success: false, message: error.message || "Unable to update FAQ category." });

    }

};


const deleteCategory = async (req, res) => {

    try {

        await faqService.deleteCategory(req.params.id);

        await createAuditLog({
            actorType: "admin",
            actorId: req.admin?._id || null,
            action: "faq.category_deleted",
            module: "faq",
            key: req.params.id,
            ...getRequestContext(req),
        }).catch(() => {});

        return res.status(200).json({ success: true, message: "FAQ category deleted." });

    } catch (error) {

        return res.status(400).json({ success: false, message: error.message || "Unable to delete FAQ category." });

    }

};


// ==========================================================
// ITEMS
// ==========================================================

const listItems = async (req, res) => {

    try {

        const items = await faqService.getAdminItems(req.query.category);

        return res.status(200).json({ success: true, data: items });

    } catch (error) {

        console.error("Admin FAQ List Items Error:", error);

        return res.status(500).json({ success: false, message: "Unable to fetch FAQ items." });

    }

};


const createItem = async (req, res) => {

    try {

        const item = await faqService.createItem(req.body || {});

        await createAuditLog({
            actorType: "admin",
            actorId: req.admin?._id || null,
            action: "faq.item_created",
            module: "faq",
            key: String(item._id),
            ...getRequestContext(req),
        }).catch(() => {});

        return res.status(201).json({ success: true, message: "FAQ item created.", data: item });

    } catch (error) {

        return res.status(400).json({ success: false, message: error.message || "Unable to create FAQ item." });

    }

};


const updateItem = async (req, res) => {

    try {

        const item = await faqService.updateItem(req.params.id, req.body || {});

        await createAuditLog({
            actorType: "admin",
            actorId: req.admin?._id || null,
            action: "faq.item_updated",
            module: "faq",
            key: String(item._id),
            ...getRequestContext(req),
        }).catch(() => {});

        return res.status(200).json({ success: true, message: "FAQ item updated.", data: item });

    } catch (error) {

        return res.status(400).json({ success: false, message: error.message || "Unable to update FAQ item." });

    }

};


const deleteItem = async (req, res) => {

    try {

        await faqService.deleteItem(req.params.id);

        await createAuditLog({
            actorType: "admin",
            actorId: req.admin?._id || null,
            action: "faq.item_deleted",
            module: "faq",
            key: req.params.id,
            ...getRequestContext(req),
        }).catch(() => {});

        return res.status(200).json({ success: true, message: "FAQ item deleted." });

    } catch (error) {

        return res.status(400).json({ success: false, message: error.message || "Unable to delete FAQ item." });

    }

};


module.exports = {
    listCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    listItems,
    createItem,
    updateItem,
    deleteItem,
};
