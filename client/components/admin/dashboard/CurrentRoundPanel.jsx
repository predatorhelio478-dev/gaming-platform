export default function CurrentRoundPanel({
    round,
    timer,
    gameStatus,
    statusLabel,
    statusColor,
    lastResult,
    resultClass,
}) {
    const formattedTimer = String(Math.max(0, Number(timer || 0))).padStart(2, "0");

    return (
        <section className="mt-6 rounded-2xl border border-white/[0.06] bg-[#0d101d] p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 border-b border-white/[0.06] pb-5 md:flex-row md:items-center">
                <div>
                    <p className="text-xs uppercase tracking-wider text-purple-400">Live Monitor</p>
                    <h3 className="mt-1 text-xl font-bold">Current Round</h3>
                </div>

                <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-white/[0.03] px-3 py-2 text-xs text-slate-500">Round</span>
                    <span className="rounded-lg border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-sm font-bold text-purple-300">
                        #{round?.roundNumber || "----"}
                    </span>
                </div>
            </div>

            <div className="grid gap-6 py-6 md:grid-cols-3">
                <div className="rounded-2xl border border-white/[0.06] bg-[#080a14] p-5">
                    <p className="text-xs uppercase tracking-wider text-slate-600">Remaining Time</p>
                    <div className="mt-3 flex items-end gap-2">
                        <span className="text-5xl font-black tabular-nums">{formattedTimer}</span>
                        <span className="mb-2 text-sm text-slate-600">sec</span>
                    </div>
                </div>

                <div className="rounded-2xl border border-white/[0.06] bg-[#080a14] p-5">
                    <p className="text-xs uppercase tracking-wider text-slate-600">Game Status</p>
                    <div className="mt-4">
                        <span className={`inline-flex rounded-full border bg-white/[0.03] px-4 py-2 text-sm font-bold ${statusColor}`}>
                            ● {statusLabel}
                        </span>
                    </div>
                </div>

                <div className="rounded-2xl border border-white/[0.06] bg-[#080a14] p-5">
                    <p className="text-xs uppercase tracking-wider text-slate-600">Last Result</p>
                    <div className="mt-3 flex items-center gap-3">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-full text-xs font-black uppercase ${resultClass}`}>
                            {lastResult?.charAt(0) || "—"}
                        </div>
                        <div>
                            <p className="font-bold uppercase">{lastResult || "Waiting"}</p>
                            <p className="text-xs text-slate-600">Latest completed round</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
