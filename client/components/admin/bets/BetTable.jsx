"use client";

import {
    Eye,
    Search,
    ChevronRight,
    ChevronLeft,
    ChevronsLeft,
    ChevronsRight,
} from "lucide-react";

export default function BetTable({
    bets = [],
    pagination = {},
    refreshing = false,
    formatCurrency,
    formatDate,
    onView,
    onPrevious,
    onNext,
    onPageChange,
}) {
    const currentPage =
        Number(pagination?.page) || 1;

    const totalPages =
        Number(pagination?.totalPages) || 1;

    const total =
        Number(pagination?.total) || 0;

    const limit =
        Number(pagination?.limit) || 20;

    /*
    |--------------------------------------------------------------------------
    | PAGE NUMBERS
    |--------------------------------------------------------------------------
    */

    const getPageNumbers = () => {
        if (totalPages <= 7) {
            return Array.from(
                { length: totalPages },
                (_, index) => index + 1
            );
        }

        const pages = [];

        pages.push(1);

        if (currentPage > 4) {
            pages.push("left-ellipsis");
        }

        const start = Math.max(
            2,
            currentPage - 1
        );

        const end = Math.min(
            totalPages - 1,
            currentPage + 1
        );

        for (
            let page = start;
            page <= end;
            page++
        ) {
            pages.push(page);
        }

        if (
            currentPage <
            totalPages - 3
        ) {
            pages.push("right-ellipsis");
        }

        pages.push(totalPages);

        return pages;
    };

    const pageNumbers =
        getPageNumbers();

    /*
    |--------------------------------------------------------------------------
    | SHOWING RANGE
    |--------------------------------------------------------------------------
    */

    const startItem =
        total === 0
            ? 0
            : (currentPage - 1) *
            limit +
            1;

    const endItem =
        total === 0
            ? 0
            : Math.min(
                currentPage * limit,
                total
            );

    /*
    |--------------------------------------------------------------------------
    | PAGE CHANGE
    |--------------------------------------------------------------------------
    */

    const handlePageChange = (
        page
    ) => {
        if (
            refreshing ||
            page === currentPage ||
            page < 1 ||
            page > totalPages
        ) {
            return;
        }

        if (
            typeof onPageChange ===
            "function"
        ) {
            onPageChange(page);
        }
    };

    return (
        <section className="mt-6 overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0d101d]">

            {/* =====================================================
                HEADER
            ===================================================== */}

            <div className="border-b border-white/[0.06] px-5 py-4 sm:px-6">

                <div className="flex items-center justify-between">

                    <div>

                        <p className="text-xs uppercase tracking-[0.15em] text-slate-600">
                            Betting Activity
                        </p>

                        <h3 className="mt-1 text-lg font-bold text-white">
                            All Bets
                        </h3>

                    </div>

                    <span className="rounded-full bg-white/[0.04] px-3 py-1 text-xs text-slate-500">
                        {bets.length} loaded
                    </span>

                </div>

            </div>


            {/* =====================================================
                EMPTY
            ===================================================== */}

            {bets.length === 0 ? (

                <div className="px-6 py-16 text-center">

                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.03] text-slate-600">

                        <Search size={20} />

                    </div>

                    <h3 className="mt-4 text-sm font-bold text-slate-400">
                        No bets found
                    </h3>

                    <p className="mt-1 text-xs text-slate-700">
                        No bets match the
                        current filters.
                    </p>

                </div>

            ) : (

                /* =================================================
                   TABLE
                ================================================= */

                <div className="overflow-x-auto">

                    <table className="w-full min-w-[1100px]">

                        <thead>

                            <tr className="border-b border-white/[0.05] text-left">

                                <TableHeader>
                                    User
                                </TableHeader>

                                <TableHeader>
                                    Round
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
                                    Created At
                                </TableHeader>

                                <TableHeader>
                                    Action
                                </TableHeader>

                            </tr>

                        </thead>


                        <tbody>

                            {bets.map(
                                (bet) => (
                                    <BetTableRow
                                        key={
                                            bet?._id ||
                                            bet?.id
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
                                        onView={() =>
                                            onView?.(
                                                bet
                                            )
                                        }
                                    />
                                )
                            )}

                        </tbody>

                    </table>

                </div>

            )}


            {/* =====================================================
                PAGINATION
            ===================================================== */}

            <div className="border-t border-white/[0.06] px-4 py-4 sm:px-5">

                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

                    {/* RANGE */}

                    <p className="text-xs text-slate-600">

                        Showing{" "}

                        <span className="font-semibold text-slate-400">
                            {startItem}
                        </span>

                        {" – "}

                        <span className="font-semibold text-slate-400">
                            {endItem}
                        </span>

                        {" of "}

                        <span className="font-semibold text-slate-400">
                            {total.toLocaleString(
                                "en-IN"
                            )}
                        </span>

                        {" bets"}

                    </p>


                    {/* DESKTOP PAGINATION */}

                    <div className="hidden items-center gap-1 sm:flex">

                        {/* FIRST */}

                        <PaginationButton
                            onClick={() =>
                                handlePageChange(
                                    1
                                )
                            }
                            disabled={
                                currentPage ===
                                1 ||
                                refreshing
                            }
                            title="First page"
                        >
                            <ChevronsLeft
                                size={15}
                            />
                        </PaginationButton>


                        {/* PREVIOUS */}

                        <PaginationButton
                            onClick={() =>
                                handlePageChange(
                                    currentPage -
                                    1
                                )
                            }
                            disabled={
                                currentPage ===
                                1 ||
                                refreshing
                            }
                            title="Previous page"
                        >
                            <ChevronLeft
                                size={15}
                            />
                        </PaginationButton>


                        {/* PAGE NUMBERS */}

                        {pageNumbers.map(
                            (
                                page,
                                index
                            ) => {

                                if (
                                    typeof page !==
                                    "number"
                                ) {
                                    return (
                                        <span
                                            key={`${page}-${index}`}
                                            className="flex h-9 min-w-9 items-center justify-center px-1 text-xs text-slate-700"
                                        >
                                            ...
                                        </span>
                                    );
                                }

                                return (
                                    <button
                                        key={
                                            page
                                        }
                                        type="button"
                                        onClick={() =>
                                            handlePageChange(
                                                page
                                            )
                                        }
                                        disabled={
                                            refreshing
                                        }
                                        className={`flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-lg px-2 text-xs font-semibold transition ${page ===
                                                currentPage
                                                ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20"
                                                : "text-slate-500 hover:bg-white/[0.05] hover:text-white"
                                            } ${refreshing
                                                ? "cursor-not-allowed opacity-50"
                                                : ""
                                            }`}
                                    >
                                        {
                                            page
                                        }
                                    </button>
                                );
                            }
                        )}


                        {/* NEXT */}

                        <PaginationButton
                            onClick={() =>
                                handlePageChange(
                                    currentPage +
                                    1
                                )
                            }
                            disabled={
                                currentPage ===
                                totalPages ||
                                refreshing
                            }
                            title="Next page"
                        >
                            <ChevronRight
                                size={15}
                            />
                        </PaginationButton>


                        {/* LAST */}

                        <PaginationButton
                            onClick={() =>
                                handlePageChange(
                                    totalPages
                                )
                            }
                            disabled={
                                currentPage ===
                                totalPages ||
                                refreshing
                            }
                            title="Last page"
                        >
                            <ChevronsRight
                                size={15}
                            />
                        </PaginationButton>

                    </div>


                    {/* MOBILE PAGINATION */}

                    <div className="flex items-center justify-between gap-3 sm:hidden">

                        <button
                            type="button"
                            onClick={() =>
                                handlePageChange(
                                    currentPage -
                                    1
                                )
                            }
                            disabled={
                                currentPage ===
                                1 ||
                                refreshing
                            }
                            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                        >
                            <ChevronLeft
                                size={14}
                            />

                            Previous
                        </button>


                        <span className="text-xs text-slate-500">

                            <span className="font-bold text-white">
                                {currentPage}
                            </span>

                            {" / "}

                            {totalPages}

                        </span>


                        <button
                            type="button"
                            onClick={() =>
                                handlePageChange(
                                    currentPage +
                                    1
                                )
                            }
                            disabled={
                                currentPage ===
                                totalPages ||
                                refreshing
                            }
                            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                        >
                            Next

                            <ChevronRight
                                size={14}
                            />
                        </button>

                    </div>

                </div>

            </div>

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
        <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-600">
            {children}
        </th>
    );
}


