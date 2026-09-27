const nodemailer = require("nodemailer");

const settingsService = require("./settingsService");
const { buildEmailHtml, textToHtmlParagraphs } = require("./emailShellService");


/*
 * ==========================================
 * EMAIL SERVICE (SMTP via Nodemailer)
 * ==========================================
 *
 * Reads SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/SMTP_FROM
 * from the environment. If they're not configured, email
 * sending fails closed with a clear reason - in development
 * only, the message content (including any OTP) is logged
 * to the console instead, so the flow stays testable locally
 * without a real mailbox. This fallback never runs in
 * production, and the OTP is never included in any API
 * response either way.
 */

let cachedTransporter = null;
let warnedNotConfigured = false;

/*
 * Classifies a Nodemailer/SMTP error into one of the specific,
 * actionable categories called out in the production email
 * runbook (auth failed / timed out / refused / other), instead
 * of a generic "Send failed". Only ever reads error.code/
 * error.responseCode/error.message - none of which nodemailer
 * populates with the password, so this is safe to log verbatim.
 */
const classifySmtpErrorReason = (error) => {

    const code = error?.code;
    const responseCode = error?.responseCode;

    if (code === "EAUTH" || responseCode === 535) {

        return "SMTP authentication failed - check SMTP_USER/SMTP_PASS";

    }

    if (code === "ETIMEDOUT") {

        return "SMTP connection timed out - check SMTP_HOST/SMTP_PORT and firewall/network rules";

    }

    if (code === "ECONNREFUSED") {

        return "SMTP connection refused - check SMTP_HOST/SMTP_PORT";

    }

    if (code === "ESOCKET" || code === "ECONNRESET") {

        return "SMTP connection was reset - check SMTP_PORT/secure (465 vs 587) and host firewall rules";

    }

    return error?.message || "Send failed";

};

/*
 * Named, per-variable check (never logs a value, just which
 * names are present/missing) so a startup log can say exactly
 * which SMTP_* var is the problem instead of a blanket
 * "not configured" - the difference between "fix SMTP_PORT" and
 * re-checking all four from scratch.
 */
const REQUIRED_SMTP_VARS = [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
];

const getMissingSmtpVars = () => {

    return REQUIRED_SMTP_VARS.filter(
        (name) => !String(process.env[name] || "").trim()
    );

};

const getMissingEmailVars = () => {

    return getEmailProvider() === "brevo"
        ? getMissingBrevoVars()
        : getMissingSmtpVars();

};

const isEmailConfigured = () => {

    return getMissingEmailVars().length === 0;

};

const getTransporter = () => {

    if (cachedTransporter) {

        return cachedTransporter;

    }

    const rawPort =
        String(process.env.SMTP_PORT || "").trim();

    const parsedPort =
        Number(rawPort);

    if (!Number.isFinite(parsedPort) || parsedPort <= 0) {

        // A common copy/paste mistake (quotes, stray
        // whitespace/characters) silently produced NaN here
        // before, which then silently fell back to 587 - surface
        // it instead of guessing.
        console.warn(
            `[emailService] SMTP_PORT ("${rawPort}") is not a valid port number - defaulting to 587.`
        );

    }

    const port =
        Number.isFinite(parsedPort) && parsedPort > 0
            ? parsedPort
            : 587;

    // SMTP_SECURE lets the port/secure combo be flipped purely
    // via env vars (e.g. to try 465+secure:true instead of
    // 587+secure:false against Gmail on a host like Render)
    // without a code change or redeploy of anything but the env
    // var itself. Falls back to the standard port-based inference
    // (465 = implicit TLS, everything else = STARTTLS) when unset.
    const rawSecure =
        String(process.env.SMTP_SECURE || "").trim().toLowerCase();

    const secure =
        rawSecure === "true" ? true :
        rawSecure === "false" ? false :
        port === 465;

    console.log(
        `[emailService] Configuring SMTP transporter: host=${process.env.SMTP_HOST} port=${port} secure=${secure}`
    );

    cachedTransporter = nodemailer.createTransport({

        host: process.env.SMTP_HOST,

        port,

        secure,

        // Gmail always offers STARTTLS on 587 - requiring it
        // (rather than silently sending in the clear if a
        // handshake step gets dropped) fails fast and clearly
        // instead of a confusing later auth error.
        requireTLS: !secure,

        tls: {
            minVersion: "TLSv1.2",
        },

        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },

        // Without these, a host that silently drops/blocks the
        // outbound SMTP port (common on PaaS platforms like
        // Render, which block or heavily throttle 25/465/587 on
        // some plans) leaves the TCP connection attempt hanging
        // with NO error and NO timeout by default - which then
        // hangs any awaited caller (e.g. register()'s OTP kick-
        // off) indefinitely instead of failing fast. Bounded here
        // so a real connectivity problem surfaces as a normal
        // ETIMEDOUT within seconds, not an unbounded hang that
        // can take down an entire request.
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,

    });

    return cachedTransporter;

};


