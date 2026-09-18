require("dotenv").config();

const emailService = require("../src/services/emailService");

/*
 * ==========================================
 * SEND TEST EMAIL
 * ==========================================
 *
 * One-off verification tool - does NOT touch the database,
 * only exercises the same emailService used by OTP/
 * notification sending. Never prints SMTP credentials.
 *
 * Usage:
 *   node scripts/sendTestEmail.js recipient@example.com
 */

const run = async () => {

    const to = process.argv[2];

    if (!to) {

        console.error(
            "Usage: node scripts/sendTestEmail.js recipient@example.com"
        );

        process.exit(1);

    }

    if (!emailService.isEmailConfigured()) {

        console.error(
            "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS " +
            "(and optionally SMTP_FROM) in server/.env, then try again."
        );

        process.exit(1);

    }

    console.log("Verifying SMTP connection...");

    const verification =
        await emailService.verifySmtpConnection();

    if (!verification.ok) {

        console.error(
            "SMTP connection/authentication failed:",
            verification.reason
        );

        process.exit(1);

    }

    console.log("SMTP connection verified.");
    console.log(`Sending test email to ${to} ...`);

    const result =
        await emailService.sendEmail({
            to,
            subject: "Gaming Platform - Test Email",
            text:
                "This is a test email confirming your SMTP configuration is " +
                "working correctly. If you received this, real email delivery " +
                "(OTPs, deposit/withdrawal notifications, etc.) is live.",
        });

    if (result.sent) {

        console.log("Test email sent successfully.");

        process.exit(0);

    }

    console.error(
        "Test email failed to send:",
        result.reason
    );

    process.exit(1);

};

run();
