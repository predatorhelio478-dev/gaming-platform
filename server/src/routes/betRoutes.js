const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");

const {
    placeBet,
    getMyBets,
} = require("../controllers/betController");


/*
 * ==========================================
 * PLACE BET
 * ==========================================
 *
 * POST /api/bets
 *
 * Authentication required.
 */

router.post(
    "/",
    auth,
    placeBet
);


/*
 * ==========================================
 * MY BET HISTORY
 * ==========================================
 *
 * GET /api/bets/history
 *
 * Authentication required.
 */

router.get(
    "/history",
    auth,
    getMyBets
);


module.exports = router;