"use client";

import {
    Hash,
    Clock3,
    ChevronRight,
    Search,
    CircleCheck,
    Lock,
    Activity,
    ChevronLeft,
    ChevronsLeft,
    ChevronsRight,
} from "lucide-react";

export default function RoundTable({
    rounds,
    pagination,
    refreshing,
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

    const limit =
        Number(
            pagination?.limit
        ) || 20;

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

            {/* =========================================================
                HEADER
            ========================================================= */}

            <div className="border-b border-white/[0.06] px-5 py-4 sm:px-6">

                <div className="flex items-center justify-between">

                    <div>
                        <p className="text-xs uppercase tracking-[0.15em] text-slate-600">
                            Round History
                        </p>

                        <h3 className="mt-1 text-lg font-bold text-white">
                            All Rounds
                        </h3>
                    </div>

                    <span className="rounded-full bg-white/[0.04] px-3 py-1 text-xs text-slate-500">
                        {rounds.length} loaded
                    </span>

                </div>

            </div>

            {/* =========================================================
                EMPTY
            ========================================================= */}

            {rounds.length === 0 ? (
                <div className="px-6 py-16 text-center">

                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.03] text-slate-600">
                        <Search size={20} />
                    </div>

                    <h3 className="mt-4 text-sm font-bold text-slate-400">
                        No rounds found
                    </h3>

                    <p className="mt-1 text-xs text-slate-700">
                        No rounds match the
                        current filters.
                    </p>

                </div>
            ) : (

                /* =====================================================
                   TABLE
                ===================================================== */

                <div className="overflow-x-auto">

                    <table className="w-full min-w-[1150px]">

                        <thead>

                            <tr className="border-b border-white/[0.05] text-left">

                                <TableHeader>
                                    Round
                                </TableHeader>

                                <TableHeader>
                                    Status
                                </TableHeader>

                                <TableHeader>
                                    Players
                                </TableHeader>

                                <TableHeader>
                                    Bets
                                </TableHeader>

                                <TableHeader>
                                    Amount
                                </TableHeader>

                                <TableHeader>
                                    Payout
                                </TableHeader>

                                <TableHeader>
                                    Result
                                </TableHeader>

                                <TableHeader>
                                    Start
                                </TableHeader>

                                <TableHeader>
                                    End
                                </TableHeader>

                                <TableHeader>
                                    Action
                                </TableHeader>

                            </tr>

                        </thead>

                        <tbody>

                            {rounds.map(
                                (round) => (
                                    <RoundTableRow
                                        key={
                                            round?._id ||
                                            round?.id ||
                                            round?.roundNumber
                                        }
                                        round={round}
                                        formatCurrency={
                                            formatCurrency
                                        }
                                        formatDate={
                                            formatDate
                                        }
                                        onView={() =>
                                            onView?.(
                                                round
                                            )
                                        }
                                    />
                                )
                            )}

                        </tbody>

                    </table>

                </div>
            )}

            {/* =========================================================
                PAGINATION
            ========================================================= */}

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
                        </span>{" "}
                        rounds
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
                            (page, index) => {

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
                                        key={page}
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
                                        {page}
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
        <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500">
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

function RoundTableRow({
    round,
    formatCurrency,
    formatDate,
    onView,
}) {
    return (
        <tr className="border-b border-white/[0.04] transition hover:bg-white/[0.015]">

            {/* ROUND */}

            <td className="px-5 py-4">

                <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                        <Hash size={15} />
                    </div>

                    <div>

                        <p className="text-sm font-bold text-white">
                            #
                            {round?.roundNumber ??
                                round?.number ??
                                "—"}
                        </p>

                        <p className="mt-0.5 text-[12px] text-slate-500">
                            {round?.gameType ||
                                "color_prediction"}
                        </p>

                    </div>

                </div>

            </td>

            {/* STATUS */}

            <td className="px-5 py-4">
                <StatusBadge
                    status={
                        round?.status
                    }
                />
            </td>

            {/* PLAYERS */}

            <td className="px-5 py-4">

                <p className="text-sm font-semibold text-slate-300">
                    {Number(
                        round?.playerCount ||
                        round?.players ||
                        0
                    ).toLocaleString(
                        "en-IN"
                    )}
                </p>

            </td>

            {/* BETS */}

            <td className="px-5 py-4">

                <p className="text-sm font-semibold text-slate-300">
                    {Number(
                        round?.totalBets ||
                        round?.bets ||
                        0
                    ).toLocaleString(
                        "en-IN"
                    )}
                </p>

            </td>

            {/* AMOUNT */}

            <td className="px-5 py-4">

                <p className="text-sm font-semibold text-slate-300">
                    {formatCurrency(
                        round?.totalAmount ||
                        round?.amount ||
                        0
                    )}
                </p>

            </td>

            {/* PAYOUT */}

            <td className="px-5 py-4">

                <p className="text-sm font-semibold text-green-400">
                    {formatCurrency(
                        round?.payoutTotal ||
                        round?.payout ||
                        0
                    )}
                </p>

            </td>

            {/* RESULT */}

            <td className="px-5 py-4">
                <ResultBadge
                    result={
                        round?.result
                    }
                />
            </td>

            {/* START */}

            <td className="px-5 py-4">

                <div className="flex items-center gap-2">

                    <Clock3
                        size={13}
                        className="text-slate-700"
                    />

                    <span className="text-xs text-slate-500">
                        {formatDate(
                            round?.startTime ||
                            round?.startedAt
                        )}
                    </span>

                </div>

            </td>

            {/* END */}

            <td className="px-5 py-4">

                <div className="flex items-center gap-2">

                    <Clock3
                        size={13}
                        className="text-slate-700"
                    />

                    <span className="text-xs text-slate-500">
                        {formatDate(
                            round?.endTime ||
                            round?.endedAt
                        )}
                    </span>

                </div>

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
| STATUS BADGE
|--------------------------------------------------------------------------
*/

function StatusBadge({
    status,
}) {
    const normalized =
        String(
            status || "unknown"
        )
            .toLowerCase()
            .replaceAll(
                "_",
                " "
            );

    let className =
        "border-slate-500/20 bg-slate-500/10 text-slate-400";

    let Icon = Clock3;

    if (
        normalized ===
        "completed"
    ) {
        className =
            "border-green-500/20 bg-green-500/10 text-green-400";

        Icon = CircleCheck;
    }

    if (
        normalized ===
        "locked"
    ) {
        className =
            "border-yellow-500/20 bg-yellow-500/10 text-yellow-400";

        Icon = Lock;
    }

    if (
        normalized ===
        "betting"
    ) {
        className =
            "border-blue-500/20 bg-blue-500/10 text-blue-400";

        Icon = Activity;
    }

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${className}`}
        >
            <Icon size={11} />

            {normalized}
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
        String(
            result
        ).toLowerCase();

    const classes = {
        red: "bg-red-500/10 text-red-400 border-red-500/20",
        green: "bg-green-500/10 text-green-400 border-green-500/20",
        blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    };

    const dots = {
        red: "bg-red-400",
        green: "bg-green-400",
        blue: "bg-blue-400",
    };

    return (
        <span
            className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${classes[normalized] ||
                "border-slate-500/20 bg-slate-500/10 text-slate-400"
                }`}
        >
            <span
                className={`h-1.5 w-1.5 rounded-full ${dots[normalized] ||
                    "bg-slate-500"
                    }`}
            />

            {normalized}
        </span>
    );
}