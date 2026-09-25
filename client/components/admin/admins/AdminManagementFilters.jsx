"use client";

import {
    Search,
    X,
    Filter,
} from "lucide-react";

import AdminDropdown from "../ui/AdminDropdown";


// ======================================================
// ADMIN MANAGEMENT FILTERS
// ======================================================

export default function AdminManagementFilters({
    search = "",
    setSearch,
    status = "all",
    setStatus,
    role = "all",
    setRole,
    onReset,
}) {

    // ==================================================
    // ACTIVE FILTER CHECK
    // ==================================================

    const hasFilters =
        Boolean(
            String(search).trim()
        ) ||
        status !== "all" ||
        role !== "all";


    // ==================================================
    // DROPDOWN OPTIONS
    // ==================================================

    const statusOptions = [

        {
            value: "all",
            label: "All Status",
        },

        {
            value: "active",
            label: "Active",
        },

        {
            value: "deactivated",
            label: "Deactivated",
        },

    ];


    const roleOptions = [

        {
            value: "all",
            label: "All Roles",
        },

        {
            value: "super_admin",
            label: "Super Admin",
        },

        {
            value: "admin",
            label: "Admin",
        },

        {
            value: "operator",
            label: "Operator",
        },

    ];


    return (

        <div
            className="
                mt-5
                rounded-2xl
                border
                border-white/[0.06]
                bg-[#0d101d]
                p-4
            "
        >

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
                        value={
                            search
                        }
                        onChange={(
                            event
                        ) =>
                            setSearch?.(
                                event.target.value
                            )
                        }
                        placeholder="Search name, username, email or mobile..."
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


                    {/* ==================================================
                        CLEAR SEARCH
                    ================================================== */}

                    {search && (

                        <button
                            type="button"
                            onClick={() =>
                                setSearch?.(
                                    ""
                                )
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


                    {/* ==================================================
                        STATUS
                    ================================================== */}

                    <div className="w-full sm:w-auto sm:min-w-[130px]">

                        <AdminDropdown
                            value={
                                status
                            }
                            onChange={
                                setStatus
                            }
                            options={
                                statusOptions
                            }
                            placeholder="All Status"
                        />

                    </div>


                    {/* ==================================================
                        ROLE
                    ================================================== */}

                    <div className="w-full sm:w-auto sm:min-w-[150px]">

                        <AdminDropdown
                            value={
                                role
                            }
                            onChange={
                                setRole
                            }
                            options={
                                roleOptions
                            }
                            placeholder="All Roles"
                        />

                    </div>


                    {/* ==================================================
                        RESET
                    ================================================== */}

                    {hasFilters && (

                        <button
                            type="button"
                            onClick={
                                onReset
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
                                setSearch?.(
                                    ""
                                )
                            }
                        />

                    )}


                    {/* STATUS */}

                    {status !== "all" && (

                        <FilterTag
                            label={
                                `Status: ${formatFilterValue(
                                    status
                                )}`
                            }
                            onRemove={() =>
                                setStatus?.(
                                    "all"
                                )
                            }
                        />

                    )}


                    {/* ROLE */}

                    {role !== "all" && (

                        <FilterTag
                            label={
                                `Role: ${formatFilterValue(
                                    role
                                )}`
                            }
                            onRemove={() =>
                                setRole?.(
                                    "all"
                                )
                            }
                        />

                    )}

                </div>

            )}

        </div>

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

            <span
                className="
                    truncate
                "
            >
                {label}
            </span>


            <button
                type="button"
                onClick={
                    onRemove
                }
                aria-label={
                    `Remove ${label}`
                }
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

function formatFilterValue(
    value
) {

    if (!value) {
        return "";
    }


    return String(
        value
    )
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
