"use client";

// ======================================================
// SHARED ADMIN/USER STATISTIC CARD
// ======================================================
//
// Matches the Game Control page's "Status / Current Round /
// Remaining Time" cards exactly (rounded-xl border bg card,
// uppercase label top-left, large white value below, colorful
// icon in a rounded-xl tinted box on the right) - that page's
// own markup is left untouched; this is the shared component
// every OTHER statistic/info card (Admin and User) reuses so
// every card in the app shares one icon/color/spacing system.

const COLOR_CLASSES = {
    violet: "bg-violet-500/10 text-violet-400",
    cyan: "bg-cyan-500/10 text-cyan-400",
    orange: "bg-orange-500/10 text-orange-400",
    emerald: "bg-emerald-500/10 text-emerald-400",
    red: "bg-red-500/10 text-red-400",
    blue: "bg-blue-500/10 text-blue-400",
    yellow: "bg-yellow-500/10 text-yellow-400",
    amber: "bg-amber-500/10 text-amber-400",
    purple: "bg-purple-500/10 text-purple-400",
    pink: "bg-pink-500/10 text-pink-400",
    green: "bg-green-500/10 text-green-400",
    slate: "bg-slate-500/10 text-slate-400",
};

export default function AdminStatCard({
    icon: Icon,
    label,
    value,
    hint,
    color = "violet",
}) {

    const iconClasses = COLOR_CLASSES[color] || COLOR_CLASSES.violet;

    return (
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.025] p-5 transition duration-200 hover:border-white/[0.08]">

            <div className="flex items-center justify-between gap-4">

                <div className="min-w-0">

                    <p className="truncate text-xs font-semibold uppercase tracking-wider text-slate-600">
                        {label}
                    </p>

                    <p className="mt-3 truncate text-xl font-black text-white">
                        {value}
                    </p>

                    {hint && (
                        <p className="mt-1 text-[12px] text-slate-500">
                            {hint}
                        </p>
                    )}

                </div>

                {Icon && (

                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClasses}`}>
                        <Icon size={20} strokeWidth={1.8} />
                    </span>

                )}

            </div>

        </div>
    );
}
