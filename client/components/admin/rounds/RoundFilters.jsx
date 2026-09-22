"use client";

import {
    Search,
    X,
    Filter,
} from "lucide-react";

import AdminDropdown from "../ui/AdminDropdown";


export default function RoundFilters({
    search = "",
    setSearch,
    statusFilter = "all",
    setStatusFilter,
    resultFilter = "all",
    setResultFilter,
}) {

    // ==================================================
    // ACTIVE FILTER CHECK
    // ==================================================

    const hasFilters =
        Boolean(
            String(search).trim()
        ) ||
        statusFilter !== "all" ||
        resultFilter !== "all";


    // ==================================================
    // STATUS OPTIONS
    // ==================================================

    const statusOptions = [

        {
            value: "all",
            label: "All Status",
        },

        {
            value: "waiting",
            label: "Waiting",
        },

        {
            value: "betting",
            label: "Betting",
        },

        {
            value: "locked",
            label: "Locked",
        },

        {
            value: "completed",
            label: "Completed",
        },

    ];


    // ==================================================
    // RESULT OPTIONS
    // ==================================================

    const resultOptions = [

        {
            value: "all",
            label: "All Results",
        },

        {
            value: "red",
            label: "Red",
        },

        {
            value: "green",
            label: "Green",
        },

        {
            value: "blue",
            label: "Blue",
        },

    ];


    // ==================================================
    // RESET
    // ==================================================

    const handleReset = () => {

        setSearch?.("");
        setStatusFilter?.("all");
        setResultFilter?.("all");

    };


    return (

        <section
            className="
                mt-6
                rounded-2xl
                border
                border-white/[0.06]
                bg-[#0d101d]
                p-4
                sm:p-5
            "
        >

            {/* ==================================================
                FILTER CONTROLS
            ================================================== */}

            <div
                className="
                    flex
                    flex-col
                    gap-3
                    xl:flex-row
                    xl:items-center
                "
            >

                {/* ==================================================
                    SEARCH
                ================================================== */}

                <div
                    className="
                        relative
                        min-w-0
                        flex-1
                    "
                >

                    <Search
                        size={15}
                        strokeWidth={2}
                        className="
                            pointer-events-none
                            absolute
                            left-3
                            top-1/2
                            -translate-y-1/2
                            text-slate-700
                        "
                    />


                    <input
                        type="text"
                        value={search}
                        onChange={(event) =>
                            setSearch?.(
                                event.target.value
                            )
                        }
                        placeholder="Search round number..."
                        className="
                            h-11
                            w-full
                            rounded-xl
                            border
                            border-white/[0.07]
                            bg-[#070914]
                            py-3
                            pl-9
                            pr-10
                            text-xs
                            text-white
                            outline-none
                            transition
                            placeholder:text-slate-700
                            hover:border-white/[0.12]
                            focus:border-purple-500/40
                        "
                    />


                    {/* CLEAR SEARCH */}

                    {search && (

                        <button
                            type="button"
                            onClick={() =>
                                setSearch?.("")
                            }
                            aria-label="Clear search"
                            className="
                                absolute
                                right-3
                                top-1/2
                                -translate-y-1/2
                                cursor-pointer
                                text-slate-700
                                transition
                                hover:text-white
                            "
                        >

                            <X
                                size={14}
                            />

                        </button>

                    )}

                </div>


                {/* ==================================================
                    FILTER CONTROLS
                ================================================== */}

                <div
                    className="
                        flex
                        flex-wrap
                        items-center
                        gap-2
                    "
                >

                    {/* FILTER LABEL */}

                    <div
                        className="
                            hidden
                            items-center
                            gap-1.5
                            px-1
                            text-[10px]
                            font-bold
                            uppercase
                            tracking-[0.08em]
                            text-slate-700
                            sm:flex
                        "
                    >

                        <Filter
                            size={12}
                        />

                        Filters

                    </div>


                    {/* STATUS */}

                    <div
                        className="
                            w-full
                            sm:w-auto
                            sm:min-w-[140px]
                        "
                    >

                        <AdminDropdown
                            value={
                                statusFilter
                            }
                            onChange={
                                setStatusFilter
                            }
                            options={
                                statusOptions
                            }
                            placeholder="All Status"
                        />

                    </div>


                    {/* RESULT */}

                    <div
                        className="
                            w-full
                            sm:w-auto
                            sm:min-w-[140px]
                        "
                    >

                        <AdminDropdown
                            value={
                                resultFilter
                            }
                            onChange={
                                setResultFilter
                            }
                            options={
                                resultOptions
                            }
                            placeholder="All Results"
                        />

                    </div>


                    {/* RESET */}

                    {hasFilters && (

                        <button
                            type="button"
                            onClick={
                                handleReset
                            }
                            className="
                                flex
                                h-11
                                cursor-pointer
                                items-center
                                gap-2
                                rounded-xl
                                border
                                border-white/[0.07]
                                bg-white/[0.025]
                                px-3
                                text-xs
                                font-semibold
                                text-slate-500
                                transition
                                hover:border-white/[0.12]
                                hover:bg-white/[0.05]
                                hover:text-white
                            "
                        >

                            <X
                                size={14}
                            />

                            Reset

                        </button>

                    )}

                </div>

            </div>


            {/* ==================================================
                ACTIVE FILTER SUMMARY
            ================================================== */}

            {hasFilters && (

                <div
                    className="
                        mt-3
                        flex
                        flex-wrap
                        items-center
                        gap-2
                        border-t
                        border-white/[0.05]
                        pt-3
                    "
                >

                    <span
                        className="
                            text-[10px]
                            font-semibold
                            text-slate-700
                        "
                    >
                        Active filters:
                    </span>


                    {/* SEARCH */}

                    {search && (

                        <FilterTag
                            label={
                                `Search: ${search}`
                            }
                            onRemove={() =>
                                setSearch?.("")
                            }
                        />

                    )}


                    {/* STATUS */}

                    {statusFilter !== "all" && (

                        <FilterTag
                            label={
                                `Status: ${formatFilterValue(
                                    statusFilter
                                )}`
                            }
                            onRemove={() =>
                                setStatusFilter?.(
                                    "all"
                                )
                            }
                        />

                    )}


                    {/* RESULT */}

                    {resultFilter !== "all" && (

                        <FilterTag
                            label={
                                `Result: ${formatFilterValue(
                                    resultFilter
                                )}`
                            }
                            onRemove={() =>
                                setResultFilter?.(
                                    "all"
                                )
                            }
                        />

                    )}

                </div>

            )}

        </section>

    );

}


// ======================================================
// FILTER TAG
// ======================================================

function FilterTag({
    label,
    onRemove,
}) {

    return (

        <span
            className="
                inline-flex
                max-w-full
                items-center
                gap-1.5
                rounded-lg
                border
                border-purple-500/10
                bg-purple-500/[0.04]
                px-2.5
                py-1.5
                text-[10px]
                font-semibold
                text-purple-300
            "
        >

            <span className="truncate">
                {label}
            </span>


            <button
                type="button"
                onClick={onRemove}
                aria-label={`Remove ${label}`}
                className="
                    shrink-0
                    cursor-pointer
                    text-purple-400/60
                    transition
                    hover:text-white
                "
            >

                <X
                    size={11}
                />

            </button>

        </span>

    );

}


// ======================================================
// FORMAT FILTER VALUE
// ======================================================

function formatFilterValue(value) {

    if (!value) {
        return "";
    }

    return String(value)
        .replace(
            /[-_]/g,
            " "
        )
        .replace(
            /\b\w/g,
            (character) =>
                character.toUpperCase()
        );

}