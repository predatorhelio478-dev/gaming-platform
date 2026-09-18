const express =
    require("express");

const router =
    express.Router();

const adminAuth =
    require("../middleware/adminAuth");

const auditLogController =
    require("../controllers/auditLogController");


// ==========================================================
// ADMIN AUDIT LOGS
// ==========================================================

// GET /api/admin/audit-logs

router.get(
    "/",
    adminAuth,
    auditLogController.getAuditLogs
);


// ==========================================================
// SINGLE AUDIT LOG
// ==========================================================

// GET /api/admin/audit-logs/:id

router.get(
    "/:id",
    adminAuth,
    auditLogController.getAuditLogById
);


module.exports =
    router;