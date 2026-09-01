const express = require("express");

const router =
    express.Router();


const adminPayoutController =
    require("../controllers/adminPayoutController");


const adminAuth =
    require("../middleware/adminAuth");


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
    adminPayoutController.retryPayout
);


// ==========================================
// MANUAL REVIEW
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
    adminPayoutController.cancelPayout
);

// ==========================================
// REVERSE PAYOUT
// ==========================================

router.post(
    "/:id/reverse",
    adminAuth,
    adminPayoutController.reversePayout
);

// ==========================================
// REFUND PAYOUT
// ==========================================

router.post(
    "/:id/refund",
    adminAuth,
    adminPayoutController.refundPayout
);

// ==========================================
// RESTORE PAYOUT
// ==========================================

router.post(
    "/:id/restore",
    adminAuth,
    adminPayoutController.restorePayout
);

module.exports = router;