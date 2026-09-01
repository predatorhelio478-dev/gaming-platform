const express = require("express");

const router = express.Router();

const adminGameController =
    require("../controllers/adminGameController");

const adminAuth =
    require("../middleware/adminAuth");


// ==========================================
// GAME STATUS
// ==========================================

router.get(
    "/status",
    adminAuth,
    adminGameController.getGameStatus
);


// ==========================================
// START GAME
// ==========================================

router.post(
    "/start",
    adminAuth,
    adminGameController.startGame
);


// ==========================================
// PAUSE GAME
// ==========================================

router.post(
    "/pause",
    adminAuth,
    adminGameController.pauseGame
);


// ==========================================
// RESUME GAME
// ==========================================

router.post(
    "/resume",
    adminAuth,
    adminGameController.resumeGame
);


// ==========================================
// STOP GAME
// ==========================================

router.post(
    "/stop",
    adminAuth,
    adminGameController.stopGame
);


// ==========================================
// EMERGENCY STOP
// ==========================================

router.post(
    "/emergency-stop",
    adminAuth,
    adminGameController.emergencyStop
);


// ==========================================
// MANUAL NEW ROUND
// ==========================================

router.post(
    "/new-round",
    adminAuth,
    adminGameController.startNewRound
);


// ==========================================
// VOID CURRENT ROUND
// ==========================================

router.post(
    "/void-round",
    adminAuth,
    adminGameController.voidCurrentRound
);


module.exports = router;