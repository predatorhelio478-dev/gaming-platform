"use client";

import {
    Eye,
    ArrowDownLeft,
    ArrowUpRight,
    MoreHorizontal,
    Search,
    Users,
    Wallet,
} from "lucide-react";

import AdminPagination
    from "../../admin/ui/AdminPagination";


// ======================================================
// WALLET USERS TABLE
// ======================================================

export default function WalletUsersTable({

    users = [],

    loading = false,

    search = "",

    onSearchChange,

    onView,

    onCredit,

    onDebit,

    pagination = {},

    onPageChange,

    formatCurrency,

    formatDate,

}) {

    // ==================================================
    // CURRENCY
    // ==================================================

    const currency = (
        value
    ) => {

        if (
            typeof formatCurrency ===
            "function"
        ) {

            return formatCurrency(
                value
            );

        }

        return new Intl.NumberFormat(
            "en-IN",
            {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 2,
            }
        ).format(
            Number(value) || 0
        );

    };


    // ==================================================
    // DATE
    // ==================================================

    const date = (
        value
    ) => {

        if (
            typeof formatDate ===
            "function"
        ) {

            return formatDate(
                value
            );

        }


        if (!value) {

            return "—";

        }


        const parsed =
            new Date(value);


        if (
            Number.isNaN(
                parsed.getTime()
            )
        ) {

            return "—";

        }


        return new Intl.DateTimeFormat(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        ).format(
            parsed
        );

    };


    // ==================================================
    // PAGINATION
    // ==================================================

    const currentPage =
        Number(
            pagination?.currentPage ||
            pagination?.page ||
            1
        );


    const totalPages =
        Number(
            pagination?.totalPages ||
            1
        );


    const totalUsers =
        Number(
            pagination?.total ||
            pagination?.totalUsers ||
            users.length
        );


    // ==================================================
    // USER WALLET
    // ==================================================

    const getWallet =
        (user) => {

            return (
                user?.wallet ||
                user ||
                {}
            );

        };


    // ==================================================
    // USER NAME
    // ==================================================

    const getUserName =
        (user) => {

            const userData =
                user?.user ||
                user ||
                {};


            return (
                userData?.fullName ||
                userData?.name ||
                userData?.username ||
                "Unknown User"
            );

        };


    // ==================================================
    // STATUS
    // ==================================================

    const getStatusClass =
        (status) => {

            if (
                status ===
                "blocked"
            ) {

                return "                border - red - 500 / 20                bg - red - 500 / 10                text - red - 400                ";

            }


            if (
                status ===
                "pending"
            ) {

                return "                border - yellow - 500 / 20                bg - yellow - 500 / 10                text - yellow - 400                ";

            }


            return "            border - emerald - 500 / 20            bg - emerald - 500 / 10            text - emerald - 400            ";

        };


    // ==================================================
    // LOADING ROWS
    // ==================================================

    const loadingRows =
        Array.from({
            length: 6,
        });


    // ==================================================
    // RENDER
    // ==================================================

    return (

        <section
            className="
                overflow-hidden
                rounded-2xl
                border
                border-white/[0.06]
                bg-[#0d101d]
                shadow-2xl
            "
        >

            {/* ==================================================
                HEADER
            ================================================== */}

            <div
                className="
                    flex
                    flex-col
                    gap-4
                    border-b
                    border-white/[0.06]
                    p-4
                    sm:p-5
                    lg:flex-row
                    lg:items-center
                    lg:justify-between
                "
            >

                <div>

                    <div
                        className="
                            flex
                            items-center
                            gap-2
                        "
                    >

                        <span
                            className="
                                flex
                                h-11
                                w-11
                                items-center
                                justify-center
                                rounded-xl
                                bg-violet-500/10
                                text-violet-400
                            "
                        >

                            <Users
                                size={18}
                            />

                        </span>


                        <div>

                            <h2
                                className="
                                    text-md
                                    font-bold
                                    text-white
                                "
                            >

                                User Wallets

                            </h2>


                            <p
                                className="
                                    mt-0.5
                                    text-[12px]
                                    text-slate-500
                                "
                            >

                                Manage user wallet balances

                            </p>

                        </div>

                    </div>

                </div>


                {/* SEARCH */}

                <div
                    className="
                        relative
                        w-full
                        lg:w-72
                    "
                >

                    <Search
                        size={15}
                        className="
                            pointer-events-none
                            absolute
                            left-3
                            top-1/2
                            -translate-y-1/2
                            text-slate-600
                        "
                    />


                    <input
                        type="search"
                        value={
                            search
                        }
                        onChange={(
                            event
                        ) => {

                            if (
                                typeof onSearchChange ===
                                "function"
                            ) {

                                onSearchChange(
                                    event.target.value
                                );

                            }

                        }}
                        placeholder="Search user..."
                        className="
                            h-10
                            w-full
                            rounded-xl
                            border
                            border-white/[0.07]
                            bg-[#080c16]
                            pl-9
                            pr-3
                            text-xs
                            text-white
                            outline-none
                            transition
                            placeholder:text-slate-500
                            focus:border-violet-500/40
                        "
                    />

                </div>

            </div>


            {/* ==================================================
                TABLE
            ================================================== */}

            <div
                className="
                    overflow-x-auto
                "
            >

                <table
                    className="
                        w-full
                        min-w-[1150px]
                        text-left
                    "
                >

                    {/* ==================================================
                        HEAD
                    ================================================== */}

                    <thead>

                        <tr
                            className="
                                border-b
                                border-white/[0.05]
                                bg-white/[0.01]
                                text-[12px]
                                uppercase
                                tracking-[0.08em]
                                text-slate-500
                            "
                        >

                            <th className="px-4 py-3">
                                User
                            </th>

                            <th className="px-4 py-3">
                                Balance
                            </th>

                            <th className="px-4 py-3">
                                Winning
                            </th>

                            <th className="px-4 py-3">
                                Bonus
                            </th>

                            <th className="px-4 py-3">
                                Deposits
                            </th>

                            <th className="px-4 py-3">
                                Withdrawals
                            </th>

                            <th className="px-4 py-3">
                                Bets
                            </th>

                            <th className="px-4 py-3">
                                Status
                            </th>

                            <th className="px-4 py-3">
                                Last Updated
                            </th>

                            <th className="px-4 py-3 text-right">
                                Actions
                            </th>

                        </tr>

                    </thead>


                    {/* ==================================================
                        BODY
                    ================================================== */}

                    <tbody>

                        {loading ? (

                            loadingRows.map(
                                (_, index) => (

                                    <tr
                                        key={
                                            index
                                        }
                                        className="
                                            border-b
                                            border-white/[0.035]
                                        "
                                    >

                                        {Array.from({
                                            length: 10,
                                        }).map(
                                            (
                                                __,
                                                column
                                            ) => (

                                                <td
                                                    key={
                                                        column
                                                    }
                                                    className="
                                                        px-4
                                                        py-4
                                                    "
                                                >

                                                    <div
                                                        className="
                                                            h-4
                                                            w-full
                                                            max-w-[110px]
                                                            animate-pulse
                                                            rounded
                                                            bg-white/[0.04]
                                                        "
                                                    />

                                                </td>

                                            )
                                        )}

                                    </tr>

                                )
                            )

                        ) : users.length ===
                            0 ? (

                            <tr>

                                <td
                                    colSpan={
                                        10
                                    }
                                    className="
                                        px-5
                                        py-16
                                        text-center
                                    "
                                >

                                    <div
                                        className="
                                            mx-auto
                                            flex
                                            max-w-xs
                                            flex-col
                                            items-center
                                        "
                                    >

                                        <span
                                            className="
                                                flex
                                                h-12
                                                w-12
                                                items-center
                                                justify-center
                                                rounded-2xl
                                                bg-white/[0.03]
                                                text-slate-600
                                            "
                                        >

                                            <Wallet
                                                size={20}
                                            />

                                        </span>


                                        <p
                                            className="
                                                mt-3
                                                text-sm
                                                font-semibold
                                                text-slate-500
                                            "
                                        >

                                            No users found

                                        </p>


                                        <p
                                            className="
                                                mt-1
                                                text-[10px]
                                                text-slate-500
                                            "
                                        >

                                            Try changing
                                            your search
                                            or filters.

                                        </p>

                                    </div>

                                </td>

                            </tr>

                        ) : (

                            users.map(
                                (
                                    user
                                ) => {

                                    const wallet =
                                        getWallet(
                                            user
                                        );


                                    const userName =
                                        getUserName(
                                            user
                                        );


                                    const userData =
                                        user?.user ||
                                        user ||
                                        {};


                                    const username =
                                        userData?.username ||
                                        "—";


                                    const status =
                                        user?.status ||
                                        "active";


                                    return (

                                        <tr
                                            key={
                                                user?._id ||
                                                user?.id
                                            }
                                            className="
                                                border-b
                                                border-white/[0.035]
                                                transition
                                                hover:bg-white/[0.015]
                                            "
                                        >

                                            {/* USER */}

                                            <td
                                                className="
                                                    px-4
                                                    py-4
                                                "
                                            >

                                                <div
                                                    className="
                                                        flex
                                                        min-w-[190px]
                                                        items-center
                                                        gap-3
                                                    "
                                                >

                                                    <div
                                                        className="
                                                            flex
                                                            h-9
                                                            w-9
                                                            shrink-0
                                                            items-center
                                                            justify-center
                                                            rounded-xl
                                                            bg-violet-500/10
                                                            text-xs
                                                            font-black
                                                            text-violet-300
                                                        "
                                                    >

                                                        {
                                                            userName
                                                                .charAt(
                                                                    0
                                                                )
                                                                .toUpperCase()
                                                        }

                                                    </div>


                                                    <div
                                                        className="
                                                            min-w-0
                                                        "
                                                    >

                                                        <p
                                                            className="
                                                                truncate
                                                                text-xs
                                                                font-bold
                                                                text-slate-300
                                                            "
                                                        >

                                                            {
                                                                userName
                                                            }

                                                        </p>


                                                        <p
                                                            className="
                                                                mt-0.5
                                                                truncate
                                                                text-[10px]
                                                                text-slate-500
                                                            "
                                                        >

                                                            @
                                                            {
                                                                username
                                                            }

                                                        </p>

                                                    </div>

                                                </div>

                                            </td>


                                            {/* BALANCE */}

                                            <td
                                                className="
                                                    whitespace-nowrap
                                                    px-4
                                                    py-4
                                                "
                                            >

                                                <div
                                                    className="
                                                        flex
                                                        items-center
                                                        gap-2
                                                    "
                                                >

                                                    <Wallet
                                                        size={13}
                                                        className="
                                                            text-emerald-400
                                                        "
                                                    />


                                                    <span
                                                        className="
                                                            text-xs
                                                            font-black
                                                            text-emerald-400
                                                        "
                                                    >

                                                        {
                                                            currency(
                                                                wallet?.balance
                                                            )
                                                        }

                                                    </span>

                                                </div>

                                            </td>


                                            {/* WINNING */}

                                            <td
                                                className="
                                                    whitespace-nowrap
                                                    px-4
                                                    py-4
                                                    text-xs
                                                    font-semibold
                                                    text-yellow-400
                                                "
                                            >

                                                {
                                                    currency(
                                                        wallet?.winningBalance
                                                    )
                                                }

                                            </td>


                                            {/* BONUS */}

                                            <td
                                                className="
                                                    whitespace-nowrap
                                                    px-4
                                                    py-4
                                                    text-xs
                                                    font-semibold
                                                    text-pink-400
                                                "
                                            >

                                                {
                                                    currency(
                                                        wallet?.bonusBalance
                                                    )
                                                }

                                            </td>


                                            {/* DEPOSIT */}

                                            <td
                                                className="
                                                    whitespace-nowrap
                                                    px-4
                                                    py-4
                                                    text-xs
                                                    font-semibold
                                                    text-blue-400
                                                "
                                            >

                                                {
                                                    currency(
                                                        wallet?.totalDeposit
                                                    )
                                                }

                                            </td>


                                            {/* WITHDRAW */}

                                            <td
                                                className="
                                                    whitespace-nowrap
                                                    px-4
                                                    py-4
                                                    text-xs
                                                    font-semibold
                                                    text-orange-400
                                                "
                                            >

                                                {
                                                    currency(
                                                        wallet?.totalWithdraw
                                                    )
                                                }

                                            </td>


                                            {/* BET */}

                                            <td
                                                className="
                                                    whitespace-nowrap
                                                    px-4
                                                    py-4
                                                    text-xs
                                                    font-semibold
                                                    text-violet-400
                                                "
                                            >

                                                {
                                                    currency(
                                                        wallet?.totalBet
                                                    )
                                                }

                                            </td>


                                            {/* STATUS */}

                                            <td
                                                className="
                                                    px-4
                                                    py-4
                                                "
                                            >

                                                <span
                                                    className={`
                                                        inline-flex
                                                        rounded-full
                                                        border
                                                        px-2.5
                                                        py-1
                                                        text-[11px]
                                                        font-bold
                                                        capitalize
                                                        ${getStatusClass(
                                                        status
                                                    )}
                                                    `}
                                                >

                                                    {
                                                        status
                                                    }

                                                </span>

                                            </td>


                                            {/* UPDATED */}

                                            <td
                                                className="
                                                    whitespace-nowrap
                                                    px-4
                                                    py-4
                                                    text-[12px]
                                                    text-slate-500
                                                "
                                            >

                                                {
                                                    date(
                                                        user?.updatedAt ||
                                                        wallet?.updatedAt
                                                    )
                                                }

                                            </td>


                                            {/* ACTIONS */}

                                            <td
                                                className="
                                                    px-4
                                                    py-4
                                                "
                                            >

                                                <div
                                                    className="
                                                        flex
                                                        items-center
                                                        justify-end
                                                        gap-1.5
                                                    "
                                                >

                                                    {/* VIEW */}

                                                    <button
                                                        type="button"
                                                        title="View wallet"
                                                        onClick={() => {

                                                            if (
                                                                typeof onView ===
                                                                "function"
                                                            ) {

                                                                onView(
                                                                    user
                                                                );

                                                            }

                                                        }}
                                                        className="
                                                            flex
                                                            h-8
                                                            w-8
                                                            items-center
                                                            justify-center
                                                            rounded-lg
                                                            border
                                                            border-white/[0.06]
                                                            bg-white/[0.02]
                                                            text-slate-500
                                                            transition
                                                            hover:border-violet-500/20
                                                            hover:bg-violet-500/10
                                                            hover:text-violet-400
                                                        "
                                                    >

                                                        <Eye
                                                            size={14}
                                                        />

                                                    </button>


                                                    {/* CREDIT */}

                                                    <button
                                                        type="button"
                                                        title="Credit wallet"
                                                        onClick={() => {

                                                            if (
                                                                typeof onCredit ===
                                                                "function"
                                                            ) {

                                                                onCredit(
                                                                    user
                                                                );

                                                            }

                                                        }}
                                                        className="
                                                            flex
                                                            h-8
                                                            w-8
                                                            items-center
                                                            justify-center
                                                            rounded-lg
                                                            border
                                                            border-emerald-500/10
                                                            bg-emerald-500/[0.04]
                                                            text-emerald-500
                                                            transition
                                                            hover:border-emerald-500/25
                                                            hover:bg-emerald-500/10
                                                            hover:text-emerald-400
                                                        "
                                                    >

                                                        <ArrowDownLeft
                                                            size={14}
                                                        />

                                                    </button>


                                                    {/* DEBIT */}

                                                    <button
                                                        type="button"
                                                        title="Debit wallet"
                                                        onClick={() => {

                                                            if (
                                                                typeof onDebit ===
                                                                "function"
                                                            ) {

                                                                onDebit(
                                                                    user
                                                                );

                                                            }

                                                        }}
                                                        className="
                                                            flex
                                                            h-8
                                                            w-8
                                                            items-center
                                                            justify-center
                                                            rounded-lg
                                                            border
                                                            border-red-500/10
                                                            bg-red-500/[0.04]
                                                            text-red-500
                                                            transition
                                                            hover:border-red-500/25
                                                            hover:bg-red-500/10
                                                            hover:text-red-400
                                                        "
                                                    >

                                                        <ArrowUpRight
                                                            size={14}
                                                        />

                                                    </button>

                                                </div>

                                            </td>

                                        </tr>

                                    );

                                }
                            )

                        )}

                    </tbody>

                </table>

            </div>


            {/* ==================================================
                FOOTER / PAGINATION
            ================================================== */}

            {/* ==================================================
    ADMIN PAGINATION
================================================== */}

            {totalUsers > 0 && (

                <AdminPagination

                    page={
                        currentPage
                    }

                    totalPages={
                        totalPages
                    }

                    total={
                        totalUsers
                    }

                    limit={
                        10
                    }

                    loading={
                        loading
                    }

                    itemLabel="users"

                    onPageChange={
                        onPageChange
                    }

                />

            )}
        </section>

    );

}