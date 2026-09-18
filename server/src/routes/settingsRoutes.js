const express = require("express");

const router = express.Router();

const adminAuth =
    require("../middleware/adminAuth");

const requireAdminRole =
    require("../middleware/requireAdminRole");

const settingsController =
    require("../controllers/settingsController");


// ==========================================================
// ADMIN SETTINGS
// ==========================================================

router.get(
    "/",
    adminAuth,
    settingsController.getAllSettings
);


router.get(
    "/category/:category",
    adminAuth,
    settingsController.getSettingsByCategory
);


router.get(
    "/category/:category/:key",
    adminAuth,
    settingsController.getSetting
);


// Writes are restricted to admin/super_admin - settings
// govern payment_mode/withdrawal_mode/limits/fees platform-
// wide, so the lowest-trust "operator" role may view them
// (GET routes above) but not change them.

router.put(
    "/category/:category",
    adminAuth,
    requireAdminRole("super_admin", "admin"),
    settingsController.updateSettings
);


router.post(
    "/category/:category/reset",
    adminAuth,
    requireAdminRole("super_admin", "admin"),
    settingsController.resetSettings
);


module.exports = router;