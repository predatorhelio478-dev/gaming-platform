const express =
    require("express");

const router =
    express.Router();

const settingsController =
    require("../controllers/settingsController");


// ==========================================================
// GET PUBLIC SETTINGS
// ==========================================================

router.get(
    "/",
    settingsController.getPublicSettings
);


module.exports = router;