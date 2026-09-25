const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Admin = require("../models/Admin");

const { createAuditLog } = require("../services/auditLogService");
const otpService = require("../services/otpService");
const emailService = require("../services/emailService");
const emailTemplateService = require("../services/emailTemplateService");
const settingsService = require("../services/settingsService");


// ==========================================
// ADMIN TOKEN EXPIRY (Settings -> Security ->
// session_timeout, minutes). Falls back to 1 day if the
// setting is unset/invalid/unreachable, matching the prior
// hardcoded behavior - never blocks login over a settings hiccup.
// ==========================================

const getAdminTokenExpiresIn = async () => {

    try {

        const minutes = Number(
            await settingsService.getValue("security", "session_timeout", null)
        );

        if (Number.isFinite(minutes) && minutes > 0) {
            return `${minutes}m`;
        }

    } catch (error) {
        // fall through to default
    }

    return "1d";

};


// ==========================================
// REQUEST CONTEXT (IP / USER AGENT)
// ==========================================

const getRequestContext = (req) => ({
    ipAddress:
        req.ip ||
        req.headers["x-forwarded-for"] ||
        req.socket?.remoteAddress ||
        null,

    userAgent:
        req.headers["user-agent"] || null,
});


// ==========================================
// ADMIN LOGIN
// ==========================================

const adminLogin = async (req, res) => {
    try {
        const {
            username,
            password,
        } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message:
                    "Username and password are required.",
            });
        }

        const requestContext =
            getRequestContext(req);

        const admin = await Admin.findOne({
            $or: [
                {
                    username:
                        username.toLowerCase(),
                },
                {
                    email:
                        username.toLowerCase(),
                },
            ],
        }).select("+password");

        if (!admin) {
            await createAuditLog({
                actorType: "system",
                action: "admin.login_failed",
                module: "auth",
                metadata: { attemptedUsername: username },
                ...requestContext,
            }).catch(() => {});

            return res.status(401).json({
                success: false,
                message:
                    "Invalid admin credentials.",
            });
        }

        if (!admin.isActive) {
            await createAuditLog({
                actorType: "admin",
                actorId: admin._id,
                action: "admin.login_failed",
                module: "auth",
                metadata: { reason: "account_disabled" },
                ...requestContext,
            }).catch(() => {});

            return res.status(403).json({
                success: false,
                message:
                    "Admin account is disabled.",
            });
        }

        const passwordMatch =
            await bcrypt.compare(
                password,
                admin.password
            );

        if (!passwordMatch) {
            await createAuditLog({
                actorType: "admin",
                actorId: admin._id,
                action: "admin.login_failed",
                module: "auth",
                metadata: { reason: "invalid_password" },
                ...requestContext,
            }).catch(() => {});

            return res.status(401).json({
                success: false,
                message:
                    "Invalid admin credentials.",
            });
        }

        const token = jwt.sign(
            {
                adminId: admin._id,
                role: admin.role,
                type: "admin",
            },
            process.env.JWT_SECRET,
            {
                expiresIn: await getAdminTokenExpiresIn(),
            }
        );

        admin.lastLogin = new Date();

        await admin.save();

        await createAuditLog({
            actorType: "admin",
            actorId: admin._id,
            action: "admin.login",
            module: "auth",
            ...requestContext,
        }).catch(() => {});

        return res.status(200).json({
            success: true,
            message:
                "Admin login successful.",

            token,

            admin: {
                id: admin._id,
                name: admin.name,
                username: admin.username,
                email: admin.email,
                role: admin.role,
            },
        });

    } catch (error) {
        console.error(
            "Admin Login Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Internal server error.",
        });
    }
};


// ==========================================
// GET CURRENT ADMIN
// ==========================================

const getCurrentAdmin = async (req, res) => {
    try {
        const admin = req.admin;

        return res.status(200).json({
            success: true,

            admin: {
                id: admin._id,
                name: admin.name,
                username: admin.username,
                email: admin.email,
                role: admin.role,
                isActive: admin.isActive,
                lastLogin: admin.lastLogin,
            },
        });

    } catch (error) {
        console.error(
            "Current Admin Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to fetch admin.",
        });
    }
};


