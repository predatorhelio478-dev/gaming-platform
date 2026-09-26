"use client";

import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from "lucide-react";

export default function AdminPagination({
    page = 1,
    totalPages = 1,
    total = 0,
    limit = 20,
    loading = false,
    itemLabel = "items",
    onPageChange,
}) {
    const currentPage =
        Number(page) || 1;

    const pages =
        Number(totalPages) || 1;

    const totalItems =
        Number(total) || 0;

    const perPage =
        Number(limit) || 20;


    const startItem =
        totalItems === 0
            ? 0
            : (currentPage - 1) *
            perPage +
            1;

    const endItem =
        totalItems === 0
            ? 0
            : Math.min(
                currentPage *
                perPage,
                totalItems
            );


    /*
    |--------------------------------------------------------------------------
    | PAGE NUMBERS
    |--------------------------------------------------------------------------
    */

    const getPages = () => {

        if (pages <= 7) {

            return Array.from(
                {
                    length: pages,
                },
                (_, index) =>
                    index + 1
            );

        }


        const result = [1];


        if (currentPage > 4) {
            result.push(
                "left-ellipsis"
            );
        }


        const start =
            Math.max(
                2,
                currentPage - 1
            );

        const end =
            Math.min(
                pages - 1,
                currentPage + 1
            );


        for (
            let index = start;
            index <= end;
            index++
        ) {
            result.push(index);
        }


        if (
            currentPage <
            pages - 3
        ) {
            result.push(
                "right-ellipsis"
            );
        }


        result.push(pages);


        return result;
    };


    const pageNumbers =
        getPages();


    const changePage = (
        nextPage
    ) => {

        if (
            loading ||
            nextPage < 1 ||
            nextPage > pages ||
            nextPage === currentPage
        ) {
            return;
        }

        onPageChange?.(
            nextPage
        );
    };


    return (
        <div className="border-t border-white/[0.06] px-4 py-4 sm:px-5">

            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

                {/* RANGE */}

                <p className="text-sm text-slate-600">

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
                        {totalItems.toLocaleString(
                            "en-IN"
                        )}
                    </span>

                    {" "}

                    {itemLabel}

                </p>


                {/* DESKTOP */}

                <div className="hidden items-center gap-1 sm:flex">

                    <PaginationButton
                        disabled={
                            currentPage ===
                            1 ||
                            loading
                        }
                        onClick={() =>
                            changePage(
                                1
                            )
                        }
                    >
                        <ChevronsLeft
                            size={15}
                        />
                    </PaginationButton>


                    <PaginationButton
                        disabled={
                            currentPage ===
                            1 ||
                            loading
                        }
                        onClick={() =>
                            changePage(
                                currentPage -
                                1
                            )
                        }
                    >
                        <ChevronLeft
                            size={15}
                        />
                    </PaginationButton>


                    {pageNumbers.map(
                        (
                            pageNumber,
                            index
                        ) => {

                            if (
                                typeof pageNumber !==
                                "number"
                            ) {
                                return (
                                    <span
                                        key={`${pageNumber}-${index}`}
                                        className="flex h-9 min-w-9 items-center justify-center text-xs text-slate-500"
                                    >
                                        ...
                                    </span>
                                );
                            }


                            return (
                                <button
                                    key={
                                        pageNumber
                                    }
                                    type="button"
                                    disabled={
                                        loading
                                    }
                                    onClick={() =>
                                        changePage(
                                            pageNumber
                                        )
                                    }
                                    className={`flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-lg px-2 text-xs font-semibold transition ${pageNumber ===
                                            currentPage
                                            ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20"
                                            : "text-slate-500 hover:bg-white/[0.05] hover:text-white"
                                        } disabled:cursor-not-allowed disabled:opacity-50`}
                                >
                                    {
                                        pageNumber
                                    }
                                </button>
                            );
                        }
                    )}


                    <PaginationButton
                        disabled={
                            currentPage ===
                            pages ||
                            loading
                        }
                        onClick={() =>
                            changePage(
                                currentPage +
                                1
                            )
                        }
                    >
                        <ChevronRight
                            size={15}
                        />
                    </PaginationButton>


                    <PaginationButton
                        disabled={
                            currentPage ===
                            pages ||
                            loading
                        }
                        onClick={() =>
                            changePage(
                                pages
                            )
                        }
                    >
                        <ChevronsRight
                            size={15}
                        />
                    </PaginationButton>

                </div>


                {/* MOBILE */}

                <div className="flex items-center justify-between gap-3 sm:hidden">

                    <button
                        type="button"
                        disabled={
                            currentPage ===
                            1 ||
                            loading
                        }
                        onClick={() =>
                            changePage(
                                currentPage -
                                1
                            )
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

                        {pages}

                    </span>


                    <button
                        type="button"
                        disabled={
                            currentPage ===
                            pages ||
                            loading
                        }
                        onClick={() =>
                            changePage(
                                currentPage +
                                1
                            )
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
    );
}


function PaginationButton({
    children,
    onClick,
    disabled,
}) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className="flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.025] text-slate-500 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
        >
            {children}
        </button>
    );
}