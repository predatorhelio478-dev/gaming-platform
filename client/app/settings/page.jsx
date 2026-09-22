"use client";

import { useState } from "react";
import { UserRound, Mail, Phone, ShieldCheck, KeyRound, Bell } from "lucide-react";

import UserLayout from "../../components/user/UserLayout";
import UserPageHeader from "../../components/user/UserPageHeader";
import useAuth, { setAuthSession, getStoredToken } from "../../lib/useAuth";
import {
    updateMyProfile,
    requestEmailChange,
    requestMobileChange,
    changeMyPassword,
    verifyOtp,
} from "../../lib/api";

// ======================================================
// USER SETTINGS PAGE - real edit forms
// ======================================================
//
// Username is NEVER editable here - it is permanently
// immutable by design. Email/mobile changes require the
// current password AND a fresh OTP sent to the new
// destination before the change actually applies.

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

export default function UserSettingsPage() {

    const auth = useAuth();
    const user = auth.user;

    const refreshUser = (patch) => {
        const updated = { ...user, ...patch };
        setAuthSession(getStoredToken(), updated);
    };

    // ==================================================
    // PROFILE (name + notification prefs)
    // ==================================================

    const [fullName, setFullName] = useState(user?.fullName || "");
    const [notifyEmail, setNotifyEmail] = useState(user?.notificationPreferences?.email ?? true);
    const [notifySms, setNotifySms] = useState(user?.notificationPreferences?.sms ?? true);
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileMessage, setProfileMessage] = useState("");
    const [profileError, setProfileError] = useState("");

    const handleProfileSave = async (event) => {
        event.preventDefault();
        setProfileMessage("");
        setProfileError("");

        try {
            setProfileSaving(true);
            const response = await updateMyProfile({
                fullName,
                notificationPreferences: { email: notifyEmail, sms: notifySms },
            });
            refreshUser(response.user);
            setProfileMessage("Profile updated.");
        } catch (err) {
            setProfileError(err.message || "Unable to update profile.");
        } finally {
            setProfileSaving(false);
        }
    };

    // ==================================================
    // EMAIL CHANGE
    // ==================================================

    const [emailStep, setEmailStep] = useState("idle"); // idle | form | otp
    const [newEmail, setNewEmail] = useState("");
    const [emailPassword, setEmailPassword] = useState("");
    const [emailOtp, setEmailOtp] = useState("");
    const [emailBusy, setEmailBusy] = useState(false);
    const [emailMessage, setEmailMessage] = useState("");
    const [emailError, setEmailError] = useState("");

    const handleRequestEmailChange = async (event) => {
        event.preventDefault();
        setEmailMessage("");
        setEmailError("");

        try {
            setEmailBusy(true);
            await requestEmailChange({ newEmail, password: emailPassword });
            setEmailStep("otp");
            setEmailMessage("Verification code sent to your new email.");
        } catch (err) {
            setEmailError(err.message || "Unable to send verification code.");
        } finally {
            setEmailBusy(false);
        }
    };

    const handleVerifyEmailChange = async (event) => {
        event.preventDefault();
        setEmailMessage("");
        setEmailError("");

        try {
            setEmailBusy(true);
            const result = await verifyOtp({ channel: "email", otp: emailOtp, purpose: "change_email" });
            refreshUser({ email: result.target, emailVerified: true });
            setEmailStep("idle");
            setNewEmail("");
            setEmailPassword("");
            setEmailOtp("");
            setEmailMessage("Email updated and verified.");
        } catch (err) {
            setEmailError(err.message || "Unable to verify code.");
        } finally {
            setEmailBusy(false);
        }
    };

    // ==================================================
    // MOBILE CHANGE
    // ==================================================

    const [mobileStep, setMobileStep] = useState("idle");
    const [newMobile, setNewMobile] = useState("");
    const [mobilePassword, setMobilePassword] = useState("");
    const [mobileOtp, setMobileOtp] = useState("");
    const [mobileBusy, setMobileBusy] = useState(false);
    const [mobileMessage, setMobileMessage] = useState("");
    const [mobileError, setMobileError] = useState("");

    const handleRequestMobileChange = async (event) => {
        event.preventDefault();
        setMobileMessage("");
        setMobileError("");

        try {
            setMobileBusy(true);
            await requestMobileChange({ newMobile, password: mobilePassword });
            setMobileStep("otp");
            setMobileMessage("Verification code sent to your new mobile number.");
        } catch (err) {
            setMobileError(err.message || "Unable to send verification code.");
        } finally {
            setMobileBusy(false);
        }
    };

    const handleVerifyMobileChange = async (event) => {
        event.preventDefault();
        setMobileMessage("");
        setMobileError("");

        try {
            setMobileBusy(true);
            const result = await verifyOtp({ channel: "mobile", otp: mobileOtp, purpose: "change_mobile" });
            refreshUser({ mobile: result.target, mobileVerified: true });
            setMobileStep("idle");
            setNewMobile("");
            setMobilePassword("");
            setMobileOtp("");
            setMobileMessage("Mobile number updated and verified.");
        } catch (err) {
            setMobileError(err.message || "Unable to verify code.");
        } finally {
            setMobileBusy(false);
        }
    };

    // ==================================================
    // PASSWORD CHANGE
    // ==================================================

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordBusy, setPasswordBusy] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState("");
    const [passwordError, setPasswordError] = useState("");

    const handleChangePassword = async (event) => {
        event.preventDefault();
        setPasswordMessage("");
        setPasswordError("");

        if (newPassword !== confirmPassword) {
            setPasswordError("New passwords do not match.");
            return;
        }

        try {
            setPasswordBusy(true);
            await changeMyPassword({ currentPassword, newPassword });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setPasswordMessage("Password changed successfully.");
        } catch (err) {
            setPasswordError(err.message || "Unable to change password.");
        } finally {
            setPasswordBusy(false);
        }
    };

    const inputClass =
        "w-full rounded-xl border border-white/10 bg-[#050a19] px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-500/60 disabled:opacity-50";

    return (
        <UserLayout title="Settings">
            <div className="p-4 sm:p-6 lg:p-8">

                <UserPageHeader
                    icon={UserRound}
                    eyebrow="Account"
                    title="Account Settings"
                    description="Manage your profile, verification, and security."
                />

              <div className="mx-auto max-w-2xl space-y-6">

                {/* PROFILE */}
                <form onSubmit={handleProfileSave} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                        <UserRound size={16} className="text-violet-300" /> Profile
                    </div>

                    {profileError && <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{profileError}</div>}
                    {profileMessage && <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">{profileMessage}</div>}

                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-slate-400">Username (permanent)</label>
                        <input type="text" value={user?.username || ""} disabled className={inputClass} />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-slate-400">Full Name</label>
                        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={profileSaving} className={inputClass} />
                    </div>

                    <div className="flex items-center gap-2 pt-1 text-xs font-bold text-slate-400">
                        <Bell size={13} /> Notification Preferences
                    </div>

                    <label className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300">
                        Email notifications
                        <input type="checkbox" checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.checked)} disabled={profileSaving} />
                    </label>

                    <label className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300">
                        SMS notifications
                        <input type="checkbox" checked={notifySms} onChange={(e) => setNotifySms(e.target.checked)} disabled={profileSaving} />
                    </label>

                    <button type="submit" disabled={profileSaving} className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-50">
                        {profileSaving ? "Saving..." : "Save Profile"}
                    </button>
                </form>

                {/* EMAIL */}
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-bold text-white">
                            <Mail size={16} className="text-violet-300" /> Email
                        </div>
                        <VerifiedBadge verified={user?.emailVerified} />
                    </div>

                    <p className="text-sm text-slate-400">{user?.email}</p>

                    {emailError && <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{emailError}</div>}
                    {emailMessage && <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">{emailMessage}</div>}

                    {emailStep === "idle" && (
                        <button type="button" onClick={() => setEmailStep("form")} className="text-xs font-bold text-violet-400 hover:underline">
                            Change email
                        </button>
                    )}

                    {emailStep === "form" && (
                        <form onSubmit={handleRequestEmailChange} className="space-y-3">
                            <input type="email" placeholder="New email address" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} disabled={emailBusy} className={inputClass} />
                            <input type="password" placeholder="Current password" value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} disabled={emailBusy} className={inputClass} />
                            <div className="flex gap-2">
                                <button type="submit" disabled={emailBusy} className="flex-1 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-500 disabled:opacity-50">
                                    {emailBusy ? "Sending..." : "Send Code"}
                                </button>
                                <button type="button" onClick={() => setEmailStep("idle")} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-400 hover:text-white">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}

                    {emailStep === "otp" && (
                        <form onSubmit={handleVerifyEmailChange} className="space-y-3">
                            <input type="text" placeholder="6-digit code" value={emailOtp} onChange={(e) => setEmailOtp(e.target.value)} disabled={emailBusy} className={inputClass} />
                            <button type="submit" disabled={emailBusy} className="w-full rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-500 disabled:opacity-50">
                                {emailBusy ? "Verifying..." : "Verify & Update Email"}
                            </button>
                        </form>
                    )}
                </div>

                {/* MOBILE */}
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-bold text-white">
                            <Phone size={16} className="text-violet-300" /> Mobile
                        </div>
                        <VerifiedBadge verified={user?.mobileVerified} />
                    </div>

                    <p className="text-sm text-slate-400">{user?.mobile || "Not set"}</p>

                    {mobileError && <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{mobileError}</div>}
                    {mobileMessage && <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">{mobileMessage}</div>}

                    {mobileStep === "idle" && (
                        <button type="button" onClick={() => setMobileStep("form")} className="text-xs font-bold text-violet-400 hover:underline">
                            Change mobile number
                        </button>
                    )}

                    {mobileStep === "form" && (
                        <form onSubmit={handleRequestMobileChange} className="space-y-3">
                            <input type="text" placeholder="New 10-digit mobile number" value={newMobile} onChange={(e) => setNewMobile(e.target.value)} disabled={mobileBusy} className={inputClass} />
                            <input type="password" placeholder="Current password" value={mobilePassword} onChange={(e) => setMobilePassword(e.target.value)} disabled={mobileBusy} className={inputClass} />
                            <div className="flex gap-2">
                                <button type="submit" disabled={mobileBusy} className="flex-1 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-500 disabled:opacity-50">
                                    {mobileBusy ? "Sending..." : "Send Code"}
                                </button>
                                <button type="button" onClick={() => setMobileStep("idle")} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-400 hover:text-white">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}

                    {mobileStep === "otp" && (
                        <form onSubmit={handleVerifyMobileChange} className="space-y-3">
                            <input type="text" placeholder="6-digit code" value={mobileOtp} onChange={(e) => setMobileOtp(e.target.value)} disabled={mobileBusy} className={inputClass} />
                            <button type="submit" disabled={mobileBusy} className="w-full rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-500 disabled:opacity-50">
                                {mobileBusy ? "Verifying..." : "Verify & Update Mobile"}
                            </button>
                        </form>
                    )}
                </div>

                {/* PASSWORD */}
                <form onSubmit={handleChangePassword} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                        <KeyRound size={16} className="text-violet-300" /> Change Password
                    </div>

                    {passwordError && <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{passwordError}</div>}
                    {passwordMessage && <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">{passwordMessage}</div>}

                    <input type="password" placeholder="Current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} disabled={passwordBusy} className={inputClass} />
                    <input type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={passwordBusy} className={inputClass} />
                    <input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={passwordBusy} className={inputClass} />

                    <button type="submit" disabled={passwordBusy} className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-50">
                        {passwordBusy ? "Changing..." : "Change Password"}
                    </button>
                </form>

              </div>

            </div>
        </UserLayout>
    );
}
