"use client";

import {
    Activity,
    RefreshCw,
} from "lucide-react";

// ======================================================
// AUDIT LOGS HEADER
// ======================================================
//
// Mirrors the Admin Rounds page's "PAGE TITLE + ACTIONS" card
// exactly (icon + eyebrow row, large bold title, description,
// right-aligned action) so this page's in-content header
// matches every other Admin page instead of its own one-off
// dot-marker layout.

export default function AuditLogsHeader({
    refreshing,
    onRefresh,
}) {
    return (
        <div className="mb-5 rounded-2xl border border-white/[0.06] bg-[#070914] px-5 py-5 sm:px-6">

            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

                <div>

                    <div className="flex items-center gap-2">
                        <Activity size={17} className="text-purple-400" />

                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-400">
                            System Activity
                        </p>
                    </div>

                    <h2 className="mt-2 text-2xl font-black text-white">
                        Audit Logs
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                        Track administrative actions, system activity and important platform changes.
                    </p>

                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">

                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={refreshing}
                        className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <RefreshCw
                            size={16}
                            className={refreshing ? "animate-spin" : ""}
                        />

                        {refreshing ? "Refreshing..." : "Refresh"}
                    </button>

                </div>

            </div>

        </div>
    );
}
