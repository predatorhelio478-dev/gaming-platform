"use client";

import {
    useEffect,
    useState,
} from "react";

import {
    X,
    KeyRound,
    Eye,
    EyeOff,
} from "lucide-react";


// ======================================================
// CHANGE ADMIN PASSWORD MODAL (Super Admin only)
// ======================================================
//
// Mirrors the header/footer/Field styling of AdminCreateModal -
// only reachable at all from the table when the viewer is a
// super_admin (see AdminManagementTable's canManuallyChangePassword),
// and independently enforced server-side either way.

export default function ChangeAdminPasswordModal({
    open = false,
    admin = null,
    actionLoading = false,
    onClose,
    onSubmit,
}) {

    const [newPassword, setNewPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {

        if (open) {
            setNewPassword("");
            setShowPassword(false);
            setError("");
        }

    }, [open, admin]);

    if (!open || !admin) {
        return null;
    }

    const handleClose = () => {
        if (actionLoading) return;
        onClose?.();
    };

    const handleSubmit = async (event) => {

        event.preventDefault();

        if (actionLoading) return;

        setError("");

        if (!newPassword || newPassword.length < 8) {
            setError("New password must be at least 8 characters.");
            return;
        }

        try {
            await onSubmit?.(newPassword);
        } catch (submitError) {
            setError(submitError?.message || "Unable to change password.");
        }

    };

    return (

        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">

            <button
                type="button"
                aria-label="Close"
                onClick={handleClose}
                className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
            />

            <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d101d] shadow-2xl shadow-black/50">

                <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">

                    <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
                            <KeyRound size={18} className="text-purple-400" />
                        </div>

                        <div>
                            <h2 className="text-base font-bold text-white">Change Password</h2>
                            <p className="mt-0.5 text-xs text-slate-600">{admin?.fullName || admin?.username}</p>
                        </div>

                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={actionLoading}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <X size={18} />
                    </button>

                </div>

                <form onSubmit={handleSubmit} className="p-5">

                    {error && (
                        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3">
                            <p className="text-xs font-medium text-red-400">{error}</p>
                        </div>
                    )}

                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
                        New Password
                    </label>

                    <div className="relative">

                        <input
                            type={showPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(event) => setNewPassword(event.target.value)}
                            placeholder="Minimum 8 characters"
                            disabled={actionLoading}
                            autoFocus
                            className="h-11 w-full rounded-xl border border-white/[0.07] bg-[#070914] px-3 pr-11 text-sm text-slate-300 outline-none transition placeholder:text-slate-700 focus:border-purple-500/30 disabled:opacity-50"
                        />

                        <button
                            type="button"
                            onClick={() => setShowPassword((current) => !current)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 transition hover:text-slate-300"
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>

                    </div>

                    <p className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.015] px-4 py-3 text-[10px] leading-4 text-slate-600">
                        This immediately invalidates any lockout on the account and takes effect on the next login. The account is not deleted or duplicated.
                    </p>

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
                            type="submit"
                            disabled={actionLoading}
                            className="flex h-10 min-w-[140px] items-center justify-center rounded-xl bg-purple-600 px-4 text-xs font-bold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {actionLoading ? "Saving..." : "Change Password"}
                        </button>

                    </div>

                </form>

            </div>

        </div>

    );

}
