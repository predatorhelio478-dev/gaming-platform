const bcrypt = require("bcrypt");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const Wallet = require("../models/Wallet");
const walletService = require("../services/walletService");
const settingsService = require("../services/settingsService");
const generateReferralCode = require("../utils/referralCodeGenerator");
const otpService = require("../services/otpService");
const emailService = require("../services/emailService");
const emailTemplateService = require("../services/emailTemplateService");
const { normalizeMobile } = require("../validators/requestValidators");
const { createAuditLog } = require("../services/auditLogService");


// ======================================================
// GENERATE A UNIQUE REFERRAL CODE
// ======================================================

const createUniqueReferralCode = async () => {

    for (let attempt = 0; attempt < 5; attempt++) {

        const candidate = generateReferralCode();

        const exists = await User.exists({
            referralCode: candidate,
        });

        if (!exists) {

            return candidate;

        }

    }

    throw new Error(
        "Unable to generate a unique referral code. Please try again."
    );

};


// ======================================================
// WELCOME EMAIL (best-effort - never blocks or rolls back
// a successful registration if sending fails)
// ======================================================

const sendWelcomeEmail = async (user) => {

    const siteName =
        await settingsService.getValue(
            "general",
            "site_name",
            "Gaming Platform"
        );

    await emailTemplateService.sendTemplatedEmail({
        key: "welcome",
        to: user.email,
        variables: {
            user_name: user.fullName || user.username,
            username: user.username,
            email: user.email,
            site_name: siteName,
        },
        fallbackSubject: `Welcome to ${siteName}!`,
        fallbackText:
            `Hi ${user.fullName || user.username},\n\n` +
            `Your account on ${siteName} has been created successfully.\n\n` +
            `Username: ${user.username}\n` +
            `Email: ${user.email}\n\n` +
            `You can now log in and start playing. If you did not create this account, please contact support immediately.`,
    });

};


// ======================================================
// ADMIN/SUPPORT NOTIFICATION - NEW USER REGISTERED
// ======================================================
//
// Sent to the existing Settings -> General -> Support Email
// address (general.support_email). Skipped (not an error) if
// that setting is empty - there's simply nowhere to send it.
// ======================================================

const notifyAdminsOfNewRegistration = async (user) => {

    const [siteName, supportEmail] =
        await Promise.all([

            settingsService.getValue(
                "general",
                "site_name",
                "Gaming Platform"
            ),

            settingsService.getValue(
                "general",
                "support_email",
                ""
            ),

        ]);

    const cleanSupportEmail =
        String(supportEmail || "").trim();

    if (!cleanSupportEmail) {

        return;

    }

    await emailTemplateService.sendTemplatedEmail({
        key: "admin_new_user",
        to: cleanSupportEmail,
        variables: {
            user_name: user.fullName || "-",
            username: user.username,
            email: user.email,
            registered_at: new Date(user.createdAt || Date.now()).toISOString(),
            site_name: siteName,
        },
        fallbackSubject: `New user registered - ${siteName}`,
        fallbackText:
            `A new user has registered on ${siteName}.\n\n` +
            `Name: ${user.fullName || "-"}\n` +
            `Username: ${user.username}\n` +
            `Email: ${user.email}\n` +
            `Registered At: ${new Date(user.createdAt || Date.now()).toISOString()}\n\n` +
            `This is an automated notification - no action is required.`,
    });

};


// ======================================================
// GRANT ONE-TIME TEST WELCOME BALANCE
// ======================================================
//
// Atomically flips testBalanceGranted (via a filtered
// findOneAndUpdate) so concurrent logins can never both
// win the race and double-grant the credit. Never touches
// real balance; failures here must never break login.
// ======================================================

const grantTestWelcomeBalanceIfNeeded = async (userId) => {

    try {

        const wonGrant =
            await Wallet.findOneAndUpdate(
                {
                    user: userId,
                    testBalanceGranted: false,
                },
                {
                    $set: {
                        testBalanceGranted: true,
                    },
                }
            );

        if (!wonGrant) {

            return;

        }

        const testWelcomeAmount =
            Number(
                await settingsService.getValue(
                    "user",
                    "test_welcome_balance",
                    100
                )
            ) || 0;

        if (testWelcomeAmount > 0) {

            await walletService.creditPool(
                userId,
                testWelcomeAmount,
                "test_credit",
                "One-time TEST welcome balance",
                "testBalance"
            );

        }

    } catch (error) {

        console.error(
            "Test Welcome Balance Grant Error:",
            error.message
        );

    }

};


