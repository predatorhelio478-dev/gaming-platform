"use client";

import { useEffect, useState } from "react";

import {
    Mail,
    Phone,
    ShieldCheck,
    ShieldOff,
    X,
} from "lucide-react";


// ======================================================
// USER VERIFICATION MODAL (verify / unverify email or mobile)
// ======================================================
//
// One shared modal for all 4 combinations (verify/unverify x
// email/mobile) - keeps the "send notification email" checkbox
// and the confirm step consistent no matter where it's opened
// from (Users table row menu, Edit modal, or the View drawer).
// Super Admin only, enforced server-side regardless of what
// this modal shows.

export default function UserVerificationModal({
    open = false,
    user = null,
    channel = "email", // "email" | "mobile"
    targetVerified = true, // true = verify, false = unverify
    actionLoading = false,
    error = "",
    onClose,
    onConfirm, // (notifyEmail: boolean) => Promise<void>
}) {

    const [notifyEmail, setNotifyEmail] = useState(false);

    useEffect(() => {

        if (open) {
            setNotifyEmail(false);
        }

    }, [open, user, channel, targetVerified]);

    if (!open || !user) {
        return null;
    }

    const isEmail = channel === "email";

    const contactValue =
        isEmail ? (user?.email || "—") : (user?.mobile || "—");

    const ChannelIcon = isEmail ? Mail : Phone;

    const actionLabel =
        targetVerified
            ? `Verify ${isEmail ? "Email" : "Mobile Number"}`
            : `Unverify ${isEmail ? "Email" : "Mobile Number"}`;

    const handleClose = () => {

        if (actionLoading) return;

        onClose?.();

    };

    const handleConfirm = async () => {

        await onConfirm?.(notifyEmail);

    };

    return (

        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">

            <button
                type="button"
                aria-label="Close modal"
                onClick={handleClose}
                className="absolute inset-0 h-full w-full cursor-default bg-black/70 backdrop-blur-[3px]"
            />

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="user-verification-modal-title"
                className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d101d] shadow-2xl"
            >

                <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">

                    <div className="flex items-center gap-3">

                        <div
                            className={
                                targetVerified
                                    ? "flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/[0.08]"
                                    : "flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/[0.08]"
                            }
                        >

                            {targetVerified ? (
                                <ShieldCheck size={17} className="text-emerald-400" />
                            ) : (
                                <ShieldOff size={17} className="text-amber-400" />
                            )}

                        </div>

                        <div>

                            <h2 id="user-verification-modal-title" className="text-sm font-black text-white">
                                {actionLabel}
                            </h2>

                            <p className="mt-0.5 text-[10px] text-slate-700">
                                Manual override - no OTP required
                            </p>

                        </div>

                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={actionLoading}
                        aria-label="Close"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.025] text-slate-600 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <X size={15} />
                    </button>

                </div>

                <div className="p-5">

                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">

                        <div className="flex items-center gap-3">

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-purple-500/15 bg-purple-500/[0.06]">
                                <ChannelIcon size={15} className="text-purple-300" />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-bold text-white">{contactValue}</p>
                                <p className="mt-0.5 truncate text-[11px] text-slate-600">
                                    {user?.fullName || user?.username || "This user"}
                                </p>
                            </div>

                        </div>

                    </div>

                    <p className="mt-4 text-[11px] leading-5 text-slate-500">
                        {targetVerified
                            ? `This marks the user's ${isEmail ? "email" : "mobile number"} as verified without sending or checking an OTP.`
                            : `This marks the user's ${isEmail ? "email" : "mobile number"} as unverified. They will need to re-verify it (via OTP or another manual override) to be considered verified again.`}
                    </p>

                    {error && (
                        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-xs font-medium text-red-400">
                            {error}
                        </div>
                    )}

                    <label className="mt-4 flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.015] px-4 py-3 text-xs font-medium text-slate-400 select-none">
                        <input
                            type="checkbox"
                            checked={notifyEmail}
                            onChange={(event) => setNotifyEmail(event.target.checked)}
                            disabled={actionLoading}
                            className="h-3.5 w-3.5 shrink-0 rounded border-white/20 bg-[#070914] text-purple-500 focus:ring-purple-500/40 disabled:cursor-not-allowed"
                        />
                        Send notification email to user
                    </label>

                    <div className="mt-5 flex items-center justify-end gap-2">

                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={actionLoading}
                            className="h-10 rounded-xl border border-white/[0.07] px-4 text-xs font-semibold text-slate-500 transition hover:border-white/[0.12] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={actionLoading}
                            className={`flex h-10 min-w-[140px] items-center justify-center rounded-xl px-4 text-xs font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                targetVerified
                                    ? "bg-emerald-600 hover:bg-emerald-500"
                                    : "bg-amber-600 hover:bg-amber-500"
                            }`}
                        >
                            {actionLoading ? "Saving..." : actionLabel}
                        </button>

                    </div>

                </div>

            </div>

        </div>

    );

}
