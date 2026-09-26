"use client";

import {
    Search,
    X,
    Filter,
    Calendar,
} from "lucide-react";

import UserDropdown from "./UserDropdown";

// ======================================================
// USER FILTERS
// ======================================================
//
// Mirrors components/admin/rounds/RoundFilters.jsx exactly
// (search box, dropdown filters, optional date range, reset
// button, active-filter-tag summary) as a generic, reusable
// filter bar for User-facing pages (My Bets, Transactions,
// Deposit, Withdrawal) - same look/behavior as the Admin
// Rounds page's own filters, parametrized per page instead of
// hardcoded to rounds-specific fields.
//
// `filters` is an array of { key, label, value, onChange,
// options: [{value,label}], placeholder }.
// `dateRange` is optional: { from, to, onFromChange, onToChange }.

export default function UserFilters({
    search = "",
    onSearchChange,
    searchPlaceholder = "Search...",
    filters = [],
    dateRange = null,
}) {

    const hasFilters =
        Boolean(String(search).trim()) ||
        filters.some((filter) => filter.value !== "all" && filter.value) ||
        Boolean(dateRange?.from) ||
        Boolean(dateRange?.to);

    const handleReset = () => {

        onSearchChange?.("");

        filters.forEach((filter) => filter.onChange?.("all"));

        if (dateRange) {
            dateRange.onFromChange?.("");
            dateRange.onToChange?.("");
        }

    };

    return (

        <section className="mt-6 rounded-2xl border border-white/[0.06] bg-[#0d101d] p-4 sm:p-5">

            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">

                {/* SEARCH */}

                {onSearchChange && (

                    <div className="relative min-w-0 flex-1">

                        <Search
                            size={15}
                            strokeWidth={2}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                        />

                        <input
                            type="text"
                            value={search}
                            onChange={(event) => onSearchChange?.(event.target.value)}
                            placeholder={searchPlaceholder}
                            className="h-11 w-full rounded-xl border border-white/[0.07] bg-[#070914] py-3 pl-9 pr-10 text-xs text-white outline-none transition placeholder:text-slate-500 hover:border-white/[0.12] focus:border-purple-500/40"
                        />

                        {search && (

                            <button
                                type="button"
                                onClick={() => onSearchChange?.("")}
                                aria-label="Clear search"
                                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-500 transition hover:text-white"
                            >
                                <X size={14} />
                            </button>

                        )}

                    </div>

                )}


                {/* FILTER CONTROLS */}

                <div className="flex flex-wrap items-center gap-2">

                    <div className="hidden items-center gap-1.5 px-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500 sm:flex">
                        <Filter size={12} />
                        Filters
                    </div>

                    {filters.map((filter) => (

                        <div key={filter.key} className="w-full sm:w-auto sm:min-w-[140px]">
                            <UserDropdown
                                value={filter.value}
                                onChange={filter.onChange}
                                options={filter.options}
                                placeholder={filter.placeholder}
                            />
                        </div>

                    ))}

                    {dateRange && (

                        <>
                            <div className="relative w-full sm:w-auto">
                                <Calendar size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="date"
                                    value={dateRange.from || ""}
                                    onChange={(event) => dateRange.onFromChange?.(event.target.value)}
                                    className="h-11 w-full rounded-xl border border-white/[0.07] bg-[#070914] py-3 pl-9 pr-3 text-xs text-slate-300 outline-none transition hover:border-white/[0.12] focus:border-purple-500/40 sm:w-[150px]"
                                />
                            </div>

                            <div className="relative w-full sm:w-auto">
                                <Calendar size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="date"
                                    value={dateRange.to || ""}
                                    onChange={(event) => dateRange.onToChange?.(event.target.value)}
                                    className="h-11 w-full rounded-xl border border-white/[0.07] bg-[#070914] py-3 pl-9 pr-3 text-xs text-slate-300 outline-none transition hover:border-white/[0.12] focus:border-purple-500/40 sm:w-[150px]"
                                />
                            </div>
                        </>

                    )}

                    {hasFilters && (

                        <button
                            type="button"
                            onClick={handleReset}
                            className="flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 text-xs font-semibold text-slate-500 transition hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-white"
                        >
                            <X size={14} />
                            Reset
                        </button>

                    )}

                </div>

            </div>


            {/* ACTIVE FILTER SUMMARY */}

            {hasFilters && (

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/[0.05] pt-3">

                    <span className="text-[10px] font-semibold text-slate-500">
                        Active filters:
                    </span>

                    {search && (
                        <FilterTag
                            label={`Search: ${search}`}
                            onRemove={() => onSearchChange?.("")}
                        />
                    )}

                    {filters.map((filter) => (
                        filter.value && filter.value !== "all" && (
                            <FilterTag
                                key={filter.key}
                                label={`${filter.label}: ${formatFilterValue(filter.value)}`}
                                onRemove={() => filter.onChange?.("all")}
                            />
                        )
                    ))}

                    {dateRange?.from && (
                        <FilterTag
                            label={`From: ${dateRange.from}`}
                            onRemove={() => dateRange.onFromChange?.("")}
                        />
                    )}

                    {dateRange?.to && (
                        <FilterTag
                            label={`To: ${dateRange.to}`}
                            onRemove={() => dateRange.onToChange?.("")}
                        />
                    )}

                </div>

            )}

        </section>

    );

}


function FilterTag({ label, onRemove }) {

    return (

        <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-purple-500/10 bg-purple-500/[0.04] px-2.5 py-1.5 text-[10px] font-semibold text-purple-300">

            <span className="truncate">{label}</span>

            <button
                type="button"
                onClick={onRemove}
                aria-label={`Remove ${label}`}
                className="shrink-0 cursor-pointer text-purple-400/60 transition hover:text-white"
            >
                <X size={11} />
            </button>

        </span>

    );

}


function formatFilterValue(value) {

    if (!value) {
        return "";
    }

    return String(value)
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase());

}
