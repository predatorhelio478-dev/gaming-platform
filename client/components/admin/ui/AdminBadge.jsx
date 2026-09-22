"use client";

export default function AdminBadge({
    children,
    variant = "default",
}) {
    const variants = {
        success:
            "border-green-500/20 bg-green-500/10 text-green-400",

        danger:
            "border-red-500/20 bg-red-500/10 text-red-400",

        warning:
            "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",

        info:
            "border-blue-500/20 bg-blue-500/10 text-blue-400",

        purple:
            "border-purple-500/20 bg-purple-500/10 text-purple-300",

        default:
            "border-slate-500/20 bg-slate-500/10 text-slate-400",
    };


    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${variants[variant] ||
                variants.default
                }`}
        >
            {children}
        </span>
    );
}