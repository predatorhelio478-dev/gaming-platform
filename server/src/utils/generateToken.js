const jwt = require("jsonwebtoken");

const settingsService = require("../services/settingsService");

/*
 * REMEMBER ME (long-lived token, "until manual logout") - JWTs
 * can't truly be infinite, so this uses a long, practically-
 * forever expiry instead. 365 days comfortably outlasts any
 * realistic session without the token itself ever becoming the
 * reason a "remembered" user gets signed out.
 */
const REMEMBER_ME_EXPIRES_IN = "365d";

/*
 * session_timeout (Settings -> Security, minutes) drives the
 * user session/token lifetime when Remember Me is NOT checked,
 * and is set to a valid positive number - falls back to the
 * JWT_EXPIRES_IN env var (e.g. "7d") if the setting is unset/
 * invalid/unreachable, so a settings-service hiccup can never
 * block login/registration. Defaults to 1440 minutes (24h),
 * matching the "not remembered -> 24 hours" requirement out of
 * the box.
 */
const generateToken = async (userId, rememberMe = false) => {

    if (rememberMe) {

        return jwt.sign(
            {
                id: userId,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: REMEMBER_ME_EXPIRES_IN,
            }
        );

    }

    let expiresIn = process.env.JWT_EXPIRES_IN;

    try {

        const sessionTimeoutMinutes =
            Number(
                await settingsService.getValue(
                    "security",
                    "session_timeout",
                    null
                )
            );

        if (Number.isFinite(sessionTimeoutMinutes) && sessionTimeoutMinutes > 0) {

            expiresIn = `${sessionTimeoutMinutes}m`;

        }

    } catch (error) {

        // Keep the env var fallback - never block token issuance
        // over a settings lookup failure.

    }

    return jwt.sign(
        {
            id: userId,
        },
        process.env.JWT_SECRET,
        {
            expiresIn,
        }
    );

};

module.exports = generateToken;
