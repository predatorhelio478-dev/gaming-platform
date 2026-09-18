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

const isEmailConfigured = () => {

    return Boolean(
        process.env.SMTP_HOST &&
        process.env.SMTP_PORT &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS
    );

};

const getTransporter = () => {

    if (cachedTransporter) {

        return cachedTransporter;

    }

    cachedTransporter = nodemailer.createTransport({

        host: process.env.SMTP_HOST,

        port: Number(process.env.SMTP_PORT) || 587,

        secure: Number(process.env.SMTP_PORT) === 465,

        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },

    });

    return cachedTransporter;

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

    if (!isEmailConfigured()) {

        if (!warnedNotConfigured) {

            console.warn(
                "[emailService] SMTP is not configured (SMTP_HOST/PORT/USER/PASS) - emails will not be sent."
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
            reason: "SMTP not configured",
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

        console.error(
            "[emailService] Send failed:",
            error.message
        );


        return {
            sent: false,
            reason: "Send failed",
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

    if (!isEmailConfigured()) {

        return {
            ok: false,
            reason: "SMTP not configured",
        };

    }

    try {

        await getTransporter().verify();

        return { ok: true };

    } catch (error) {

        console.error(
            "[emailService] SMTP connection verification failed:",
            error.message
        );

        return {
            ok: false,
            reason: error.message,
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
    isEmailConfigured,
    sendEmail,
    sendEmailBestEffort,
    verifySmtpConnection,
};
