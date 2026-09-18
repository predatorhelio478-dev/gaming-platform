const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");

const { otpLimiter } = require("../middleware/rateLimiters");

const {
    otpRequestValidators,
    otpVerifyValidators,
} = require("../validators/requestValidators");

const {
    requestOtp,
    verifyOtp,
} = require("../controllers/otpController");

router.use(auth);

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
