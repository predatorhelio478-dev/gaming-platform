"use client";

import {
    Eye,
    ChevronRight,
    RotateCcw,
    AlertTriangle,
    Ban,
    Banknote,
    Undo2,
} from "lucide-react";

import {
    AdminTable,
    AdminTableRow,
    AdminTableCell,
} from "../ui/AdminTable";

import AdminPagination from "../ui/AdminPagination";

export default function PayoutTable({
    payouts = [],
    pagination = {},
    refreshing = false,
    formatCurrency,
    formatDate,
    onView,
    onRetry,
    onManualReview,
    onCancel,
    onReverse,
    onRefund,
    onRestore,
    actionLoading = false,
    onPageChange,
}) {
    const total =
        Number(pagination?.total) || 0;

    const page =
        Number(pagination?.page) || 1;

    const limit =
        Number(pagination?.limit) || 20;

    const totalPages =
        Number(
            pagination?.totalPages
        ) || 1;


    const currency = (value) => {

        if (
            typeof formatCurrency ===
            "function"
        ) {
            return formatCurrency(
                value || 0
            );
        }

        return `₹${Number(
            value || 0
        ).toLocaleString("en-IN")}`;

    };


    return (
        <section className="mt-6 overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0d101d]">

            {/* HEADER */}

            <div className="border-b border-white/[0.06] px-5 py-4 sm:px-6">

                <div className="flex items-center justify-between">

                    <div>

                        <p className="text-xs uppercase tracking-[0.15em] text-slate-600">
                            Payout Activity
                        </p>

                        <h3 className="mt-1 text-lg font-bold text-white">
                            Payout History
                        </h3>

                    </div>

                    <span className="rounded-full bg-white/[0.04] px-3 py-1 text-xs text-slate-500">
                        {payouts.length} loaded
                    </span>

                </div>

            </div>


            {/* EMPTY */}

            {payouts.length === 0 ? (

                <div className="px-6 py-16 text-center">

                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.03] text-slate-600">

                        <Eye size={20} />

                    </div>

                    <h3 className="mt-4 text-sm font-bold text-slate-400">
                        No payouts found
                    </h3>

                    <p className="mt-1 text-xs text-slate-700">
                        No payout records match
                        the current filters.
                    </p>

                </div>

            ) : (

                <div className="overflow-x-auto">

                    <table className="w-full min-w-[1250px]">

                        <thead>

                            <tr className="border-b border-white/[0.05] text-left">

                                <TableHeader>
                                    User
                                </TableHeader>

                                <TableHeader>
                                    Round
                                </TableHeader>

                                <TableHeader>
                                    Bet Amount
                                </TableHeader>

                                <TableHeader>
                                    Winning Color
                                </TableHeader>

                                <TableHeader>
                                    Payout
                                </TableHeader>

                                <TableHeader>
                                    Status
                                </TableHeader>

                                <TableHeader>
                                    Time
                                </TableHeader>

                                <TableHeader>
                                    Action
                                </TableHeader>

                            </tr>

                        </thead>


                        <tbody>

                            {payouts.map(
                                (payout) => (

                                    <PayoutRow
                                        key={payout?._id}
                                        payout={payout}
                                        formatCurrency={formatCurrency}
                                        formatDate={formatDate}
                                        onView={() =>
                                            onView?.(payout)
                                        }
                                        onRetry={() =>
                                            onRetry?.(payout)
                                        }
                                        onManualReview={() =>
                                            onManualReview?.(payout)
                                        }
                                        onCancel={() =>
                                            onCancel?.(payout)
                                        }
                                        onReverse={() =>
                                            onReverse?.(payout)
                                        }
                                        onRefund={() =>
                                            onRefund?.(payout)
                                        }
                                        onRestore={() =>
                                            onRestore?.(payout)
                                        }
                                        actionLoading={actionLoading}
                                    />

                                )
                            )}

                        </tbody>

                    </table>

                </div>

            )}


            {/* PAGINATION */}

            {total > 0 && (

                <AdminPagination
                    page={page}
                    totalPages={
                        totalPages
                    }
                    total={total}
                    limit={limit}
                    loading={
                        refreshing
                    }
                    itemLabel="payouts"
                    onPageChange={
                        onPageChange
                    }
                />

            )}

        </section>
    );
}


