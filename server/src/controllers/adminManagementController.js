const adminManagementService =
    require("../services/adminManagementService");

const { createAuditLog } =
    require("../services/auditLogService");


const getRequestContext = (req) => ({

    ipAddress:
        req.ip ||
        req.headers["x-forwarded-for"] ||
        req.socket?.remoteAddress ||
        null,

    userAgent:
        req.headers["user-agent"] || null,

});


// ======================================================
// LIST ADMINS
// ======================================================

const listAdmins = async (req, res) => {

    try {

        const { page = 1, limit = 20, search = "", role = "all", status = "all" } = req.query;

        const result = await adminManagementService.listAdmins({ page, limit, search, role, status });

        return res.status(200).json({ success: true, ...result });

    } catch (error) {

        console.error("Admin Management List Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Unable to fetch admins.",
        });

    }

};


// ======================================================
// CREATE ADMIN
// ======================================================

const createAdmin = async (req, res) => {

    try {

        const { fullName, username, email, mobile, password, role } = req.body;

        const admin = await adminManagementService.createAdmin(
            { fullName, username, email, mobile, password, role },
            req.admin
        );

        await createAuditLog({
            actorType: "admin",
            actorId: req.admin?._id || null,
            action: "admin.created",
            module: "admin_management",
            key: String(admin._id),
            newValue: { username: admin.username, email: admin.email, role: admin.role },
            ...getRequestContext(req),
        }).catch(() => {});

        return res.status(201).json({
            success: true,
            message: "Admin account created successfully.",
            data: admin,
        });

    } catch (error) {

        console.error("Admin Management Create Error:", error);

        const statusCode =
            error.statusCode ||
            (error?.code === 11000 ? 409 : 400);

        return res.status(statusCode).json({
            success: false,
            message: error.message || "Unable to create admin.",
        });

    }

};


// ======================================================
// UPDATE ADMIN (role / status / profile)
// ======================================================

const updateAdmin = async (req, res) => {

    try {

        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ success: false, message: "Admin ID is required." });
        }

        const { fullName, mobile, role, isActive, username, email } = req.body;

        const result = await adminManagementService.updateAdmin(
            id,
            { fullName, mobile, role, isActive, username, email },
            req.admin
        );

        const changed = {};
        if (result.before.role !== result.after.role) changed.role = result.after.role;
        if (result.before.isActive !== result.after.isActive) changed.isActive = result.after.isActive;
        if (result.before.username !== result.after.username) changed.username = result.after.username;
        if (result.before.email !== result.after.email) changed.email = result.after.email;

        if (Object.keys(changed).length > 0) {

            await createAuditLog({
                actorType: "admin",
                actorId: req.admin?._id || null,
                action: "admin.updated",
                module: "admin_management",
                key: id,
                oldValue: result.before,
                newValue: result.after,
                ...getRequestContext(req),
            }).catch(() => {});

        }

        return res.status(200).json({
            success: true,
            message: "Admin account updated successfully.",
            data: result.admin,
        });

    } catch (error) {

        console.error("Admin Management Update Error:", error);

        const statusCode = error.statusCode || 400;

        return res.status(statusCode).json({
            success: false,
            message: error.message || "Unable to update admin.",
        });

    }

};


// ======================================================
// DEACTIVATE ADMIN ("delete")
// ======================================================

const deactivateAdmin = async (req, res) => {

    try {

        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ success: false, message: "Admin ID is required." });
        }

        const result = await adminManagementService.deactivateAdmin(id, req.admin);

        if (!result.alreadyDeactivated) {

            await createAuditLog({
                actorType: "admin",
                actorId: req.admin?._id || null,
                action: "admin.deactivated",
                module: "admin_management",
                key: id,
                newValue: { username: result.admin?.username },
                ...getRequestContext(req),
            }).catch(() => {});

        }

        return res.status(200).json({
            success: true,
            message:
                result.alreadyDeactivated
                    ? "Admin is already deactivated."
                    : "Admin account deactivated successfully.",
            data: result.admin,
        });

    } catch (error) {

        console.error("Admin Management Deactivate Error:", error);

        const statusCode = error.statusCode || 400;

        return res.status(statusCode).json({
            success: false,
            message: error.message || "Unable to deactivate admin.",
        });

    }

};


// ======================================================
// CHANGE ADMIN PASSWORD (Super Admin only)
// ======================================================

const changeAdminPassword = async (req, res) => {

    try {

        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ success: false, message: "Admin ID is required." });
        }

        const { newPassword } = req.body;

        const result = await adminManagementService.changeAdminPassword(id, newPassword, req.admin);

        await createAuditLog({
            actorType: "admin",
            actorId: req.admin?._id || null,
            action: "admin.password_changed",
            module: "admin_management",
            key: id,
            newValue: { username: result.admin?.username },
            ...getRequestContext(req),
        }).catch(() => {});

        return res.status(200).json({
            success: true,
            message: "Admin password changed successfully.",
            data: result.admin,
        });

    } catch (error) {

        console.error("Admin Management Change Password Error:", error);

        const statusCode = error.statusCode || 400;

        return res.status(statusCode).json({
            success: false,
            message: error.message || "Unable to change admin password.",
        });

    }

};


module.exports = {
    listAdmins,
    createAdmin,
    updateAdmin,
    deactivateAdmin,
    changeAdminPassword,
};
