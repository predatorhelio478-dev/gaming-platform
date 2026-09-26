"use client";

import {
    Search,
    RotateCcw,
    SlidersHorizontal,
    CalendarDays,
    X,
} from "lucide-react";

import AdminDropdown from "../../../components/admin/ui/AdminDropdown";


// ======================================================
// WALLET FILTERS
// ======================================================

export default function WalletFilters({

    search = "",
    setSearch,

    walletStatus = "all",
    setWalletStatus,

    transactionType = "all",
    setTransactionType,

    dateFrom = "",
    setDateFrom,

    dateTo = "",
    setDateTo,

    minBalance = "",
    setMinBalance,

    maxBalance = "",
    setMaxBalance,

    onReset,

}) {

    const hasActiveFilters =
        Boolean(
            String(search).trim() ||
            walletStatus !== "all" ||
            transactionType !== "all" ||
            dateFrom ||
            dateTo ||
            minBalance !== "" ||
            maxBalance !== ""
        );


    const reset = () => {

        if (
            typeof onReset === "function"
        ) {

            onReset();

        }

    };


    return (

        <section
            className="
                mt-6
                rounded-2xl
                border
                border-white/[0.06]
                bg-[#0d101d]
            "
        >

            {/* ==================================================
                HEADER
            ================================================== */}

            <div
                className="
                    flex
                    flex-col
                    gap-3
                    border-b
                    border-white/[0.05]
                    px-4
                    py-4
                    sm:px-5
                    lg:flex-row
                    lg:items-center
                    lg:justify-between
                "
            >

                <div
                    className="
                        flex
                        items-center
                        gap-3
                    "
                >

                    <div
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

                        <SlidersHorizontal
                            size={17}
                        />

                    </div>


                    <div>

                        <h3
                            className="
                                text-md
                                font-bold
                                text-white
                            "
                        >
                            Wallet Filters
                        </h3>


                        <p
                            className="
                                mt-0.5
                                text-[12px]
                                text-slate-500
                            "
                        >
                            Search and filter wallet activity
                        </p>

                    </div>

                </div>


                {hasActiveFilters && (

                    <button
                        type="button"
                        onClick={reset}
                        className="
                            flex
                            w-fit
                            cursor-pointer
                            items-center
                            gap-2
                            rounded-xl
                            border
                            border-white/[0.07]
                            bg-white/[0.025]
                            px-3
                            py-2
                            text-xs
                            font-semibold
                            text-slate-500
                            transition
                            hover:border-white/[0.12]
                            hover:bg-white/[0.05]
                            hover:text-white
                        "
                    >

                        <RotateCcw
                            size={13}
                        />

                        Reset Filters

                    </button>

                )}

            </div>


            {/* ==================================================
                BODY
            ================================================== */}

            <div
                className="
                    grid
                    gap-3
                    p-4
                    sm:grid-cols-2
                    lg:grid-cols-3
                    xl:grid-cols-4
                    sm:p-5
                "
            >

                {/* SEARCH */}

                <div
                    className="
                        sm:col-span-2
                        lg:col-span-2
                    "
                >

                    <label
                        className="
                            mb-2
                            block
                            text-[11px]
                            font-semibold
                            uppercase
                            tracking-wider
                            text-slate-600
                        "
                    >
                        Search User
                    </label>


                    <div
                        className="
                            flex
                            h-11
                            items-center
                            overflow-hidden
                            rounded-xl
                            border
                            border-white/[0.07]
                            bg-[#111522]
                            transition
                            focus-within:border-purple-500/40
                        "
                    >

                        <Search
                            size={16}
                            className="
                                ml-3
                                shrink-0
                                text-slate-600
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
                            placeholder="Name, username, email or user ID"
                            className="
                                min-w-0
                                flex-1
                                bg-transparent
                                px-3
                                text-sm
                                text-white
                                outline-none
                                placeholder:text-slate-500
                            "
                        />


                        {search && (

                            <button
                                type="button"
                                onClick={() =>
                                    setSearch?.("")
                                }
                                className="
                                    mr-2
                                    flex
                                    h-7
                                    w-7
                                    cursor-pointer
                                    items-center
                                    justify-center
                                    rounded-lg
                                    text-slate-600
                                    hover:bg-white/[0.05]
                                    hover:text-white
                                "
                            >

                                <X
                                    size={14}
                                />

                            </button>

                        )}

                    </div>

                </div>


                {/* WALLET STATUS */}

                <div>

                    <label
                        className="
                            mb-2
                            block
                            text-[11px]
                            font-semibold
                            uppercase
                            tracking-wider
                            text-slate-600
                        "
                    >
                        Wallet Status
                    </label>


                    <AdminDropdown
                        value={walletStatus}
                        onChange={setWalletStatus}
                        options={[
                            {
                                value: "all",
                                label: "All Wallets",
                            },
                            {
                                value: "active",
                                label: "Active",
                            },
                            {
                                value: "positive",
                                label: "Positive Balance",
                            },
                            {
                                value: "zero",
                                label: "Zero Balance",
                            },
                            {
                                value: "locked",
                                label: "Has Locked Balance",
                            },
                        ]}
                        placeholder="Select Wallet Status"
                    />

                </div>


                {/* TRANSACTION TYPE */}

                <div>

                    <label
                        className="
                            mb-2
                            block
                            text-[11px]
                            font-semibold
                            uppercase
                            tracking-wider
                            text-slate-600
                        "
                    >
                        Transaction Type
                    </label>


                    <AdminDropdown
                        value={transactionType}
                        onChange={setTransactionType}
                        options={[
                            {
                                value: "all",
                                label: "All Transactions",
                            },
                            {
                                value: "deposit",
                                label: "Deposit",
                            },
                            {
                                value: "withdraw",
                                label: "Withdrawal",
                            },
                            {
                                value: "bet",
                                label: "Bet",
                            },
                            {
                                value: "win",
                                label: "Win",
                            },
                            {
                                value: "refund",
                                label: "Refund",
                            },
                            {
                                value: "payout_reverse",
                                label: "Payout Reverse",
                            },
                            {
                                value: "payout_restore",
                                label: "Payout Restore",
                            },
                            {
                                value: "bonus",
                                label: "Bonus",
                            },
                            {
                                value: "admin_credit",
                                label: "Admin Credit",
                            },
                            {
                                value: "admin_debit",
                                label: "Admin Debit",
                            },
                        ]}
                        placeholder="Select Transaction Type"
                    />

                </div>


                {/* FROM DATE */}

                <div>

                    <label
                        className="
                            mb-2
                            block
                            text-[11px]
                            font-semibold
                            uppercase
                            tracking-wider
                            text-slate-600
                        "
                    >
                        From Date
                    </label>


                    <div
                        className="
                            flex
                            h-11
                            items-center
                            rounded-xl
                            border
                            border-white/[0.07]
                            bg-[#111522]
                            px-3
                            focus-within:border-purple-500/40
                        "
                    >

                        <CalendarDays
                            size={15}
                            className="
                                mr-2
                                shrink-0
                                text-slate-600
                            "
                        />


                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(event) =>
                                setDateFrom?.(
                                    event.target.value
                                )
                            }
                            className="
                                min-w-0
                                flex-1
                                bg-transparent
                                text-xs
                                text-slate-400
                                outline-none
                                [color-scheme:dark]
                            "
                        />

                    </div>

                </div>


                {/* TO DATE */}

                <div>

                    <label
                        className="
                            mb-2
                            block
                            text-[11px]
                            font-semibold
                            uppercase
                            tracking-wider
                            text-slate-600
                        "
                    >
                        To Date
                    </label>


                    <div
                        className="
                            flex
                            h-11
                            items-center
                            rounded-xl
                            border
                            border-white/[0.07]
                            bg-[#111522]
                            px-3
                            focus-within:border-purple-500/40
                        "
                    >

                        <CalendarDays
                            size={15}
                            className="
                                mr-2
                                shrink-0
                                text-slate-600
                            "
                        />


                        <input
                            type="date"
                            value={dateTo}
                            onChange={(event) =>
                                setDateTo?.(
                                    event.target.value
                                )
                            }
                            className="
                                min-w-0
                                flex-1
                                bg-transparent
                                text-xs
                                text-slate-400
                                outline-none
                                [color-scheme:dark]
                            "
                        />

                    </div>

                </div>


                {/* MIN BALANCE */}

                <div>

                    <label
                        className="
                            mb-2
                            block
                            text-[11px]
                            font-semibold
                            uppercase
                            tracking-wider
                            text-slate-600
                        "
                    >
                        Min Balance
                    </label>


                    <div
                        className="
                            flex
                            h-11
                            items-center
                            rounded-xl
                            border
                            border-white/[0.07]
                            bg-[#111522]
                            focus-within:border-purple-500/40
                        "
                    >

                        <span
                            className="
                                px-3
                                text-slate-600
                            "
                        >
                            ₹
                        </span>


                        <input
                            type="number"
                            min="0"
                            value={minBalance}
                            onChange={(event) =>
                                setMinBalance?.(
                                    event.target.value
                                )
                            }
                            placeholder="0"
                            className="
                                min-w-0
                                flex-1
                                bg-transparent
                                pr-3
                                text-xs
                                text-white
                                outline-none
                                placeholder:text-slate-500
                            "
                        />

                    </div>

                </div>


                {/* MAX BALANCE */}

                <div>

                    <label
                        className="
                            mb-2
                            block
                            text-[11px]
                            font-semibold
                            uppercase
                            tracking-wider
                            text-slate-600
                        "
                    >
                        Max Balance
                    </label>


                    <div
                        className="
                            flex
                            h-11
                            items-center
                            rounded-xl
                            border
                            border-white/[0.07]
                            bg-[#111522]
                            focus-within:border-purple-500/40
                        "
                    >

                        <span
                            className="
                                px-3
                                text-slate-600
                            "
                        >
                            ₹
                        </span>


                        <input
                            type="number"
                            min="0"
                            value={maxBalance}
                            onChange={(event) =>
                                setMaxBalance?.(
                                    event.target.value
                                )
                            }
                            placeholder="Unlimited"
                            className="
                                min-w-0
                                flex-1
                                bg-transparent
                                pr-3
                                text-xs
                                text-white
                                outline-none
                                placeholder:text-slate-500
                            "
                        />

                    </div>

                </div>

            </div>

        </section>

    );

}