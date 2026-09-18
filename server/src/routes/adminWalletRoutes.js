const express = require("express");

const router =
    express.Router();

const adminWalletController =
    require("../controllers/adminWalletController");

const adminAuth =
    require("../middleware/adminAuth");

const requireAdminRole =
    require("../middleware/requireAdminRole");

const { adminWalletAdjustValidators } =
    require("../validators/requestValidators");

router.use(adminAuth);


// ======================================================
// ADMIN WALLET OVERVIEW
// ======================================================

router.get(
    "/overview",
    adminWalletController.getWalletOverview
);


// ======================================================
// USER WALLETS
// ======================================================

router.get(
    "/users",
    adminWalletController.getUserWallets
);


// ======================================================
// USER WALLET DETAILS
// ======================================================

router.get(
    "/users/:userId",
    adminWalletController.getUserWalletDetails
);


// ======================================================
// WALLET TRANSACTIONS
// ======================================================

router.get(
    "/transactions",
    adminWalletController.getTransactions
);


// ======================================================
// ADJUST USER WALLET
// ======================================================
//
// Restricted to admin/super_admin - directly mutates real
// money outside the normal deposit/withdrawal flow.
// ======================================================

router.post(
    "/adjust",
    requireAdminRole("super_admin", "admin"),
    adminWalletAdjustValidators,
    adminWalletController.adjustUserWallet
);


module.exports = router;