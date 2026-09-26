"use client";

import {
    Suspense,
    useEffect,
    useState,
} from "react";

import {
    useRouter,
    useSearchParams,
} from "next/navigation";

import {
    Check,
    Eye,
    EyeOff,
    LogIn,
    ShieldCheck,
} from "lucide-react";

import {
    loginUser,
    resendVerificationOtp,
    verifyAndLogin,
} from "../../lib/api";

import { setAuthSession } from "../../lib/useAuth";

import GuestOnly
    from "../../components/auth/GuestOnly";

import AuthShell, {
    SecurityNote,
} from "../../components/auth/AuthShell";

import RateLimitCountdown
    from "../../components/auth/RateLimitCountdown";

import useRateLimitCountdown
    from "../../lib/useRateLimitCountdown";


/*
 * useSearchParams() (here and inside GuestOnly) requires a
 * Suspense boundary during static prerendering.
 */
export default function LoginPage() {

    return (
        <Suspense fallback={null}>
            <LoginForm />
        </Suspense>
    );

}


function LoginForm() {

    const router =
        useRouter();

    const searchParams =
        useSearchParams();


    const [formData, setFormData] =
        useState({
            identifier: "",
            password: "",
        });


    const [loading, setLoading] =
        useState(false);


    const [error, setError] =
        useState("");


    const [showPassword, setShowPassword] =
        useState(false);


    const [rememberMe, setRememberMe] =
        useState(false);


    // ======================================================
    // EMAIL/MOBILE-NOT-VERIFIED RECOVERY
    // ======================================================
    //
    // If login is blocked because email and/or mobile
    // verification is required and missing, switch to an
    // inline "enter code" step (via the no-session resend/
    // verify-login endpoints) instead of just showing an
    // error with no way forward. `verificationChannel` tracks
    // which one is currently being verified - if both are
    // required, verifying email can hand back a
    // MOBILE_NOT_VERIFIED response instead of a session, which
    // switches this to "mobile" and keeps the flow going
    // rather than issuing a session too early.

    const [needsVerification, setNeedsVerification] =
        useState(false);

    const [verificationChannel, setVerificationChannel] =
        useState("email");

    const [otp, setOtp] =
        useState("");

    const [success, setSuccess] =
        useState("");

    const loginLimiter =
        useRateLimitCountdown("login_rate_limit");

    const resendLimiter =
        useRateLimitCountdown("login_otp_resend_cooldown");


    // ======================================================
    // RETURN URL
    // ======================================================

    const getRedirectPath =
        () => {

            const redirect =
                searchParams.get(
                    "redirect"
                );


            /*
             * Only allow internal
             * application paths.
             */

            if (
                redirect &&
                redirect.startsWith("/") &&
                !redirect.startsWith("//") &&
                redirect !== "/login" &&
                redirect !== "/register"
            ) {

                return redirect;

            }


            /*
             * Default user page.
             */

            return "/games/color-prediction";

        };


    // ======================================================
    // ALREADY LOGGED IN
    // ======================================================

    useEffect(() => {

        const token =
            localStorage.getItem(
                "token"
            );


        if (!token) {

            return;

        }


        /*
         * Already logged in.
         *
         * Do not show login page.
         */

        router.replace(
            getRedirectPath()
        );

    }, [
        router,
        searchParams,
    ]);


    // ======================================================
    // HANDLE INPUT
    // ======================================================

    const handleChange =
        (event) => {

            const {
                name,
                value,
            } = event.target;


            setFormData(
                (previous) => ({

                    ...previous,

                    [name]:
                        value,

                })
            );


            if (error) {

                setError("");

            }

        };


    // ======================================================
    // LOGIN
    // ======================================================

    const handleSubmit =
        async (
            event
        ) => {

            event.preventDefault();

            setError("");


            /*
             * Validation
             */

            if (
                !formData.identifier.trim() ||
                !formData.password
            ) {

                setError(
                    "Username/email and password are required."
                );

                return;

            }


            try {

                setLoading(
                    true
                );


                const response =
                    await loginUser({

                        identifier:
                            formData.identifier.trim(),

                        password:
                            formData.password,

                        rememberMe,

                    });


                console.log(
                    "Login Response:",
                    response
                );


                // ==================================================
                // GET TOKEN
                // ==================================================

                const token =
                    response?.token ||
                    response?.data?.token ||
                    response?.accessToken ||
                    response?.data?.accessToken;


                if (!token) {

                    throw new Error(
                        "Login successful but token was not received."
                    );

                }


                // ==================================================
                // SAVE SESSION
                // ==================================================

                const user =
                    response?.user ||
                    response?.data?.user;


                setAuthSession(
                    token,
                    user
                );


                // ==================================================
                // REDIRECT
                // ==================================================

                const redirectPath =
                    getRedirectPath();


                router.replace(
                    redirectPath
                );


            } catch (
            loginError
            ) {

                console.error(
                    "Login Error:",
                    loginError
                );


                const verificationCode =
                    loginError?.data?.code;

                if (
                    verificationCode === "EMAIL_NOT_VERIFIED" ||
                    verificationCode === "MOBILE_NOT_VERIFIED"
                ) {

                    const channel =
                        verificationCode === "EMAIL_NOT_VERIFIED"
                            ? "email"
                            : "mobile";

                    setVerificationChannel(channel);

                    setNeedsVerification(true);

                    setError("");

                    setSuccess(
                        `Please verify your ${channel === "email" ? "email" : "mobile number"} to continue - enter the code we sent, or request a new one.`
                    );

                    return;

                }


                if (
                    loginError?.status === 429 &&
                    loginError?.data?.retryAfterSeconds
                ) {

                    loginLimiter.start(
                        loginError.data.retryAfterSeconds
                    );

                    return;

                }


                setError(
                    loginError?.message ||
                    "Unable to login."
                );

            } finally {

                setLoading(
                    false
                );

            }

        };


    // ======================================================
    // VERIFY + LOGIN (recovery path)
    // ======================================================

    const handleVerifyAndLogin =
        async (event) => {

            event.preventDefault();

            setError("");

            setSuccess("");


            if (!otp.trim()) {

                setError(
                    `Enter the code we sent to your ${verificationChannel === "email" ? "email" : "mobile number"}.`
                );

                return;

            }


            try {

                setLoading(true);


                const response =
                    await verifyAndLogin({

                        identifier:
                            formData.identifier.trim(),

                        password:
                            formData.password,

                        channel: verificationChannel,

                        otp: otp.trim(),

                        purpose:
                            verificationChannel === "email"
                                ? "verify_email"
                                : "verify_mobile",

                        rememberMe,

                    });


                const token =
                    response?.token;

                const user =
                    response?.user;


                if (!token) {

                    throw new Error(
                        "Verification succeeded but no session token was returned."
                    );

                }


                setAuthSession(token, user);


                router.replace(
                    getRedirectPath()
                );

            } catch (verifyError) {

                // Both email and mobile verification can be
                // required at once - successfully verifying
                // this channel can still come back blocked on
                // the OTHER one instead of a session. Chain
                // straight into that next step rather than
                // treating it as a dead-end error.

                const nextCode =
                    verifyError?.data?.code;

                if (
                    nextCode === "MOBILE_NOT_VERIFIED" &&
                    verificationChannel !== "mobile"
                ) {

                    setVerificationChannel("mobile");

                    setOtp("");

                    setSuccess(
                        "Email verified! Now enter the code sent to your mobile number, or request a new one."
                    );

                    return;

                }

                if (
                    nextCode === "EMAIL_NOT_VERIFIED" &&
                    verificationChannel !== "email"
                ) {

                    setVerificationChannel("email");

                    setOtp("");

                    setSuccess(
                        "Mobile verified! Now enter the code sent to your email, or request a new one."
                    );

                    return;

                }

                setError(
                    verifyError?.message ||
                    "Unable to verify code."
                );

            } finally {

                setLoading(false);

            }

        };


    const handleResendVerification =
        async () => {

            if (resendLimiter.active || loading) {

                return;

            }

            setError("");

            setSuccess("");


            try {

                const result =
                    await resendVerificationOtp({

                        identifier:
                            formData.identifier.trim(),

                        password:
                            formData.password,

                        channel: verificationChannel,

                    });


                setSuccess(
                    result?.message ||
                    `A new code has been sent to your ${verificationChannel === "email" ? "email" : "mobile number"}.`
                );


                resendLimiter.start(
                    result?.resendCooldownSeconds || 60
                );

            } catch (resendError) {

                if (resendError?.data?.retryAfterSeconds) {

                    resendLimiter.start(
                        resendError.data.retryAfterSeconds
                    );

                }

                setError(
                    resendError?.message ||
                    "Unable to resend code."
                );

            }

        };


    if (needsVerification) {

        return (

            <AuthShell
                heading={verificationChannel === "email" ? "Verify Your Email" : "Verify Your Mobile Number"}
                subheading="One quick step to continue"
                cardIcon={<ShieldCheck size={17} className="text-purple-400" />}
                cardTitle="Enter verification code"
                cardDescription={`We sent a 6-digit code to your ${verificationChannel === "email" ? "email" : "mobile number"}.`}
                error={error}
                success={success}
                bottomTextSuffix="• Secure Player Access"
                footer={
                    <button
                        type="button"
                        onClick={() => {

                            setNeedsVerification(false);

                            setVerificationChannel("email");

                            setError("");

                            setSuccess("");

                        }}
                        className="text-sm text-slate-500 transition hover:text-white hover:underline"
                    >
                        Back to login
                    </button>
                }
            >

                <form onSubmit={handleVerifyAndLogin} className="space-y-5">

                    <div>
                        <label
                            htmlFor="login-otp"
                            className="mb-2 block text-sm font-medium text-slate-300"
                        >
                            Verification Code
                        </label>

                        <input
                            id="login-otp"
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={otp}
                            onChange={(event) => setOtp(event.target.value)}
                            placeholder="000000"
                            disabled={loading}
                            autoFocus
                            className="w-full rounded-xl border border-white/[0.08] bg-[#080a14] px-4 py-3.5 text-center text-2xl tracking-[0.5em] text-white outline-none transition placeholder:text-slate-500 focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-900/20 transition hover:from-purple-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading ? "Verifying..." : "Verify & Sign In"}
                    </button>

                    <button
                        type="button"
                        onClick={handleResendVerification}
                        disabled={resendLimiter.active || loading}
                        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-xs font-semibold text-slate-400 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {resendLimiter.active
                            ? `Resend code in ${resendLimiter.formatted}`
                            : "Resend code"}
                    </button>

                </form>

            </AuthShell>

        );

    }


    return (

        <GuestOnly>

            <AuthShell
                heading="Welcome Back"
                subheading="Sign in to continue playing"
                cardIcon={<LogIn size={17} className="text-purple-400" />}
                cardTitle="Sign in"
                cardDescription="Enter your account credentials to continue."
                error={
                    loginLimiter.active
                        ? <RateLimitCountdown formatted={loginLimiter.formatted} />
                        : error
                }
                bottomTextSuffix="• Secure Player Access"
                footer={
                    <p className="text-sm text-slate-500">
                        Don&apos;t have an account?
                        <a
                            href="/register"
                            className="ml-2 font-semibold text-purple-400 transition hover:text-purple-300 hover:underline"
                        >
                            Create Account
                        </a>
                    </p>
                }
            >

                <form
                    onSubmit={
                        handleSubmit
                    }
                    className="space-y-5"
                >


                    {/* =================================================
                        USERNAME OR EMAIL
                    ================================================= */}

                    <div>

                        <label
                            htmlFor="identifier"
                            className="mb-2 block text-sm font-medium text-slate-300"
                        >
                            Username or Email
                        </label>


                        <input
                            id="identifier"
                            name="identifier"
                            type="text"
                            value={
                                formData.identifier
                            }
                            onChange={
                                handleChange
                            }
                            placeholder="Enter your username or email"
                            autoComplete="username"
                            disabled={
                                loading
                            }
                            className="w-full rounded-xl border border-white/[0.08] bg-[#080a14] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                        />

                    </div>


                    {/* =================================================
                        PASSWORD
                    ================================================= */}

                    <div>

                        <label
                            htmlFor="password"
                            className="mb-2 block text-sm font-medium text-slate-300"
                        >
                            Password
                        </label>


                        <div className="relative">

                            <input
                                id="password"
                                name="password"
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                value={
                                    formData.password
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                disabled={
                                    loading
                                }
                                className="w-full rounded-xl border border-white/[0.08] bg-[#080a14] px-4 py-3.5 pr-20 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                            />


                            <button
                                type="button"
                                onClick={() =>
                                    setShowPassword(
                                        (previous) =>
                                            !previous
                                    )
                                }
                                disabled={
                                    loading
                                }
                                className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5 px-2 text-xs font-semibold text-slate-500 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                            >

                                {showPassword ? (

                                    <EyeOff
                                        size={15}
                                    />

                                ) : (

                                    <Eye
                                        size={15}
                                    />

                                )}

                                {showPassword
                                    ? "Hide"
                                    : "Show"
                                }

                            </button>

                        </div>

                    </div>


                    <div className="-mt-2 flex items-center justify-between">

                        <label className="group flex items-center gap-2 text-xs font-medium text-slate-400 transition-colors select-none hover:text-slate-300">
                            <span className="relative flex h-4 w-4 shrink-0 items-center justify-center">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(event) => setRememberMe(event.target.checked)}
                                    disabled={loading}
                                    className="peer absolute inset-0 h-4 w-4 cursor-pointer appearance-none rounded-md border border-white/15 bg-[#080a14] transition-all duration-150 checked:border-purple-500 checked:bg-purple-600 group-hover:border-white/30 focus-visible:ring-2 focus-visible:ring-purple-500/40 focus-visible:ring-offset-1 focus-visible:ring-offset-[#080a14] disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                <Check
                                    size={11}
                                    strokeWidth={3}
                                    className="pointer-events-none relative z-10 scale-75 text-white opacity-0 transition-all duration-150 peer-checked:scale-100 peer-checked:opacity-100"
                                />
                            </span>
                            Remember me
                        </label>

                        <a
                            href="/forgot-password"
                            className="text-xs font-semibold text-purple-400 transition hover:text-purple-300 hover:underline"
                        >
                            Forgot password?
                        </a>
                    </div>


                    <SecurityNote />


                    {/* =================================================
                        LOGIN BUTTON
                    ================================================= */}

                    <button
                        type="submit"
                        disabled={
                            loading ||
                            loginLimiter.active
                        }
                        className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-900/20 transition hover:from-purple-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >

                        {loginLimiter.active ? (

                            <span>Try again in {loginLimiter.formatted}</span>

                        ) : loading ? (

                            <span className="flex items-center justify-center gap-2">

                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                                Signing in...

                            </span>

                        ) : (

                            <span className="flex items-center justify-center gap-2">

                                <LogIn
                                    size={16}
                                />

                                Sign in to Gaming Platform

                            </span>

                        )}

                    </button>

                </form>

            </AuthShell>

        </GuestOnly>

    );

}
