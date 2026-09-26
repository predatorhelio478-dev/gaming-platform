"use client";

// ======================================================
// SHARED USER STATISTIC CARD
// ======================================================
//
// Mirrors components/admin/ui/AdminStatCard.jsx exactly (in
// turn matching the Game Control page's colorful icon-box
// cards) so every statistic/info card in the app - Admin and
// User alike - shares one icon/color/spacing system.

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

export default function UserStatCard({
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

                    <p className="truncate text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {label}
                    </p>

                    <p className="mt-3 truncate text-xl font-black text-white">
                        {value}
                    </p>

                    {hint && (
                        <p className="mt-1 text-[12px] text-slate-400">
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
