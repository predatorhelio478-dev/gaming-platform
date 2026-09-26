const rateLimit = require("express-rate-limit");

const settingsService = require("../services/settingsService");


/*
 * ==========================================
 * RATE-LIMIT RESPONSE HANDLER (with countdown)
 * ==========================================
 *
 * express-rate-limit populates req.rateLimit.resetTime (when
 * standardHeaders is on) with the Date the current window
 * clears - this turns that into a plain retryAfterSeconds
 * integer in the JSON body, so the frontend can render a real
 * countdown instead of only a static string. Falls back to
 * omitting the field (frontend just shows the message) if
 * resetTime isn't available for some reason.
 */

const buildRateLimitHandler = (message) => (req, res) => {

    const resetTime =
        req.rateLimit?.resetTime;

    const retryAfterSeconds =
        resetTime
            ? Math.max(
                1,
                Math.ceil(
                    (new Date(resetTime).getTime() - Date.now()) / 1000
                )
            )
            : undefined;

    res.status(429).json({
        success: false,
        message,
        ...(retryAfterSeconds ? { retryAfterSeconds } : {}),
    });

};


/*
 * ==========================================
 * AUTH LIMITER
 * ==========================================
 *
 * Applied to login/register endpoints (user + admin).
 * Max attempts is admin-configurable via
 * Settings -> security.max_login_attempts.
 *
 * This is a raw per-IP request-volume ceiling, independent of
 * the account-level progressive lockout in loginLockout.js
 * (which escalates a SPECIFIC account's wait from 30s up to 30
 * minutes the more it's attacked - see that file for the
 * schedule). windowMs stays short here since this layer's job is
 * just to blunt a burst of raw requests, not to enforce the
 * account-level schedule.
 */

const authLimiter = rateLimit({

    windowMs: 60 * 1000,

    max: async (req) => {

        try {

            const configured =
                Number(
                    await settingsService.getValue(
                        "security",
                        "max_login_attempts",
                        5
                    )
                );


            return Number.isFinite(configured) && configured > 0
                ? configured
                : 5;

        } catch (error) {

            return 5;

        }

    },

    standardHeaders: true,

    legacyHeaders: false,

    handler: buildRateLimitHandler(
        "Too many attempts. Please try again later."
    ),

});


/*
 * ==========================================
 * BET LIMITER
 * ==========================================
 *
 * Limits how quickly a single client can place bets,
 * independent of per-round application-level checks.
 */

const betLimiter = rateLimit({

    windowMs: 60 * 1000,

    max: 20,

    standardHeaders: true,

    legacyHeaders: false,

    message: {
        success: false,
        message:
            "Too many bet requests. Please slow down.",
    },

});


/*
 * ==========================================
 * OTP LIMITER
 * ==========================================
 *
 * Applied to OTP request/verify endpoints, independent of
 * otpService's own resend-cooldown (that's a per-user
 * business rule; this is a raw per-IP abuse ceiling).
 */

const otpLimiter = rateLimit({

    windowMs: 15 * 60 * 1000,

    max: 10,

    standardHeaders: true,

    legacyHeaders: false,

    handler: buildRateLimitHandler(
        "Too many verification requests. Please try again later."
    ),

});


/*
 * ==========================================
 * WALLET ACTION LIMITER
 * ==========================================
 *
 * Applied to deposit/withdrawal request creation.
 */

const walletActionLimiter = rateLimit({

    windowMs: 15 * 60 * 1000,

    max: 10,

    standardHeaders: true,

    legacyHeaders: false,

    message: {
        success: false,
        message:
            "Too many wallet requests. Please try again later.",
    },

});


/*
 * ==========================================
 * PASSWORD RESET LIMITER
 * ==========================================
 *
 * Applied to both forgot-password (request) and
 * reset-password (verify) - this is a classic account-
 * enumeration and brute-force surface, independent of
 * otpService's own per-record resend-cooldown/attempt-limit
 * (those are per-account business rules; this is a raw
 * per-IP abuse ceiling), for both the user and admin flows.
 */

const passwordResetLimiter = rateLimit({

    windowMs: 15 * 60 * 1000,

    max: 10,

    standardHeaders: true,

    legacyHeaders: false,

    handler: buildRateLimitHandler(
        "Too many password reset attempts. Please try again later."
    ),

});


/*
 * ==========================================
 * SUPPORT TICKET CREATION LIMITER
 * ==========================================
 *
 * Caps how many new tickets one client can open, to stop
 * spam ticket creation without making normal support usage
 * (a handful of tickets over time) difficult.
 */

const supportCreateLimiter = rateLimit({

    windowMs: 60 * 60 * 1000,

    max: 5,

    standardHeaders: true,

    legacyHeaders: false,

    message: {
        success: false,
        message:
            "Too many support tickets created. Please try again later.",
    },

});


/*
 * ==========================================
 * SUPPORT REPLY LIMITER
 * ==========================================
 *
 * Caps rapid repeated replies (either side) on the support
 * conversation endpoints.
 */

const supportReplyLimiter = rateLimit({

    windowMs: 60 * 1000,

    max: 20,

    standardHeaders: true,

    legacyHeaders: false,

    message: {
        success: false,
        message:
            "Too many messages sent. Please slow down.",
    },

});


/*
 * ==========================================
 * GENERAL API LIMITER
 * ==========================================
 *
 * Fallback ceiling applied globally so no single
 * client can flood the API.
 */

const generalApiLimiter = rateLimit({

    windowMs: 60 * 1000,

    max: 300,

    standardHeaders: true,

    legacyHeaders: false,

    message: {
        success: false,
        message:
            "Too many requests. Please slow down.",
    },

});


module.exports = {

    authLimiter,

    betLimiter,

    otpLimiter,

    walletActionLimiter,

    passwordResetLimiter,

    supportCreateLimiter,

    supportReplyLimiter,

    generalApiLimiter,

};
