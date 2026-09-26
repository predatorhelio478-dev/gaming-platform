const { body, validationResult } = require("express-validator");


// ==========================================
// SHARED PATTERNS
// ==========================================
//
// Indian mobile numbers: 10 digits starting 6-9, with an
// optional +91/91/0 prefix that gets stripped before storage.

const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

// Strips a country code / trunk prefix ONLY when the input is
// longer than a plain 10-digit number. A blind
// `.replace(/^(\+91|91|0)/, "")` corrupted any genuine 10-digit
// number that happens to start with "91" (e.g. 9100020808 ->
// wrongly stripped to the 8-digit "00020808") - never touch an
// input that's already exactly 10 digits.
const normalizeMobile = (value) => {

    let digits =
        String(value || "").trim().replace(/[^\d]/g, "");

    if (digits.length === 12 && digits.startsWith("91")) {

        digits = digits.slice(2);

    } else if (digits.length === 11 && digits.startsWith("0")) {

        digits = digits.slice(1);

    }

    return digits;

};


/*
 * ==========================================
 * HANDLE VALIDATION ERRORS
 * ==========================================
 *
 * Runs after a chain of express-validator checks;
 * short-circuits with the first error message rather
 * than letting a malformed/malicious payload reach
 * the controller.
 */

const handleValidationErrors = (req, res, next) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {

        return res.status(400).json({

            success: false,

            message:
                errors.array()[0]?.msg ||
                "Invalid request.",

        });

    }

    next();

};


// ==========================================
// AUTH
// ==========================================

const registerValidators = [

    body("fullName")
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage("Full name must be between 2 and 100 characters."),

    body("username")
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage("Username must be between 3 and 30 characters.")
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage("Username may only contain letters, numbers, and underscores."),

    body("email")
        .trim()
        .isEmail()
        .withMessage("A valid email is required."),

    body("password")
        .isLength({ min: 6, max: 128 })
        .withMessage("Password must be at least 6 characters."),

    body("mobile")
        .optional({ checkFalsy: true })
        .customSanitizer(normalizeMobile)
        .matches(INDIAN_MOBILE_REGEX)
        .withMessage("Enter a valid 10-digit mobile number."),

    body("referralCode")
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ min: 3, max: 20 })
        .withMessage("Invalid referral code."),

    handleValidationErrors,

];

const loginValidators = [

    // Accepts either `identifier` (username or email, current
    // frontend contract) or a bare `email` (older callers) -
    // resolved to a single non-empty string either way.
    body("identifier")
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ min: 3, max: 255 })
        .withMessage("A valid username or email is required."),

    body("email")
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ min: 3, max: 255 })
        .withMessage("A valid username or email is required."),

    body().custom((value, { req }) => {

        if (!req.body.identifier && !req.body.email) {

            throw new Error(
                "Username or email is required."
            );

        }

        return true;

    }),

    body("password")
        .notEmpty()
        .withMessage("Password is required."),

    body("rememberMe")
        .optional()
        .isBoolean()
        .withMessage("rememberMe must be true or false."),

    handleValidationErrors,

];

const adminLoginValidators = [

    body("username")
        .trim()
        .notEmpty()
        .withMessage("Username is required."),

    body("rememberMe")
        .optional()
        .isBoolean()
        .withMessage("rememberMe must be true or false."),

    body("password")
        .notEmpty()
        .withMessage("Password is required."),

    handleValidationErrors,

];


// ==========================================
// BETS
// ==========================================

const placeBetValidators = [

    body("color")
        .trim()
        .toLowerCase()
        .isIn(["red", "green", "blue"])
        .withMessage("Color must be one of red, green, blue."),

    body("amount")
        .isFloat({ gt: 0 })
        .withMessage("Amount must be a positive number."),

    body("mode")
        .optional()
        .isIn(["real", "test", "bonus"])
        .withMessage("Invalid wallet mode."),

    handleValidationErrors,

];

const increaseBetValidators = [

    body("color")
        .trim()
        .toLowerCase()
        .isIn(["red", "green", "blue"])
        .withMessage("Color must be one of red, green, blue."),

    body("amount")
        .isFloat({ gt: 0 })
        .withMessage("Increase amount must be a positive number."),

    handleValidationErrors,

];


// ==========================================
// ADMIN WALLET
// ==========================================