/*
|--------------------------------------------------------------------------
| TABLE HEADER
|--------------------------------------------------------------------------
*/

function TableHeader({
    children,
}) {
    return (
        <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500">
            {children}
        </th>
    );
}


/*
|--------------------------------------------------------------------------
| PAYOUT ROW
|--------------------------------------------------------------------------
*/

function PayoutRow({
    payout,
    formatCurrency,
    formatDate,
    onView,
    onRetry,
    onManualReview,
    onCancel,
    onReverse,
    onRefund,
    onRestore,
    actionLoading,
}) {

    const username =
        payout?.user?.username ||
        payout?.user?.fullName ||
        "Unknown User";


    const color =
        String(
            payout?.winningColor || ""
        ).toLowerCase();


    const status =
        String(
            payout?.status ||
            "pending"
        ).toLowerCase();


    /*
     * Correct payout amount.
     *
     * Backend:
     *
     * payoutAmount
     */

    const payoutAmount =
        Number(
            payout?.payoutAmount ||
            0
        );


    const colorClass = {

        red:
            "border-red-500/20 bg-red-500/10 text-red-400",

        green:
            "border-green-500/20 bg-green-500/10 text-green-400",

        blue:
            "border-blue-500/20 bg-blue-500/10 text-blue-400",

    };


    const statusClass = {

        paid:
            "border-green-500/20 bg-green-500/10 text-green-400",

        pending:
            "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",

        processing:
            "border-blue-500/20 bg-blue-500/10 text-blue-400",

        failed:
            "border-red-500/20 bg-red-500/10 text-red-400",

        cancelled:
            "border-slate-500/20 bg-slate-500/10 text-slate-400",

        reversed:
            "border-orange-500/20 bg-orange-500/10 text-orange-400",

        manual_review:
            "border-purple-500/20 bg-purple-500/10 text-purple-400",

    };


    const currency = (value) => {

        if (
            typeof formatCurrency ===
            "function"
        ) {

            return formatCurrency(
                value || 0
            );

        }

        return `₹${Number(
            value || 0
        ).toLocaleString("en-IN")}`;

    };


    return (
        <tr className="border-b border-white/[0.04] transition hover:bg-white/[0.015]">

            {/* USER */}

            <td className="px-5 py-4">

                <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">

                        {username
                            .charAt(0)
                            .toUpperCase()}

                    </div>


                    <div className="min-w-0">

                        <p className="max-w-[150px] truncate text-sm font-bold text-white">
                            {username}
                        </p>

                        <p className="mt-0.5 max-w-[170px] truncate text-[12px] text-slate-500">
                            {payout?.user?.email ||
                                "—"}
                        </p>

                    </div>

                </div>

            </td>


            {/* ROUND */}

            <td className="px-5 py-4">

                <p className="text-sm font-bold text-purple-300">

                    #
                    {payout?.round
                        ?.roundNumber ??
                        "—"}

                </p>

            </td>


            {/* BET */}

            <td className="px-5 py-4">

                <p className="text-sm font-semibold text-slate-300">

                    {currency(
                        payout?.betAmount
                    )}

                </p>

            </td>


            {/* WINNING COLOR */}

            <td className="px-5 py-4">

                <span
                    className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${colorClass[
                        color
                    ] ||
                        "border-slate-500/20 bg-slate-500/10 text-slate-400"
                        }`}
                >

                    <span
                        className={`h-1.5 w-1.5 rounded-full ${color ===
                            "red"
                            ? "bg-red-400"
                            : color ===
                                "green"
                                ? "bg-green-400"
                                : color ===
                                    "blue"
                                    ? "bg-blue-400"
                                    : "bg-slate-500"
                            }`}
                    />

                    {color || "—"}

                </span>

            </td>


            {/* PAYOUT */}

            <td className="px-5 py-4">

                <p className="text-sm font-bold text-green-400">

                    {currency(
                        payoutAmount
                    )}

                </p>

            </td>


            {/* STATUS */}

            <td className="px-5 py-4">

                <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${statusClass[
                        status
                    ] ||
                        "border-slate-500/20 bg-slate-500/10 text-slate-400"
                        }`}
                >

                    {status.replace(
                        "_",
                        " "
                    )}

                </span>

            </td>


            {/* TIME */}

            <td className="px-5 py-4">

                <span className="whitespace-nowrap text-xs text-slate-500">

                    {typeof formatDate ===
                        "function"
                        ? formatDate(
                            payout?.time
                        )
                        : "—"}

                </span>

            </td>


            {/* ACTION */}

            <td className="px-5 py-4">

                <div className="flex items-center gap-2">

                    {/* VIEW */}

                    <button
                        type="button"
                        onClick={
                            onView
                        }
                        className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-2 text-xs font-semibold text-slate-400 transition hover:border-purple-500/20 hover:bg-purple-500/5 hover:text-white"
                    >

                        View

                        <ChevronRight
                            size={14}
                        />

                    </button>


                    {/* RETRY */}

                    {status ===
                        "failed" && (

                            <button
                                type="button"
                                disabled={
                                    actionLoading
                                }
                                onClick={
                                    onRetry
                                }
                                title="Retry payout"
                                className="flex cursor-pointer items-center justify-center rounded-lg border border-yellow-500/20 bg-yellow-500/[0.04] p-2 text-yellow-400 transition hover:bg-yellow-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                            >

                                <RotateCcw
                                    size={14}
                                />

                            </button>

                        )}


                    {/* MANUAL REVIEW */}

                    {(status ===
                        "failed" ||
                        status ===
                        "pending") && (

                            <button
                                type="button"
                                disabled={
                                    actionLoading
                                }
                                onClick={
                                    onManualReview
                                }
                                title="Manual review"
                                className="flex cursor-pointer items-center justify-center rounded-lg border border-purple-500/20 bg-purple-500/[0.04] p-2 text-purple-400 transition hover:bg-purple-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                            >

                                <AlertTriangle
                                    size={14}
                                />

                            </button>

                        )}


                    {/* CANCEL */}

                    {(status ===
                        "pending" ||
                        status ===
                        "failed" ||
                        status ===
                        "manual_review") && (

                            <button
                                type="button"
                                disabled={
                                    actionLoading
                                }
                                onClick={
                                    onCancel
                                }
                                title="Cancel payout"
                                className="flex cursor-pointer items-center justify-center rounded-lg border border-red-500/20 bg-red-500/[0.04] p-2 text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                            >

                                <Ban
                                    size={14}
                                />

                            </button>

                        )}

                    {/* REVERSE */}

                    {status === "paid" && (

                        <button
                            type="button"
                            disabled={actionLoading}
                            onClick={onReverse}
                            title="Reverse payout"
                            className="flex cursor-pointer items-center justify-center rounded-lg border border-red-500/20 bg-red-500/[0.04] p-2 text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >

                            <Undo2 size={14} />

                        </button>

                    )}

                    {/* REFUND */}

                    {status === "failed" && (

                        <button
                            type="button"
                            disabled={actionLoading}
                            onClick={onRefund}
                            title="Refund user"
                            className="flex cursor-pointer items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/[0.04] p-2 text-blue-400 transition hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >

                            <Banknote size={14} />

                        </button>

                    )}

                    {/* RESTORE */}

                    {status === "reversed" && (

                        <button
                            type="button"
                            disabled={actionLoading}
                            onClick={onRestore}
                            title="Restore payout"
                            className="flex cursor-pointer items-center justify-center rounded-lg border border-green-500/20 bg-green-500/[0.04] p-2 text-green-400 transition hover:bg-green-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >

                            <Undo2 size={14} />

                        </button>

                    )}

                </div>

            </td>

        </tr>
    );
}