const express = require("express");

const router = express.Router();

const {

    currentRound,

    history,

    historyPaginated

} = require("../controllers/gameController");

router.get("/current", currentRound);

router.get("/history", history);

router.get("/history/paginated", historyPaginated);

module.exports = router;