/*
 * ==========================================
 * BREVO (HTTPS Transactional Email API)
 * ==========================================
 *
 * Opt-in via EMAIL_PROVIDER=brevo. Exists because some hosts
 * (Render Free) block outbound SMTP ports entirely, so every
 * nodemailer send ends in ETIMEDOUT - Brevo's API goes over
 * plain HTTPS (443) instead. When EMAIL_PROVIDER is unset or
 * "smtp", none of this runs and the SMTP path above is used
 * exactly as before (local development).
 *
 * Reads BREVO_API_KEY (never logged) and BREVO_SENDER_EMAIL
 * (falls back to SMTP_FROM / SMTP_USER). The sender address
 * must be a verified sender in the Brevo dashboard.
 */

const BREVO_API_BASE = "https://api.brevo.com/v3";

const BREVO_TIMEOUT_MS = 15000;

const getEmailProvider = () => {

    return String(process.env.EMAIL_PROVIDER || "smtp").trim().toLowerCase() === "brevo"
        ? "brevo"
        : "smtp";

};

// SMTP_FROM may be a bare address or `"Name" <addr>` - Brevo
// wants the bare address, so pull it out of the angle brackets.
const extractAddress = (value) => {

    const raw = String(value || "").trim();

    const match = raw.match(/<([^>]+)>/);

    return (match ? match[1] : raw).trim();

};

const getBrevoSenderEmail = () => {

    return extractAddress(
        process.env.BREVO_SENDER_EMAIL ||
        process.env.SMTP_FROM ||
        process.env.SMTP_USER
    );

};

const getMissingBrevoVars = () => {

    const missing = [];

    if (!String(process.env.BREVO_API_KEY || "").trim()) {

        missing.push("BREVO_API_KEY");

    }

    if (!getBrevoSenderEmail()) {

        missing.push("BREVO_SENDER_EMAIL");

    }

    return missing;

};

/*
 * Same idea as classifySmtpErrorReason - a specific, actionable
 * reason instead of a generic failure. Only reads the HTTP
 * status and Brevo's own error body, never the API key.
 */
const classifyBrevoErrorReason = (status, body, error) => {

    if (error) {

        if (error.name === "TimeoutError" || error.name === "AbortError") {

            return "Brevo API request timed out";

        }

        return `Brevo API request failed - ${error.message || "network error"}`;

    }

    const detail =
        body?.message || body?.code || `HTTP ${status}`;

    if (status === 401) {

        return `Brevo authentication failed - check BREVO_API_KEY (${detail})`;

    }

    if (status === 400 && /sender/i.test(String(detail))) {

        return `Brevo rejected the sender - verify BREVO_SENDER_EMAIL in the Brevo dashboard (${detail})`;

    }

    return `Brevo API error: ${detail}`;

};

const brevoRequest = async (path, { method = "GET", body } = {}) => {

    const response = await fetch(`${BREVO_API_BASE}${path}`, {

        method,

        headers: {
            "api-key": String(process.env.BREVO_API_KEY).trim(),
            "content-type": "application/json",
            accept: "application/json",
        },

        body: body ? JSON.stringify(body) : undefined,

        signal: AbortSignal.timeout(BREVO_TIMEOUT_MS),

    });

    const data =
        await response.json().catch(() => null);

    return { ok: response.ok, status: response.status, data };

};

const toBrevoRecipients = (to) => {

    const list =
        Array.isArray(to) ? to : String(to || "").split(",");

    return list
        .map((entry) => extractAddress(entry))
        .filter(Boolean)
        .map((email) => ({ email }));

};

