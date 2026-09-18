const settingsService =
    require("../services/settingsService");

const defaultSettings =
    require("../config/defaultSettings");


// ==========================================================
// GET ALL SETTINGS
// ==========================================================

const getAllSettings = async (
    req,
    res
) => {

    try {

        const settings =
            await settingsService
                .getAllSettings();


        return res.status(200).json({

            success: true,

            message:
                "Settings fetched successfully.",

            data: settings,

        });

    } catch (error) {

        console.error(
            "Get all settings error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch settings.",

        });

    }

};


// ==========================================================
// GET SETTINGS BY CATEGORY
// ==========================================================

const getSettingsByCategory = async (
    req,
    res
) => {

    try {

        const {
            category
        } = req.params;


        if (!category) {

            return res.status(400).json({

                success: false,

                message:
                    "Settings category is required.",

            });

        }


        const settings =
            await settingsService
                .getSettingsByCategory(
                    category
                );


        return res.status(200).json({

            success: true,

            message:
                "Category settings fetched successfully.",

            data: settings,

        });

    } catch (error) {

        console.error(
            "Get category settings error:",
            error
        );


        return res.status(400).json({

            success: false,

            message:
                error.message,

        });

    }

};


// ==========================================================
// GET SINGLE SETTING
// ==========================================================

const getSetting = async (
    req,
    res
) => {

    try {

        const {
            category,
            key,
        } = req.params;


        if (
            !category ||
            !key
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Category and setting key are required.",

            });

        }


        const setting =
            await settingsService.getSetting(
                category,
                key
            );


        if (!setting) {

            return res.status(404).json({

                success: false,

                message:
                    "Setting not found.",

            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Setting fetched successfully.",

            data: setting,

        });

    } catch (error) {

        console.error(
            "Get setting error:",
            error
        );


        return res.status(400).json({

            success: false,

            message:
                error.message,

        });

    }

};


// ==========================================================
// GET PUBLIC SETTINGS
// ==========================================================

const getPublicSettings = async (
    req,
    res
) => {

    try {

        const settings =
            await settingsService
                .getPublicSettings();

        const legalUpdatedAt =
            await settingsService
                .getLegalLastUpdated()
                .catch(() => null);


        return res.status(200).json({

            success: true,

            message:
                "Public settings fetched successfully.",

            data: settings,

            legalUpdatedAt,

        });

    } catch (error) {

        console.error(
            "Get public settings error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch public settings.",

        });

    }

};


// ==========================================================
// UPDATE SETTINGS
// ==========================================================

const updateSettings = async (
    req,
    res
) => {

    try {

        const {
            category
        } = req.params;


        const {
            settings
        } = req.body;


        // ==================================================
        // VALIDATE CATEGORY
        // ==================================================

        if (!category) {

            return res.status(400).json({

                success: false,

                message:
                    "Settings category is required.",

            });

        }


        // ==================================================
        // VALIDATE PAYLOAD
        // ==================================================

        if (
            !Array.isArray(settings)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Settings must be an array.",

            });

        }


        // ==================================================
        // ADMIN
        // ==================================================

        const adminId =
            req.admin?._id || null;


        if (!adminId) {

            return res.status(401).json({

                success: false,

                message:
                    "Authenticated admin not found.",

            });

        }


        // ==================================================
        // AUDIT CONTEXT
        // ==================================================

        const auditContext = {

            ipAddress:
                req.ip ||
                req.headers[
                "x-forwarded-for"
                ] ||
                req.socket?.remoteAddress ||
                null,

            userAgent:
                req.headers[
                "user-agent"
                ] ||
                null,

        };


        // ==================================================
        // UPDATE
        // ==================================================

        const result =
            await settingsService.updateSettings(
                category,
                settings,
                adminId,
                auditContext
            );


        const hasChanges =
            result.changed.length > 0;


        return res.status(200).json({

            success: true,

            message:
                hasChanges
                    ? "Settings updated successfully."
                    : "No changes to save.",

            data: result.settings,

            changed: result.changed,

            unchanged: result.unchanged,

        });

    } catch (error) {

        console.error(
            "Update settings error:",
            error
        );


        return res.status(400).json({

            success: false,

            message:
                error.message,

        });

    }

};


// ==========================================================
// RESET SETTINGS
// ==========================================================

const resetSettings = async (
    req,
    res
) => {

    try {

        const {
            category
        } = req.params;


        // ==================================================
        // VALIDATE CATEGORY
        // ==================================================

        if (!category) {

            return res.status(400).json({

                success: false,

                message:
                    "Settings category is required.",

            });

        }


        // ==================================================
        // ADMIN
        // ==================================================

        const adminId =
            req.admin?._id || null;


        if (!adminId) {

            return res.status(401).json({

                success: false,

                message:
                    "Authenticated admin not found.",

            });

        }


        // ==================================================
        // AUDIT CONTEXT
        // ==================================================

        const auditContext = {

            ipAddress:
                req.ip ||
                req.headers[
                "x-forwarded-for"
                ] ||
                req.socket?.remoteAddress ||
                null,

            userAgent:
                req.headers[
                "user-agent"
                ] ||
                null,

        };


        // ==================================================
        // RESET
        // ==================================================

        const result =
            await settingsService.resetSettings(
                category,
                defaultSettings,
                adminId,
                auditContext
            );


        const hasChanges =
            result.changed.length > 0;


        return res.status(200).json({

            success: true,

            message:
                hasChanges
                    ? "Settings reset successfully."
                    : "Settings already at default values. No changes to save.",

            data: result.settings,

            changed: result.changed,

            unchanged: result.unchanged,

        });

    } catch (error) {

        console.error(
            "Reset settings error:",
            error
        );


        return res.status(400).json({

            success: false,

            message:
                error.message,

        });

    }

};


// ==========================================================
// EXPORT
// ==========================================================

module.exports = {

    getAllSettings,

    getSettingsByCategory,

    getSetting,

    getPublicSettings,

    updateSettings,

    resetSettings,

};