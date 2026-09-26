const express = require("express");

const router = express.Router();

const adminAuth = require("../middleware/adminAuth");

const { otpLimiter } = require("../middleware/rateLimiters");

const {
    otpRequestValidators,
    otpVerifyValidators,
} = require("../validators/requestValidators");

const {
    requestOtp,
    verifyOtp,
} = require("../controllers/adminOtpController");

// ======================================================
// ADMIN/SUPER-ADMIN SELF-SERVICE EMAIL/MOBILE VERIFICATION
// ======================================================
//
// Mirrors /api/otp (the User-facing equivalent) - same
// validators/rate limiter, scoped to the Admin collection via
// adminOtpController (which tags every OTP record actorModel:
// "Admin"). Any authenticated admin (any role) can verify their
// own email/mobile - this is self-service on your own account,
// not a role-gated management action.

router.use(adminAuth);

router.post(
    "/request",
    otpLimiter,
    otpRequestValidators,
    requestOtp
);

router.post(
    "/verify",
    otpLimiter,
    otpVerifyValidators,
    verifyOtp
);

module.exports = router;
