const adminGameService = require("../services/adminGameService");


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