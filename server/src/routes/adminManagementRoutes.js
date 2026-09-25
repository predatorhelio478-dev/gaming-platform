const express = require("express");

const router = express.Router();

const adminManagementController = require("../controllers/adminManagementController");

const adminAuth = require("../middleware/adminAuth");

const requireAdminRole = require("../middleware/requireAdminRole");


// ======================================================
// ADMIN ACCOUNT MANAGEMENT
// ======================================================
//
// Manages the Admin collection itself (super_admin / admin /
// operator - the accounts that can log into /admin/*), as
// distinct from adminUserRoutes.js which manages the User
// (player) collection. Every mutating route is re-checked
// inside adminManagementService for role/self-delete rules,
// so this middleware gate is defense-in-depth, not the only
// enforcement.
// ======================================================

router.get(
    "/",
    adminAuth,
    adminManagementController.listAdmins
);

router.post(
    "/",
    adminAuth,
    requireAdminRole("super_admin", "admin"),
    adminManagementController.createAdmin
);

router.patch(
    "/:id",
    adminAuth,
    requireAdminRole("super_admin", "admin"),
    adminManagementController.updateAdmin
);

router.delete(
    "/:id",
    adminAuth,
    requireAdminRole("super_admin", "admin"),
    adminManagementController.deactivateAdmin
);

// Route-gated to super_admin only, and re-checked independently
// inside adminManagementService.changeAdminPassword - password is
// more sensitive than username/email, which already require
// super_admin.
router.post(
    "/:id/password",
    adminAuth,
    requireAdminRole("super_admin"),
    adminManagementController.changeAdminPassword
);

module.exports = router;
