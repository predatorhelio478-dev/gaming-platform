"use client";

import {
    useEffect,
    useState,
} from "react";

import {
    AlertTriangle,
    ShieldAlert,
    ShieldX,
    X,
} from "lucide-react";


// ======================================================
// DEACTIVATE ADMIN MODAL
// ======================================================
//
// Mirrors DeleteUserModal.jsx's strongly-worded, type-to-
// confirm pattern - deactivating an admin account is a
// destructive-adjacent action (blocks their login entirely),
// so it gets the same visual treatment as permanently
// deleting a user, even though this one is reversible via
// the Reactivate action.
// ======================================================

const CONFIRM_WORD = "DEACTIVATE";

export default function DeactivateAdminModal({
    open = false,
    admin = null,
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

    }, [open, admin]);


    if (
        !open ||
        !admin
    ) {
        return null;
    }


    const adminName =
        admin?.fullName ||
        admin?.username ||
        "this admin";


    const username =
        admin?.username
            ? `@${admin.username}`
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
                aria-labelledby="deactivate-admin-modal-title"
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

                            <ShieldX
                                size={17}
                                className="text-red-400"
                            />

                        </div>


                        <div>

                            <h2
                                id="deactivate-admin-modal-title"
                                className="text-sm font-black text-red-100"
                            >
                                Deactivate Admin Account
                            </h2>


                            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-400/80">
                                They will lose access immediately
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
                                    You are about to deactivate this admin account.
                                </p>

                                <p className="mt-1.5 text-[11px] leading-5 text-red-300/80">
                                    They will no longer be able to log into the admin panel. This can be reversed later from this same screen (Reactivate).
                                </p>

                            </div>

                        </div>

                    </div>


                    {/* =============================================
                        ADMIN INFO
                    ============================================== */}

                    <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">

                        <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/[0.08] text-xs font-black text-red-300">

                                {getInitials(adminName)}

                            </div>

                            <div className="min-w-0 flex-1">

                                <p className="truncate text-xs font-bold text-white">
                                    {adminName}
                                </p>

                                {username && (

                                    <p className="mt-0.5 truncate text-[11px] text-slate-500">
                                        {username}
                                    </p>

                                )}

                                {admin?.email && (

                                    <p className="mt-0.5 truncate text-[11px] text-slate-600">
                                        {admin.email}
                                    </p>

                                )}

                            </div>

                            {admin?.role === "super_admin" && (

                                <div className="flex shrink-0 items-center gap-1 rounded-lg border border-yellow-500/20 bg-yellow-500/[0.06] px-2 py-1 text-[10px] font-bold text-yellow-400">
                                    <ShieldAlert size={11} />
                                    Super Admin
                                </div>

                            )}

                        </div>

                    </div>


                    {/* =============================================
                        TYPE-TO-CONFIRM
                    ============================================== */}

                    <div className="mt-4">

                        <label
                            htmlFor="deactivate-admin-confirm-input"
                            className="mb-2 block text-[11px] font-semibold text-slate-400"
                        >
                            Type <span className="font-mono font-bold text-red-400">{CONFIRM_WORD}</span> to confirm
                        </label>

                        <input
                            id="deactivate-admin-confirm-input"
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
                        onClick={() => onConfirm?.(admin)}
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

                                Deactivating...

                            </span>

                        ) : (

                            <>
                                <ShieldX size={14} />
                                Deactivate Admin
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
        return "A";
    }

    const initials =
        String(name)
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase())
            .join("");

    return initials || "A";

}
