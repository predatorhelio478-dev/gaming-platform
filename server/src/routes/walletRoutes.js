const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");

const {
  getWallet,
  getMyTransactions,
  getReferralInfo,
  getReferredUsers,
} = require("../controllers/walletController");

router.get("/", auth, getWallet);
router.get("/transactions", auth, getMyTransactions);
router.get("/referral", auth, getReferralInfo);
router.get("/referral/users", auth, getReferredUsers);

module.exports = router;
