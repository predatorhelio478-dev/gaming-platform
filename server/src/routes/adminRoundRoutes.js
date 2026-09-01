const express = require("express");

const router = express.Router();

const adminRoundController =
    require("../controllers/adminRoundController");

const adminAuth =
    require("../middleware/adminAuth");


// ==========================================
// GET ADMIN ROUNDS
// ==========================================
//
// GET /api/admin/rounds
//
// Examples:
//
// /api/admin/rounds
// /api/admin/rounds?page=2&limit=20
// /api/admin/rounds?status=completed
// /api/admin/rounds?result=red
// /api/admin/rounds?search=1024
//
// ==========================================

router.get(
    "/",
    adminAuth,
    adminRoundController.getRounds
);

// ==========================================
// GET ADMIN ROUND DETAIL
// ==========================================
//
// GET /api/admin/rounds/:id
//
// ==========================================

router.get(
    "/:id",
    adminAuth,
    adminRoundController.getRoundDetail
);


module.exports = router;