const defaultSettings = [

    // =========================================================
    // GENERAL
    // =========================================================

    {
        category: "general",
        key: "site_name",
        value: "Gamzzones",
        type: "string",
        description: "Website name",
        isPublic: true,
    },

    {
        category: "general",
        key: "site_description",
        value: "Gaming Platform",
        type: "string",
        description: "Website tagline/description",
        isPublic: true,
    },

    {
        category: "general",
        key: "support_email",
        value: "",
        type: "string",
        description: "Customer support email",
        isPublic: true,
    },

    {
        category: "general",
        key: "support_phone",
        value: "",
        type: "string",
        description: "Customer support phone number",
        isPublic: true,
    },

    {
        category: "general",
        key: "currency",
        value: "INR",
        type: "string",
        description: "Platform currency",
        isPublic: true,
    },

    {
        category: "general",
        key: "timezone",
        value: "Asia/Kolkata",
        type: "string",
        description: "Platform timezone",
        isPublic: true,
    },

    {
        category: "general",
        key: "client_url",
        value: process.env.CLIENT_URL || "http://localhost:3000",
        type: "string",
        description: "Frontend URL used for CORS and any links the backend generates back to the site",
        isPublic: false,
    },

    {
        category: "general",
        key: "email_sender_name",
        value: "",
        type: "string",
        description: "Display name shown as the sender on outgoing emails (e.g. 'Gaming Platform Support'). The actual SMTP address/credentials stay in .env and are never exposed here.",
        isPublic: false,
    },


    // =========================================================
    // PAYMENT
    // =========================================================

    {
        category: "payment",
        key: "deposit_enabled",
        value: true,
        type: "boolean",
        description: "Allow users to deposit money",
        isPublic: true,
    },

    {
        category: "payment",
        key: "withdrawal_enabled",
        value: true,
        type: "boolean",
        description: "Allow users to withdraw money",
        isPublic: true,
    },

    {
        category: "payment",
        key: "minimum_deposit",
        value: 100,
        type: "number",
        description: "Minimum deposit amount",
        isPublic: true,
    },

    {
        category: "payment",
        key: "maximum_deposit",
        value: 100000,
        type: "number",
        description: "Maximum deposit amount",
        isPublic: true,
    },

    {
        category: "payment",
        key: "minimum_withdrawal",
        value: 200,
        type: "number",
        description: "Minimum withdrawal amount",
        isPublic: true,
    },

    {
        category: "payment",
        key: "maximum_withdrawal",
        value: 50000,
        type: "number",
        description: "Maximum withdrawal amount",
        isPublic: true,
    },

    {
        category: "payment",
        key: "minimum_real_balance_for_withdrawal",
        value: 50,
        type: "number",
        description: "Minimum REAL (non-test, non-bonus) wallet balance a user must hold before a withdrawal is allowed",
        isPublic: true,
    },

    {
        category: "payment",
        key: "payment_mode",
        value: "manual",
        type: "string",
        description: "How deposits are processed: 'automatic' (Razorpay) or 'manual' (admin-reviewed reference submission)",
        isPublic: true,
    },

    {
        category: "payment",
        key: "withdrawal_mode",
        value: "manual",
        type: "string",
        description: "How withdrawals are processed: 'automatic' (RazorpayX payout) or 'manual' (admin-reviewed)",
        isPublic: true,
    },

    {
        category: "payment",
        key: "razorpay_mode",
        value: "test",
        type: "string",
        description: "Which Razorpay credential set is active: 'test' or 'live'. Each mode reads its own separate Key ID/Secret/Webhook Secret from .env - never falls back to the other mode's credentials.",
        isPublic: false,
    },


    // =========================================================
    // GAME
    // =========================================================

    {
        category: "game",
        key: "games_enabled",
        value: true,
        type: "boolean",
        description: "Enable or disable all games",
        isPublic: true,
    },

    {
        category: "game",
        key: "minimum_bet",
        value: 10,
        type: "number",
        description: "Minimum betting amount",
        isPublic: true,
    },

    {
        category: "game",
        key: "maximum_bet",
        value: 10000,
        type: "number",
        description: "Maximum betting amount",
        isPublic: true,
    },

    {
        category: "game",
        key: "round_duration",
        value: 60,
        type: "number",
        description: "Default game round duration in seconds",
        isPublic: true,
    },

    {
        category: "game",
        key: "payout_multiplier",
        value: 2,
        type: "number",
        description: "Multiplier applied to a winning bet's stake to compute its payout",
        isPublic: true,
    },


    // =========================================================
    // USER
    // =========================================================

    {
        category: "user",
        key: "registration_enabled",
        value: true,
        type: "boolean",
        description: "Allow new users to register",
        isPublic: true,
    },

    {
        category: "user",
        key: "email_verification_required",
        value: false,
        type: "boolean",
        description: "Require email verification",
        isPublic: true,
    },

    {
        category: "user",
        key: "mobile_verification_required",
        value: false,
        type: "boolean",
        description: "Require mobile verification (has no effect until an SMS provider is configured - see smsService.js)",
        isPublic: true,
    },

    {
        category: "user",
        key: "referral_enabled",
        value: true,
        type: "boolean",
        description: "Enable referral system",
        isPublic: true,
    },

    {
        category: "user",
        key: "referral_bonus_amount",
        value: 200,
        type: "number",
        description: "Bonus balance amount used for both referral rewards: credited to a referrer once their referred user qualifies, and credited immediately to a new user who registers with a valid referral code",
        isPublic: true,
    },

    {
        category: "user",
        key: "bonus_conversion_rate",
        value: 30,
        type: "number",
        description: "Percentage of winnings from a bonus-funded bet that converts to real (withdrawable) balance; the remainder stays as bonus balance",
        isPublic: true,
    },

    {
        category: "user",
        key: "test_welcome_balance",
        value: 100,
        type: "number",
        description: "One-time TEST balance credited to a user on their first login",
        isPublic: true,
    },


    // =========================================================
    // NOTIFICATION
    // =========================================================

    {
        category: "notification",
        key: "email_enabled",
        value: true,
        type: "boolean",
        description: "Enable email notifications",
    },

    {
        category: "notification",
        key: "sms_enabled",
        value: false,
        type: "boolean",
        description: "Enable SMS notifications",
    },

    {
        category: "notification",
        key: "deposit_notification",
        value: true,
        type: "boolean",
        description: "Notify users about deposits",
    },

    {
        category: "notification",
        key: "withdrawal_notification",
        value: true,
        type: "boolean",
        description: "Notify users about withdrawals",
    },


    // =========================================================
    // SECURITY
    // =========================================================

    {
        category: "security",
        key: "max_login_attempts",
        value: 5,
        type: "number",
        description: "Maximum failed login attempts",
    },

    {
        category: "security",
        key: "session_timeout",
        value: 1440,
        type: "number",
        description: "Session timeout in minutes (1440 = 24 hours)",
    },

    {
        category: "security",
        key: "otp_expiry_minutes",
        value: 10,
        type: "number",
        description: "How long an email/mobile OTP stays valid, in minutes",
    },

    {
        category: "security",
        key: "otp_max_attempts",
        value: 5,
        type: "number",
        description: "Maximum incorrect OTP attempts before it must be resent",
    },

    {
        category: "security",
        key: "otp_resend_cooldown_seconds",
        value: 60,
        type: "number",
        description: "Minimum time between OTP resend requests, in seconds",
    },


    // =========================================================
    // LEGAL
    // =========================================================

    {
        category: "legal",
        key: "terms_and_conditions",
        value: "",
        type: "string",
        description: "Terms and conditions content",
        isPublic: true,
    },

    {
        category: "legal",
        key: "privacy_policy",
        value: "",
        type: "string",
        description: "Privacy policy content",
        isPublic: true,
    },

    {
        category: "legal",
        key: "responsible_gaming",
        value: "",
        type: "string",
        description: "Responsible gaming information",
        isPublic: true,
    },

    {
        category: "legal",
        key: "responsible_gaming_popup_enabled",
        value: true,
        type: "boolean",
        description: "Show the daily responsible-gaming warning popup on the public site",
        isPublic: true,
    },

    {
        category: "legal",
        key: "responsible_gaming_popup_title",
        value: "Play Responsibly",
        type: "string",
        description: "Responsible-gaming popup title",
        isPublic: true,
    },

    {
        category: "legal",
        key: "responsible_gaming_popup_message",
        value: "This platform involves real financial risk. You can lose the money you play with, so only play with money you can afford to lose. Participation is at your own risk and our full Terms & Conditions apply.",
        type: "string",
        description: "Responsible-gaming popup message",
        isPublic: true,
    },

    {
        category: "legal",
        key: "responsible_gaming_popup_button_text",
        value: "I Understand, Continue",
        type: "string",
        description: "Responsible-gaming popup continue/close button text",
        isPublic: true,
    },

    {
        category: "legal",
        key: "responsible_gaming_popup_terms_url",
        value: "/legal-help#terms",
        type: "string",
        description: "Terms & Conditions link shown on the responsible-gaming popup",
        isPublic: true,
    },


    // =========================================================
    // SYSTEM
    // =========================================================

    {
        category: "system",
        key: "maintenance_mode",
        value: false,
        type: "boolean",
        description: "Put the website into maintenance mode",
    },

    {
        category: "system",
        key: "debug_mode",
        value: false,
        type: "boolean",
        description: "Enable system debug mode",
        isSensitive: true,
    },

];

module.exports = defaultSettings;