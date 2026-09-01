const express = require("express");

const router =
    express.Router();


const adminBetController =
    require("../controllers/adminBetController");


const adminAuth =
    require("../middleware/adminAuth");


// ==========================================
// GET ADMIN BETS
// ==========================================
//
// GET /api/admin/bets
//
// Examples:
//
// /api/admin/bets
// /api/admin/bets?page=2
// /api/admin/bets?color=red
// /api/admin/bets?result=won
// /api/admin/bets?search=vishnu
//
// ==========================================

router.get(
    "/",
    adminAuth,
    adminBetController.getBets
);


module.exports = router;