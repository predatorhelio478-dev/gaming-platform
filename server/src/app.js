const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/authRoutes");
const walletRoutes = require("./routes/walletRoutes");
const gameRoutes = require("./routes/gameRoutes");
const betRoutes = require("./routes/betRoutes");
const adminGameRoutes = require("./routes/adminGameRoutes");
const adminAuthRoutes = require("./routes/adminAuthRoutes");
const adminRoundRoutes = require("./routes/adminRoundRoutes");
const adminBetRoutes = require("./routes/adminBetRoutes");
const adminPayoutRoutes = require("./routes/adminPayoutRoutes");
const adminUserRoutes = require("./routes/adminUserRoutes");
const adminManagementRoutes = require("./routes/adminManagementRoutes");
const adminWalletRoutes = require("./routes/adminWalletRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const publicSettingsRoutes = require("./routes/publicSettingsRoutes");
const maintenanceMiddleware = require("./middleware/maintenanceMiddleware");
const auditLogRoutes = require("./routes/auditLogRoutes");
const walletRequestRoutes = require("./routes/walletRequestRoutes");
const adminWalletRequestRoutes = require("./routes/adminWalletRequestRoutes");
const otpRoutes = require("./routes/otpRoutes");
const userRoutes = require("./routes/userRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminNotificationRoutes = require("./routes/adminNotificationRoutes");
const supportRoutes = require("./routes/supportRoutes");
const adminSupportRoutes = require("./routes/adminSupportRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const faqRoutes = require("./routes/faqRoutes");
const adminFaqRoutes = require("./routes/adminFaqRoutes");
const adminEmailTemplateRoutes = require("./routes/adminEmailTemplateRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const sanitizeInput = require("./middleware/sanitizeInput");
const errorHandler = require("./middleware/errorHandler");
const { generalApiLimiter } = require("./middleware/rateLimiters");
const { isOriginAllowed } = require("./config/allowedOrigins");
const app = express();

app.use(helmet());

/*
 * Resolved per-request (not once at boot) against the full
 * allowlist (Settings -> General -> Frontend URL, CLIENT_URL,
 * ALLOWED_ORIGINS - see config/allowedOrigins.js), so an
 * admin-updated Frontend URL takes effect immediately with no
 * restart, without that single DB value being the only thing
 * standing between a correct deploy and every request failing
 * CORS. The exact matched origin is echoed back (never "*" -
 * required for credentials:true to work, and keeps this a real
 * allowlist rather than an open CORS policy).
 */
app.use(cors({
    origin: async (origin, callback) => {

        try {

            const allowed = await isOriginAllowed(origin);

            callback(null, allowed ? origin : false);

        } catch (error) {

            callback(null, false);

        }

    },
    credentials: true
}));

/*
 * Razorpay webhook signature verification needs the exact
 * raw request bytes, so it's mounted here with its own
 * express.raw() parser - BEFORE the global express.json()
 * below would otherwise consume/parse the body. This also
 * means webhook requests never pass through
 * sanitizeInput/generalApiLimiter/maintenanceMiddleware,
 * which is intentional: an external gateway must always be
 * able to deliver a webhook, including during maintenance.
 */
app.use("/api/webhooks", webhookRoutes);

app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.use(sanitizeInput);
app.use(generalApiLimiter);
app.use(maintenanceMiddleware);
app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/wallet", walletRequestRoutes);
app.use("/api/game", gameRoutes);
app.use("/api/bets", betRoutes);
app.use("/api/admin/game", adminGameRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin/rounds", adminRoundRoutes);
app.use("/api/admin/bets", adminBetRoutes);
app.use("/api/admin/payouts", adminPayoutRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/admins", adminManagementRoutes);
app.use("/api/admin/wallet", adminWalletRoutes);
app.use("/api/admin/wallet", adminWalletRequestRoutes);
app.use("/api/admin/settings", settingsRoutes);
app.use("/api/settings/public", publicSettingsRoutes);
app.use("/api/admin/audit-logs", auditLogRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin/notifications", adminNotificationRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/admin/support", adminSupportRoutes);
app.use("/api/faq", faqRoutes);
app.use("/api/admin/faq", adminFaqRoutes);
app.use("/api/admin/email-templates", adminEmailTemplateRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Gaming Platform API Running"
    });
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found."
    });
});

app.use(errorHandler);

module.exports = app;