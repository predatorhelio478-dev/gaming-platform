"use client";

import { X } from "lucide-react";

export default function AuditLogModal({
    log,
    onClose,
}) {
    if (!log) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
                if (
                    event.target ===
                    event.currentTarget
                ) {
                    onClose();
                }
            }}
        >
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d101d] shadow-2xl">

                {/* HEADER */}

                <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">

                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-purple-400">
                            Audit Detail
                        </p>

                        <h2 className="mt-1 text-lg font-bold text-white">
                            {formatValue(
                                log.action
                            )}
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white/[0.05] hover:text-white"
                    >
                        <X size={17} />
                    </button>

                </div>

                {/* BODY */}

                <div className="max-h-[70vh] overflow-y-auto p-5">

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                        <DetailItem
                            label="Actor Type"
                            value={
                                log.actorType
                            }
                        />

                        <DetailItem
                            label="Actor ID"
                            value={
                                log.actorId
                            }
                        />

                        <DetailItem
                            label="Module"
                            value={
                                log.module
                            }
                        />

                        <DetailItem
                            label="Category"
                            value={
                                log.category
                            }
                        />

                        <DetailItem
                            label="Setting Key"
                            value={
                                log.key
                            }
                        />

                        <DetailItem
                            label="Created At"
                            value={formatDate(
                                log.createdAt
                            )}
                        />

                        <DetailItem
                            label="IP Address"
                            value={
                                log.ipAddress
                            }
                        />

                        <DetailItem
                            label="User Agent"
                            value={
                                log.userAgent
                            }
                        />

                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">

                        <ValueBox
                            title="Old Value"
                            value={
                                log.oldValue
                            }
                        />

                        <ValueBox
                            title="New Value"
                            value={
                                log.newValue
                            }
                        />

                    </div>

                    {log.metadata && (
                        <ValueBox
                            title="Metadata"
                            value={
                                log.metadata
                            }
                        />
                    )}

                </div>
            </div>
        </div>
    );
}

function DetailItem({
    label,
    value,
}) {
    return (
        <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">

            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {label}
            </p>

            <p className="mt-1 break-all text-xs text-slate-400">
                {value || "—"}
            </p>

        </div>
    );
}

function ValueBox({
    title,
    value,
}) {
    return (
        <div className="overflow-hidden rounded-xl border border-white/[0.05] bg-[#070914]">

            <div className="border-b border-white/[0.05] px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    {title}
                </p>
            </div>

            <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all p-3 font-mono text-[11px] leading-5 text-slate-500">
                {formatObject(value)}
            </pre>

        </div>
    );
}

function formatObject(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return "—";
    }

    if (
        typeof value ===
        "object"
    ) {
        try {
            return JSON.stringify(
                value,
                null,
                2
            );
        } catch {
            return "[Object]";
        }
    }

    return String(value);
}

function formatDate(value) {
    if (!value) {
        return "—";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "—";
    }

    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }
    );
}

function formatValue(value) {
    if (!value) {
        return "—";
    }

    return String(value)
        .replace(/_/g, " ")
        .replace(
            /\b\w/g,
            (char) =>
                char.toUpperCase()
        );
}