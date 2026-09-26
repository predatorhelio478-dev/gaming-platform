"use client";

import {
    Suspense,
    useState,
} from "react";

import { useRouter } from "next/navigation";

import {
    Eye,
    EyeOff,
    KeyRound,
    Mail,
} from "lucide-react";

import {
    adminForgotPassword,
    adminResetPassword,
} from "../../../lib/adminApi";

import AuthShell
    from "../../../components/auth/AuthShell";


export default function AdminForgotPasswordPage() {

    return (
        <Suspense fallback={null}>
            <AdminForgotPasswordForm />
        </Suspense>
    );

}


function AdminForgotPasswordForm() {

    const router =
        useRouter();


    const [step, setStep] =
        useState("request");


    const [username, setUsername] =
        useState("");


    const [otp, setOtp] =
        useState("");


    const [newPassword, setNewPassword] =
        useState("");


    const [showPassword, setShowPassword] =
        useState(false);


    const [loading, setLoading] =
        useState(false);


    const [error, setError] =
        useState("");


    const [success, setSuccess] =
        useState("");


    const [resetComplete, setResetComplete] =
        useState(false);


    // ======================================================
    // STEP 1 - REQUEST CODE
    // ======================================================

    const handleRequestCode =
        async (event) => {

            event.preventDefault();

            setError("");

            setSuccess("");


            if (!username.trim()) {

                setError(
                    "Enter your admin username."
                );

                return;

            }


            try {

                setLoading(true);


                const response =
                    await adminForgotPassword(
                        username.trim()
                    );


                setSuccess(
                    response?.message ||
                    "If an account exists, a reset code has been sent to its registered email."
                );

                setStep("reset");

            } catch (requestError) {

                setError(
                    requestError?.message ||
                    "Unable to send reset code."
                );

            } finally {

                setLoading(false);

            }

        };


    // ======================================================
    // STEP 2 - RESET PASSWORD
    // ======================================================

    const handleResetPassword =
        async (event) => {

            event.preventDefault();

            setError("");

            setSuccess("");


            if (!otp.trim()) {

                setError(
                    "Enter the code sent to your email."
                );

                return;

            }


            if (!newPassword || newPassword.length < 6) {

                setError(
                    "New password must be at least 6 characters."
                );

                return;

            }


            try {

                setLoading(true);


                await adminResetPassword({

                    username:
                        username.trim(),

                    otp:
                        otp.trim(),

                    newPassword,

                });


                setSuccess(
                    "Password reset successfully. You can now login with your new password."
                );

                setResetComplete(true);

                setTimeout(() => {

                    router.replace("/admin/login");

                }, 2500);

                return;

            } catch (resetError) {

                setError(
                    resetError?.message ||
                    "Invalid or expired code."
                );

            } finally {

                setLoading(false);

            }

        };


    if (step === "reset") {

        return (

            <AuthShell
                heading="Reset Admin Password"
                subheading="Enter the code we emailed you"
                cardIcon={<KeyRound size={17} className="text-purple-400" />}
                cardTitle="Enter code & new password"
                cardDescription="Check your email for the 6-digit reset code."
                error={error}
                success={success}
                bottomTextSuffix="Administration"
                footer={
                    resetComplete ? null : (
                        <button
                            type="button"
                            onClick={() => {

                                setStep("request");

                                setOtp("");

                                setNewPassword("");

                                setError("");

                                setSuccess("");

                            }}
                            className="text-sm text-slate-500 transition hover:text-white hover:underline"
                        >
                            Use a different account
                        </button>
                    )
                }
            >

                <form onSubmit={handleResetPassword} className="space-y-5">

                    <div>
                        <label
                            htmlFor="admin-reset-otp"
                            className="mb-2 block text-sm font-medium text-slate-300"
                        >
                            Reset Code
                        </label>

                        <input
                            id="admin-reset-otp"
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={otp}
                            onChange={(event) => setOtp(event.target.value)}
                            placeholder="000000"
                            disabled={loading || resetComplete}
                            autoFocus
                            className="w-full rounded-xl border border-white/[0.08] bg-[#080a14] px-4 py-3.5 text-center text-2xl tracking-[0.5em] text-white outline-none transition placeholder:text-slate-500 focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="admin-reset-new-password"
                            className="mb-2 block text-sm font-medium text-slate-300"
                        >
                            New Password
                        </label>

                        <div className="relative">

                            <input
                                id="admin-reset-new-password"
                                type={showPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(event) => setNewPassword(event.target.value)}
                                placeholder="Enter new password"
                                autoComplete="new-password"
                                disabled={loading || resetComplete}
                                className="w-full rounded-xl border border-white/[0.08] bg-[#080a14] px-4 py-3.5 pr-20 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword((previous) => !previous)}
                                disabled={loading || resetComplete}
                                className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5 px-2 text-xs font-semibold text-slate-500 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                {showPassword ? "Hide" : "Show"}
                            </button>

                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || resetComplete}
                        className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-900/20 transition hover:from-purple-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {resetComplete
                            ? "Redirecting to login..."
                            : loading
                                ? "Resetting..."
                                : "Reset Password"}
                    </button>

                    {!resetComplete && (

                        <button
                            type="button"
                            onClick={handleRequestCode}
                            disabled={loading}
                            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-xs font-semibold text-slate-400 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Resend code
                        </button>

                    )}

                </form>

            </AuthShell>

        );

    }


    return (

        <AuthShell
            heading="Forgot Admin Password"
            subheading="We'll email you a reset code"
            cardIcon={<Mail size={17} className="text-purple-400" />}
            cardTitle="Enter your admin username"
            cardDescription="Enter your admin username and we'll send a reset code if an account exists."
            error={error}
            success={success}
            bottomTextSuffix="Administration"
            footer={
                <p className="text-sm text-slate-500">
                    Remembered your password?
                    <a
                        href="/admin/login"
                        className="ml-2 font-semibold text-purple-400 transition hover:text-purple-300 hover:underline"
                    >
                        Back to Login
                    </a>
                </p>
            }
        >

            <form onSubmit={handleRequestCode} className="space-y-5">

                <div>
                    <label
                        htmlFor="admin-forgot-username"
                        className="mb-2 block text-sm font-medium text-slate-300"
                    >
                        Admin Username
                    </label>

                    <input
                        id="admin-forgot-username"
                        type="text"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        placeholder="Enter your admin username"
                        autoComplete="username"
                        disabled={loading}
                        autoFocus
                        className="w-full rounded-xl border border-white/[0.08] bg-[#080a14] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-900/20 transition hover:from-purple-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading ? "Sending..." : "Send Reset Code"}
                </button>

            </form>

        </AuthShell>

    );

}
