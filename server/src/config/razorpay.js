const Razorpay = require("razorpay");
const axios = require("axios");

const settingsService = require("../services/settingsService");


/*
 * ==========================================
 * RAZORPAY TEST/LIVE MODE
 * ==========================================
 *
 * The active mode is an admin-manageable Setting
 * (payment.razorpay_mode, "test"|"live", default "test") -
 * NOT an env var - so switching it takes effect immediately
 * for every new request via settingsService's own cache
 * invalidation, with no code change or restart required.
 *
 * Test and Live each have their own, completely separate set
 * of credentials in .env (RAZORPAY_TEST_* / RAZORPAY_LIVE_*).
 * Whichever mode is selected, ONLY that mode's credentials are
 * ever used - there is no fallback from Live to Test or vice
 * versa. Today only RAZORPAY_TEST_* is populated; Live mode
 * fails closed with a clear "not configured" error until
 * RAZORPAY_LIVE_* is added to .env, at which point Live starts
 * working with no other code changes.
 */

const VALID_MODES = ["test", "live"];


// ==========================================================
// ACTIVE MODE
// ==========================================================

const getRazorpayMode = async () => {

    const mode =
        await settingsService.getValue(
            "payment",
            "razorpay_mode",
            "test"
        );

    return VALID_MODES.includes(mode)
        ? mode
        : "test";

};


// ==========================================================
// CREDENTIALS FOR A GIVEN MODE (read directly from env -
// never falls back to the other mode's credentials)
// ==========================================================

const getCredentialsForMode = (mode) => {

    if (mode === "live") {

        return {
            keyId: process.env.RAZORPAY_LIVE_KEY_ID || "",
            keySecret: process.env.RAZORPAY_LIVE_KEY_SECRET || "",
            webhookSecret: process.env.RAZORPAY_LIVE_WEBHOOK_SECRET || "",
        };

    }

    return {
        keyId: process.env.RAZORPAY_TEST_KEY_ID || "",
        keySecret: process.env.RAZORPAY_TEST_KEY_SECRET || "",
        webhookSecret: process.env.RAZORPAY_TEST_WEBHOOK_SECRET || "",
    };

};


const isModeConfigured = (mode) => {

    const creds =
        getCredentialsForMode(mode);

    return Boolean(
        creds.keyId &&
        creds.keySecret
    );

};


// ==========================================================
// IS RAZORPAY CONFIGURED (for the CURRENTLY ACTIVE mode)
// ==========================================================

const isRazorpayConfigured = async () => {

    const mode =
        await getRazorpayMode();

    return isModeConfigured(mode);

};


// ==========================================================
// RESOLVE CREDENTIALS
// ==========================================================
//
// `forcedMode`, when given, resolves that exact mode's
// credentials regardless of the currently active setting -
// used to keep an already-created order/refund pinned to
// whichever mode it was actually created under, even if an
// admin flips the global mode afterwards.
// ==========================================================

const resolveRazorpayCredentials = async (
    forcedMode = null
) => {

    const mode =
        forcedMode && VALID_MODES.includes(forcedMode)
            ? forcedMode
            : await getRazorpayMode();

    const creds =
        getCredentialsForMode(mode);

    if (!creds.keyId || !creds.keySecret) {

        throw new Error(
            mode === "live"
                ? "Live Razorpay credentials are not configured."
                : "Test Razorpay credentials are not configured."
        );

    }

    return {
        mode,
        ...creds,
    };

};


// ==========================================================
// RAZORPAY CLIENT (cached per mode)
// ==========================================================

const clientCache = {};

const getRazorpayClient = async (
    forcedMode = null
) => {

    const { mode, keyId, keySecret } =
        await resolveRazorpayCredentials(forcedMode);

    if (clientCache[mode]) {

        return clientCache[mode];

    }

    const client = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
    });

    clientCache[mode] = client;

    return client;

};


// ==========================================================
// PUBLIC KEY ID (safe to expose to frontend Checkout.js -
// Razorpay's key_id is designed to be public)
// ==========================================================

const getRazorpayKeyId = async (
    forcedMode = null
) => {

    const { keyId } =
        await resolveRazorpayCredentials(forcedMode);

    return keyId;

};


// ==========================================================
// KEY SECRET (server-side signature verification only -
// NEVER expose this to the frontend, API responses, or logs)
// ==========================================================

const getRazorpayKeySecret = async (
    forcedMode = null
) => {

    const { keySecret } =
        await resolveRazorpayCredentials(forcedMode);

    return keySecret;

};


// ==========================================================
// WEBHOOK SECRETS FOR EVERY CONFIGURED MODE
// ==========================================================
//
// Razorpay's webhook payload carries no explicit "mode" field
// - Test and Live are fully separate Razorpay accounts, each
// with its own webhook secret configured in its own
// dashboard. Verification tries every mode that actually has
// a webhook secret configured and accepts whichever one
// matches. With only Test configured (today), this behaves
// identically to a single hardcoded secret. Once Live is
// added, a Test event only ever verifies against the Test
// secret and a Live event only against the Live secret - one
// mode's secret is never used to accept the other mode's
// events.
// ==========================================================

const getConfiguredWebhookSecrets = () => {

    return VALID_MODES
        .map((mode) => ({
            mode,
            secret: getCredentialsForMode(mode).webhookSecret,
        }))
        .filter((entry) => Boolean(entry.secret));

};


// ==========================================================
// RAZORPAYX (Payouts) - same underlying account credentials,
// resolved through the same mode-aware logic. Still gated on
// RAZORPAYX_ACCOUNT_NUMBER exactly as before (unset today, so
// this remains fully dormant with no behavior change).
// ==========================================================

const isRazorpayXConfigured = async () => {

    const mode =
        await getRazorpayMode();

    return Boolean(
        isModeConfigured(mode) &&
        process.env.RAZORPAYX_ACCOUNT_NUMBER
    );

};


const cachedXClients = {};

const getRazorpayXClient = async () => {

    if (!(await isRazorpayXConfigured())) {

        throw new Error(
            "Automatic payouts are not configured."
        );

    }

    const { mode, keyId, keySecret } =
        await resolveRazorpayCredentials();

    if (cachedXClients[mode]) {

        return cachedXClients[mode];

    }

    const client = axios.create({

        baseURL: "https://api.razorpay.com/v1",

        auth: {
            username: keyId,
            password: keySecret,
        },

        timeout: 15000,

    });

    cachedXClients[mode] = client;

    return client;

};

const getRazorpayXAccountNumber = () => process.env.RAZORPAYX_ACCOUNT_NUMBER;


module.exports = {
    VALID_MODES,
    getRazorpayMode,
    isModeConfigured,
    isRazorpayConfigured,
    resolveRazorpayCredentials,
    getRazorpayClient,
    getRazorpayKeyId,
    getRazorpayKeySecret,
    getConfiguredWebhookSecrets,
    isRazorpayXConfigured,
    getRazorpayXClient,
    getRazorpayXAccountNumber,
};