const adminWalletAdjustValidators = [

    body("userId")
        .isMongoId()
        .withMessage("A valid user ID is required."),

    body("type")
        .isIn(["admin_credit", "admin_debit"])
        .withMessage("Invalid wallet adjustment type."),

    body("amount")
        .isFloat({ gt: 0 })
        .withMessage("Amount must be a positive number."),

    body("remark")
        .trim()
        .notEmpty()
        .withMessage("Adjustment reason is required."),

    handleValidationErrors,

];


// ==========================================
// DEPOSIT / WITHDRAWAL REQUESTS
// ==========================================

const createDepositRequestValidators = [

    body("amount")
        .isFloat({ gt: 0 })
        .withMessage("Amount must be a positive number."),

    body("referenceId")
        .trim()
        .notEmpty()
        .withMessage("Payment reference/UTR is required.")
        .isLength({ max: 100 })
        .withMessage("Payment reference is too long."),

    handleValidationErrors,

];

const createWithdrawalRequestValidators = [

    body("amount")
        .isFloat({ gt: 0 })
        .withMessage("Amount must be a positive number."),

    body("payoutDetails")
        .trim()
        .notEmpty()
        .withMessage("Payout details (bank/UPI) are required.")
        .isLength({ max: 300 })
        .withMessage("Payout details are too long."),

    // Structured payout target - only required when automatic
    // payouts are enabled (enforced in withdrawalService, since
    // that depends on a runtime setting, not a static shape).

    body("upiId")
        .optional({ checkFalsy: true })
        .trim()
        .matches(/^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/)
        .withMessage("Invalid UPI ID format."),

    body("bankAccountNumber")
        .optional({ checkFalsy: true })
        .trim()
        .matches(/^\d{6,20}$/)
        .withMessage("Invalid bank account number."),

    body("bankIfsc")
        .optional({ checkFalsy: true })
        .trim()
        .matches(/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/)
        .withMessage("Invalid IFSC code."),

    handleValidationErrors,

];

const reviewRequestValidators = [

    body("reviewNotes")
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage("Review notes are too long."),

    handleValidationErrors,

];


// ==========================================
// OTP
// ==========================================

const otpRequestValidators = [

    body("channel")
        .isIn(["email", "mobile"])
        .withMessage("Invalid verification channel."),

    body("purpose")
        .isIn([
            "verify_email",
            "verify_mobile",
            "change_email",
            "change_mobile",
        ])
        .withMessage("Invalid verification purpose."),

    body("target")
        .optional({ checkFalsy: true })
        .trim(),

    handleValidationErrors,

];

const otpVerifyValidators = [

    body("channel")
        .isIn(["email", "mobile"])
        .withMessage("Invalid verification channel."),

    body("purpose")
        .isIn([
            "verify_email",
            "verify_mobile",
            "change_email",
            "change_mobile",
        ])
        .withMessage("Invalid verification purpose."),

    body("otp")
        .trim()
        .isLength({ min: 4, max: 8 })
        .withMessage("Invalid code."),

    handleValidationErrors,

];


// ==========================================
// USER PROFILE
// ==========================================

const updateProfileValidators = [

    body("fullName")
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage("Full name must be between 2 and 100 characters."),

    body("notificationPreferences")
        .optional()
        .isObject()
        .withMessage("Invalid notification preferences."),

    handleValidationErrors,

];

const emailChangeValidators = [

    body("newEmail")
        .trim()
        .isEmail()
        .withMessage("A valid new email is required."),

    body("password")
        .notEmpty()
        .withMessage("Current password is required."),

    handleValidationErrors,

];

const mobileChangeValidators = [

    body("newMobile")
        .customSanitizer(normalizeMobile)
        .matches(INDIAN_MOBILE_REGEX)
        .withMessage("Enter a valid 10-digit mobile number."),

    body("password")
        .notEmpty()
        .withMessage("Current password is required."),

    handleValidationErrors,

];

const changePasswordValidators = [

    body("currentPassword")
        .notEmpty()
        .withMessage("Current password is required."),

    body("newPassword")
        .isLength({ min: 6, max: 128 })
        .withMessage("New password must be at least 6 characters."),

    handleValidationErrors,

];


// ==========================================
// FORGOT / RESET PASSWORD (user + admin)
// ==========================================

const forgotPasswordValidators = [

    body("identifier")
        .trim()
        .notEmpty()
        .withMessage("Email or username is required."),

    handleValidationErrors,

];

const resetPasswordValidators = [

    body("identifier")
        .trim()
        .notEmpty()
        .withMessage("Email or username is required."),

    body("otp")
        .trim()
        .notEmpty()
        .withMessage("Verification code is required."),

    body("newPassword")
        .isLength({ min: 6, max: 128 })
        .withMessage("New password must be at least 6 characters."),

    handleValidationErrors,

];

