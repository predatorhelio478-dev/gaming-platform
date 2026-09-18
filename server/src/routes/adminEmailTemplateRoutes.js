const express = require("express");

const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const requireAdminRole = require("../middleware/requireAdminRole");
const adminEmailTemplateController = require("../controllers/adminEmailTemplateController");

// Email templates control what real users receive by email -
// same trust level as Settings, so writes are restricted to
// admin/super_admin; operator can view/preview but not edit.
const manageTemplates = requireAdminRole("super_admin", "admin");

router.get("/", adminAuth, adminEmailTemplateController.listTemplates);
router.get("/:key", adminAuth, adminEmailTemplateController.getTemplate);
router.get("/:key/preview", adminAuth, adminEmailTemplateController.previewTemplate);
router.patch("/:key", adminAuth, manageTemplates, adminEmailTemplateController.updateTemplate);

module.exports = router;
