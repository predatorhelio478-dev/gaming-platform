"use client";

import { AlertCircle, Loader2, Inbox } from "lucide-react";

// ======================================================
// SHARED LOADING / ERROR / EMPTY STATES
// ======================================================
//
// Used across the wallet/deposit/withdrawal/bets/
// transactions/referrals pages to avoid re-implementing
// the same three states in each one.

export function LoadingState({ label = "Loading..." }) {
    return (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] py-12 text-sm text-slate-400">
            <Loader2 size={16} className="animate-spin" />
            {label}
        </div>
    );
}

export function ErrorState({ message = "Something went wrong.", onRetry }) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 py-12 text-center">
            <AlertCircle size={22} className="text-red-400" />
            <p className="max-w-sm text-sm text-red-400">{message}</p>
            {onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/20"
                >
                    Try again
                </button>
            )}
        </div>
    );
}

export function EmptyState({ message = "Nothing here yet." }) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] py-12 text-center">
            <Inbox size={22} className="text-slate-600" />
            <p className="text-sm text-slate-500">{message}</p>
        </div>
    );
}
