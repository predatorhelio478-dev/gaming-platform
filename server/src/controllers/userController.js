const bcrypt = require("bcrypt");

const User =
    require("../models/User");

const { createAuditLog } =
    require("../services/auditLogService");

const notificationService =
    require("../services/notificationService");


const getRequestContext = (req) => ({

    ipAddress:
        req.ip ||
        req.headers["x-forwarded-for"] ||
        req.socket?.remoteAddress ||
        null,

    userAgent:
        req.headers["user-agent"] || null,

});


// ==========================================================
// UPDATE MY PROFILE (non-sensitive fields only)
// ==========================================================
//
// Username, email, mobile, role, status and verification
// flags are NEVER accepted here - email/mobile changes go
// through the OTP-gated /users/me/email/change and
// /users/me/mobile/change flows, username is permanently
// immutable, and everything else is admin-only.
// ==========================================================

const updateMyProfile = async (req, res) => {

    try {

        const userId =
            req.user._id;

        const {
            fullName,
            notificationPreferences,
        } = req.body;

        const update = {};

        if (fullName !== undefined) {

            const cleanName =
                String(fullName).trim();

            if (cleanName.length < 2 || cleanName.length > 100) {

                return res.status(400).json({
                    success: false,
                    message: "Full name must be between 2 and 100 characters.",
                });

            }

            update.fullName = cleanName;

        }

        if (notificationPreferences && typeof notificationPreferences === "object") {

            if (typeof notificationPreferences.email === "boolean") {
                update["notificationPreferences.email"] = notificationPreferences.email;
            }

            if (typeof notificationPreferences.sms === "boolean") {
                update["notificationPreferences.sms"] = notificationPreferences.sms;
            }

        }

        if (Object.keys(update).length === 0) {

            return res.status(400).json({
                success: false,
                message: "No valid fields to update.",
            });

        }

        const user =
            await User.findByIdAndUpdate(
                userId,
                { $set: update },
                { new: true }
            );

        return res.status(200).json({
            success: true,
            message: "Profile updated.",
            user: {
                _id: user._id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                mobile: user.mobile,
                emailVerified: user.emailVerified,
                mobileVerified: user.mobileVerified,
                notificationPreferences: user.notificationPreferences,
            },
        });

    } catch (error) {

        console.error(
            "Update My Profile Error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to update profile.",
        });

    }

};


// ==========================================================
// REQUEST EMAIL CHANGE (password-confirmed, then OTP-gated)
// ==========================================================
//
// Requires the CURRENT password before an OTP is even sent to
// the new address - otherwise a hijacked session token alone
// (no password knowledge) could redirect account contact info
// to an attacker-controlled address. The actual email swap
// only happens on successful /api/otp/verify (purpose
// "change_email"), which is already fully built.
// ==========================================================

const requestEmailChange = async (req, res) => {

    try {

        const { newEmail, password } = req.body;

        if (!password) {

            return res.status(400).json({
                success: false,
                message: "Current password is required.",
            });

        }

        const cleanEmail =
            String(newEmail || "").trim().toLowerCase();

        if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {

            return res.status(400).json({
                success: false,
                message: "A valid new email is required.",
            });

        }

        const user =
            await User.findById(req.user._id).select("+password email");

        const passwordMatches =
            await bcrypt.compare(password, user.password);

        if (!passwordMatches) {

            return res.status(401).json({
                success: false,
                message: "Incorrect password.",
            });

        }

        if (cleanEmail === user.email) {

            return res.status(400).json({
                success: false,
                message: "This is already your current email.",
            });

        }

        const otpService =
            require("../services/otpService");

        const result =
            await otpService.requestOtp(
                user._id,
                "email",
                cleanEmail,
                "change_email"
            );

        return res.status(200).json({
            success: true,
            message: "Verification code sent to your new email.",
            ...result,
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message || "Unable to request email change.",
        });

    }

};


// ==========================================================
// REQUEST MOBILE CHANGE (password-confirmed, then OTP-gated)
// ==========================================================

const requestMobileChange = async (req, res) => {

    try {

        const { normalizeMobile, INDIAN_MOBILE_REGEX } =
            require("../validators/requestValidators");

        const { newMobile, password } = req.body;

        if (!password) {

            return res.status(400).json({
                success: false,
                message: "Current password is required.",
            });

        }

        const cleanMobile =
            normalizeMobile(newMobile);

        if (!INDIAN_MOBILE_REGEX.test(cleanMobile)) {

            return res.status(400).json({
                success: false,
                message: "Enter a valid 10-digit mobile number.",
            });

        }

        const user =
            await User.findById(req.user._id).select("+password mobile");

        const passwordMatches =
            await bcrypt.compare(password, user.password);

        if (!passwordMatches) {

            return res.status(401).json({
                success: false,
                message: "Incorrect password.",
            });

        }

        if (cleanMobile === user.mobile) {

            return res.status(400).json({
                success: false,
                message: "This is already your current mobile number.",
            });

        }

        const otpService =
            require("../services/otpService");

        const result =
            await otpService.requestOtp(
                user._id,
                "mobile",
                cleanMobile,
                "change_mobile"
            );

        return res.status(200).json({
            success: true,
            message: "Verification code sent to your new mobile number.",
            ...result,
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message || "Unable to request mobile change.",
        });

    }

};


// ==========================================================
// CHANGE PASSWORD
// ==========================================================

const changeMyPassword = async (req, res) => {

    try {

        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {

            return res.status(400).json({
                success: false,
                message: "Current and new password are required.",
            });

        }

        if (String(newPassword).length < 6 || String(newPassword).length > 128) {

            return res.status(400).json({
                success: false,
                message: "New password must be at least 6 characters.",
            });

        }

        const user =
            await User.findById(req.user._id).select("+password");

        const passwordMatches =
            await bcrypt.compare(currentPassword, user.password);

        if (!passwordMatches) {

            return res.status(401).json({
                success: false,
                message: "Current password is incorrect.",
            });

        }

        user.password =
            await bcrypt.hash(newPassword, 10);

        await user.save();

        await createAuditLog({
            actorType: "user",
            actorId: user._id,
            action: "user.password_changed",
            module: "auth",
            key: String(user._id),
            ...getRequestContext(req),
        }).catch(() => {});

        notificationService
            .notify(
                user._id,
                "security",
                "Password changed",
                "Your account password was changed. If this wasn't you, contact support immediately.",
                {}
            )
            .catch(() => {});

        return res.status(200).json({
            success: true,
            message: "Password changed successfully.",
        });

    } catch (error) {

        console.error(
            "Change My Password Error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to change password.",
        });

    }

};


module.exports = {
    updateMyProfile,
    requestEmailChange,
    requestMobileChange,
    changeMyPassword,
};
