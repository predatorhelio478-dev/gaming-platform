const adminGameService = require("../services/adminGameService");

const { createAuditLog } = require("../services/auditLogService");

const notificationService = require("../services/notificationService");


// ==========================================
// REQUEST CONTEXT (IP / USER AGENT)
// ==========================================

const getRequestContext = (req) => ({

    ipAddress:
        req.ip ||
        req.headers["x-forwarded-for"] ||
        req.socket?.remoteAddress ||
        null,

    userAgent:
        req.headers["user-agent"] || null,

});


// ==========================================
// LOG A GAME CONTROL ACTION
// ==========================================

const logGameAction = (req, action) =>
    createAuditLog({
        actorType: "admin",
        actorId: req.admin?._id || null,
        action: `game.${action}`,
        module: "game",
        ...getRequestContext(req),
    }).catch(() => {});


// ==========================================
// GET GAME STATUS
// ==========================================

const getGameStatus = async (req, res) => {
    try {
        const status =
            await adminGameService.getGameStatus();

        return res.status(200).json({
            success: true,
            status,
        });

    } catch (error) {
        console.error(
            "Admin Get Game Status Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to get game status.",
        });
    }
};


// ==========================================
// START GAME
// ==========================================

const startGame = async (req, res) => {
    try {
        const result =
            await adminGameService.startGame(
                req.admin
            );

        await logGameAction(req, "start");

        return res.status(200).json({
            success: true,
            message:
                "Game started successfully.",
            data: result,
        });

    } catch (error) {
        console.error(
            "Admin Start Game Error:",
            error
        );

        return res.status(400).json({
            success: false,
            message:
                error.message ||
                "Unable to start game.",
        });
    }
};


// ==========================================
// PAUSE GAME
// ==========================================

const pauseGame = async (req, res) => {
    try {
        const result =
            await adminGameService.pauseGame(
                req.admin
            );

        await logGameAction(req, "pause");

        return res.status(200).json({
            success: true,
            message:
                "Game paused successfully.",
            data: result,
        });

    } catch (error) {
        console.error(
            "Admin Pause Game Error:",
            error
        );

        return res.status(400).json({
            success: false,
            message:
                error.message ||
                "Unable to pause game.",
        });
    }
};


// ==========================================
// RESUME GAME
// ==========================================

const resumeGame = async (req, res) => {
    try {
        const result =
            await adminGameService.resumeGame(
                req.admin
            );

        await logGameAction(req, "resume");

        return res.status(200).json({
            success: true,
            message:
                "Game resumed successfully.",
            data: result,
        });

    } catch (error) {
        console.error(
            "Admin Resume Game Error:",
            error
        );

        return res.status(400).json({
            success: false,
            message:
                error.message ||
                "Unable to resume game.",
        });
    }
};


// ==========================================
// STOP GAME
// ==========================================

const stopGame = async (req, res) => {
    try {
        const result =
            await adminGameService.stopGame(
                req.admin
            );

        await logGameAction(req, "stop");

        return res.status(200).json({
            success: true,
            message:
                "Game stopped successfully.",
            data: result,
        });

    } catch (error) {
        console.error(
            "Admin Stop Game Error:",
            error
        );

        return res.status(400).json({
            success: false,
            message:
                error.message ||
                "Unable to stop game.",
        });
    }
};


// ==========================================
// EMERGENCY STOP
// ==========================================

const emergencyStop = async (req, res) => {
    try {
        const result =
            await adminGameService.emergencyStop(
                req.admin
            );

        await logGameAction(req, "emergency_stop");

        notificationService
            .notifyAdmins(
                "system",
                "Emergency stop activated",
                `Emergency stop was activated by ${req.admin?.name || req.admin?.username || "an admin"}.`,
                { adminId: String(req.admin?._id || "") }
            )
            .catch(() => {});

        return res.status(200).json({
            success: true,
            message:
                "Emergency stop activated.",
            data: result,
        });

    } catch (error) {
        console.error(
            "Admin Emergency Stop Error:",
            error
        );

        return res.status(400).json({
            success: false,
            message:
                error.message ||
                "Unable to activate emergency stop.",
        });
    }
};


// ==========================================
// START NEW ROUND
// ==========================================

const startNewRound = async (req, res) => {
    try {
        const result =
            await adminGameService.startNewRound(
                req.admin
            );

        await logGameAction(req, "new_round");

        return res.status(200).json({
            success: true,
            message:
                "New round started successfully.",
            data: result,
        });

    } catch (error) {
        console.error(
            "Admin Start New Round Error:",
            error
        );

        return res.status(400).json({
            success: false,
            message:
                error.message ||
                "Unable to start new round.",
        });
    }
};


// ==========================================
// VOID CURRENT ROUND
// ==========================================

const voidCurrentRound = async (req, res) => {
    try {
        const result =
            await adminGameService.voidCurrentRound(
                req.admin
            );

        await logGameAction(req, "void_round");

        return res.status(200).json({
            success: true,
            message:
                "Current round voided successfully.",
            data: result,
        });

    } catch (error) {
        console.error(
            "Admin Void Round Error:",
            error
        );

        return res.status(400).json({
            success: false,
            message:
                error.message ||
                "Unable to void current round.",
        });
    }
};


module.exports = {
    getGameStatus,
    startGame,
    pauseGame,
    resumeGame,
    stopGame,
    emergencyStop,
    startNewRound,
    voidCurrentRound,
};