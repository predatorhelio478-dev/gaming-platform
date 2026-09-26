"use client";

import {
    useEffect,
    useState,
} from "react";

import {
    AlertTriangle,
    ShieldAlert,
    Trash2,
    X,
} from "lucide-react";


// ======================================================
// DELETE USER MODAL (PERMANENT ACTION)
// ======================================================
//
// Deliberately distinct from UserStatusModal (block/unblock)
// and the plain window.confirm() used elsewhere - this is an
// irreversible action, so it gets its own strongly-worded,
// visually distinct confirmation that requires the admin to
// type DELETE before the final button becomes clickable.
// ======================================================

const CONFIRM_WORD = "DELETE";

export default function DeleteUserModal({
    open = false,
    user = null,
    actionLoading = false,
    onClose,
    onConfirm,
}) {

    const [typedValue, setTypedValue] =
        useState("");


    useEffect(() => {

        if (open) {

            setTypedValue("");

        }

    }, [open, user]);


    if (
        !open ||
        !user
    ) {
        return null;
    }


    // Admin-role User accounts are never deletable through
    // this module - defense in depth alongside the backend
    // RBAC/business-rule check.

    if (user?.role === "admin") {
        return null;
    }


    const userName =
        user?.fullName ||
        user?.username ||
        "this user";


    const username =
        user?.username
            ? `@${user.username}`
            : "";


    const isConfirmed =
        typedValue.trim().toUpperCase() ===
        CONFIRM_WORD;


    const handleClose = () => {

        if (actionLoading) {
            return;
        }

        onClose?.();

    };


    return (

        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">

            {/* =================================================
                BACKDROP
            ================================================== */}

            <button
                type="button"
                aria-label="Close modal"
                onClick={
                    actionLoading
                        ? undefined
                        : handleClose
                }
                className="
                    absolute
                    inset-0
                    h-full
                    w-full
                    cursor-default
                    bg-black/80
                    backdrop-blur-[3px]
                "
            />


            {/* =================================================
                MODAL
            ================================================== */}

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-user-modal-title"
                className="
                    relative
                    z-10
                    w-full
                    max-w-md
                    overflow-hidden
                    rounded-2xl
                    border
                    border-red-500/30
                    bg-[#150a0d]
                    shadow-2xl
                    shadow-red-950/40
                "
            >

                {/* =================================================
                    HEADER
                ================================================== */}

                <div className="flex items-center justify-between border-b border-red-500/15 bg-red-500/[0.04] px-5 py-4">

                    <div className="flex items-center gap-3">

                        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/25 bg-red-500/10">

                            <ShieldAlert
                                size={17}
                                className="text-red-400"
                            />

                        </div>


                        <div>

                            <h2
                                id="delete-user-modal-title"
                                className="text-sm font-black text-red-100"
                            >
                                Delete User Permanently
                            </h2>


                            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-400/80">
                                This action cannot be undone
                            </p>

                        </div>

                    </div>


                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={actionLoading}
                        aria-label="Close"
                        className="
                            flex
                            h-8
                            w-8
                            cursor-pointer
                            items-center
                            justify-center
                            rounded-lg
                            border
                            border-white/[0.07]
                            bg-white/[0.025]
                            text-slate-500
                            transition
                            hover:bg-white/[0.06]
                            hover:text-white
                            disabled:cursor-not-allowed
                            disabled:opacity-40
                        "
                    >

                        <X size={15} />

                    </button>

                </div>


                {/* =================================================
                    CONTENT
                ================================================== */}

                <div className="p-5">

                    {/* =============================================
                        WARNING
                    ============================================== */}

                    <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] p-4">

                        <div className="flex items-start gap-3">

                            <AlertTriangle
                                size={17}
                                className="mt-0.5 shrink-0 text-red-400"
                            />

                            <div>

                                <p className="text-xs font-bold text-red-200">
                                    You are about to permanently delete this account.
                                </p>

                                <p className="mt-1.5 text-[11px] leading-5 text-red-300/80">
                                    The account will be anonymized and can never log in again. This is different from deactivating a user, which can be reversed later.
                                </p>

                            </div>

                        </div>

                    </div>


                    {/* =============================================
                        USER INFO
                    ============================================== */}

                    <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">

                        <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/[0.08] text-xs font-black text-red-300">

                                {getInitials(userName)}

                            </div>

                            <div className="min-w-0 flex-1">

                                <p className="truncate text-xs font-bold text-white">
                                    {userName}
                                </p>

                                {username && (

                                    <p className="mt-0.5 truncate text-[11px] text-slate-500">
                                        {username}
                                    </p>

                                )}

                                {user?.email && (

                                    <p className="mt-0.5 truncate mt-0.5 max-w-[170px] truncate text-[12px] text-slate-500">
                                        {user.email}
                                    </p>

                                )}

                            </div>

                        </div>

                    </div>


                    {/* =============================================
                        PRESERVED DATA NOTE
                    ============================================== */}

                    <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.015] p-3.5 text-[11px] leading-5 text-slate-500">
                        Wallet balance, transactions, bets, deposits, withdrawals and audit history are <span className="font-semibold text-slate-300">preserved</span> and remain correctly attributed. Only the account&apos;s name, username, email, mobile and password are permanently removed.
                    </div>


                    {/* =============================================
                        TYPE-TO-CONFIRM
                    ============================================== */}

                    <div className="mt-4">

                        <label
                            htmlFor="delete-user-confirm-input"
                            className="mb-2 block text-[11px] font-semibold text-slate-400"
                        >
                            Type <span className="font-mono font-bold text-red-400">{CONFIRM_WORD}</span> to confirm
                        </label>

                        <input
                            id="delete-user-confirm-input"
                            type="text"
                            value={typedValue}
                            onChange={(event) => setTypedValue(event.target.value)}
                            disabled={actionLoading}
                            autoFocus
                            autoComplete="off"
                            spellCheck={false}
                            placeholder={CONFIRM_WORD}
                            className="
                                h-11
                                w-full
                                rounded-xl
                                border
                                border-red-500/20
                                bg-[#0a0505]
                                px-3.5
                                text-sm
                                font-semibold
                                tracking-wide
                                text-red-100
                                outline-none
                                transition
                                placeholder:text-red-900/60
                                focus:border-red-500/50
                                focus:ring-2
                                focus:ring-red-500/10
                                disabled:cursor-not-allowed
                                disabled:opacity-50
                            "
                        />

                    </div>

                </div>


                {/* =================================================
                    FOOTER
                ================================================== */}

                <div className="flex items-center justify-end gap-2 border-t border-red-500/15 bg-red-500/[0.02] px-5 py-4">

                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={actionLoading}
                        className="
                            cursor-pointer
                            rounded-xl
                            border
                            border-white/[0.07]
                            bg-white/[0.025]
                            px-4
                            py-2.5
                            text-xs
                            font-bold
                            text-slate-400
                            transition
                            hover:bg-white/[0.05]
                            hover:text-white
                            disabled:cursor-not-allowed
                            disabled:opacity-40
                        "
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={() => onConfirm?.(user)}
                        disabled={actionLoading || !isConfirmed}
                        className="
                            flex
                            cursor-pointer
                            items-center
                            gap-2
                            rounded-xl
                            border
                            border-red-500/30
                            bg-red-600
                            px-4
                            py-2.5
                            text-xs
                            font-bold
                            text-white
                            transition
                            hover:bg-red-500
                            disabled:cursor-not-allowed
                            disabled:opacity-40
                            disabled:hover:bg-red-600
                        "
                    >

                        {actionLoading ? (

                            <span className="flex items-center gap-2">

                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />

                                Deleting...

                            </span>

                        ) : (

                            <>
                                <Trash2 size={14} />
                                Delete User Permanently
                            </>

                        )}

                    </button>

                </div>

            </div>

        </div>

    );

}


// ======================================================
// GET INITIALS
// ======================================================

function getInitials(name) {

    if (!name) {
        return "U";
    }

    const initials =
        String(name)
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase())
            .join("");

    return initials || "U";

}
