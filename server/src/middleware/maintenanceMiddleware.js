const settingsCache =
    require("../services/settingsCache");


// ==========================================================
// MAINTENANCE MODE MIDDLEWARE
// ==========================================================

const maintenanceMiddleware = async (
    req,
    res,
    next
) => {

    try {

        // ==================================================
        // ADMIN ROUTES BYPASS
        // ==================================================

        if (
            req.originalUrl.startsWith(
                "/api/admin"
            )
        ) {

            return next();

        }


        // ==================================================
        // GET MAINTENANCE MODE
        // ==================================================

        const maintenanceMode =
            await settingsCache.getValue(
                "system",
                "maintenance_mode",
                false
            );


        // ==================================================
        // MAINTENANCE DISABLED
        // ==================================================

        if (
            maintenanceMode !== true
        ) {

            return next();

        }


        // ==================================================
        // MAINTENANCE ENABLED
        // ==================================================

        return res.status(503).json({

            success: false,

            code:
                "MAINTENANCE_MODE",

            message:
                "The platform is currently under maintenance. Please try again later.",

        });

    } catch (error) {

        console.error(
            "Maintenance middleware error:",
            error.message
        );


        /*
         * Fail-open:
         *
         * Agar settings/cache check fail ho,
         * application unnecessarily block nahi hogi.
         */

        return next();

    }

};


// ==========================================================
// EXPORT
// ==========================================================

module.exports =
    maintenanceMiddleware;