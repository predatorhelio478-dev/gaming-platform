const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");
const { getLeaderboard } = require("../controllers/leaderboardController");

router.get("/", auth, getLeaderboard);

module.exports = router;
