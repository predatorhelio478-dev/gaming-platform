const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");

const { betLimiter } = require("../middleware/rateLimiters");

const { placeBetValidators, increaseBetValidators } = require("../validators/requestValidators");

const {
    placeBet,
    increaseBet,
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
    betLimiter,
    placeBetValidators,
    placeBet
);


/*
 * ==========================================
 * INCREASE BET
 * ==========================================
 *
 * POST /api/bets/increase
 *
 * Authentication required. Only allowed on the caller's own
 * existing bet in the current betting round, same color,
 * more than 5 seconds before betting closes (server-timed).
 */

router.post(
    "/increase",
    auth,
    betLimiter,
    increaseBetValidators,
    increaseBet
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