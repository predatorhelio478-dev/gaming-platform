const otpService =
    require("../services/otpService");

const Admin =
    require("../models/Admin");

const { createAuditLog } =
    require("../services/auditLogService");

const { maskEmail, maskPhone } =
    require("../utils/maskContact");


// ==========================================================
// SELF-SERVICE EMAIL/MOBILE VERIFICATION FOR ADMIN/SUPER ADMIN
// ==========================================================
//
// Mirrors controllers/otpController.js (the User-facing flow)
// exactly, but scoped to the Admin collection and tagged with
// actorModel: "Admin" throughout - so an admin's OTP record
// never collides with a user's even if the two happen to share
// the same ObjectId across collections. Only verify_email/
// verify_mobile are supported here - changing an admin's email/
// mobile is a separate, super_admin-only action
// (adminManagementService.updateAdmin), not a self-service OTP
// flow.

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
// REQUEST OTP
// ==========================================================

const requestOtp = async (req, res) => {

    try {

        const adminId = req.admin._id;

        const { channel, purpose } = req.body;

        if (
            purpose !== "verify_email" &&
            purpose !== "verify_mobile"
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Only email/mobile verification is supported for admin accounts.",
            });

        }

        const admin =
            await Admin.findById(adminId).select(
                "email mobile"
            );

        if (!admin) {

            return res.status(404).json({
                success: false,
                message: "Admin not found.",
            });

        }

        const resolvedTarget =
            purpose === "verify_email"
                ? admin.email
                : admin.mobile;

        if (!resolvedTarget) {

            return res.status(400).json({
                success: false,
                message:
                    purpose === "verify_email"
                        ? "No email on file."
                        : "No mobile number on file.",
            });

        }

        const result =
            await otpService.requestOtp(
                adminId,
                channel,
                resolvedTarget,
                purpose,
                "Admin"
            );

        return res.status(200).json({
            success: true,
            message:
                result.maskedTarget
                    ? `OTP sent to ${result.maskedTarget}`
                    : `Verification code sent to your ${channel}.`,
            ...result,
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message:
                error.message ||
                "Unable to send verification code.",
            ...(error.retryAfterSeconds
                ? { retryAfterSeconds: error.retryAfterSeconds }
                : {}),
        });

    }

};


// ==========================================================
// VERIFY OTP
// ==========================================================

const verifyOtp = async (req, res) => {

    try {

        const adminId = req.admin._id;

        const { channel, otp, purpose } = req.body;

        const result =
            await otpService.verifyOtp(
                adminId,
                channel,
                otp,
                purpose,
                "Admin"
            );

        await createAuditLog({
            actorType: "admin",
            actorId: adminId,
            action: `admin.${channel}_verified`,
            module: "auth",
            key: String(adminId),
            newValue: result.target,
            ...getRequestContext(req),
        }).catch(() => {});

        const maskedTarget =
            channel === "email"
                ? maskEmail(result.target)
                : maskPhone(result.target);

        return res.status(200).json({
            success: true,
            message: `${channel === "email" ? "Email" : "Mobile"} verified successfully.`,
            maskedTarget,
            ...result,
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message:
                error.message ||
                "Unable to verify code.",
        });

    }

};


module.exports = {
    requestOtp,
    verifyOtp,
};