// ======================================================
// REGISTER
// ======================================================

exports.register = async (req, res) => {

    try {

        // Was previously decorative (admin could toggle it,
        // nothing read it).

        const registrationEnabled =
            await settingsService.getValue(
                "user",
                "registration_enabled",
                true
            );

        if (registrationEnabled !== true) {

            return res.status(403).json({

                success: false,

                message: "New registrations are currently disabled.",

            });

        }

        const {
            fullName,
            username,
            email,
            mobile,
            password,
            referralCode,
        } = req.body;

        const cleanMobile =
            mobile
                ? normalizeMobile(mobile)
                : "";


        // ==================================================
        // CHECK EXISTING USER
        // ==================================================

        const userExists =
            await User.findOne({
                $or: [
                    { email },
                    { username },
                ],
            });


        if (userExists) {

            return res.status(400).json({

                success:
                    false,

                message:
                    "User already exists",

            });

        }


        // ==================================================
        // VALIDATE REFERRAL CODE (OPTIONAL)
        // ==================================================
        //
        // A new user has no account yet, so self-referral
        // isn't reachable through this endpoint; the referrer
        // must already exist.

        let referrer = null;

        const cleanReferralCode =
            typeof referralCode === "string"
                ? referralCode.trim().toUpperCase()
                : "";

        if (cleanReferralCode) {

            referrer =
                await User.findOne({
                    referralCode: cleanReferralCode,
                });

            if (!referrer) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Invalid referral code.",

                });

            }

        }


        // ==================================================
        // HASH PASSWORD
        // ==================================================

        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );


        // ==================================================
        // UNIQUE REFERRAL CODE FOR THE NEW USER
        // ==================================================

        const newReferralCode =
            await createUniqueReferralCode();


        // ==================================================
        // CREATE USER
        // ==================================================

        const user =
            await User.create({

                fullName,

                username,

                email,

                mobile:
                    cleanMobile,

                password:
                    hashedPassword,

                referralCode:
                    newReferralCode,

                referredBy:
                    referrer?._id || null,

            });


        // ==================================================
        // CREATE WALLET
        // ==================================================

        const wallet =
            await Wallet.create({

                user:
                    user._id,

                balance:
                    0,

                bonusBalance:
                    0,

                winningBalance:
                    0,

                lockedBalance:
                    0,

            });


        // ==================================================
        // REFERRAL SIGNUP BONUS (new user's side)
        // ==================================================
        //
        // Distinct from the EXISTING referrer-side reward
        // (referralService.qualifyReferral - paid to the
        // REFERRER once the new user places their first
        // real-money bet, unchanged). This is an ADDITIONAL,
        // immediate bonus to the NEW user for having entered a
        // valid referral code - only reachable when `referrer`
        // was resolved above (invalid codes already returned
        // 400 earlier; self-referral is structurally impossible
        // since the referrer must already exist before this new
        // account is created). Guarded by a one-time
        // `referralSignupBonusGranted` flag (mirrors the
        // existing testBalanceGranted pattern) so a retried/
        // duplicated call path could never double-credit it -
        // though under normal operation this only ever runs
        // once, immediately after this brand-new wallet is
        // created. Best-effort: a failure here must never roll
        // back the already-created account/wallet.

        if (referrer) {

            try {

                const referralEnabled =
                    await settingsService.getValue(
                        "user",
                        "referral_enabled",
                        true
                    );

                const referralBonusAmount =
                    Number(
                        await settingsService.getValue(
                            "user",
                            "referral_bonus_amount",
                            200
                        )
                    ) || 200;

                if (
                    referralEnabled === true &&
                    referralBonusAmount > 0 &&
                    !wallet.referralSignupBonusGranted
                ) {

                    await walletService.creditPool(
                        user._id,
                        referralBonusAmount,
                        "bonus",
                        `Referral signup bonus - referred by ${referrer._id}`,
                        "bonusBalance"
                    );

                    await Wallet.updateOne(
                        { _id: wallet._id },
                        { $set: { referralSignupBonusGranted: true } }
                    );

                    await createAuditLog({
                        actorType: "system",
                        action: "referral.signup_bonus_awarded",
                        module: "referrals",
                        key: String(user._id),
                        newValue: referralBonusAmount,
                        metadata: {
                            referrerId: String(referrer._id),
                        },
                    });

                }

            } catch (error) {

                console.error(
                    "Register: referral signup bonus failed:",
                    error.message
                );

            }

        }


        // ==================================================
        // WELCOME EMAIL + ADMIN NEW-USER NOTIFICATION
        // ==================================================
        //
        // Fire-and-forget: registration has already succeeded
        // (user + wallet both created) by this point, so an
        // email failure here must never roll back the account
        // or slow down the response. Never includes password/
        // OTP/tokens - name/username/email/registration time
        // only.

        sendWelcomeEmail(user).catch((error) => {

            console.error(
                "Register: welcome email failed:",
                error.message
            );

        });

        notifyAdminsOfNewRegistration(user).catch((error) => {

            console.error(
                "Register: admin new-user notification email failed:",
                error.message
            );

        });


        // ==================================================
        // TEST WELCOME BALANCE
        // ==================================================
        //
        // register() issues its own token below instead of
        // going through issueSession() (the frontend logs the
        // user straight in from this response, it never makes
        // a separate login() call), so without this the grant
        // never fired for a normal signup - grantTestWelcomeBalanceIfNeeded
        // is idempotent (atomic testBalanceGranted:false filter),
        // so calling it here AND again from issueSession() at a
        // later login is always safe - only the first call ever
        // wins the flag flip. Must not require/wait on email
        // verification - runs regardless of that outcome.

        await grantTestWelcomeBalanceIfNeeded(
            user._id
        );


        // ==================================================
        // KICK OFF EMAIL VERIFICATION
        // ==================================================
        //
        // Awaited (not fire-and-forget): the frontend moves
        // straight to an inline "enter code" step after this
        // response, so the OtpVerification row must actually
        // exist by the time this returns - otherwise a fast
        // client could hit /otp/verify before it's ready.
        // Still best-effort: registration must succeed even
        // if the email channel is unreachable (e.g. SMTP not
        // yet configured) - the user can request a new code
        // later from Settings either way.

        try {

            await otpService.requestOtp(
                user._id,
                "email",
                user.email,
                "verify_email"
            );

        } catch (error) {

            console.error(
                "Register: email OTP request failed:",
                error.message
            );

        }

        if (cleanMobile) {

            otpService
                .requestOtp(user._id, "mobile", cleanMobile, "verify_mobile")
                .catch((error) => {

                    console.error(
                        "Register: mobile OTP request failed:",
                        error.message
                    );

                });

        }


        // ==================================================
        // GENERATE TOKEN
        // ==================================================

        const token =
            await generateToken(
                user._id
            );


        const userResponse =
            user.toObject();

        delete userResponse.password;


        return res.status(201).json({

            success:
                true,

            token,

            user:
                userResponse,

        });

    } catch (
    err
    ) {

        console.error(
            "Register Error:",
            err
        );


        return res.status(500).json({

            success:
                false,

            message:
                err.message,

        });

    }

};


