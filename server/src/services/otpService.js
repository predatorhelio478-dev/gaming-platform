const bcrypt = require("bcrypt");

const OtpVerification =
    require("../models/OtpVerification");

const User =
    require("../models/User");

const settingsService =
    require("./settingsService");

const emailService =
    require("./emailService");

const emailTemplateService =
    require("./emailTemplateService");

const smsService =
    require("./smsService");


const CHANNEL_PURPOSES = {
    email: ["verify_email", "change_email", "reset_password"],
    mobile: ["verify_mobile", "change_mobile"],
};


// ==========================================================
// GENERATE 6-DIGIT NUMERIC OTP
// ==========================================================

const generateOtp = () =>
    String(
        Math.floor(100000 + Math.random() * 900000)
    );


// ==========================================================
// REQUEST OTP
// ==========================================================
//
// Enforces the resend cooldown, generates + bcrypt-hashes a
// fresh OTP, upserts the single record for this
// (user, channel, purpose), and sends it via the appropriate
// channel. Never returns the OTP itself.
// ==========================================================

const requestOtp = async (
    userId,
    channel,
    target,
    purpose,
    actorModel = "User"
) => {

    if (!CHANNEL_PURPOSES[channel]) {

        throw new Error(
            "Invalid verification channel."
        );

    }

    if (!CHANNEL_PURPOSES[channel].includes(purpose)) {

        throw new Error(
            "Invalid verification purpose."
        );

    }

    const cleanTarget =
        channel === "email"
            ? String(target || "").trim().toLowerCase()
            : String(target || "").trim();

    if (!cleanTarget) {

        throw new Error(
            `A valid ${channel} is required.`
        );

    }


    // ======================================================
    // UNIQUENESS (only relevant when CHANGING to a new value)
    // ======================================================

    if (purpose === "change_email") {

        const taken = await User.findOne({
            email: cleanTarget,
            _id: { $ne: userId },
        });

        if (taken) {

            throw new Error(
                "This email is already in use."
            );

        }

    }

    if (purpose === "change_mobile") {

        const taken = await User.findOne({
            mobile: cleanTarget,
            _id: { $ne: userId },
        });

        if (taken) {

            throw new Error(
                "This mobile number is already in use."
            );

        }

    }


    const [
        expiryMinutes,
        maxAttempts,
        resendCooldownSeconds,
    ] = await Promise.all([

        settingsService.getValue(
            "security",
            "otp_expiry_minutes",
            10
        ),

        settingsService.getValue(
            "security",
            "otp_max_attempts",
            5
        ),

        settingsService.getValue(
            "security",
            "otp_resend_cooldown_seconds",
            60
        ),

    ]);


    // ======================================================
    // RESEND COOLDOWN
    // ======================================================

    const existing =
        await OtpVerification.findOne({
            user: userId,
            actorModel,
            channel,
            purpose,
        });

    if (existing) {

        const secondsSinceLastSend =
            (Date.now() - existing.lastSentAt.getTime()) / 1000;

        const cooldown =
            Number(resendCooldownSeconds) || 60;

        if (secondsSinceLastSend < cooldown) {

            const waitSeconds =
                Math.ceil(cooldown - secondsSinceLastSend);

            throw new Error(
                `Please wait ${waitSeconds}s before requesting another code.`
            );

        }

    }


    // ======================================================
    // GENERATE + STORE (hashed only)
    // ======================================================

    const otp =
        generateOtp();

    const otpHash =
        await bcrypt.hash(otp, 10);

    const now =
        new Date();

    const expiresAt =
        new Date(
            now.getTime() +
            (Number(expiryMinutes) || 10) * 60 * 1000
        );

    await OtpVerification.findOneAndUpdate(
        {
            user: userId,
            actorModel,
            channel,
            purpose,
        },
        {
            $set: {
                target: cleanTarget,
                otpHash,
                attempts: 0,
                maxAttempts: Number(maxAttempts) || 5,
                lastSentAt: now,
                expiresAt,
                consumedAt: null,
            },
        },
        {
            upsert: true,
        }
    );


    // ======================================================
    // SEND (never returns/logs the OTP outside emailService's
    // own dev-only, non-production fallback)
    // ======================================================

    const TEMPLATE_KEY_BY_PURPOSE = {
        verify_email: "otp_verify_email",
        change_email: "otp_change_email",
        reset_password:
            actorModel === "Admin"
                ? "admin_forgot_password"
                : "forgot_password",
    };

    const FALLBACK_SUBJECTS = {
        change_email: "Confirm your new email",
        reset_password: "Reset your password",
    };

    if (channel === "email") {

        const fallbackText =
            purpose === "reset_password"
                ? `Your password reset code is ${otp}. ` +
                  `It expires in ${expiryMinutes} minutes. ` +
                  `If you did not request this, you can safely ignore this email - your password will not be changed.`
                : `Your verification code is ${otp}. ` +
                  `It expires in ${expiryMinutes} minutes. ` +
                  `Do not share this code with anyone.`;

        await emailTemplateService.sendTemplatedEmail({
            key: TEMPLATE_KEY_BY_PURPOSE[purpose] || "otp_verify_email",
            to: cleanTarget,
            variables: {
                otp,
                otp_expiry_minutes: expiryMinutes,
            },
            fallbackSubject:
                FALLBACK_SUBJECTS[purpose] ||
                "Verify your email",
            fallbackText,
        });

    } else {

        await smsService.sendSms({
            to: cleanTarget,
            message:
                `Your verification code is ${otp}. It expires in ${expiryMinutes} minutes.`,
        });

    }


    return {
        requested: true,
        expiresInMinutes: Number(expiryMinutes) || 10,
    };

};


