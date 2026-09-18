const express = require("express");

const router =
    express.Router();


const adminPayoutController =
    require("../controllers/adminPayoutController");


const adminAuth =
    require("../middleware/adminAuth");

const requireAdminRole =
    require("../middleware/requireAdminRole");

// Every action here except manual-review directly mutates a
// payout's wallet-affecting state (retry/cancel/reverse/
// refund/restore) - restricted to admin/super_admin.
const moneyMovingAdmin = requireAdminRole("super_admin", "admin");


// ==========================================
// GET ADMIN PAYOUTS
// ==========================================
//
// GET /api/admin/payouts
//
// Examples:
//
// /api/admin/payouts
// /api/admin/payouts?page=2
// /api/admin/payouts?search=vishnu
// /api/admin/payouts?search=4483
// /api/admin/payouts?status=paid
//
// ==========================================

router.get(
    "/",
    adminAuth,
    adminPayoutController.getPayouts
);

// ==========================================
// RETRY PAYOUT
// ==========================================

router.post(
    "/:id/retry",
    adminAuth,
    moneyMovingAdmin,
    adminPayoutController.retryPayout
);


// ==========================================
// MANUAL REVIEW
// ==========================================
//
// Pure status flag - no wallet mutation - left open to every
// active admin for triage.
// ==========================================

router.post(
    "/:id/manual-review",
    adminAuth,
    adminPayoutController.markManualReview
);


// ==========================================
// CANCEL PAYOUT
// ==========================================

router.post(
    "/:id/cancel",
    adminAuth,
    moneyMovingAdmin,
    adminPayoutController.cancelPayout
);

// ==========================================
// REVERSE PAYOUT
// ==========================================

router.post(
    "/:id/reverse",
    adminAuth,
    moneyMovingAdmin,
    adminPayoutController.reversePayout
);

// ==========================================
// REFUND PAYOUT
// ==========================================

router.post(
    "/:id/refund",
    adminAuth,
    moneyMovingAdmin,
    adminPayoutController.refundPayout
);

// ==========================================
// RESTORE PAYOUT
// ==========================================

router.post(
    "/:id/restore",
    adminAuth,
    moneyMovingAdmin,
    adminPayoutController.restorePayout
);

module.exports = router;
