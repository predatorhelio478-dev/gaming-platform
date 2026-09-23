const settingsService =
    require("../services/settingsService");


/*
 * ==========================================
 * CORS ALLOWED ORIGINS
 * ==========================================
 *
 * A single source of truth shared by REST CORS (app.js) and
 * Socket.IO CORS (socket.js) - both used to independently
 * resolve just one origin via getClientUrl(), which meant a
 * single wrong/stale value broke both at once (and once the
 * Settings->General->client_url row was seeded, it could never
 * self-correct - see below). This resolves a real allowlist of
 * origins instead, combining every configured source, and
 * matches the browser's actual Origin header against it - the
 * exact matched origin is echoed back (never "*"), which is
 * also required for credentials:true to work at all.
 *
 * Sources, all additive (any of them being correct is enough):
 *   1) Settings -> General -> Frontend URL (general.client_url)
 *      - admin-configurable at runtime, no restart needed.
 *   2) CLIENT_URL env var - the canonical primary frontend URL.
 *   3) ALLOWED_ORIGINS env var - comma-separated list, for
 *      Vercel preview-deployment URLs, a secondary environment,
 *      or local-frontend-against-live-backend testing.
 *
 * Why "additive" matters: general.client_url is seeded once via
 * $setOnInsert (see seeders/settingsSeeder.js) using whatever
 * CLIENT_URL happened to be set at the very first server boot,
 * and is then never auto-updated again (by design, so it never
 * overwrites an admin's own edit). If CLIENT_URL was wrong or
 * unset at that first boot, the database value is permanently
 * stuck - previously that alone broke CORS with no way to
 * recover except manually editing the Settings row. Now it's
 * just one entry in a set; a correct CLIENT_URL/ALLOWED_ORIGINS
 * env var is enough on its own regardless of the DB's state.
 * ==========================================
 */

const normalize = (
    value
) => {

    if (typeof value !== "string") {

        return null;

    }

    const trimmed =
        value.trim().replace(/\/+$/, "");

    return trimmed || null;

};


const getAllowedOrigins = async () => {

    const origins = new Set();


    /*
     * 1) Admin-configured Frontend URL
     */

    try {

        const configured =
            await settingsService.getValue(
                "general",
                "client_url",
                null
            );

        const normalized =
            normalize(configured);

        if (normalized) {

            origins.add(normalized);

        }

    } catch (error) {

        /*
         * Settings read failed (DB hiccup, not yet seeded) -
         * fall through to the env-configured sources below.
         */

    }


    /*
     * 2) CLIENT_URL env var
     */

    const envClientUrl =
        normalize(process.env.CLIENT_URL);

    if (envClientUrl) {

        origins.add(envClientUrl);

    }


    /*
     * 3) ALLOWED_ORIGINS env var (comma-separated)
     */

    if (process.env.ALLOWED_ORIGINS) {

        for (const raw of process.env.ALLOWED_ORIGINS.split(",")) {

            const normalized =
                normalize(raw);

            if (normalized) {

                origins.add(normalized);

            }

        }

    }


    /*
     * Last-resort fallback so a totally unconfigured environment
     * still has a working local-dev origin rather than allowing
     * nothing at all.
     */

    if (origins.size === 0) {

        origins.add("http://localhost:3000");

    }


    return origins;

};


const isOriginAllowed = async (
    origin
) => {

    /*
     * No Origin header at all - same-origin navigation, a
     * server-to-server call, curl, a mobile app, or a webhook.
     * Nothing for CORS to check; the browser only ever sends
     * Origin on cross-origin requests.
     */

    if (!origin) {

        return true;

    }

    const allowed =
        await getAllowedOrigins();

    return allowed.has(
        normalize(origin)
    );

};


module.exports = {

    getAllowedOrigins,

    isOriginAllowed,

};
