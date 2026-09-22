"use client";

import {
    AlertTriangle,
    Ban,
    CheckCircle2,
    X,
    ShieldCheck,
} from "lucide-react";


// ======================================================
// USER STATUS MODAL
// ======================================================

export default function UserStatusModal({
    open = false,
    user = null,
    status = null,
    actionLoading = false,
    onClose,
    onSubmit,
}) {

    if (
        !open ||
        !user
    ) {
        return null;
    }


    const isBlocking =
        status === "blocked";


    const isActivating =
        status === "active";


    const userName =
        user?.fullName ||
        user?.username ||
        "this user";


    const username =
        user?.username
            ? `@${user.username}`
            : "";


    /*
     * Safety:
     * Admin account should never be blocked through
     * this modal.
     */

    const isAdmin =
        user?.role === "admin";


    if (isAdmin) {
        return null;
    }


    return (

        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">

            {/* =================================================
                BACKDROP
            ================================================== */}

            <button
                type="button"
                aria-label="Close modal"
                onClick={
                    actionLoading
                        ? undefined
                        : onClose
                }
                className="
                    absolute
                    inset-0
                    h-full
                    w-full
                    cursor-default
                    bg-black/70
                    backdrop-blur-[3px]
                "
            />


            {/* =================================================
                MODAL
            ================================================== */}

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="user-status-modal-title"
                className="
                    relative
                    z-10
                    w-full
                    max-w-md
                    overflow-hidden
                    rounded-2xl
                    border
                    border-white/[0.08]
                    bg-[#0d101d]
                    shadow-2xl
                "
            >

                {/* =================================================
                    HEADER
                ================================================== */}

                <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">

                    <div className="flex items-center gap-3">

                        <div
                            className={
                                isBlocking
                                    ? "flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/[0.07]"
                                    : "flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/[0.07]"
                            }
                        >

                            {isBlocking ? (

                                <Ban
                                    size={17}
                                    className="text-red-400"
                                />

                            ) : (

                                <CheckCircle2
                                    size={17}
                                    className="text-green-400"
                                />

                            )}

                        </div>


                        <div>

                            <h2
                                id="user-status-modal-title"
                                className="text-sm font-black text-white"
                            >
                                {isBlocking
                                    ? "Block User"
                                    : "Unblock User"}
                            </h2>


                            <p className="mt-0.5 text-[10px] text-slate-700">
                                Account status confirmation
                            </p>

                        </div>

                    </div>


                    <button
                        type="button"
                        onClick={
                            onClose
                        }
                        disabled={
                            actionLoading
                        }
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
                            text-slate-600
                            transition
                            hover:bg-white/[0.06]
                            hover:text-white
                            disabled:cursor-not-allowed
                            disabled:opacity-40
                        "
                    >

                        <X
                            size={15}
                        />

                    </button>

                </div>


                {/* =================================================
                    CONTENT
                ================================================== */}

                <div className="p-5">

                    {/* =============================================
                        WARNING
                    ============================================== */}

                    <div
                        className={
                            isBlocking
                                ? "rounded-xl border border-red-500/10 bg-red-500/[0.04] p-4"
                                : "rounded-xl border border-green-500/10 bg-green-500/[0.04] p-4"
                        }
                    >

                        <div className="flex items-start gap-3">

                            <AlertTriangle
                                size={17}
                                className={
                                    isBlocking
                                        ? "mt-0.5 shrink-0 text-red-400"
                                        : "mt-0.5 shrink-0 text-green-400"
                                }
                            />


                            <div>

                                <p
                                    className={
                                        isBlocking
                                            ? "text-xs font-bold text-red-300"
                                            : "text-xs font-bold text-green-300"
                                    }
                                >
                                    {isBlocking
                                        ? "Are you sure you want to block this user?"
                                        : "Are you sure you want to unblock this user?"}
                                </p>


                                <p className="mt-1.5 text-[11px] leading-5 text-slate-500">

                                    {isBlocking
                                        ? "The user will no longer be able to use the platform normally until the account is activated again."
                                        : "The user will regain access to the platform after the account is activated."}

                                </p>

                            </div>

                        </div>

                    </div>


                    {/* =============================================
                        USER INFO
                    ============================================== */}

                    <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">

                        <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-purple-500/15 bg-purple-500/[0.06] text-xs font-black text-purple-300">

                                {getInitials(
                                    userName
                                )}

                            </div>


                            <div className="min-w-0 flex-1">

                                <p className="truncate text-xs font-bold text-white">
                                    {userName}
                                </p>


                                {username && (

                                    <p className="mt-0.5 truncate text-[11px] text-slate-600">
                                        {username}
                                    </p>

                                )}

                            </div>


                            <div className="shrink-0">

                                <span
                                    className={
                                        isBlocking
                                            ? "inline-flex rounded-full border border-green-500/15 bg-green-500/[0.04] px-2.5 py-1 text-[9px] font-bold text-green-400"
                                            : "inline-flex rounded-full border border-red-500/15 bg-red-500/[0.04] px-2.5 py-1 text-[9px] font-bold text-red-400"
                                    }
                                >

                                    {isBlocking
                                        ? "Active"
                                        : "Blocked"}

                                </span>

                            </div>

                        </div>


                        {/* =========================================
                            USER DETAILS
                        ========================================== */}

                        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">

                            <InfoRow
                                label="Email"
                                value={
                                    user?.email ||
                                    "—"
                                }
                            />


                            <InfoRow
                                label="Mobile"
                                value={
                                    user?.mobile ||
                                    "—"
                                }
                            />


                            <InfoRow
                                label="User ID"
                                value={
                                    user?._id ||
                                    "—"
                                }
                            />


                            <InfoRow
                                label="Role"
                                value={
                                    user?.role ===
                                        "admin"
                                        ? "Admin"
                                        : "Player"
                                }
                            />

                        </div>

                    </div>


                    {/* =============================================
                        IMPORTANT NOTE
                    ============================================== */}

                    <div className="mt-4 flex items-start gap-2 text-[10px] leading-4 text-slate-700">

                        <ShieldCheck
                            size={13}
                            className="mt-0.5 shrink-0 text-slate-700"
                        />

                        <p>
                            This action changes only the user's
                            account status. Wallet balance,
                            transactions, bets and payouts are
                            not modified.
                        </p>

                    </div>

                </div>


                {/* =================================================
                    FOOTER
                ================================================== */}

                <div className="flex items-center justify-end gap-2 border-t border-white/[0.06] px-5 py-4">

                    <button
                        type="button"
                        onClick={
                            onClose
                        }
                        disabled={
                            actionLoading
                        }
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
                            text-slate-500
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
                        onClick={
                            onSubmit
                        }
                        disabled={
                            actionLoading ||
                            !isActivating &&
                            !isBlocking
                        }
                        className={
                            isBlocking
                                ? `
                                    flex
                                    cursor-pointer
                                    items-center
                                    gap-2
                                    rounded-xl
                                    border
                                    border-red-500/15
                                    bg-red-500/[0.07]
                                    px-4
                                    py-2.5
                                    text-xs
                                    font-bold
                                    text-red-400
                                    transition
                                    hover:bg-red-500/[0.12]
                                    disabled:cursor-not-allowed
                                    disabled:opacity-50
                                `
                                : `
                                    flex
                                    cursor-pointer
                                    items-center
                                    gap-2
                                    rounded-xl
                                    border
                                    border-green-500/15
                                    bg-green-500/[0.07]
                                    px-4
                                    py-2.5
                                    text-xs
                                    font-bold
                                    text-green-400
                                    transition
                                    hover:bg-green-500/[0.12]
                                    disabled:cursor-not-allowed
                                    disabled:opacity-50
                                `
                        }
                    >

                        {actionLoading ? (

                            <span className="flex items-center gap-2">

                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />

                                Processing...

                            </span>

                        ) : (

                            <>
                                {isBlocking ? (

                                    <Ban
                                        size={14}
                                    />

                                ) : (

                                    <CheckCircle2
                                        size={14}
                                    />

                                )}


                                {isBlocking
                                    ? "Block User"
                                    : "Unblock User"}

                            </>

                        )}

                    </button>

                </div>

            </div>

        </div>

    );

}


// ======================================================
// INFO ROW
// ======================================================

function InfoRow({
    label,
    value,
}) {

    return (

        <div className="min-w-0 rounded-lg border border-white/[0.04] bg-white/[0.015] px-3 py-2">

            <p className="text-[8px] font-bold uppercase tracking-[0.08em] text-slate-700">
                {label}
            </p>


            <p className="mt-1 truncate text-[10px] font-semibold text-slate-500">
                {value}
            </p>

        </div>

    );

}


// ======================================================
// GET INITIALS
// ======================================================

function getInitials(
    name
) {

    if (!name) {
        return "U";
    }


    const initials =
        String(name)
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(
                (part) =>
                    part
                        .charAt(0)
                        .toUpperCase()
            )
            .join("");


    return initials ||
        "U";

}