// ======================================================
// SHARED: FIND USER BY CREDENTIALS
// ======================================================
//
// Used by login, resendVerificationOtp, and verifyAndLogin -
// all three need "prove you own these credentials" without
// necessarily granting a full session yet.
// ======================================================

const findUserByCredentials = async (
    identifierRaw,
    password
) => {

    const cleanIdentifier =
        String(identifierRaw || "")
            .trim()
            .toLowerCase();

    const user =
        await User.findOne({
            $or: [
                { email: cleanIdentifier },
                { username: cleanIdentifier },
            ],
        }).select(
            "+password"
        );

    if (!user) {

        throw Object.assign(
            new Error("Invalid credentials"),
            { statusCode: 401 }
        );

    }

    const isMatch =
        await bcrypt.compare(
            password,
            user.password
        );

    if (!isMatch) {

        throw Object.assign(
            new Error("Invalid credentials"),
            { statusCode: 401 }
        );

    }

    if (user.status === "blocked") {

        throw Object.assign(
            new Error("Your account has been blocked."),
            { statusCode: 403 }
        );

    }

    if (user.isDeleted) {

        throw Object.assign(
            new Error("This account is no longer active."),
            { statusCode: 403 }
        );

    }

    return user;

};


// ======================================================
// SHARED: ISSUE A SESSION FOR AN ALREADY-VALIDATED USER
// ======================================================

