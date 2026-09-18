const express = require("express");

const {
    adminLogin,
    getCurrentAdmin,
    adminForgotPassword,
    adminResetPassword,
} = require("../controllers/adminAuthController");

const adminAuth = require("../middleware/adminAuth");

const { authLimiter, passwordResetLimiter } = require("../middleware/rateLimiters");

const {
    adminLoginValidators,
    adminForgotPasswordValidators,
    adminResetPasswordValidators,
} = require("../validators/requestValidators");

const router = express.Router();


// ==========================================
// ADMIN LOGIN
// ==========================================

router.post(
    "/login",
    authLimiter,
    adminLoginValidators,
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


// ==========================================
// ADMIN FORGOT / RESET PASSWORD
// ==========================================

router.post(
    "/forgot-password",
    passwordResetLimiter,
    adminForgotPasswordValidators,
    adminForgotPassword
);

router.post(
    "/reset-password",
    passwordResetLimiter,
    adminResetPasswordValidators,
    adminResetPassword
);


module.exports = router;