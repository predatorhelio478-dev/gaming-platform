"use client";

import { useEffect, useState } from "react";
import { UserRound, Mail, Phone, ShieldCheck } from "lucide-react";

import AdminHeader from "../../../components/admin/AdminHeader";
import AdminPageHeader from "../../../components/admin/ui/AdminPageHeader";
import { maskEmail, maskPhone } from "../../../lib/mask";
import {
    getCurrentAdmin,
    requestAdminOtp,
    verifyAdminOtp,
} from "../../../lib/adminApi";

// ======================================================
// ADMIN / SUPER ADMIN - MY PROFILE
// ======================================================
//
// Self-service email/mobile verification for the currently
// logged-in admin account, mirroring the User Settings page's
// Verify Email/Verify Phone pattern exactly (see
// client/app/settings/SettingsClient.jsx) but backed by the
// admin-scoped /api/admin/otp/* endpoints (adminOtpController,
// actorModel: "Admin"). Any admin role can verify their OWN
// account - this is not a role-gated management action.

function VerifiedBadge({ verified }) {
    return verified ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
            <ShieldCheck size={11} /> Verified
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
            Not verified
        </span>
    );
}

export default function AdminProfileClient() {

    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    const refreshAdmin = (patch) => {
        setAdmin((current) => {
            const updated = { ...current, ...patch };

            try {
                localStorage.setItem("admin", JSON.stringify(updated));
            } catch {
                // localStorage unavailable - not critical, in-memory state still updates.
            }

            return updated;
        });
    };

    useEffect(() => {
        (async () => {
            try {
                const response = await getCurrentAdmin();
                setAdmin(response?.admin || null);
            } catch (err) {
                setLoadError(err.message || "Unable to load your profile.");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // ==================================================
    // VERIFY EMAIL
    // ==================================================

    const [verifyEmailStep, setVerifyEmailStep] = useState("idle"); // idle | otp
    const [verifyEmailOtp, setVerifyEmailOtp] = useState("");
    const [verifyEmailBusy, setVerifyEmailBusy] = useState(false);
    const [verifyEmailMessage, setVerifyEmailMessage] = useState("");
    const [verifyEmailError, setVerifyEmailError] = useState("");

    const handleStartVerifyEmail = async () => {
        setVerifyEmailMessage("");
        setVerifyEmailError("");

        try {
            setVerifyEmailBusy(true);
            const result = await requestAdminOtp({ channel: "email", purpose: "verify_email" });
            setVerifyEmailStep("otp");
            setVerifyEmailMessage(result?.message || "OTP sent to your email.");
        } catch (err) {
            setVerifyEmailError(err.message || "Unable to send verification code.");
        } finally {
            setVerifyEmailBusy(false);
        }
    };

    const handleConfirmVerifyEmail = async (event) => {
        event.preventDefault();
        setVerifyEmailMessage("");
        setVerifyEmailError("");

        try {
            setVerifyEmailBusy(true);
            await verifyAdminOtp({ channel: "email", otp: verifyEmailOtp, purpose: "verify_email" });
            refreshAdmin({ emailVerified: true });
            setVerifyEmailStep("idle");
            setVerifyEmailOtp("");
            setVerifyEmailMessage("Email verified successfully.");
        } catch (err) {
            setVerifyEmailError(err.message || "Unable to verify code.");
        } finally {
            setVerifyEmailBusy(false);
        }
    };

    // ==================================================
    // VERIFY MOBILE
    // ==================================================

    const [verifyMobileStep, setVerifyMobileStep] = useState("idle");
    const [verifyMobileOtp, setVerifyMobileOtp] = useState("");
    const [verifyMobileBusy, setVerifyMobileBusy] = useState(false);
    const [verifyMobileMessage, setVerifyMobileMessage] = useState("");
    const [verifyMobileError, setVerifyMobileError] = useState("");

    const handleStartVerifyMobile = async () => {
        setVerifyMobileMessage("");
        setVerifyMobileError("");

        try {
            setVerifyMobileBusy(true);
            const result = await requestAdminOtp({ channel: "mobile", purpose: "verify_mobile" });
            setVerifyMobileStep("otp");
            setVerifyMobileMessage(result?.message || "OTP sent to your mobile.");
        } catch (err) {
            setVerifyMobileError(err.message || "Unable to send verification code.");
        } finally {
            setVerifyMobileBusy(false);
        }
    };

    const handleConfirmVerifyMobile = async (event) => {
        event.preventDefault();
        setVerifyMobileMessage("");
        setVerifyMobileError("");

        try {
            setVerifyMobileBusy(true);
            await verifyAdminOtp({ channel: "mobile", otp: verifyMobileOtp, purpose: "verify_mobile" });
            refreshAdmin({ phoneVerified: true });
            setVerifyMobileStep("idle");
            setVerifyMobileOtp("");
            setVerifyMobileMessage("Mobile number verified successfully.");
        } catch (err) {
            setVerifyMobileError(err.message || "Unable to verify code.");
        } finally {
            setVerifyMobileBusy(false);
        }
    };

    const inputClass =
        "w-full rounded-xl border border-white/10 bg-[#050a19] px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-500/60 disabled:opacity-50";

    return (
        <main className="min-h-screen bg-[#070914] text-white">

            <AdminHeader title="My Profile" subtitle="Account & Verification" showSocketStatus={false} />

            <div className="p-4 sm:p-6 lg:p-8">

                <AdminPageHeader
                    icon={UserRound}
                    eyebrow="Account"
                    title="My Profile"
                    description="View your account details and verify your email/mobile number."
                />

                {loadError && (
                    <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                        {loadError}
                    </div>
                )}

                {loading ? (
                    <div className="mt-6 text-sm text-slate-500">Loading...</div>
                ) : (
                    <div className="mx-auto mt-6 max-w-2xl space-y-6">

                        {/* ACCOUNT */}
                        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3">
                            <div className="flex items-center gap-2 text-sm font-bold text-white">
                                <UserRound size={16} className="text-violet-300" /> Account
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-slate-400">Username</label>
                                <input type="text" value={admin?.username || ""} disabled className={inputClass} />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-slate-400">Full Name</label>
                                <input type="text" value={admin?.name || ""} disabled className={inputClass} />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-slate-400">Role</label>
                                <input type="text" value={admin?.role || ""} disabled className={inputClass} />
                            </div>

                            <p className="text-xs text-slate-500">
                                To change your username, email, mobile number, or password, contact a Super Admin.
                            </p>
                        </div>

                        {/* EMAIL */}
                        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm font-bold text-white">
                                    <Mail size={16} className="text-violet-300" /> Email
                                </div>
                                <VerifiedBadge verified={admin?.emailVerified} />
                            </div>

                            <p className="text-sm text-slate-400">{maskEmail(admin?.email)}</p>

                            {!admin?.emailVerified && (
                                <div className="space-y-3 rounded-lg border border-amber-500/10 bg-amber-500/5 p-3">
                                    {verifyEmailError && <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{verifyEmailError}</div>}
                                    {verifyEmailMessage && <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">{verifyEmailMessage}</div>}

                                    {verifyEmailStep === "idle" && (
                                        <button type="button" onClick={handleStartVerifyEmail} disabled={verifyEmailBusy} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50">
                                            {verifyEmailBusy ? "Sending..." : "Verify Email"}
                                        </button>
                                    )}

                                    {verifyEmailStep === "otp" && (
                                        <form onSubmit={handleConfirmVerifyEmail} className="flex gap-2">
                                            <input type="text" placeholder="6-digit code" value={verifyEmailOtp} onChange={(e) => setVerifyEmailOtp(e.target.value)} disabled={verifyEmailBusy} className={inputClass} />
                                            <button type="submit" disabled={verifyEmailBusy} className="whitespace-nowrap rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50">
                                                {verifyEmailBusy ? "Verifying..." : "Confirm"}
                                            </button>
                                        </form>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* MOBILE */}
                        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm font-bold text-white">
                                    <Phone size={16} className="text-violet-300" /> Mobile
                                </div>
                                <VerifiedBadge verified={admin?.phoneVerified} />
                            </div>

                            <p className="text-sm text-slate-400">{admin?.mobile ? maskPhone(admin.mobile) : "Not set"}</p>

                            {admin?.mobile && !admin?.phoneVerified && (
                                <div className="space-y-3 rounded-lg border border-amber-500/10 bg-amber-500/5 p-3">
                                    {verifyMobileError && <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{verifyMobileError}</div>}
                                    {verifyMobileMessage && <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">{verifyMobileMessage}</div>}

                                    {verifyMobileStep === "idle" && (
                                        <button type="button" onClick={handleStartVerifyMobile} disabled={verifyMobileBusy} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50">
                                            {verifyMobileBusy ? "Sending..." : "Verify Phone"}
                                        </button>
                                    )}

                                    {verifyMobileStep === "otp" && (
                                        <form onSubmit={handleConfirmVerifyMobile} className="flex gap-2">
                                            <input type="text" placeholder="6-digit code" value={verifyMobileOtp} onChange={(e) => setVerifyMobileOtp(e.target.value)} disabled={verifyMobileBusy} className={inputClass} />
                                            <button type="submit" disabled={verifyMobileBusy} className="whitespace-nowrap rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50">
                                                {verifyMobileBusy ? "Verifying..." : "Confirm"}
                                            </button>
                                        </form>
                                    )}

                                    {!admin?.mobile && (
                                        <p className="text-xs text-slate-500">Ask a Super Admin to add a mobile number to your account first.</p>
                                    )}
                                </div>
                            )}
                        </div>

                    </div>
                )}

            </div>

        </main>
    );
}
