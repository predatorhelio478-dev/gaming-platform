"use client";

import {
    X,
    Hash,
    Users,
    Receipt,
    WalletCards,
    Clock3,
    TrendingUp,
    Trophy,
    CircleDollarSign,
} from "lucide-react";


export default function RoundDetail({
    data,
    formatCurrency,
    formatDate,
    onClose,
    loading = false,
    error = "",
}) {

    /*
     * ------------------------------------------
     * LOADING
     * ------------------------------------------
     */

    if (loading) {
        return (
            <div className="fixed inset-0 z-[100]">

                <button
                    type="button"
                    aria-label="Close round details"
                    onClick={onClose}
                    className="absolute inset-0 cursor-pointer bg-black/70 backdrop-blur-sm"
                />

                <aside className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col border-l border-white/[0.06] bg-[#0a0d18]">

                    <DetailHeader
                        onClose={onClose}
                    />

                    <div className="flex flex-1 items-center justify-center">

                        <div className="text-center">

                            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-purple-500" />

                            <p className="mt-4 text-sm text-slate-500">
                                Loading round details...
                            </p>

                        </div>

                    </div>

                </aside>

            </div>
        );
    }


    /*
     * ------------------------------------------
     * ERROR
     * ------------------------------------------
     */

    if (error) {
        return (
            <div className="fixed inset-0 z-[100]">

                <button
                    type="button"
                    aria-label="Close round details"
                    onClick={onClose}
                    className="absolute inset-0 cursor-pointer bg-black/70 backdrop-blur-sm"
                />

                <aside className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col border-l border-white/[0.06] bg-[#0a0d18]">

                    <DetailHeader
                        onClose={onClose}
                    />

                    <div className="flex flex-1 items-center justify-center p-6">

                        <div className="w-full max-w-md rounded-2xl border border-red-500/10 bg-red-500/5 p-6 text-center">

                            <p className="text-sm font-semibold text-red-400">
                                Unable to load round
                                details
                            </p>

                            <p className="mt-2 text-xs text-slate-500">
                                {error}
                            </p>

                            <button
                                type="button"
                                onClick={onClose}
                                className="mt-5 cursor-pointer rounded-lg border border-white/[0.06] px-4 py-2 text-xs font-semibold text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
                            >
                                Close
                            </button>

                        </div>

                    </div>

                </aside>

            </div>
        );
    }


    /*
     * ------------------------------------------
     * NO DATA
     * ------------------------------------------
     */

    if (!data) {
        return null;
    }


    /*
     * ------------------------------------------
     * API DATA
     * ------------------------------------------
     */

    const round =
        data?.round || {};

    const summary =
        data?.summary || {};

    const bets =
        Array.isArray(data?.bets)
            ? data.bets
            : [];


    return (
        <div className="fixed inset-0 z-[100]">

            {/* BACKDROP */}

            <button
                type="button"
                aria-label="Close round details"
                onClick={onClose}
                className="absolute inset-0 cursor-pointer bg-black/70 backdrop-blur-sm"
            />


            {/* DRAWER */}

            <aside className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col border-l border-white/[0.06] bg-[#0a0d18] shadow-2xl">

                {/* HEADER */}

                <DetailHeader
                    round={round}
                    onClose={onClose}
                />


                {/* CONTENT */}

                <div className="flex-1 overflow-y-auto p-5 sm:p-6">

                    {/* ==========================================
                        ROUND OVERVIEW
                    ========================================== */}

                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">

                        <div className="flex items-start justify-between gap-4">

                            <div>

                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400">
                                    Round Overview
                                </p>

                                <h2 className="mt-2 text-2xl font-black text-white">
                                    #
                                    {round?.roundNumber ??
                                        "—"}
                                </h2>

                                <p className="mt-1 text-xs text-slate-600">
                                    {round?.gameType ||
                                        "color_prediction"}
                                </p>

                            </div>

                            <StatusBadge
                                status={
                                    round?.status
                                }
                            />

                        </div>


                        {/* RESULT */}

                        <div className="mt-5 flex items-center justify-between rounded-xl border border-white/[0.05] bg-black/10 px-4 py-3">

                            <div className="flex items-center gap-2">

                                <Trophy
                                    size={16}
                                    className="text-slate-600"
                                />

                                <span className="text-xs text-slate-500">
                                    Winning Color
                                </span>

                            </div>

                            <ResultBadge
                                result={
                                    round?.result
                                }
                            />

                        </div>

                    </div>


                    {/* ==========================================
                        SUMMARY
                    ========================================== */}

                    <div className="mt-5">

                        <p className="mb-3 text-[12px] font-bold uppercase tracking-[0.2em] text-slate-400">
                            Round Statistics
                        </p>


                        <div className="grid grid-cols-2 gap-3">

                            <StatCard
                                icon={
                                    <Users
                                        size={17}
                                    />
                                }
                                label="Players"
                                value={Number(
                                    summary?.players ||
                                    0
                                ).toLocaleString(
                                    "en-IN"
                                )}
                            />

                            <StatCard
                                icon={
                                    <Receipt
                                        size={17}
                                    />
                                }
                                label="Total Bets"
                                value={Number(
                                    summary?.totalBets ||
                                    0
                                ).toLocaleString(
                                    "en-IN"
                                )}
                            />

                            <StatCard
                                icon={
                                    <CircleDollarSign
                                        size={17}
                                    />
                                }
                                label="Bet Amount"
                                value={formatCurrency(
                                    summary?.totalAmount ||
                                    0
                                )}
                            />

                            <StatCard
                                icon={
                                    <WalletCards
                                        size={17}
                                    />
                                }
                                label="Total Payout"
                                value={formatCurrency(
                                    summary?.totalPayout ||
                                    0
                                )}
                            />

                        </div>

                    </div>


                    {/* ==========================================
                        BET RESULT SUMMARY
                    ========================================== */}

                    <div className="mt-5 grid grid-cols-3 gap-3">

                        <MiniStat
                            label="Won"
                            value={
                                summary?.wonBets ||
                                0
                            }
                            className="text-green-400"
                        />

                        <MiniStat
                            label="Lost"
                            value={
                                summary?.lostBets ||
                                0
                            }
                            className="text-red-400"
                        />

                        <MiniStat
                            label="Pending"
                            value={
                                summary?.pendingBets ||
                                0
                            }
                            className="text-yellow-400"
                        />

                    </div>


                    {/* ==========================================
                        COLOR DISTRIBUTION
                    ========================================== */}

                    <div className="mt-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">

                        <div className="flex items-center gap-2">

                            <TrendingUp
                                size={16}
                                className="text-slate-600"
                            />

                            <p className="text-xs font-semibold text-slate-400">
                                Color Distribution
                            </p>

                        </div>


                        <div className="mt-4 grid grid-cols-3 gap-3">

                            <ColorAmount
                                color="red"
                                amount={
                                    summary
                                        ?.colorTotals
                                        ?.red || 0
                                }
                                formatCurrency={
                                    formatCurrency
                                }
                            />

                            <ColorAmount
                                color="green"
                                amount={
                                    summary
                                        ?.colorTotals
                                        ?.green || 0
                                }
                                formatCurrency={
                                    formatCurrency
                                }
                            />

                            <ColorAmount
                                color="blue"
                                amount={
                                    summary
                                        ?.colorTotals
                                        ?.blue || 0
                                }
                                formatCurrency={
                                    formatCurrency
                                }
                            />

                        </div>

                    </div>


                    {/* ==========================================
                        TIMES
                    ========================================== */}

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">

                        <TimeCard
                            label="Start Time"
                            value={formatDate(
                                round?.startTime
                            )}
                        />

                        <TimeCard
                            label="End Time"
                            value={formatDate(
                                round?.endTime
                            )}
                        />

                    </div>


                    {/* ==========================================
                        BET DETAILS
                    ========================================== */}

                    <div className="mt-6">

                        <div className="mb-3 flex items-center justify-between">

                            <div>

                                <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                    Bet Details
                                </p>

                                <h3 className="mt-1 text-lg font-bold text-white">
                                    All Bets
                                </h3>

                            </div>

                            <span className="rounded-full bg-white/[0.04] px-3 py-1 text-xs text-slate-500">
                                {bets.length} bets
                            </span>

                        </div>


                        {bets.length === 0 ? (

                            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-10 text-center">

                                <Receipt
                                    size={20}
                                    className="mx-auto text-slate-500"
                                />

                                <p className="mt-3 text-sm text-slate-500">
                                    No bets found
                                </p>

                            </div>

                        ) : (

                            <div className="overflow-hidden rounded-2xl border border-white/[0.06]">

                                <div className="overflow-x-auto">

                                    <table className="w-full min-w-[750px]">

                                        <thead>

                                            <tr className="border-b border-white/[0.06] bg-white/[0.02] text-left">

                                                <TableHeader>
                                                    User
                                                </TableHeader>

                                                <TableHeader>
                                                    Color
                                                </TableHeader>

                                                <TableHeader>
                                                    Amount
                                                </TableHeader>

                                                <TableHeader>
                                                    Result
                                                </TableHeader>

                                                <TableHeader>
                                                    Payout
                                                </TableHeader>

                                                <TableHeader>
                                                    Created
                                                </TableHeader>

                                            </tr>

                                        </thead>

                                        <tbody>

                                            {bets.map(
                                                (
                                                    bet
                                                ) => (

                                                    <BetRow
                                                        key={
                                                            bet?._id
                                                        }
                                                        bet={
                                                            bet
                                                        }
                                                        formatCurrency={
                                                            formatCurrency
                                                        }
                                                        formatDate={
                                                            formatDate
                                                        }
                                                    />

                                                )
                                            )}

                                        </tbody>

                                    </table>

                                </div>

                            </div>

                        )}

                    </div>

                </div>

            </aside>

        </div>
    );
}


/*
|--------------------------------------------------------------------------
| HEADER
|--------------------------------------------------------------------------
*/

function DetailHeader({
    round,
    onClose,
}) {
    return (
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-5 py-5 sm:px-6">

            <div>

                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400">
                    Round Details
                </p>

                <h2 className="mt-1 text-lg font-black text-white">
                    {round?.roundNumber
                        ? `#${round.roundNumber}`
                        : "Round"}
                </h2>

            </div>

            <button
                type="button"
                onClick={onClose}
                aria-label="Close round details"
                className="cursor-pointer rounded-lg p-2 text-slate-500 transition hover:bg-white/[0.05] hover:text-white"
            >
                <X size={20} />
            </button>

        </div>
    );
}


/*
|--------------------------------------------------------------------------
| STAT CARD
|--------------------------------------------------------------------------
*/

function StatCard({
    icon,
    label,
    value,
}) {
    return (
        <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">

            <div className="flex items-center gap-2 text-slate-600">
                {icon}

                <span className="text-xs">
                    {label}
                </span>
            </div>

            <p className="mt-3 text-lg font-black text-white">
                {value}
            </p>

        </div>
    );
}


/*
|--------------------------------------------------------------------------
| MINI STAT
|--------------------------------------------------------------------------
*/

function MiniStat({
    label,
    value,
    className,
}) {
    return (
        <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">

            <p className="text-[10px] uppercase tracking-wider text-slate-500">
                {label}
            </p>

            <p
                className={`mt-2 text-lg font-black ${className}`}
            >
                {value}
            </p>

        </div>
    );
}


/*
|--------------------------------------------------------------------------
| COLOR AMOUNT
|--------------------------------------------------------------------------
*/

function ColorAmount({
    color,
    amount,
    formatCurrency,
}) {
    const styles = {
        red: {
            wrapper:
                "border-red-500/10 bg-red-500/5",
            dot:
                "bg-red-400",
            text:
                "text-red-400",
        },

        green: {
            wrapper:
                "border-green-500/10 bg-green-500/5",
            dot:
                "bg-green-400",
            text:
                "text-green-400",
        },

        blue: {
            wrapper:
                "border-blue-500/10 bg-blue-500/5",
            dot:
                "bg-blue-400",
            text:
                "text-blue-400",
        },
    };

    const style =
        styles[color] ||
        styles.red;

    return (
        <div
            className={`rounded-xl border p-3 ${style.wrapper}`}
        >

            <div className="flex items-center gap-2">

                <span
                    className={`h-2 w-2 rounded-full ${style.dot}`}
                />

                <span className="text-xs capitalize text-slate-500">
                    {color}
                </span>

            </div>

            <p
                className={`mt-2 text-sm font-black ${style.text}`}
            >
                {formatCurrency(
                    amount
                )}
            </p>

        </div>
    );
}


/*
|--------------------------------------------------------------------------
| TIME CARD
|--------------------------------------------------------------------------
*/

function TimeCard({
    label,
    value,
}) {
    return (
        <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">

            <div className="flex items-center gap-2">

                <Clock3
                    size={14}
                    className="text-slate-500"
                />

                <p className="text-[10px] uppercase tracking-wider text-slate-600">
                    {label}
                </p>

            </div>

            <p className="mt-2 text-xs text-slate-400">
                {value}
            </p>

        </div>
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
        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-600">
            {children}
        </th>
    );
}


/*
|--------------------------------------------------------------------------
| BET ROW
|--------------------------------------------------------------------------
*/

function BetRow({
    bet,
    formatCurrency,
    formatDate,
}) {
    const username =
        bet?.user?.username ||
        bet?.user?.fullName ||
        "Unknown User";

    return (
        <tr className="border-b border-white/[0.04] transition last:border-b-0 hover:bg-white/[0.015]">

            {/* USER */}

            <td className="px-4 py-4">

                <div className="flex items-center gap-3">

                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500/10 text-[10px] font-bold text-purple-300">
                        {username
                            ?.charAt(0)
                            ?.toUpperCase() ||
                            "U"}
                    </div>

                    <div className="min-w-0">

                        <p className="max-w-[140px] truncate text-xs font-semibold text-white">
                            {username}
                        </p>

                        {bet?.user?.email && (
                            <p className="max-w-[140px] truncate text-[10px] text-slate-500">
                                {bet.user.email}
                            </p>
                        )}

                    </div>

                </div>

            </td>


            {/* COLOR */}

            <td className="px-4 py-4">

                <ResultBadge
                    result={
                        bet?.color
                    }
                    label={
                        bet?.color
                    }
                />

            </td>


            {/* AMOUNT */}

            <td className="px-4 py-4">

                <span className="text-xs font-semibold text-slate-300">
                    {formatCurrency(
                        bet?.amount || 0
                    )}
                </span>

            </td>


            {/* RESULT */}

            <td className="px-4 py-4">

                <BetResultBadge
                    result={
                        bet?.result
                    }
                />

            </td>


            {/* PAYOUT */}

            <td className="px-4 py-4">

                <span className="text-xs font-semibold text-green-400">
                    {formatCurrency(
                        bet?.payout || 0
                    )}
                </span>

            </td>


            {/* CREATED */}

            <td className="px-4 py-4">

                <span className="whitespace-nowrap text-[10px] text-slate-600">
                    {formatDate(
                        bet?.createdAt
                    )}
                </span>

            </td>

        </tr>
    );
}


/*
|--------------------------------------------------------------------------
| STATUS BADGE
|--------------------------------------------------------------------------
*/

function StatusBadge({
    status,
}) {
    const normalized =
        String(
            status || "unknown"
        ).toLowerCase();

    let classes =
        "border-slate-500/20 bg-slate-500/10 text-slate-400";

    if (
        normalized ===
        "completed"
    ) {
        classes =
            "border-green-500/20 bg-green-500/10 text-green-400";
    }

    if (
        normalized ===
        "betting"
    ) {
        classes =
            "border-blue-500/20 bg-blue-500/10 text-blue-400";
    }

    if (
        normalized ===
        "locked"
    ) {
        classes =
            "border-yellow-500/20 bg-yellow-500/10 text-yellow-400";
    }

    if (
        normalized ===
        "waiting"
    ) {
        classes =
            "border-purple-500/20 bg-purple-500/10 text-purple-400";
    }

    return (
        <span
            className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase ${classes}`}
        >
            {normalized}
        </span>
    );
}


/*
|--------------------------------------------------------------------------
| COLOR BADGE
|--------------------------------------------------------------------------
*/

function ResultBadge({
    result,
    label,
}) {
    if (!result) {
        return (
            <span className="text-xs text-slate-500">
                —
            </span>
        );
    }

    const normalized =
        String(result).toLowerCase();

    const styles = {
        red:
            "border-red-500/20 bg-red-500/10 text-red-400",

        green:
            "border-green-500/20 bg-green-500/10 text-green-400",

        blue:
            "border-blue-500/20 bg-blue-500/10 text-blue-400",
    };

    const dots = {
        red: "bg-red-400",
        green: "bg-green-400",
        blue: "bg-blue-400",
    };

    return (
        <span
            className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${styles[normalized] ||
                "border-white/10 bg-white/5 text-slate-400"
                }`}
        >

            <span
                className={`h-1.5 w-1.5 rounded-full ${dots[normalized] ||
                    "bg-slate-500"
                    }`}
            />

            {label || normalized}

        </span>
    );
}


/*
|--------------------------------------------------------------------------
| BET RESULT
|--------------------------------------------------------------------------
*/

function BetResultBadge({
    result,
}) {
    const normalized =
        String(
            result || "pending"
        ).toLowerCase();

    const styles = {
        won:
            "border-green-500/20 bg-green-500/10 text-green-400",

        lost:
            "border-red-500/20 bg-red-500/10 text-red-400",

        pending:
            "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
    };

    return (
        <span
            className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${styles[normalized] ||
                styles.pending
                }`}
        >
            {normalized}
        </span>
    );
}