const ALLOWED_CATEGORIES = [
    "general",
    "payment",
    "game",
    "user",
    "notification",
    "security",
    "legal",
    "system",
];


// ==========================================================
// CATEGORY VALIDATION
// ==========================================================

const validateCategory = (category) => {

    if (!category) {
        return "Settings category is required.";
    }

    if (
        typeof category !== "string"
    ) {
        return "Invalid settings category.";
    }

    if (
        !ALLOWED_CATEGORIES.includes(
            category.toLowerCase()
        )
    ) {
        return `Invalid settings category: ${category}`;
    }

    return null;
};


// ==========================================================
// SETTINGS PAYLOAD VALIDATION
// ==========================================================

const validateSettingsPayload = (
    settings
) => {

    if (!Array.isArray(settings)) {
        return "Settings must be an array.";
    }

    if (settings.length === 0) {
        return "At least one setting is required.";
    }

    const keys = new Set();

    for (const item of settings) {

        if (
            !item ||
            typeof item !== "object" ||
            Array.isArray(item)
        ) {
            return "Each setting must be a valid object.";
        }


        // --------------------------------------------------
        // KEY
        // --------------------------------------------------

        if (
            !item.key ||
            typeof item.key !== "string"
        ) {
            return "Each setting must contain a valid key.";
        }

        const key =
            item.key.trim().toLowerCase();


        if (keys.has(key)) {
            return `Duplicate setting key: ${key}`;
        }

        keys.add(key);


        // --------------------------------------------------
        // VALUE
        // --------------------------------------------------

        if (
            !Object.prototype.hasOwnProperty.call(
                item,
                "value"
            )
        ) {
            return `Value is required for setting '${key}'.`;
        }
    }

    return null;
};


// ==========================================================
// VALUE TYPE VALIDATION
// ==========================================================

const getValueType = (value) => {

    if (Array.isArray(value)) {
        return "array";
    }

    if (value === null) {
        return "object";
    }

    return typeof value;
};


// ==========================================================
// BUSINESS VALIDATION
// ==========================================================

const validateBusinessRules = (
    category,
    settings
) => {

    const values = {};

    for (const item of settings) {
        values[
            item.key.trim().toLowerCase()
        ] = item.value;
    }


    // ======================================================
    // PAYMENT
    // ======================================================

    if (category === "payment") {

        const numericFields = [
            "minimum_deposit",
            "maximum_deposit",
            "minimum_withdrawal",
            "maximum_withdrawal",
        ];

        for (const key of numericFields) {

            if (
                values[key] !== undefined &&
                (
                    typeof values[key] !== "number" ||
                    !Number.isFinite(values[key]) ||
                    values[key] < 0
                )
            ) {
                return `${key} must be a valid non-negative number.`;
            }
        }


        if (
            values.minimum_deposit !== undefined &&
            values.maximum_deposit !== undefined &&
            values.minimum_deposit >
            values.maximum_deposit
        ) {
            return "Minimum deposit cannot be greater than maximum deposit.";
        }


        if (
            values.minimum_withdrawal !== undefined &&
            values.maximum_withdrawal !== undefined &&
            values.minimum_withdrawal >
            values.maximum_withdrawal
        ) {
            return "Minimum withdrawal cannot be greater than maximum withdrawal.";
        }


        const modeFields = [
            "payment_mode",
            "withdrawal_mode",
        ];

        for (const key of modeFields) {

            if (
                values[key] !== undefined &&
                !["manual", "automatic"].includes(values[key])
            ) {
                return `${key} must be either "manual" or "automatic".`;
            }
        }


        if (
            values.razorpay_mode !== undefined &&
            !["test", "live"].includes(values.razorpay_mode)
        ) {
            return `razorpay_mode must be either "test" or "live".`;
        }
    }


    // ======================================================
    // GENERAL
    // ======================================================

    if (category === "general") {

        if (values.client_url !== undefined) {

            const rawUrl =
                String(values.client_url || "").trim();

            if (!rawUrl) {
                return "Frontend URL is required.";
            }

            let parsedUrl;

            try {

                parsedUrl = new URL(rawUrl);

            } catch (error) {

                return "Frontend URL must be a valid URL (e.g. https://example.com).";

            }

            if (
                parsedUrl.protocol !== "http:" &&
                parsedUrl.protocol !== "https:"
            ) {
                return "Frontend URL must start with http:// or https://.";
            }
        }


        if (
            values.email_sender_name !== undefined &&
            String(values.email_sender_name).length > 100
        ) {
            return "Sender name must be 100 characters or fewer.";
        }
    }


    // ======================================================
    // GAME
    // ======================================================

    if (category === "game") {

        const numericFields = [
            "minimum_bet",
            "maximum_bet",
            "round_duration",
        ];

        for (const key of numericFields) {

            if (
                values[key] !== undefined &&
                (
                    typeof values[key] !== "number" ||
                    !Number.isFinite(values[key]) ||
                    values[key] <= 0
                )
            ) {
                return `${key} must be a valid positive number.`;
            }
        }


        if (
            values.minimum_bet !== undefined &&
            values.maximum_bet !== undefined &&
            values.minimum_bet >
            values.maximum_bet
        ) {
            return "Minimum bet cannot be greater than maximum bet.";
        }


        if (
            values.round_duration !== undefined &&
            !Number.isInteger(
                values.round_duration
            )
        ) {
            return "Round duration must be a whole number.";
        }
    }


    // ======================================================
    // SECURITY
    // ======================================================

    if (category === "security") {

        if (
            values.max_login_attempts !== undefined &&
            (
                !Number.isInteger(
                    values.max_login_attempts
                ) ||
                values.max_login_attempts <= 0
            )
        ) {
            return "Maximum login attempts must be a positive integer.";
        }


        if (
            values.session_timeout !== undefined &&
            (
                !Number.isInteger(
                    values.session_timeout
                ) ||
                values.session_timeout <= 0
            )
        ) {
            return "Session timeout must be a positive integer.";
        }
    }


    return null;
};


// ==========================================================
// EXPORTS
// ==========================================================

module.exports = {
    ALLOWED_CATEGORIES,
    validateCategory,
    validateSettingsPayload,
    getValueType,
    validateBusinessRules,
};