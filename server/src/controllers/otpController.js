const otpService =
    require("../services/otpService");

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
// REQUEST OTP
// ==========================================================

const requestOtp = async (req, res) => {

    try {

        const userId =
            req.user?.id || req.user?._id;

        const { channel, purpose, target } = req.body;


        // ==================================================
        // CHANGE-OF-CONTACT PURPOSES REQUIRE PASSWORD CONFIRMATION
        // ==================================================
        //
        // change_email/change_mobile must go through
        // POST /users/me/email/change or /users/me/mobile/change,
        // which verify the current password BEFORE an OTP is
        // sent to a new, attacker-choosable destination. Without
        // this, a hijacked session token alone (no password
        // knowledge) could redirect account contact info.

        if (
            purpose === "change_email" ||
            purpose === "change_mobile"
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Use the email/mobile change endpoint in Settings to change this - it requires your password.",
            });

        }


        // ==================================================
        // RESOLVE TARGET
        // ==================================================
        //
        // For verify_email/verify_mobile, the target is
        // always the user's CURRENT on-file value - never
        // whatever the client claims - so a user can't
        // "verify" an email/mobile that isn't actually theirs.
        // For change_email/change_mobile, the client-supplied
        // new value is used (uniqueness is re-checked inside
        // otpService).

        let resolvedTarget = target;

        if (
            purpose === "verify_email" ||
            purpose === "verify_mobile"
        ) {

            const user =
                await User.findById(userId).select(
                    "email mobile"
                );

            if (!user) {

                return res.status(404).json({
                    success: false,
                    message: "User not found.",
                });

            }

            resolvedTarget =
                purpose === "verify_email"
                    ? user.email
                    : user.mobile;

            if (!resolvedTarget) {

                return res.status(400).json({
                    success: false,
                    message:
                        purpose === "verify_email"
                            ? "No email on file."
                            : "No mobile number on file. Add one in Settings first.",
                });

            }

        }

        const result =
            await otpService.requestOtp(
                userId,
                channel,
                resolvedTarget,
                purpose
            );

        return res.status(200).json({
            success: true,
            message: `Verification code sent to your ${channel}.`,
            ...result,
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message:
                error.message ||
                "Unable to send verification code.",
        });

    }

};


// ==========================================================
// VERIFY OTP
// ==========================================================

const verifyOtp = async (req, res) => {

    try {

        const userId =
            req.user?.id || req.user?._id;

        const { channel, otp, purpose } = req.body;

        const result =
            await otpService.verifyOtp(
                userId,
                channel,
                otp,
                purpose
            );

        await createAuditLog({
            actorType: "user",
            actorId: userId,
            action: `user.${channel}_verified`,
            module: "auth",
            key: String(userId),
            newValue: result.target,
            ...getRequestContext(req),
        }).catch(() => {});

        notificationService
            .notify(
                userId,
                "verification",
                channel === "email" ? "Email verified" : "Mobile verified",
                `Your ${channel} (${result.target}) has been verified successfully.`,
                { channel }
            )
            .catch(() => {});

        return res.status(200).json({
            success: true,
            message: `${channel === "email" ? "Email" : "Mobile"} verified successfully.`,
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
