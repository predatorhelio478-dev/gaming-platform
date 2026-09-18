const settingsService = require("../services/settingsService");

const ENV_FALLBACK =
    process.env.CLIENT_URL || "http://localhost:3000";


/*
 * ==========================================
 * ADMIN-MANAGEABLE FRONTEND URL
 * ==========================================
 *
 * Settings -> General -> Frontend URL (general.client_url) is
 * the source of truth once an admin has saved one; until then
 * (or if the settings read fails) this falls back to the
 * CLIENT_URL env var so nothing breaks for an existing
 * deployment that has never touched this setting. Used by CORS
 * (app.js/socket.js) and by anything that needs to build a
 * link back to the frontend (e.g. a future reset-password or
 * payment-return URL).
 * ==========================================
 */

const getClientUrl = async () => {

    try {

        const configured =
            await settingsService.getValue(
                "general",
                "client_url",
                ENV_FALLBACK
            );

        if (
            typeof configured === "string" &&
            configured.trim()
        ) {

            return configured.trim();

        }

        return ENV_FALLBACK;

    } catch (error) {

        return ENV_FALLBACK;

    }

};

module.exports = {
    getClientUrl,
};
