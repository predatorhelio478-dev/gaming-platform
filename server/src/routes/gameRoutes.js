const express = require("express");

const router = express.Router();

const {

    currentRound,

    history

} = require("../controllers/gameController");

router.get("/current", currentRound);

router.get("/history", history);

module.exports = router;