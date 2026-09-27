"use client";

import {
    useState,
} from "react";

import {
    AlertTriangle,
    Trash2,
    X,
} from "lucide-react";


// ======================================================
// BULK DELETE MODAL
// ======================================================
//
// Shared by the Users and Admins tables. Same type-to-
// confirm pattern as DeleteUserModal / DeactivateAdminModal.
// The server re-checks every selected account, so this is a
// confirmation step, not the permission check.
// ======================================================

const CONFIRM_WORD = "DELETE";

export default function BulkDeleteModal({
    open = false,
    count = 0,
    noun = "account",
    description = "",
    actionLoading = false,
    onClose,
    onConfirm,
}) {

    // Cleared whenever the dialog closes or confirms, so it
    // always opens empty.
    const [typedValue, setTypedValue] =
        useState("");

    if (!open || count <= 0) {

        return null;

    }

    const label =
        `${count} ${noun}${count === 1 ? "" : "s"}`;

    const isConfirmed =
        typedValue.trim().toUpperCase() === CONFIRM_WORD;

    const handleClose = () => {

        if (!actionLoading) {

            setTypedValue("");

            onClose?.();

        }

    };

    return (

        <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={handleClose}
        >

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="bulk-delete-modal-title"
                onClick={(event) => event.stopPropagation()}
                className="w-full max-w-md overflow-hidden rounded-2xl border border-red-500/20 bg-[#0d101d] shadow-2xl"
            >

                <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">

                    <div className="flex items-center gap-3">

                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10">
                            <Trash2 size={17} className="text-red-400" />
                        </div>

                        <div>

                            <h2 id="bulk-delete-modal-title" className="text-sm font-black text-red-100">
                                Delete {label}
                            </h2>

                            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-400/80">
                                This cannot be undone
                            </p>

                        </div>

                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={actionLoading}
                        className="cursor-pointer rounded-lg p-1.5 text-slate-500 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed"
                        aria-label="Close"
                    >
                        <X size={16} />
                    </button>

                </div>

                <div className="space-y-4 px-5 py-5">

                    <div className="flex gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3">

                        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-400" />

                        <div>

                            <p className="text-xs font-bold text-red-200">
                                You are about to permanently delete {label}.
                            </p>

                            {description && (
                                <p className="mt-1.5 text-[11px] leading-5 text-red-300/80">
                                    {description}
                                </p>
                            )}

                        </div>

                    </div>

                    <div>

                        <label htmlFor="bulk-delete-confirm-input" className="mb-1.5 block text-[11px] font-semibold text-slate-400">
                            Type <span className="font-mono font-bold text-red-400">{CONFIRM_WORD}</span> to confirm
                        </label>

                        <input
                            id="bulk-delete-confirm-input"
                            type="text"
                            value={typedValue}
                            onChange={(event) => setTypedValue(event.target.value)}
                            disabled={actionLoading}
                            placeholder={CONFIRM_WORD}
                            autoComplete="off"
                            className="w-full rounded-xl border border-red-500/20 bg-[#070914] px-3 py-2.5 font-mono text-sm text-white outline-none transition placeholder:text-red-900/60 focus:border-red-500/50"
                        />

                    </div>

                </div>

                <div className="flex justify-end gap-2 border-t border-white/[0.06] px-5 py-4">

                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={actionLoading}
                        className="cursor-pointer rounded-xl border border-white/10 px-4 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setTypedValue("");
                            onConfirm?.();
                        }}
                        disabled={actionLoading || !isConfirmed}
                        className="flex cursor-pointer items-center gap-2 rounded-xl border border-red-500/30 bg-red-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-red-600"
                    >
                        {actionLoading ? (
                            <span className="flex items-center gap-2">
                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Deleting...
                            </span>
                        ) : (
                            <>
                                <Trash2 size={14} />
                                Delete {label}
                            </>
                        )}
                    </button>

                </div>

            </div>

        </div>

    );

}