const sendViaBrevo = async ({ to, subject, text, html, senderName }) => {

    const sender = {
        email: getBrevoSenderEmail(),
    };

    const name =
        String(senderName || process.env.BREVO_SENDER_NAME || "").trim().replace(/"/g, "");

    if (name) {

        sender.name = name;

    }

    const payload = {
        sender,
        to: toBrevoRecipients(to),
        subject,
        htmlContent: html,
    };

    if (text) {

        payload.textContent = text;

    }

    let result;

    try {

        result =
            await brevoRequest("/smtp/email", { method: "POST", body: payload });

    } catch (error) {

        return { sent: false, reason: classifyBrevoErrorReason(null, null, error) };

    }

    if (!result.ok) {

        return { sent: false, reason: classifyBrevoErrorReason(result.status, result.data) };

    }

    return { sent: true };

};

// Brevo counterpart of transporter.verify(): checks the API key
// against GET /account without sending anything.
const verifyBrevoConnection = async () => {

    const missing =
        getMissingBrevoVars();

    if (missing.length > 0) {

        return {
            ok: false,
            reason: `Brevo not configured (missing: ${missing.join(", ")})`,
        };

    }

    try {

        const result =
            await brevoRequest("/account");

        if (result.ok) {

            return { ok: true };

        }

        const reason =
            classifyBrevoErrorReason(result.status, result.data);

        console.error(`[emailService] Brevo API verification failed: ${reason}`);

        return { ok: false, reason };

    } catch (error) {

        const reason =
            classifyBrevoErrorReason(null, null, error);

        console.error(`[emailService] Brevo API verification failed: ${reason}`);

        return { ok: false, reason };

    }

};


/*
 * ==========================================
 * SEND EMAIL
 * ==========================================
 *
 * Returns { sent: boolean, reason?: string } - callers
 * (otpService) decide what that means for the user-facing
 * flow; this never throws for a "not configured" state.
 */

const sendEmail = async ({ to, subject, text, html, heading, ctaText, ctaUrl }) => {

    const provider =
        getEmailProvider();

    if (!isEmailConfigured()) {

        const missing =
            getMissingEmailVars();

        if (!warnedNotConfigured) {

            console.warn(
                `[emailService] ${provider === "brevo" ? "Brevo" : "SMTP"} is not configured - missing: ${missing.join(", ")}. Emails will not be sent.`
            );

            warnedNotConfigured = true;

        }


        if (process.env.NODE_ENV !== "production") {

            console.log(
                `[emailService][DEV FALLBACK] Would send email to ${to}: ${subject}\n${text}`
            );

        }


        return {
            sent: false,
            reason: `${provider === "brevo" ? "Brevo" : "SMTP"} not configured (missing: ${missing.join(", ")})`,
        };

    }

    try {

        const fromAddress =
            process.env.SMTP_FROM || process.env.SMTP_USER;

        // Admin-manageable display name only (Settings ->
        // General -> Sender Name) - the actual address/
        // credentials always stay in .env, never in the DB.
        const senderName =
            await settingsService
                .getValue("general", "email_sender_name", "")
                .catch(() => "");

        // Every outgoing email is wrapped in the shared
        // professional HTML shell (logo/header, content card,
        // optional CTA button, consistent footer) - this is
        // the single choke-point that guarantees visual
        // consistency across the whole system without relying
        // on every call site to remember to build its own HTML.
        // A caller-supplied `html` is used as the body content
        // (still wrapped in the shell); otherwise `text` is
        // escaped and turned into paragraphs automatically.
        const wrappedHtml =
            await buildEmailHtml({
                heading: heading || subject,
                bodyHtml: html || textToHtmlParagraphs(text || ""),
                ctaText,
                ctaUrl,
            });

        if (provider === "brevo") {

            const result =
                await sendViaBrevo({ to, subject, text, html: wrappedHtml, senderName });

            if (!result.sent) {

                console.error(`[emailService] Send failed: ${result.reason}`);

            }

            return result;

        }

        await getTransporter().sendMail({

            from:
                senderName && String(senderName).trim()
                    ? `"${String(senderName).trim().replace(/"/g, "")}" <${fromAddress}>`
                    : fromAddress,

            to,

            subject,

            text,

            html: wrappedHtml,

        });


        return { sent: true };

    } catch (error) {

        // error.message/.code are Nodemailer/SMTP protocol
        // details (e.g. "Invalid login: 535 ...", ECONNREFUSED)
        // - never the password/credentials themselves, so it's
        // safe to both log and return here.
        const reason =
            classifySmtpErrorReason(error);

        console.error(
            `[emailService] Send failed: ${reason}${error?.code ? ` (code: ${error.code})` : ""}`
        );


        return {
            sent: false,
            reason,
        };

    }

};


/*
 * ==========================================
 * VERIFY SMTP CONNECTION
 * ==========================================
 *
 * Uses Nodemailer's own transporter.verify() to actually
 * connect + authenticate against the configured SMTP server,
 * without sending anything. Never throws, never logs the
 * password (nodemailer's own errors don't include it) - safe
 * to call from server startup or a one-off test script.
 */

const verifySmtpConnection = async () => {

    if (getEmailProvider() === "brevo") {

        return verifyBrevoConnection();

    }

    const missing =
        getMissingSmtpVars();

    if (missing.length > 0) {

        return {
            ok: false,
            reason: `SMTP not configured (missing: ${missing.join(", ")})`,
        };

    }

    try {

        await getTransporter().verify();

        return { ok: true };

    } catch (error) {

        const reason =
            classifySmtpErrorReason(error);

        console.error(
            `[emailService] SMTP connection verification failed: ${reason}${error?.code ? ` (code: ${error.code})` : ""}`
        );

        return {
            ok: false,
            reason,
        };

    }

};


/*
 * ==========================================
 * SEND BEST-EFFORT (fire-and-forget helper)
 * ==========================================
 *
 * For emails that must never block or fail their caller's
 * primary action (welcome email, admin new-user notification,
 * password-reset confirmation, etc). sendEmail() itself never
 * throws for a delivery failure - it resolves { sent: false,
 * reason } - so a plain .catch() on its own would miss that
 * case. This logs BOTH failure shapes (a rejected promise from
 * something upstream, and a resolved-but-undelivered result)
 * without ever propagating to the caller.
 */

const sendEmailBestEffort = (params, label) => {

    sendEmail(params)
        .then((result) => {

            if (!result?.sent) {

                console.warn(
                    `[emailService] ${label}: email not sent - ${result?.reason || "unknown reason"}`
                );

            }

        })
        .catch((error) => {

            console.error(
                `[emailService] ${label}: email failed -`,
                error.message
            );

        });

};


module.exports = {
    getEmailProvider,
    isEmailConfigured,
    sendEmail,
    sendEmailBestEffort,
    verifySmtpConnection,
};
