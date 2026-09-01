const express = require("express");

const {
    adminLogin,
    getCurrentAdmin,
} = require("../controllers/adminAuthController");

const adminAuth = require("../middleware/adminAuth");

const router = express.Router();


// ==========================================
// ADMIN LOGIN
// ==========================================

router.post(
    "/login",
    adminLogin
);


// ==========================================
// CURRENT ADMIN
// ==========================================

router.get(
    "/me",
    adminAuth,
    getCurrentAdmin
);


module.exports = router;