/*
|--------------------------------------------------------------------------
| PAGINATION BUTTON
|--------------------------------------------------------------------------
*/

function PaginationButton({
    children,
    onClick,
    disabled,
    title,
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            className="flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.025] text-slate-500 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
        >
            {children}
        </button>
    );
}


/*
|--------------------------------------------------------------------------
| TABLE ROW
|--------------------------------------------------------------------------
*/

function BetTableRow({
    bet,
    formatCurrency,
    formatDate,
    onView,
}) {
    const username =
        bet?.user?.username ||
        bet?.user?.fullName ||
        "Unknown User";

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

                        <p className="mt-0.5 max-w-[170px] truncate text-[10px] text-slate-700">
                            {bet?.user?.email ||
                                "—"}
                        </p>

                    </div>

                </div>

            </td>


            {/* ROUND */}

            <td className="px-5 py-4">

                <p className="text-sm font-bold text-purple-300">
                    #
                    {bet?.round
                        ?.roundNumber ??
                        "—"}
                </p>

            </td>


            {/* COLOR */}

            <td className="px-5 py-4">

                <ColorBadge
                    color={
                        bet?.color
                    }
                />

            </td>


            {/* AMOUNT */}

            <td className="px-5 py-4">

                <p className="text-sm font-semibold text-slate-300">
                    {typeof formatCurrency ===
                        "function"
                        ? formatCurrency(
                            bet?.amount ||
                            0
                        )
                        : `₹${Number(
                            bet?.amount ||
                            0
                        ).toLocaleString(
                            "en-IN"
                        )}`}
                </p>

            </td>


            {/* RESULT */}

            <td className="px-5 py-4">

                <ResultBadge
                    result={
                        bet?.result
                    }
                />

            </td>


            {/* PAYOUT */}

            <td className="px-5 py-4">

                <p
                    className={
                        Number(
                            bet?.payout ||
                            0
                        ) > 0
                            ? "text-sm font-semibold text-green-400"
                            : "text-sm font-semibold text-slate-600"
                    }
                >
                    {typeof formatCurrency ===
                        "function"
                        ? formatCurrency(
                            bet?.payout ||
                            0
                        )
                        : `₹${Number(
                            bet?.payout ||
                            0
                        ).toLocaleString(
                            "en-IN"
                        )}`}
                </p>

            </td>


            {/* CREATED */}

            <td className="px-5 py-4">

                <span className="whitespace-nowrap text-xs text-slate-500">
                    {typeof formatDate ===
                        "function"
                        ? formatDate(
                            bet?.createdAt
                        )
                        : "—"}
                </span>

            </td>


            {/* ACTION */}

            <td className="px-5 py-4">

                <button
                    type="button"
                    onClick={onView}
                    className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-2 text-xs font-semibold text-slate-400 transition hover:border-purple-500/20 hover:bg-purple-500/5 hover:text-white"
                >
                    View

                    <ChevronRight
                        size={14}
                    />
                </button>

            </td>

        </tr>
    );
}


/*
|--------------------------------------------------------------------------
| COLOR BADGE
|--------------------------------------------------------------------------
*/

function ColorBadge({
    color,
}) {
    const normalized =
        String(
            color || ""
        ).toLowerCase();

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
                "border-slate-500/20 bg-slate-500/10 text-slate-400"
                }`}
        >
            <span
                className={`h-1.5 w-1.5 rounded-full ${dots[normalized] ||
                    "bg-slate-500"
                    }`}
            />

            {normalized || "—"}
        </span>
    );
}


/*
|--------------------------------------------------------------------------
| RESULT BADGE
|--------------------------------------------------------------------------
*/

function ResultBadge({
    result,
}) {
    if (!result) {
        return (
            <span className="text-xs text-slate-700">
                —
            </span>
        );
    }

    const normalized =
        String(result).toLowerCase();

    const classes = {
        won:
            "bg-green-500/10 text-green-400 border-green-500/20",

        lost:
            "bg-red-500/10 text-red-400 border-red-500/20",

        pending:
            "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    };

    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${classes[normalized] ||
                "border-slate-500/20 bg-slate-500/10 text-slate-400"
                }`}
        >
            {normalized}
        </span>
    );
}