// ==========================================================
// VERIFY OTP
// ==========================================================

const verifyOtp = async (
    userId,
    channel,
    otp,
    purpose,
    actorModel = "User"
) => {

    if (!otp || !String(otp).trim()) {

        throw new Error(
            "OTP is required."
        );

    }

    const record =
        await OtpVerification.findOne({
            user: userId,
            actorModel,
            channel,
            purpose,
        });

    if (!record) {

        throw new Error(
            "No verification code was requested. Please request a new code."
        );

    }

    if (record.consumedAt) {

        throw new Error(
            "This code has already been used. Please request a new one."
        );

    }

    if (record.expiresAt.getTime() < Date.now()) {

        throw new Error(
            "This code has expired. Please request a new one."
        );

    }

    if (record.attempts >= record.maxAttempts) {

        throw new Error(
            "Too many incorrect attempts. Please request a new code."
        );

    }

    const isMatch =
        await bcrypt.compare(
            String(otp).trim(),
            record.otpHash
        );

    if (!isMatch) {

        record.attempts += 1;

        await record.save();

        throw new Error(
            "Incorrect code."
        );

    }

    record.consumedAt =
        new Date();

    await record.save();


    // ======================================================
    // PASSWORD RESET - proves identity only, doesn't imply
    // anything about email/mobile verification. The caller
    // (authController/adminAuthController) is responsible for
    // actually setting the new password against the right
    // model (User or Admin).
    // ======================================================

    if (purpose === "reset_password") {

        return {
            verified: true,
            channel,
            target: record.target,
        };

    }


    // ======================================================
    // APPLY VERIFICATION (and the new value, for change_*)
    // ======================================================

    const update = {};

    if (channel === "email") {

        update.emailVerified = true;

        if (purpose === "change_email") {

            update.email = record.target;

        }

    } else {

        update.mobileVerified = true;

        if (purpose === "change_mobile") {

            update.mobile = record.target;

        }

    }

    await User.findByIdAndUpdate(
        userId,
        { $set: update }
    );


    return {
        verified: true,
        channel,
        target: record.target,
    };

};


module.exports = {
    requestOtp,
    verifyOtp,
};
