const jwt = require("jsonwebtoken");

const settingsService = require("../services/settingsService");

/*
 * session_timeout (Settings -> Security, minutes) drives the
 * user session/token lifetime when it's set to a valid positive
 * number - falls back to the JWT_EXPIRES_IN env var (e.g. "7d")
 * if the setting is unset/invalid/unreachable, so a settings-
 * service hiccup can never block login/registration.
 */
const generateToken = async (userId) => {

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
