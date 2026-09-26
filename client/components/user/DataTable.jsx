"use client";

// ======================================================
// SHARED USER-FACING DATA TABLE
// ======================================================
//
// Matches the exact visual system already established by the
// admin panel's AdminTable component (itself matching the
// Rounds page table): same card, header, row spacing, border,
// radius, padding, alignment and hover behavior - so every
// table across the app (admin and user-facing) looks and feels
// the same, per the "one table system" requirement.

export default function DataTable({

    title,

    subtitle,

    count,

    headers = [],

    empty = false,

    emptyTitle = "No data found",

    emptyMessage = "There is no data to display.",

    minWidth = "800px",

    children,

}) {

    return (
        <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0d101d]">

            {title && (

                <div className="border-b border-white/[0.06] px-5 py-4 sm:px-6">

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                        <div>

                            {subtitle && (

                                <p className="text-xs uppercase tracking-[0.15em] text-slate-400">
                                    {subtitle}
                                </p>

                            )}

                            <h3 className="mt-1 text-lg font-bold text-white">
                                {title}
                            </h3>

                        </div>

                        {count !== undefined && (

                            <span className="w-fit rounded-full bg-white/[0.04] px-3 py-1 text-xs text-slate-500">
                                {count} loaded
                            </span>

                        )}

                    </div>

                </div>

            )}

            {empty ? (

                <div className="px-6 py-16 text-center">
                    <h3 className="text-sm font-bold text-slate-400">{emptyTitle}</h3>
                    <p className="mt-1 text-xs text-slate-500">{emptyMessage}</p>
                </div>

            ) : (

                <div className="overflow-x-auto">
                    <table className="w-full" style={{ minWidth }}>
                        <thead>
                            <tr className="border-b border-white/[0.05] bg-white/[0.015] text-left">
                                {headers.map((header) => (
                                    <th
                                        key={header.key || header}
                                        className="px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500"
                                    >
                                        {header.label || header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {children}
                        </tbody>
                    </table>
                </div>

            )}

        </div>
    );

}

export function DataTableRow({ children, className = "", onClick }) {

    return (
        <tr
            onClick={onClick}
            className={`border-b border-white/[0.04] transition last:border-b-0 hover:bg-white/[0.015] ${onClick ? "cursor-pointer" : ""} ${className}`}
        >
            {children}
        </tr>
    );

}

export function DataTableCell({ children, className = "" }) {

    return (
        <td className={`px-5 py-4 text-sm ${className}`}>
            {children}
        </td>
    );

}
