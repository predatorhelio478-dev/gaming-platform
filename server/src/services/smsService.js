/*
 * ==========================================
 * SMS SERVICE (pluggable, not yet wired to a provider)
 * ==========================================
 *
 * No SMS provider (MSG91/Twilio/Fast2SMS/etc.) has been
 * chosen yet, so this never claims to have sent a real SMS.
 * The contract mirrors emailService.sendEmail so a real
 * provider can be dropped in later without touching
 * otpService: replace the body of sendSms() with the
 * provider's API call and flip isSmsConfigured() to check
 * for that provider's env vars.
 *
 * In development only, the message is logged to the console
 * so the mobile-OTP flow stays fully testable end-to-end
 * without a real provider. This never runs in production.
 */

const isSmsConfigured = () => {

    return false;

};


const sendSms = async ({ to, message }) => {

    if (process.env.NODE_ENV !== "production") {

        console.log(
            `[smsService][DEV FALLBACK] Would SMS ${to}: ${message}`
        );

    }

    return {
        sent: false,
        reason: "SMS provider not configured",
    };

};


module.exports = {
    isSmsConfigured,
    sendSms,
};
