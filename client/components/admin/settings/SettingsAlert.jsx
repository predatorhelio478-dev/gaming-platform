"use client";

import {
    AlertCircle,
    CheckCircle2,
    X,
} from "lucide-react";

export default function SettingsAlert({
    type = "success",
    message = "",
    onClose,
}) {
    if (!message) {
        return null;
    }

    const isSuccess =
        type === "success";

    return (
        <div
            className={`mb-2 flex min-h-[42px] w-full items-center justify-between rounded-xl border px-4 py-2.5 ${isSuccess
                    ? "border-green-500/20 bg-green-500/5"
                    : "border-red-500/20 bg-red-500/5"
                }`}
        >
            <div className="flex min-w-0 items-center gap-2.5">
                {isSuccess ? (
                    <CheckCircle2
                        size={16}
                        className="shrink-0 text-green-400"
                    />
                ) : (
                    <AlertCircle
                        size={16}
                        className="shrink-0 text-red-400"
                    />
                )}

                <p
                    className={`truncate text-xs font-semibold ${isSuccess
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                >
                    {message}
                </p>
            </div>

            <button
                type="button"
                onClick={onClose}
                className={`ml-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition ${isSuccess
                        ? "text-green-500/60 hover:bg-green-500/10 hover:text-green-400"
                        : "text-red-500/60 hover:bg-red-500/10 hover:text-red-400"
                    }`}
            >
                <X size={14} />
            </button>
        </div>
    );
}