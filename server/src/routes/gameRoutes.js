const express = require("express");

const router = express.Router();

const {

    status,

    currentRound,

    history,

    historyPaginated

} = require("../controllers/gameController");

router.get("/status", status);

router.get("/current", currentRound);

router.get("/history", history);

router.get("/history/paginated", historyPaginated);

module.exports = router;