const issueSession = async (user) => {

    user.lastLogin =
        new Date();

    await user.save();

    await grantTestWelcomeBalanceIfNeeded(
        user._id
    );

    const token =
        await generateToken(
            user._id
        );

    const userResponse =
        user.toObject();

    delete userResponse.password;

    return {
        token,
        user: userResponse,
    };

};


// ======================================================
// SHARED: CHECK EMAIL/MOBILE VERIFICATION GATES
// ======================================================
//
// Used by BOTH login() and verifyAndLogin() so verifying one
// channel can never silently bypass a still-required check on
// the other (e.g. both settings enabled, user verifies email
// only - verifyAndLogin must still refuse to issue a session
// while mobile remains required and unverified).
// ======================================================

const checkVerificationGates = async (user) => {

    const emailVerificationRequired =
        await settingsService.getValue(
            "user",
            "email_verification_required",
            false
        );

    if (
        emailVerificationRequired === true &&
        !user.emailVerified
    ) {

        return {
            blocked: true,
            statusCode: 403,
            code: "EMAIL_NOT_VERIFIED",
            message: "Please verify your email before logging in.",
        };

    }

    const mobileVerificationRequired =
        await settingsService.getValue(
            "user",
            "mobile_verification_required",
            false
        );

    if (
        mobileVerificationRequired === true &&
        user.mobile &&
        !user.mobileVerified
    ) {

        return {
            blocked: true,
            statusCode: 403,
            code: "MOBILE_NOT_VERIFIED",
            message: "Please verify your mobile number before logging in.",
        };

    }

    return { blocked: false };

};


// ======================================================
// LOGIN
// ======================================================

exports.login = async (
    req,
    res
) => {

    try {

        const {
            identifier,
            email,
            password,
        } = req.body;

        const user =
            await findUserByCredentials(
                identifier || email,
                password
            );


        // ==================================================
        // EMAIL/MOBILE VERIFICATION REQUIRED?
        // ==================================================
        //
        // Blocked here rather than allowing a "logged in but
        // unverified" session, per policy - see
        // resendVerificationOtp/verifyAndLogin below for how
        // a user in this state gets back in without ever
        // holding a normal session first.

        const gateCheck =
            await checkVerificationGates(user);

        if (gateCheck.blocked) {

            return res.status(gateCheck.statusCode).json({

                success: false,

                message: gateCheck.message,

                code: gateCheck.code,

            });

        }


        const session =
            await issueSession(user);


        return res.json({

            success:
                true,

            ...session,

        });

    } catch (
    err
    ) {

        console.error(
            "Login Error:",
            err
        );


        return res.status(err.statusCode || 500).json({

            success:
                false,

            message:
                err.statusCode
                    ? err.message
                    : "Unable to login.",

        });

    }

};


// ======================================================
// RESEND VERIFICATION OTP (no existing session required)
// ======================================================
//
// Closes the lockout that login's EMAIL_NOT_VERIFIED gate
// would otherwise create: a user who never completed
// verification right after registering (and lost that
// session) has no other way to obtain a token for
// /api/otp/request. Re-proves identity with the password
// instead of a session.
// ======================================================

