export default function BetDistribution({ stats, formatCurrency }) {
    const total = stats.redAmount + stats.greenAmount + stats.blueAmount;

    const items = [
        ["RED", stats.redAmount, "text-red-400", "bg-red-500"],
        ["GREEN", stats.greenAmount, "text-green-400", "bg-green-500"],
        ["BLUE", stats.blueAmount, "text-blue-400", "bg-blue-500"],
    ];

    return (
        <section className="rounded-2xl border border-white/[0.06] bg-[#0d101d] p-5 sm:p-6 xl:col-span-2">
            <p className="text-xs uppercase tracking-wider text-slate-600">Current Exposure</p>
            <h3 className="mt-1 text-lg font-bold">Bet Distribution</h3>

            <div className="mt-6 space-y-5">
                {items.map(([name, amount, textColor, barColor]) => {
                    const percentage = total > 0 ? (amount / total) * 100 : 0;

                    return (
                        <div key={name}>
                            <div className="mb-2 flex justify-between text-sm">
                                <span className="font-semibold">{name}</span>
                                <span className={`font-semibold ${textColor}`}>
                                    {formatCurrency(amount)}
                                </span>
                            </div>

                            <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
                                <div
                                    className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>

                            <p className="mt-1 text-right text-[12px] text-slate-500">
                                {percentage.toFixed(1)}%
                            </p>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-white/[0.06] pt-4">
                <span className="text-xs uppercase tracking-wider text-slate-600">Total Exposure</span>
                <span className="font-bold">{formatCurrency(total)}</span>
            </div>
        </section>
    );
}