// ==========================================
// ADMIN FORGOT PASSWORD (no session required)
// ==========================================
//
// Same enumeration-safe contract as the user-facing version:
// always the same generic response regardless of whether the
// identifier matches a real admin account.
// ==========================================

const adminForgotPassword = async (req, res) => {

    const GENERIC_MESSAGE =
        "If an admin account with that email or username exists, a password reset code has been sent to its email address.";

    try {

        const { username } = req.body;

        const cleanIdentifier =
            String(username || "").trim().toLowerCase();

        if (!cleanIdentifier) {

            return res.status(400).json({
                success: false,
                message: "Username or email is required.",
            });

        }

        const admin = await Admin.findOne({
            $or: [
                { username: cleanIdentifier },
                { email: cleanIdentifier },
            ],
        });

        if (admin && admin.isActive && admin.email) {

            await otpService
                .requestOtp(
                    admin._id,
                    "email",
                    admin.email,
                    "reset_password",
                    "Admin"
                )
                .catch((error) => {

                    console.error(
                        "Admin Forgot Password Error:",
                        error.message
                    );

                });

        }

        return res.status(200).json({
            success: true,
            message: GENERIC_MESSAGE,
        });

    } catch (error) {

        console.error(
            "Admin Forgot Password Error:",
            error
        );

        return res.status(200).json({
            success: true,
            message: GENERIC_MESSAGE,
        });

    }

};


// ==========================================
// ADMIN RESET PASSWORD (no session required)
// ==========================================

const adminResetPassword = async (req, res) => {

    try {

        const { username, otp, newPassword } = req.body;

        const cleanIdentifier =
            String(username || "").trim().toLowerCase();

        if (!cleanIdentifier || !otp) {

            return res.status(400).json({
                success: false,
                message: "Username/email and code are required.",
            });

        }

        if (
            !newPassword ||
            String(newPassword).length < 6 ||
            String(newPassword).length > 128
        ) {

            return res.status(400).json({
                success: false,
                message: "New password must be at least 6 characters.",
            });

        }

        const admin = await Admin.findOne({
            $or: [
                { username: cleanIdentifier },
                { email: cleanIdentifier },
            ],
        }).select("+password");

        if (!admin) {

            return res.status(400).json({
                success: false,
                message: "Invalid or expired code.",
            });

        }

        try {

            await otpService.verifyOtp(
                admin._id,
                "email",
                otp,
                "reset_password",
                "Admin"
            );

        } catch (otpError) {

            // Never surface otpService's specific reason
            // (incorrect/expired/already-used/too-many-attempts)
            // - that would let an attacker distinguish "wrong
            // code" from "account doesn't exist" depending on
            // which message comes back.

            return res.status(400).json({
                success: false,
                message: "Invalid or expired code.",
            });

        }

        admin.password =
            await bcrypt.hash(newPassword, 10);

        await admin.save();

        await createAuditLog({
            actorType: "admin",
            actorId: admin._id,
            action: "admin.password_reset",
            module: "auth",
            key: String(admin._id),
        }).catch(() => {});

        // Best-effort confirmation email - the password has
        // already been changed successfully at this point, so
        // a delivery failure here must never undo that or fail
        // the request. Never includes the new password.

        emailTemplateService.sendTemplatedEmail({
            key: "admin_password_reset_confirmation",
            to: admin.email,
            variables: {},
            fallbackSubject: "Your password has been reset",
            fallbackText: "Your password has been successfully reset. If you did not perform this action, please contact support immediately.",
        });

        return res.status(200).json({
            success: true,
            message: "Password has been reset successfully. Please log in with your new password.",
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message:
                error.message ||
                "Unable to reset password.",
        });

    }

};


module.exports = {
    adminLogin,
    getCurrentAdmin,
    adminForgotPassword,
    adminResetPassword,
};