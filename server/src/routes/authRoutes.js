const express = require("express");

const router = express.Router();

const {
  register,
  login,
  resendVerificationOtp,
  verifyAndLogin,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

const { authLimiter, passwordResetLimiter } = require("../middleware/rateLimiters");

const {
  registerValidators,
  loginValidators,
  forgotPasswordValidators,
  resetPasswordValidators,
} = require("../validators/requestValidators");

router.post("/register", authLimiter, registerValidators, register);

router.post("/login", authLimiter, loginValidators, login);

router.post("/resend-verification", authLimiter, resendVerificationOtp);

router.post("/verify-login", authLimiter, verifyAndLogin);

router.post("/forgot-password", passwordResetLimiter, forgotPasswordValidators, forgotPassword);

router.post("/reset-password", passwordResetLimiter, resetPasswordValidators, resetPassword);

module.exports = router;