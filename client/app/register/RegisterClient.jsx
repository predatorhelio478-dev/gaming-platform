"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { UserPlus, ShieldCheck } from "lucide-react";

import { registerUser, verifyOtp, requestOtp } from "../../lib/api";
import { setAuthSession } from "../../lib/useAuth";
import GuestOnly from "../../components/auth/GuestOnly";
import AuthShell, { SecurityNote } from "../../components/auth/AuthShell";
import RateLimitCountdown from "../../components/auth/RateLimitCountdown";
import useRateLimitCountdown from "../../lib/useRateLimitCountdown";

/*
 * useSearchParams() (here and inside GuestOnly) requires a
 * Suspense boundary during static prerendering.
 */
export default function RegisterPage() {

    return (
        <Suspense fallback={null}>
            <RegisterForm />
        </Suspense>
    );

}

function RegisterForm() {

    const router = useRouter();

    const searchParams = useSearchParams();

    const [step, setStep] = useState("form"); // "form" | "verify"

    const [formData, setFormData] = useState({
        fullName: "",
        username: "",
        email: "",
        mobile: "",
        password: "",
        referralCode: searchParams.get("ref") || "",
    });

    const [otp, setOtp] = useState("");

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");

    const [success, setSuccess] = useState("");

    const registerLimiter = useRateLimitCountdown("register_rate_limit");

    const resendLimiter = useRateLimitCountdown("register_otp_resend_cooldown");


    const handleChange = (event) => {

        const {
            name,
            value,
        } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

    };


    const handleSubmit = async (event) => {

        event.preventDefault();

        setError("");

        setSuccess("");


        if (
            !formData.fullName ||
            !formData.username ||
            !formData.email ||
            !formData.password
        ) {

            setError(
                "Please fill all required fields."
            );

            return;
        }


        if (formData.password.length < 6) {

            setError(
                "Password must be at least 6 characters."
            );

            return;
        }


        try {

            setLoading(true);


            const response =
                await registerUser(formData);


            const token =
                response?.token ||
                response?.data?.token;

            const user =
                response?.user ||
                response?.data?.user;


            if (!token) {

                throw new Error(
                    "Registration succeeded but no session token was returned."
                );

            }


            /*
             * Save the session immediately so the OTP
             * request/verify calls below (both auth-
             * protected) can go through.
             */

            setAuthSession(
                token,
                user
            );

            setStep("verify");

            setSuccess(
                "Account created. We've sent a verification code to your email."
            );

        } catch (error) {

            console.error(
                "Register Error:",
                error
            );

            if (
                error?.status === 429 &&
                error?.data?.retryAfterSeconds
            ) {

                registerLimiter.start(
                    error.data.retryAfterSeconds
                );

                return;

            }

            setError(
                error.message ||
                "Registration failed."
            );

        } finally {

            setLoading(false);

        }

    };


    const handleVerify = async (event) => {

        event.preventDefault();

        setError("");

        setSuccess("");


        if (!otp.trim()) {

            setError("Enter the code we emailed you.");

            return;

        }


        try {

            setLoading(true);


            await verifyOtp({
                channel: "email",
                purpose: "verify_email",
                otp: otp.trim(),
            });


            router.push("/games/color-prediction");

        } catch (error) {

            setError(
                error.message ||
                "Unable to verify code."
            );

        } finally {

            setLoading(false);

        }

    };


    const handleResend = async () => {

        if (resendLimiter.active || loading) {

            return;

        }

        setError("");

        setSuccess("");

        try {

            const result = await requestOtp({
                channel: "email",
                purpose: "verify_email",
            });

            setSuccess(result?.message || "A new code has been sent to your email.");

            resendLimiter.start(result?.resendCooldownSeconds || 60);

        } catch (error) {

            if (error?.data?.retryAfterSeconds) {

                resendLimiter.start(error.data.retryAfterSeconds);

            }

            setError(error.message || "Unable to resend code.");

        }

    };


    const handleSkipVerification = () => {

        router.push("/games/color-prediction");

    };


    if (step === "verify") {

        return (
            <AuthShell
                heading="Verify Your Email"
                subheading="One quick step to secure your account"
                cardIcon={<ShieldCheck size={17} className="text-purple-400" />}
                cardTitle="Enter verification code"
                cardDescription={`We sent a 6-digit code to ${formData.email}.`}
                error={error}
                success={success}
                bottomTextSuffix="• Secure Player Access"
                footer={
                    <button
                        type="button"
                        onClick={handleSkipVerification}
                        className="text-sm text-slate-500 transition hover:text-white hover:underline"
                    >
                        Skip for now - verify later from Settings
                    </button>
                }
            >

                <form onSubmit={handleVerify} className="space-y-5">

                    <div>
                        <label
                            htmlFor="otp"
                            className="mb-2 block text-sm font-medium text-slate-300"
                        >
                            Verification Code
                        </label>

                        <input
                            id="otp"
                            name="otp"
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
                        {loading ? "Verifying..." : "Verify Email"}
                    </button>

                    <button
                        type="button"
                        onClick={handleResend}
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
                heading="Create Account"
                subheading="Join the gaming platform"
                cardIcon={<UserPlus size={17} className="text-purple-400" />}
                cardTitle="Sign up"
                cardDescription="Fill in your details to get started."
                error={
                    registerLimiter.active
                        ? <RateLimitCountdown formatted={registerLimiter.formatted} />
                        : error
                }
                success={success}
                bottomTextSuffix="• Secure Player Access"
                footer={
                    <p className="text-sm text-slate-500">
                        Already have an account?
                        <a
                            href="/login"
                            className="ml-2 font-semibold text-purple-400 transition hover:text-purple-300 hover:underline"
                        >
                            Login
                        </a>
                    </p>
                }
            >

                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* FULL NAME + USERNAME (side-by-side on sm+) */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                        <div>
                            <label htmlFor="fullName" className="mb-2 block text-sm font-medium text-slate-300">
                                Full Name
                            </label>
                            <input
                                id="fullName"
                                name="fullName"
                                type="text"
                                value={formData.fullName}
                                onChange={handleChange}
                                placeholder="Enter your full name"
                                autoComplete="name"
                                disabled={loading}
                                className="w-full rounded-xl border border-white/[0.08] bg-[#080a14] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>

                        <div>
                            <label htmlFor="username" className="mb-2 block text-sm font-medium text-slate-300">
                                Username
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="Choose a username"
                                autoComplete="username"
                                disabled={loading}
                                className="w-full rounded-xl border border-white/[0.08] bg-[#080a14] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>

                    </div>

                    {/* EMAIL + MOBILE (side-by-side on sm+) */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                        <div>
                            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-300">
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter your email"
                                autoComplete="email"
                                disabled={loading}
                                className="w-full rounded-xl border border-white/[0.08] bg-[#080a14] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>

                        <div>
                            <label htmlFor="mobile" className="mb-2 block text-sm font-medium text-slate-300">
                                Mobile (optional)
                            </label>
                            <input
                                id="mobile"
                                name="mobile"
                                type="tel"
                                value={formData.mobile}
                                onChange={handleChange}
                                placeholder="10-digit mobile number"
                                autoComplete="tel"
                                disabled={loading}
                                className="w-full rounded-xl border border-white/[0.08] bg-[#080a14] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>

                    </div>

                    {/* PASSWORD + REFERRAL CODE (side-by-side on sm+) */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                        <div>
                            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-300">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Create a password"
                                autoComplete="new-password"
                                disabled={loading}
                                className="w-full rounded-xl border border-white/[0.08] bg-[#080a14] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>

                        <div>
                            <label htmlFor="referralCode" className="mb-2 block text-sm font-medium text-slate-300">
                                Referral Code (optional)
                            </label>
                            <input
                                id="referralCode"
                                name="referralCode"
                                type="text"
                                value={formData.referralCode}
                                onChange={handleChange}
                                placeholder="Enter a referral code"
                                autoComplete="off"
                                disabled={loading}
                                className="w-full rounded-xl border border-white/[0.08] bg-[#080a14] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>

                    </div>

                    <SecurityNote text="We'll email you a verification code after signup" />

                    <button
                        type="submit"
                        disabled={loading || registerLimiter.active}
                        className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-900/20 transition hover:from-purple-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {registerLimiter.active
                            ? `Try again in ${registerLimiter.formatted}`
                            : loading
                                ? "Creating Account..."
                                : "Create Account"}
                    </button>

                </form>

            </AuthShell>
        </GuestOnly>
    );
}
