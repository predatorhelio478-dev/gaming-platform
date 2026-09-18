const settingsService = require("./settingsService");

/*
 * ==========================================
 * SHARED PROFESSIONAL EMAIL SHELL
 * ==========================================
 *
 * The single choke-point every outgoing email is wrapped
 * through (see emailService.sendEmail) - header with site
 * name, a clean content card, an optional CTA button, and a
 * consistent footer with support contact + copyright. Uses
 * table-based layout and inline styles only, for compatibility
 * with real-world email clients (Outlook/Gmail strip <style>
 * blocks and flexbox/grid).
 *
 * All dynamic text passed in here (bodyHtml, heading, ctaText)
 * must already be HTML-escaped by the caller - this function
 * only lays content out, it never escapes on its own, so it
 * can also be handed genuinely-safe pre-built HTML fragments
 * (e.g. a <ul> list) when needed.
 */

const escapeHtml = (value) =>
    String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

// Plain text with \n\n-separated paragraphs -> escaped <p> tags.
const textToHtmlParagraphs = (text) =>
    escapeHtml(text)
        .split(/\n{2,}/)
        .map((paragraph) => `<p style="margin:0 0 16px 0;">${paragraph.replace(/\n/g, "<br>")}</p>`)
        .join("");

const buildEmailHtml = async ({
    heading,
    bodyHtml,
    ctaText = "",
    ctaUrl = "",
}) => {

    const [siteName, supportEmail, supportPhone] = await Promise.all([
        settingsService.getValue("general", "site_name", "Gaming Platform").catch(() => "Gaming Platform"),
        settingsService.getValue("general", "support_email", "").catch(() => ""),
        settingsService.getValue("general", "support_phone", "").catch(() => ""),
    ]);

    const year = new Date().getFullYear();

    const ctaBlock =
        ctaText && ctaUrl
            ? `
                <tr>
                    <td align="center" style="padding:8px 0 24px 0;">
                        <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 28px;border-radius:10px;">
                            ${escapeHtml(ctaText)}
                        </a>
                    </td>
                </tr>
            `
            : "";

    const contactLine =
        [supportEmail, supportPhone].filter(Boolean).join(" &nbsp;|&nbsp; ");

    return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(siteName)}</title>
</head>
<body style="margin:0;padding:0;background-color:#0b0d17;font-family:Segoe UI,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0b0d17;padding:32px 16px;">
    <tr>
        <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#12141f;border-radius:16px;overflow:hidden;border:1px solid #23263a;">

                <!-- HEADER -->
                <tr>
                    <td style="background:linear-gradient(90deg,#7c3aed,#c026d3);padding:24px 32px;">
                        <span style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:0.3px;">
                            ${escapeHtml(siteName)}
                        </span>
                    </td>
                </tr>

                <!-- BODY -->
                <tr>
                    <td style="padding:32px;color:#e2e4f0;">
                        ${heading
            ? `<h1 style="margin:0 0 16px 0;font-size:19px;font-weight:800;color:#ffffff;">${escapeHtml(heading)}</h1>`
            : ""
        }
                        <div style="font-size:14px;line-height:22px;color:#c3c6db;">
                            ${bodyHtml}
                        </div>
                    </td>
                </tr>

                ${ctaBlock ? `<tr><td style="padding:0 32px;">${ctaBlock}</td></tr>` : ""}

                <!-- FOOTER -->
                <tr>
                    <td style="padding:24px 32px;border-top:1px solid #23263a;background-color:#0e0f1a;">
                        <p style="margin:0 0 6px 0;font-size:12px;color:#7c8098;">
                            Need help? ${contactLine ? contactLine : "Contact our support team from your account."}
                        </p>
                        <p style="margin:0;font-size:11px;color:#565a70;">
                            &copy; ${year} ${escapeHtml(siteName)}. All rights reserved.
                        </p>
                        <p style="margin:8px 0 0 0;font-size:10px;color:#464a5e;">
                            This is an automated message - please do not reply directly to this email.
                        </p>
                    </td>
                </tr>

            </table>
        </td>
    </tr>
</table>
</body>
</html>
    `.trim();

};

module.exports = {
    escapeHtml,
    textToHtmlParagraphs,
    buildEmailHtml,
};
