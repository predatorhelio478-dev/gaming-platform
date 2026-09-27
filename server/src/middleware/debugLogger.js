const settingsCache =
    require("../services/settingsCache");


// ==========================================================
// DEBUG MODE REQUEST LOGGER
// ==========================================================
//
// Active only while system.debug_mode is ON (Admin ->
// Settings -> System). Logs one line per API request with
// method, path, status, duration and the authenticated
// user/admin id when one was resolved. Server-side only -
// debug mode never changes what API responses expose.
// The query string is dropped so tokens/OTPs passed as
// query params never end up in the logs.
// ==========================================================

const debugLogger = async (
    req,
    res,
    next
) => {

    let debugMode = false;

    try {

        debugMode =
            await settingsCache.getValue(
                "system",
                "debug_mode",
                false
            ) === true;

    } catch {

        debugMode = false;

    }

    if (!debugMode) {

        return next();

    }

    const startedAt =
        process.hrtime.bigint();

    res.on("finish", () => {

        const durationMs =
            Number(process.hrtime.bigint() - startedAt) / 1e6;

        const actorId =
            req.user?._id || req.user?.id || req.admin?._id || req.admin?.id;

        console.log(
            `[debug] ${req.method} ${req.originalUrl.split("?")[0]} ${res.statusCode} ${durationMs.toFixed(1)}ms${actorId ? ` actor=${actorId}` : ""}`
        );

    });

    return next();

};


module.exports =
    debugLogger;
