const express = require("express");

const router = express.Router();

const { handleRazorpayWebhook } = require("../controllers/razorpayWebhookController");

/*
 * express.raw() here (not the global express.json()) so the
 * controller receives the exact bytes Razorpay signed.
 */
router.post(
    "/razorpay",
    express.raw({ type: "application/json" }),
    handleRazorpayWebhook
);

module.exports = router;
