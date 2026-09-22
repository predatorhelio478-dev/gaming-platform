"use client";

export default function AdminTable({

    title,

    subtitle,

    count,

    headers = [],

    empty = false,

    emptyTitle = "No data found",

    emptyMessage = "There is no data to display.",

    minWidth = "1000px",

    icon = null,

    headerAction = null,

    children,
}) {
    return (
        <section className="mt-6 overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0d101d]">

            {/* HEADER */}

            {title && (

                <div className="border-b border-white/[0.06] px-5 py-4 sm:px-6">

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                        {/* LEFT */}

                        <div className="flex items-center gap-3">

                            {/* ICON */}

                            {icon && (

                                <span
                                    className="
                            flex
                            h-11
                            w-11
                            shrink-0
                            items-center
                            justify-center
                            rounded-xl
                            bg-violet-500/10
                            text-violet-400
                        "
                                >

                                    {icon}

                                </span>

                            )}


                            {/* TITLE */}

                            <div>

                                <h3
                                    className="
                            text-lg
                            font-bold
                            text-white
                        "
                                >
                                    {title}
                                </h3>


                                {subtitle && (

                                    <p
                                        className="
                                mt-1
                                text-[11px]
                                uppercase
                                tracking-[0.15em]
                                text-slate-600
                            "
                                    >
                                        {subtitle}
                                    </p>

                                )}

                            </div>

                        </div>


                        {/* RIGHT */}

                        {(count !== undefined || headerAction) && (

                            <div className="flex items-center gap-2">

                                {count !== undefined && (

                                    <span
                                        className="
                                rounded-full
                                bg-white/[0.04]
                                px-3
                                py-1
                                text-xs
                                text-slate-500
                            "
                                    >
                                        {count} loaded
                                    </span>

                                )}


                                {headerAction && (
                                    headerAction
                                )}

                            </div>

                        )}

                    </div>

                </div>

            )}


            {/* EMPTY */}

            {empty ? (

                <div className="px-6 py-16 text-center">

                    <h3 className="text-sm font-bold text-slate-400">
                        {emptyTitle}
                    </h3>

                    <p className="mt-1 text-xs text-slate-700">
                        {emptyMessage}
                    </p>

                </div>

            ) : (

                <div className="overflow-x-auto">

                    <table
                        className="w-full"
                        style={{
                            minWidth,
                        }}
                    >

                        <thead>

                            <tr className="border-b border-white/[0.05] bg-white/[0.015] text-left">

                                {headers.map(
                                    (header) => (
                                        <th
                                            key={
                                                header.key ||
                                                header.label
                                            }
                                            className="px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500"
                                        >
                                            {header.label}
                                        </th>
                                    )
                                )}

                            </tr>

                        </thead>

                        <tbody>
                            {children}
                        </tbody>

                    </table>

                </div>

            )}

        </section>
    );
}


/*
|--------------------------------------------------------------------------
| TABLE ROW
|--------------------------------------------------------------------------
*/

export function AdminTableRow({
    children,
    onClick,
    className = "",
}) {
    return (
        <tr
            onClick={onClick}
            className={`border-b border-white/[0.04] transition last:border-b-0 hover:bg-white/[0.015] ${onClick
                ? "cursor-pointer"
                : ""
                } ${className}`}
        >
            {children}
        </tr>
    );
}


/*
|--------------------------------------------------------------------------
| TABLE CELL
|--------------------------------------------------------------------------
*/

export function AdminTableCell({
    children,
    className = "",
    ...rest
}) {
    return (
        <td
            className={`px-5 py-4 ${className}`}
            {...rest}
        >
            {children}
        </td>
    );
}