const adminForgotPasswordValidators = [

    body("username")
        .trim()
        .notEmpty()
        .withMessage("Username or email is required."),

    handleValidationErrors,

];

const adminResetPasswordValidators = [

    body("username")
        .trim()
        .notEmpty()
        .withMessage("Username or email is required."),

    body("otp")
        .trim()
        .notEmpty()
        .withMessage("Verification code is required."),

    body("newPassword")
        .isLength({ min: 6, max: 128 })
        .withMessage("New password must be at least 6 characters."),

    handleValidationErrors,

];


// ==========================================
// ADMIN-INITIATED PASSWORD CHANGE (for a normal user)
// ==========================================

const adminChangeUserPasswordValidators = [

    body("newPassword")
        .isLength({ min: 6, max: 128 })
        .withMessage("New password must be at least 6 characters."),

    handleValidationErrors,

];


// ==========================================
// SUPPORT TICKETS
// ==========================================

const SUPPORT_CATEGORIES = [
    "payment", "deposit", "withdrawal", "betting", "wallet",
    "referral", "account", "verification", "technical", "other",
];

const SUPPORT_PRIORITIES = ["low", "normal", "high", "urgent"];

const SUPPORT_STATUSES = ["open", "pending", "replied", "resolved", "closed"];

const createTicketValidators = [

    body("subject")
        .trim()
        .isLength({ min: 3, max: 150 })
        .withMessage("Subject must be between 3 and 150 characters."),

    body("message")
        .trim()
        .isLength({ min: 1, max: 2000 })
        .withMessage("Message must be between 1 and 2000 characters."),

    body("category")
        .optional({ checkFalsy: true })
        .isIn(SUPPORT_CATEGORIES)
        .withMessage("Invalid category."),

    // Priority is never accepted from the user - it's derived
    // server-side from category (see supportService.createTicket).
    // No validator for it here on purpose; any `priority` the
    // client sends is simply ignored by the controller/service.

    body("references")
        .optional()
        .isArray({ max: 10 })
        .withMessage("Invalid references."),

    handleValidationErrors,

];

const ticketReplyValidators = [

    body("message")
        .trim()
        .isLength({ min: 1, max: 2000 })
        .withMessage("Message must be between 1 and 2000 characters."),

    handleValidationErrors,

];

const ticketStatusValidators = [

    body("status")
        .isIn(SUPPORT_STATUSES)
        .withMessage("Invalid status."),

    body("closingNote")
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 2000 })
        .withMessage("Closing note is too long (max 2000 characters)."),

    handleValidationErrors,

];

const ticketPriorityValidators = [

    body("priority")
        .isIn(SUPPORT_PRIORITIES)
        .withMessage("Invalid priority."),

    handleValidationErrors,

];

const ticketAssignValidators = [

    body("adminId")
        .optional({ nullable: true, checkFalsy: true })
        .isMongoId()
        .withMessage("Invalid admin id."),

    // Required-ness of `note` depends on whether the assignment
    // actually changes (business logic, enforced in
    // supportService.assignTicket) - this only checks its shape
    // when present.
    body("note")
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 2000 })
        .withMessage("Note is too long (max 2000 characters)."),

    handleValidationErrors,

];

const ticketNoteValidators = [

    body("note")
        .trim()
        .isLength({ min: 1, max: 2000 })
        .withMessage("Note must be between 1 and 2000 characters."),

    handleValidationErrors,

];


module.exports = {

    handleValidationErrors,

    registerValidators,

    loginValidators,

    adminLoginValidators,

    placeBetValidators,

    increaseBetValidators,

    adminWalletAdjustValidators,

    createDepositRequestValidators,

    createWithdrawalRequestValidators,

    reviewRequestValidators,

    otpRequestValidators,

    otpVerifyValidators,

    updateProfileValidators,

    emailChangeValidators,

    mobileChangeValidators,

    changePasswordValidators,

    forgotPasswordValidators,

    resetPasswordValidators,

    adminForgotPasswordValidators,

    adminResetPasswordValidators,

    adminChangeUserPasswordValidators,

    createTicketValidators,

    ticketReplyValidators,

    ticketStatusValidators,

    ticketPriorityValidators,

    ticketAssignValidators,

    ticketNoteValidators,

    INDIAN_MOBILE_REGEX,

    normalizeMobile,

};
