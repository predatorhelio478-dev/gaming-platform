"use client";

import {
    CalendarDays,
    Filter,
    Search,
    X,
} from "lucide-react";

import AdminDropdown from "../ui/AdminDropdown";

const MODULE_OPTIONS = [
    {
        value: "",
        label: "All Modules",
    },
    {
        value: "settings",
        label: "Settings",
    },
    {
        value: "users",
        label: "Users",
    },
    {
        value: "wallet",
        label: "Wallet",
    },
    {
        value: "bets",
        label: "Bets",
    },
    {
        value: "game",
        label: "Game",
    },
    {
        value: "auth",
        label: "Authentication",
    },
];

const ACTION_OPTIONS = [
    {
        value: "",
        label: "All Actions",
    },
    {
        value: "create",
        label: "Create",
    },
    {
        value: "update",
        label: "Update",
    },
    {
        value: "delete",
        label: "Delete",
    },
    {
        value: "reset",
        label: "Reset",
    },
    {
        value: "login",
        label: "Login",
    },
    {
        value: "logout",
        label: "Logout",
    },
];

const ACTOR_OPTIONS = [
    {
        value: "",
        label: "All Actors",
    },
    {
        value: "admin",
        label: "Admin",
    },
    {
        value: "user",
        label: "User",
    },
    {
        value: "system",
        label: "System",
    },
];

export default function AuditLogsFilters({
    search,
    module,
    action,
    actorType,
    dateFrom,
    dateTo,

    onSearchChange,
    onModuleChange,
    onActionChange,
    onActorChange,
    onDateFromChange,
    onDateToChange,

    onSearch,
    onClear,

    hasFilters,
}) {
    return (
        <section className="rounded-2xl border border-white/[0.06] bg-[#0d101d] p-4 sm:p-5">

            <div className="mb-4 flex items-center gap-3">

                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                    <Filter size={17} />
                </span>

                <div>
                    <h2 className="text-sm font-bold text-white">
                        Filters
                    </h2>

                    <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500">
                        Find specific activity
                    </p>
                </div>

            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">

                {/* SEARCH */}

                <form
                    onSubmit={onSearch}
                    className="relative xl:col-span-2"
                >
                    <Search
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                    />

                    <input
                        type="text"
                        value={search}
                        onChange={(event) =>
                            onSearchChange(
                                event.target.value
                            )
                        }
                        placeholder="Search logs..."
                        className="h-11 w-full rounded-xl border border-white/[0.07] bg-[#070914] pl-9 pr-3 text-sm text-slate-300 outline-none transition placeholder:text-slate-500 focus:border-purple-500/40"
                    />
                </form>

                {/* MODULE */}

                <AdminDropdown
                    value={module}
                    onChange={onModuleChange}
                    options={MODULE_OPTIONS}
                    placeholder="All Modules"
                />

                {/* ACTION */}

                <AdminDropdown
                    value={action}
                    onChange={onActionChange}
                    options={ACTION_OPTIONS}
                    placeholder="All Actions"
                />

                {/* ACTOR */}

                <AdminDropdown
                    value={actorType}
                    onChange={onActorChange}
                    options={ACTOR_OPTIONS}
                    placeholder="All Actors"
                />

                {/* CLEAR */}

                {hasFilters && (
                    <button
                        type="button"
                        onClick={onClear}
                        className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 text-sm font-semibold text-slate-500 transition hover:bg-white/[0.06] hover:text-white"
                    >
                        <X size={14} />

                        Clear
                    </button>
                )}
            </div>

            {/* DATE */}

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">

                <DateInput
                    value={dateFrom}
                    onChange={onDateFromChange}
                    placeholder="From date"
                />

                <DateInput
                    value={dateTo}
                    onChange={onDateToChange}
                    placeholder="To date"
                />

            </div>
        </section>
    );
}

function DateInput({
    value,
    onChange,
}) {
    return (
        <div className="relative">

            <CalendarDays
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
                type="date"
                value={value}
                onChange={(event) =>
                    onChange(
                        event.target.value
                    )
                }
                className="h-11 w-full rounded-xl border border-white/[0.07] bg-[#070914] px-3 pl-9 text-sm text-slate-400 outline-none focus:border-purple-500/40"
            />

        </div>
    );
}