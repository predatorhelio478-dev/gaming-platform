const express = require("express");

const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const requireAdminRole = require("../middleware/requireAdminRole");
const adminFaqController = require("../controllers/adminFaqController");

// Reads are open to any authenticated admin (including
// operator) so the FAQ tab is visible platform-wide; writes
// (create/update/delete for both categories and items) are
// restricted to admin/super_admin - matching the existing
// Settings-write RBAC convention exactly.
const manageFaq = requireAdminRole("super_admin", "admin");


// ==========================================================
// CATEGORIES
// ==========================================================

router.get("/categories", adminAuth, adminFaqController.listCategories);
router.post("/categories", adminAuth, manageFaq, adminFaqController.createCategory);
router.patch("/categories/:id", adminAuth, manageFaq, adminFaqController.updateCategory);
router.delete("/categories/:id", adminAuth, manageFaq, adminFaqController.deleteCategory);


// ==========================================================
// ITEMS
// ==========================================================

router.get("/items", adminAuth, adminFaqController.listItems);
router.post("/items", adminAuth, manageFaq, adminFaqController.createItem);
router.patch("/items/:id", adminAuth, manageFaq, adminFaqController.updateItem);
router.delete("/items/:id", adminAuth, manageFaq, adminFaqController.deleteItem);


module.exports = router;
