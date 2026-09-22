"use client";

import {
    AlertCircle,
    X,
} from "lucide-react";

export default function AuditLogsError({
    message,
    onClose,
}) {
    if (!message) {
        return null;
    }

    return (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">

            <div className="flex min-w-0 items-center gap-2.5">

                <AlertCircle
                    size={16}
                    className="shrink-0 text-red-400"
                />

                <p className="truncate text-xs font-semibold text-red-400">
                    {message}
                </p>

            </div>

            <button
                type="button"
                onClick={onClose}
                className="text-red-500/60 transition hover:text-red-400"
            >
                <X size={15} />
            </button>

        </div>
    );
}