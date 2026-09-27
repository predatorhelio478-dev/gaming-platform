"use client";

import {
    AlertTriangle,
    CheckCircle2,
    X,
} from "lucide-react";


// ======================================================
// BULK DELETE FEEDBACK
// ======================================================
//
// Result of a bulk delete: green when everything was
// deleted, amber for a partial result, red when nothing was.
// Failed rows are listed with the server's reason for each.
// `feedback` = { message, deletedCount, failed: [{ label,
// reason }] }.
// ======================================================

export default function BulkDeleteFeedback({
    feedback = null,
    onDismiss,
}) {

    if (!feedback) {

        return null;

    }

    const failed =
        feedback.failed || [];

    const tone =
        failed.length === 0
            ? "success"
            : feedback.deletedCount > 0
                ? "partial"
                : "error";

    const styles = {
        success: "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-300",
        partial: "border-amber-500/20 bg-amber-500/[0.06] text-amber-300",
        error: "border-red-500/20 bg-red-500/[0.06] text-red-300",
    };

    const Icon =
        tone === "success" ? CheckCircle2 : AlertTriangle;

    return (

        <div
            role="status"
            className={`mb-6 flex items-start justify-between gap-3 rounded-xl border px-4 py-3 ${styles[tone]}`}
        >

            <div className="flex min-w-0 items-start gap-3">

                <Icon size={17} className="mt-0.5 shrink-0" />

                <div className="min-w-0">

                    <p className="text-sm font-semibold">
                        {feedback.message}
                    </p>

                    {failed.length > 0 && (

                        <ul className="mt-1.5 space-y-0.5 text-xs text-slate-400">

                            {failed.map((item, index) => (
                                <li key={`${item.label}-${index}`} className="break-words">
                                    <span className="font-semibold text-slate-300">{item.label}</span>: {item.reason}
                                </li>
                            ))}

                        </ul>

                    )}

                </div>

            </div>

            <button
                type="button"
                onClick={onDismiss}
                className="shrink-0 cursor-pointer rounded-lg p-1 text-slate-500 transition hover:bg-white/[0.05] hover:text-white"
                aria-label="Dismiss"
            >
                <X size={14} />
            </button>

        </div>

    );

}
