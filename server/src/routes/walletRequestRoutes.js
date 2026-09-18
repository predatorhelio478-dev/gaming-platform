const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");

const { walletActionLimiter } = require("../middleware/rateLimiters");

const {
    createDepositRequestValidators,
    createWithdrawalRequestValidators,
} = require("../validators/requestValidators");

const {
    createDepositRequest,
    createRazorpayOrder,
    verifyRazorpayPayment,
    getMyDepositRequests,
    createWithdrawalRequest,
    getMyWithdrawalRequests,
} = require("../controllers/walletRequestController");

router.use(auth);

router.post(
    "/deposit-requests",
    walletActionLimiter,
    createDepositRequestValidators,
    createDepositRequest
);

router.get(
    "/deposit-requests",
    getMyDepositRequests
);

router.post(
    "/deposit/razorpay/order",
    walletActionLimiter,
    createRazorpayOrder
);

router.post(
    "/deposit/razorpay/verify",
    walletActionLimiter,
    verifyRazorpayPayment
);

router.post(
    "/withdrawal-requests",
    walletActionLimiter,
    createWithdrawalRequestValidators,
    createWithdrawalRequest
);

router.get(
    "/withdrawal-requests",
    getMyWithdrawalRequests
);

module.exports = router;