exports.resendVerificationOtp = async (
    req,
    res
) => {

    try {

        const {
            identifier,
            password,
            channel = "email",
        } = req.body;

        const user =
            await findUserByCredentials(
                identifier,
                password
            );

        const target =
            channel === "email"
                ? user.email
                : user.mobile;

        if (!target) {

            return res.status(400).json({

                success: false,

                message:
                    channel === "email"
                        ? "No email on file."
                        : "No mobile number on file.",

            });

        }

        const purpose =
            channel === "email"
                ? "verify_email"
                : "verify_mobile";

        const result =
            await otpService.requestOtp(
                user._id,
                channel,
                target,
                purpose
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

        return res.status(error.statusCode || 400).json({

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


// ======================================================
// VERIFY OTP + LOGIN (no existing session required)
// ======================================================
//
// Companion to resendVerificationOtp above - proves
// identity via password, then verifies the OTP, and only
// on both succeeding issues a real session. A user is never
// "logged in" before they're verified.
// ======================================================

exports.verifyAndLogin = async (
    req,
    res
) => {

    try {

        const {
            identifier,
            password,
            channel = "email",
            otp,
            purpose = "verify_email",
        } = req.body;

        const user =
            await findUserByCredentials(
                identifier,
                password
            );

        await otpService.verifyOtp(
            user._id,
            channel,
            otp,
            purpose
        );


        // otpService.verifyOtp updates the user document
        // directly via findByIdAndUpdate, which doesn't
        // touch this in-memory `user` - reload it so the
        // session response reflects the real, current
        // emailVerified/mobileVerified state.

        const refreshedUser =
            await User.findById(user._id).select(
                "+password"
            );

        // Re-run BOTH gates against the refreshed state -
        // verifying just the channel requested here must never
        // be enough to issue a session if the OTHER channel is
        // also required and still unverified (e.g. both
        // settings enabled, user only just verified email).

        const gateCheck =
            await checkVerificationGates(refreshedUser);

        if (gateCheck.blocked) {

            return res.status(gateCheck.statusCode).json({

                success: false,

                message: gateCheck.message,

                code: gateCheck.code,

            });

        }

        const session =
            await issueSession(refreshedUser);

        return res.json({

            success: true,

            ...session,

        });

    } catch (error) {

        return res.status(error.statusCode || 400).json({

            success: false,

            message:
                error.message ||
                "Unable to verify.",

        });

    }

};


// ======================================================
// FORGOT PASSWORD (no session required)
// ======================================================
//
// Always returns the same generic message regardless of
// whether the identifier matches a real account - never lets
// this endpoint be used to enumerate registered emails/
// usernames. Only actually sends an OTP when a match with a
// real email is found.
// ======================================================

exports.forgotPassword = async (
    req,
    res
) => {

    const GENERIC_MESSAGE =
        "If an account with that email or username exists, a password reset code has been sent to its email address.";

    try {

        const { identifier } = req.body;

        const cleanIdentifier =
            String(identifier || "").trim().toLowerCase();

        if (!cleanIdentifier) {

            return res.status(400).json({
                success: false,
                message: "Email or username is required.",
            });

        }

        const user =
            await User.findOne({
                $or: [
                    { email: cleanIdentifier },
                    { username: cleanIdentifier },
                ],
            });

        if (user && !user.isDeleted && user.email) {

            await otpService
                .requestOtp(
                    user._id,
                    "email",
                    user.email,
                    "reset_password",
                    "User"
                )
                .catch((error) => {

                    // Swallow everything (including the resend
                    // cooldown error) - surfacing a different
                    // response for "found but cooling down" vs
                    // "not found" would itself leak existence.

                    console.error(
                        "Forgot Password (User) Error:",
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
            "Forgot Password (User) Error:",
            error
        );

        // Even an unexpected error must not distinguish from
        // the normal case.

        return res.status(200).json({
            success: true,
            message: GENERIC_MESSAGE,
        });

    }

};


// ======================================================
// RESET PASSWORD (no session required)
// ======================================================

exports.resetPassword = async (
    req,
    res
) => {

    try {

        const { identifier, otp, newPassword } = req.body;

        const cleanIdentifier =
            String(identifier || "").trim().toLowerCase();

        if (!cleanIdentifier || !otp) {

            return res.status(400).json({
                success: false,
                message: "Email/username and code are required.",
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

        const user =
            await User.findOne({
                $or: [
                    { email: cleanIdentifier },
                    { username: cleanIdentifier },
                ],
            }).select("+password");

        if (!user) {

            // Same message a genuinely wrong/expired code
            // would produce - never confirms non-existence.

            return res.status(400).json({
                success: false,
                message: "Invalid or expired code.",
            });

        }

        try {

            await otpService.verifyOtp(
                user._id,
                "email",
                otp,
                "reset_password",
                "User"
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

        user.password =
            await bcrypt.hash(newPassword, 10);

        await user.save();

        await createAuditLog({
            actorType: "user",
            actorId: user._id,
            action: "user.password_reset",
            module: "auth",
            key: String(user._id),
        }).catch(() => {});

        // Best-effort confirmation email - the password has
        // already been changed successfully at this point, so
        // a delivery failure here must never undo that or fail
        // the request. Never includes the new password.

        emailTemplateService.sendTemplatedEmail(
            {
                key: "password_reset_confirmation",
                to: user.email,
                variables: {},
                fallbackSubject: "Your password has been reset",
                fallbackText: "Your password has been successfully reset. If you did not perform this action, please contact support immediately.",
            }
        );

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