"use client";

// ======================================================
// STATUS BADGE
// ======================================================
//
// Shared pill badge for request/bet/transaction status
// across wallet/deposit/withdrawal/bets/transactions pages.

const COLOR_BY_STATUS = {
    pending: "border-yellow-500/20 bg-yellow-500/10 text-yellow-300",
    approved: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    completed: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    won: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    paid: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    rejected: "border-red-500/20 bg-red-500/10 text-red-400",
    failed: "border-red-500/20 bg-red-500/10 text-red-400",
    lost: "border-red-500/20 bg-red-500/10 text-red-400",
    processing: "border-yellow-500/20 bg-yellow-500/10 text-yellow-300",
    manual_review: "border-orange-500/20 bg-orange-500/10 text-orange-300",
    open: "border-blue-500/20 bg-blue-500/10 text-blue-300",
    replied: "border-violet-500/20 bg-violet-500/10 text-violet-300",
    resolved: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    closed: "border-slate-500/20 bg-slate-500/10 text-slate-400",
};

// User-facing display text only for internal-sounding status
// values - the underlying value still drives the color above.
const DISPLAY_LABEL_OVERRIDE = {
    manual_review: "Delayed",
};

export default function StatusBadge({ status }) {
    const normalized = String(status || "").toLowerCase();

    const classes =
        COLOR_BY_STATUS[normalized] ||
        "border-white/10 bg-white/[0.04] text-slate-300";

    const label =
        DISPLAY_LABEL_OVERRIDE[normalized] || status || "-";

    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${classes}`}
        >
            {label}
        </span>
    );
}
