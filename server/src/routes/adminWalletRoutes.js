const express = require("express");

const router =
    express.Router();

const adminWalletController =
    require("../controllers/adminWalletController");


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

router.post(
    "/adjust",
    adminWalletController.adjustUserWallet
);


module.exports = router;