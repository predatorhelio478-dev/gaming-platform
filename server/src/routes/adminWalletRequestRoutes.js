const express = require("express");

const router = express.Router();

const adminAuth = require("../middleware/adminAuth");

const requireAdminRole = require("../middleware/requireAdminRole");

const { reviewRequestValidators } = require("../validators/requestValidators");

const {
    getDepositRequests,
    approveDepositRequest,
    rejectDepositRequest,
    reconcileDepositRequest,
    refundDepositRequest,
    reconcileDepositRefund,
    getWithdrawalRequests,
    approveWithdrawalRequest,
    rejectWithdrawalRequest,
    reconcileWithdrawalRequest,
    retryWithdrawalRequest,
} = require("../controllers/adminWalletRequestController");

router.use(adminAuth);

// Every write below moves real money (approve/reject/refund/
// reconcile/retry all mutate wallet balances or gateway
// state) - restricted to admin/super_admin. The two list GETs
// stay open to every active admin (including "operator") for
// visibility/triage.

const moneyMovingAdmin = requireAdminRole("super_admin", "admin");

router.get("/deposit-requests", getDepositRequests);

router.post(
    "/deposit-requests/:id/approve",
    moneyMovingAdmin,
    reviewRequestValidators,
    approveDepositRequest
);

router.post(
    "/deposit-requests/:id/reject",
    moneyMovingAdmin,
    reviewRequestValidators,
    rejectDepositRequest
);

router.post(
    "/deposit-requests/:id/reconcile",
    moneyMovingAdmin,
    reconcileDepositRequest
);

router.post(
    "/deposit-requests/:id/refund",
    moneyMovingAdmin,
    refundDepositRequest
);

router.post(
    "/deposit-requests/:id/refund/reconcile",
    moneyMovingAdmin,
    reconcileDepositRefund
);

router.get("/withdrawal-requests", getWithdrawalRequests);

router.post(
    "/withdrawal-requests/:id/approve",
    moneyMovingAdmin,
    reviewRequestValidators,
    approveWithdrawalRequest
);

router.post(
    "/withdrawal-requests/:id/reject",
    moneyMovingAdmin,
    reviewRequestValidators,
    rejectWithdrawalRequest
);

router.post(
    "/withdrawal-requests/:id/reconcile",
    moneyMovingAdmin,
    reconcileWithdrawalRequest
);

router.post(
    "/withdrawal-requests/:id/retry",
    moneyMovingAdmin,
    retryWithdrawalRequest
);

module.exports = router;
