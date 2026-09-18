/*
 * ==========================================
 * CENTRALIZED ERROR HANDLER
 * ==========================================
 *
 * Registered last in app.js. Ensures an uncaught
 * error never leaks stack traces / internal details
 * to real users, regardless of the system.debug_mode
 * setting (that flag governs application-level debug
 * logging, not what the HTTP layer exposes).
 */

const errorHandler = (err, req, res, next) => {

    if (res.headersSent) {

        return next(err);

    }


    console.error(
        "Unhandled Error:",
        err
    );


    const statusCode =
        Number.isInteger(err?.statusCode)
            ? err.statusCode
            : Number.isInteger(err?.status)
                ? err.status
                : 500;


    const isDev =
        process.env.NODE_ENV !== "production";


    return res.status(statusCode).json({

        success: false,

        message:
            statusCode < 500 && err?.message
                ? err.message
                : "Internal server error.",

        ...(isDev
            ? { stack: err?.stack }
            : {}),

    });

};


module.exports = errorHandler;
