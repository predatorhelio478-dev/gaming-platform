"use client";

import {
    Eye,
    UserRound,
} from "lucide-react";

import AdminTable, {
    AdminTableRow,
    AdminTableCell,
} from "../ui/AdminTable";

import {
    AuditActionBadge,
    AuditActorBadge,
} from "./AuditLogStatus";

export default function AuditLogsTable({
    logs,
    loading,
    total,
    onView,
}) {
    return (
        <AdminTable
            title="Activity Logs"
            subtitle="Administrative and system audit trail"
            count={total}
            icon={
                <UserRound size={19} />
            }
            minWidth="1250px"
            empty={
                !loading &&
                logs.length === 0
            }
            emptyTitle="No audit logs found"
            emptyMessage="There is no audit activity to display."
        >
            {loading ? (
                <LoadingRows />
            ) : (
                logs.map((log) => (
                    <AuditLogRow
                        key={
                            log._id ||
                            log.id ||
                            `${log.createdAt}-${log.action}-${log.key}`
                        }
                        log={log}
                        onView={onView}
                    />
                ))
            )}
        </AdminTable>
    );
}

function AuditLogRow({
    log,
    onView,
}) {
    return (
        <AdminTableRow>

            {/* ACTOR */}

            <AdminTableCell>
                <div className="flex items-center gap-3">

                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.035] text-slate-600">
                        <UserRound size={15} />
                    </span>

                    <div>
                        <p className="text-sm font-semibold text-slate-300">
                            {log.actorName ||
                                log.adminName ||
                                log.actorType ||
                                "System"}
                        </p>

                        <p className="mt-1 max-w-[180px] truncate text-[12px] text-slate-700">
                            {log.actorId || "—"}
                        </p>
                    </div>

                </div>
            </AdminTableCell>

            {/* ACTION */}

            <AdminTableCell>
                <AuditActionBadge
                    action={log.action}
                />
            </AdminTableCell>

            {/* MODULE */}

            <AdminTableCell>
                <p className="text-sm font-semibold capitalize text-slate-400">
                    {log.module || "—"}
                </p>

                {log.category && (
                    <p className="mt-1 text-[12px] text-slate-700">
                        {log.category}
                    </p>
                )}
            </AdminTableCell>

            {/* KEY */}

            <AdminTableCell>
                {log.key ? (
                    <code className="rounded-lg bg-white/[0.035] px-2 py-1 text-[11px] text-slate-500">
                        {log.key}
                    </code>
                ) : (
                    <span className="text-slate-700">
                        —
                    </span>
                )}
            </AdminTableCell>

            {/* ACTOR TYPE */}

            <AdminTableCell>
                <AuditActorBadge
                    actorType={
                        log.actorType
                    }
                />
            </AdminTableCell>

            {/* DATE */}

            <AdminTableCell>
                <p className="whitespace-nowrap text-xs text-slate-500">
                    {formatDate(
                        log.createdAt
                    )}
                </p>
            </AdminTableCell>

            {/* VIEW */}

            <AdminTableCell>
                <button
                    type="button"
                    onClick={() =>
                        onView(log)
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.025] text-slate-600 transition hover:bg-white/[0.06] hover:text-white"
                    title="View details"
                >
                    <Eye size={15} />
                </button>
            </AdminTableCell>

        </AdminTableRow>
    );
}

function LoadingRows() {
    return Array.from(
        { length: 8 },
        (_, index) => (
            <tr
                key={index}
                className="border-b border-white/[0.04]"
            >
                {Array.from(
                    { length: 7 },
                    (_, cellIndex) => (
                        <td
                            key={cellIndex}
                            className="px-5 py-5"
                        >
                            <div className="h-9 animate-pulse rounded-lg bg-white/[0.035]" />
                        </td>
                    )
                )}
            </tr>
        )
    );
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