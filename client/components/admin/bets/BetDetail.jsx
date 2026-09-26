"use client";

import {
    X,
    User,
    Hash,
    Palette,
    CircleDollarSign,
    Trophy,
    CalendarDays,
} from "lucide-react";

export default function BetDetail({
    bet,
    onClose,
}) {
    if (!bet) {
        return null;
    }

    const formatCurrency = (value) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(Number(value || 0));
    };

    const formatDate = (value) => {
        if (!value) {
            return "—";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "—";
        }

        return date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    };

    const username =
        bet?.user?.username ||
        bet?.user?.fullName ||
        "Unknown User";

    const color =
        String(bet?.color || "")
            .toUpperCase();

    const result =
        String(bet?.result || "pending")
            .toUpperCase();

    const resultClass =
        bet?.result === "won"
            ? "text-green-400 bg-green-500/10 border-green-500/20"
            : bet?.result === "lost"
                ? "text-red-400 bg-red-500/10 border-red-500/20"
                : "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";

    const colorClass =
        bet?.color === "red"
            ? "text-red-400 bg-red-500/10 border-red-500/20"
            : bet?.color === "green"
                ? "text-green-400 bg-green-500/10 border-green-500/20"
                : "text-blue-400 bg-blue-500/10 border-blue-500/20";

    return (
        <>
            {/* BACKDROP */}

            <div
                className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />


            {/* DRAWER */}

            <aside className="fixed right-0 top-0 z-[90] flex h-full w-full max-w-md flex-col border-l border-white/[0.08] bg-[#0a0d18] shadow-2xl">

                {/* HEADER */}

                <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-5">

                    <div>

                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400">
                            Bet Details
                        </p>

                        <h2 className="mt-1 text-lg font-black text-white">
                            Bet Information
                        </h2>

                    </div>


                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer rounded-lg border border-white/[0.07] p-2 text-slate-500 transition hover:bg-white/[0.05] hover:text-white"
                    >
                        <X size={18} />
                    </button>

                </div>


                {/* CONTENT */}

                <div className="flex-1 overflow-y-auto p-5">

                    {/* BET ID */}

                    <div className="mb-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">

                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                            Bet ID
                        </p>

                        <p className="mt-2 break-all font-mono text-xs text-slate-400">
                            {bet?._id || "—"}
                        </p>

                    </div>


                    {/* USER */}

                    <DetailRow
                        icon={User}
                        label="User"
                        value={username}
                        subValue={
                            bet?.user?.email
                        }
                    />


                    {/* ROUND */}

                    <DetailRow
                        icon={Hash}
                        label="Round"
                        value={
                            bet?.round
                                ?.roundNumber
                                ? `#${bet.round.roundNumber}`
                                : "—"
                        }
                    />


                    {/* COLOR */}

                    <div className="flex items-center justify-between border-b border-white/[0.05] py-4">

                        <div className="flex items-center gap-3">

                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.03] text-slate-500">

                                <Palette size={16} />

                            </div>

                            <span className="text-xs text-slate-500">
                                Color
                            </span>

                        </div>


                        <span
                            className={`rounded-full border px-3 py-1 text-[10px] font-bold ${colorClass}`}
                        >
                            {color || "—"}
                        </span>

                    </div>


                    {/* AMOUNT */}

                    <DetailRow
                        icon={CircleDollarSign}
                        label="Bet Amount"
                        value={formatCurrency(
                            bet?.amount
                        )}
                    />


                    {/* RESULT */}

                    <div className="flex items-center justify-between border-b border-white/[0.05] py-4">

                        <div className="flex items-center gap-3">

                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.03] text-slate-500">

                                <Trophy size={16} />

                            </div>

                            <span className="text-xs text-slate-500">
                                Result
                            </span>

                        </div>


                        <span
                            className={`rounded-full border px-3 py-1 text-[10px] font-bold ${resultClass}`}
                        >
                            {result}
                        </span>

                    </div>


                    {/* PAYOUT */}

                    <DetailRow
                        icon={Trophy}
                        label="Payout"
                        value={formatCurrency(
                            bet?.payout
                        )}
                    />


                    {/* CREATED */}

                    <DetailRow
                        icon={CalendarDays}
                        label="Created At"
                        value={formatDate(
                            bet?.createdAt
                        )}
                    />


                    {/* UPDATED */}

                    <DetailRow
                        icon={CalendarDays}
                        label="Updated At"
                        value={formatDate(
                            bet?.updatedAt
                        )}
                    />


                    {/* ROUND RESULT */}

                    <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">

                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                            Round Information
                        </p>


                        <div className="mt-3 space-y-3">

                            <InfoLine
                                label="Round"
                                value={
                                    bet?.round
                                        ?.roundNumber
                                        ? `#${bet.round.roundNumber}`
                                        : "—"
                                }
                            />

                            <InfoLine
                                label="Round Status"
                                value={
                                    bet?.round
                                        ?.status ||
                                    "—"
                                }
                            />

                            <InfoLine
                                label="Winning Color"
                                value={
                                    bet?.round
                                        ?.result
                                        ? String(
                                            bet.round.result
                                        ).toUpperCase()
                                        : "—"
                                }
                            />

                        </div>

                    </div>

                </div>

            </aside>
        </>
    );
}


/*
|--------------------------------------------------------------------------
| DETAIL ROW
|--------------------------------------------------------------------------
*/

function DetailRow({
    icon: Icon,
    label,
    value,
    subValue,
}) {
    return (
        <div className="flex items-center justify-between border-b border-white/[0.05] py-4">

            <div className="flex min-w-0 items-center gap-3">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.03] text-slate-500">

                    <Icon size={16} />

                </div>


                <div className="min-w-0">

                    <p className="text-xs text-slate-500">
                        {label}
                    </p>

                    {subValue && (
                        <p className="mt-0.5 max-w-[180px] truncate text-[10px] text-slate-500">
                            {subValue}
                        </p>
                    )}

                </div>

            </div>


            <p className="ml-4 max-w-[190px] truncate text-right text-xs font-semibold text-slate-300">
                {value}
            </p>

        </div>
    );
}


/*
|--------------------------------------------------------------------------
| INFO LINE
|--------------------------------------------------------------------------
*/

function InfoLine({
    label,
    value,
}) {
    return (
        <div className="flex items-center justify-between gap-4">

            <span className="text-xs text-slate-600">
                {label}
            </span>

            <span className="text-xs font-semibold text-slate-400">
                {value}
            </span>

        </div>
    );
}