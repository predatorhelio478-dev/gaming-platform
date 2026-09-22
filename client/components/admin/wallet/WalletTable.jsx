"use client";

import {
    Eye,
    Loader2,
    MoreHorizontal,
    Pencil,
    RefreshCw,
    Wallet,
} from "lucide-react";

import AdminPagination
    from "../../admin/ui/AdminPagination";

// ======================================================
// WALLET TABLE
// ======================================================

export default function WalletTable({

    users = [],

    loading = false,

    onViewUser,

    onAdjustWallet,

    pagination = {},

    onPageChange,

    formatCurrency,

}) {

    // ==================================================
    // CURRENCY FORMATTER
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
    // PAGINATION
    // ==================================================

    const currentPage =
        Number(
            pagination?.currentPage ||
            1
        );


    const totalPages =
        Math.max(
            Number(
                pagination?.totalPages ||
                1
            ),
            1
        );


    const total =
        Number(
            pagination?.total ||
            users.length
        );


    // ==================================================
    // PAGE CHANGE
    // ==================================================

    const changePage =
        (
            page
        ) => {

            if (
                page < 1 ||
                page > totalPages
            ) {

                return;

            }


            if (
                typeof onPageChange ===
                "function"
            ) {

                onPageChange(
                    page
                );

            }

        };


    // ==================================================
    // USER HELPERS
    // ==================================================

    const getUser =
        (
            item
        ) => {

            return (
                item?.user ||
                item
            );

        };


    const getWallet =
        (
            item
        ) => {

            return (
                item?.wallet ||
                item
            );

        };


    const getUserName =
        (
            item
        ) => {

            const user =
                getUser(
                    item
                );


            return (
                user?.fullName ||
                user?.username ||
                "Unknown User"
            );

        };


    const getUsername =
        (
            item
        ) => {

            const user =
                getUser(
                    item
                );


            return (
                user?.username ||
                ""
            );

        };


    const getEmail =
        (
            item
        ) => {

            const user =
                getUser(
                    item
                );


            return (
                user?.email ||
                ""
            );

        };


    const getInitial =
        (
            item
        ) => {

            const name =
                getUserName(
                    item
                );


            return (
                name
                    .trim()
                    .charAt(
                        0
                    )
                    .toUpperCase() ||
                "U"
            );

        };


    // ==================================================
    // LOADING STATE
    // ==================================================

    if (
        loading
    ) {

        return (

            <section
                className="
                    overflow-hidden
                    rounded-2xl
                    border
                    border-white/[0.06]
                    bg-[#0d101d]
                    shadow-xl
                "
            >

                {/* HEADER */}

                <div
                    className="
                        flex
                        items-center
                        justify-between
                        border-b
                        border-white/[0.05]
                        px-5
                        py-4
                    "
                >

                    <div>

                        <div
                            className="
                                h-4
                                w-32
                                animate-pulse
                                rounded
                                bg-white/[0.06]
                            "
                        />

                        <div
                            className="
                                mt-2
                                h-3
                                w-48
                                animate-pulse
                                rounded
                                bg-white/[0.04]
                            "
                        />

                    </div>


                    <Loader2
                        size={17}
                        className="
                            animate-spin
                            text-violet-400
                        "
                    />

                </div>


                {/* ROWS */}

                <div
                    className="
                        divide-y
                        divide-white/[0.035]
                    "
                >

                    {Array.from(
                        {
                            length: 6,
                        }
                    ).map(
                        (
                            _,
                            index
                        ) => (

                            <div
                                key={
                                    index
                                }
                                className="
                                    grid
                                    grid-cols-6
                                    gap-4
                                    px-5
                                    py-4
                                "
                            >

                                {Array.from(
                                    {
                                        length: 6,
                                    }
                                ).map(
                                    (
                                        __,
                                        cell
                                    ) => (

                                        <div
                                            key={
                                                cell
                                            }
                                            className="
                                                h-4
                                                animate-pulse
                                                rounded
                                                bg-white/[0.04]
                                            "
                                        />

                                    )
                                )}

                            </div>

                        )
                    )}

                </div>

            </section>

        );

    }


    // ==================================================
    // EMPTY STATE
    // ==================================================

    if (
        users.length ===
        0
    ) {

        return (

            <section
                className="
                    rounded-2xl
                    border
                    border-white/[0.06]
                    bg-[#0d101d]
                    p-8
                    text-center
                    shadow-xl
                "
            >

                <div
                    className="
                        mx-auto
                        flex
                        h-12
                        w-12
                        items-center
                        justify-center
                        rounded-2xl
                        bg-violet-500/10
                        text-violet-400
                    "
                >

                    <Wallet
                        size={20}
                    />

                </div>


                <h3
                    className="
                        mt-4
                        text-sm
                        font-bold
                        text-white
                    "
                >

                    No wallet records found

                </h3>


                <p
                    className="
                        mx-auto
                        mt-1
                        max-w-sm
                        text-[11px]
                        leading-5
                        text-slate-600
                    "
                >

                    There are no player wallets matching
                    the current filters.

                </p>

            </section>

        );

    }


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
                shadow-xl
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
                    px-5
                    py-4
                    sm:flex-row
                    sm:items-center
                    sm:justify-between
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
                                rounded-lg
                                bg-violet-500/10
                                text-violet-400
                            "
                        >

                            <Wallet
                                size={20}
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

                                Player Wallets

                            </h2>
                            <p
                                className="
                            mt-1
                            text-[12px]
                            text-slate-500
                        "
                            >

                                Manage player wallet balances
                                and financial activity.

                            </p>
                        </div>
                    </div>




                </div>


                <div
                    className="
                        flex
                        items-center
                        gap-2
                    "
                >

                    <span
                        className="
                            rounded-full
                            border
                            border-white/[0.05]
                            bg-white/[0.02]
                            px-2.5
                            py-1.5
                            text-[12px]
                            font-semibold
                            text-slate-500
                        "
                    >

                        {total.toLocaleString(
                            "en-IN"
                        )} Users

                    </span>

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
                        min-w-[1000px]
                        text-left
                    "
                >

                    <thead>

                        <tr
                            className="
                                border-b
                                border-white/[0.05]
                                bg-white/[0.015]
                            "
                        >

                            <th
                                className="
                                    px-5
                                    py-3
                                    text-[12px]
                                    font-bold
                                    uppercase
                                    tracking-wider
                                    text-slate-500
                                "
                            >
                                Player
                            </th>


                            <th
                                className="
                                    px-4
                                    py-3
                                    text-right
                                    text-[12px]
                                    font-bold
                                    uppercase
                                    tracking-wider
                                    text-slate-500
                                "
                            >
                                Balance
                            </th>


                            <th
                                className="
                                    px-4
                                    py-3
                                    text-right
                                    text-[12px]
                                    font-bold
                                    uppercase
                                    tracking-wider
                                    text-slate-500
                                "
                            >
                                Winning
                            </th>


                            <th
                                className="
                                    px-4
                                    py-3
                                    text-right
                                    text-[12px]
                                    font-bold
                                    uppercase
                                    tracking-wider
                                    text-slate-500
                                "
                            >
                                Bonus
                            </th>


                            <th
                                className="
                                    px-4
                                    py-3
                                    text-right
                                    text-[12px]
                                    font-bold
                                    uppercase
                                    tracking-wider
                                    text-slate-500
                                "
                            >
                                Locked
                            </th>


                            <th
                                className="
                                    px-4
                                    py-3
                                    text-right
                                    text-[12px]
                                    font-bold
                                    uppercase
                                    tracking-wider
                                    text-slate-500
                                "
                            >
                                Deposits
                            </th>


                            <th
                                className="
                                    px-4
                                    py-3
                                    text-right
                                    text-[12px]
                                    font-bold
                                    uppercase
                                    tracking-wider
                                    text-slate-500
                                "
                            >
                                Withdrawals
                            </th>


                            <th
                                className="
                                    px-4
                                    py-3
                                    text-center
                                    text-[12px]
                                    font-bold
                                    uppercase
                                    tracking-wider
                                    text-slate-500
                                "
                            >
                                Actions
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        {users.map(
                            (
                                item
                            ) => {

                                const wallet =
                                    getWallet(
                                        item
                                    );


                                const user =
                                    getUser(
                                        item
                                    );


                                const userId =
                                    user?._id ||
                                    item?.userId ||
                                    item?._id;


                                const balance =
                                    Number(
                                        wallet?.balance ||
                                        0
                                    );


                                const winningBalance =
                                    Number(
                                        wallet?.winningBalance ||
                                        0
                                    );


                                const bonusBalance =
                                    Number(
                                        wallet?.bonusBalance ||
                                        0
                                    );


                                const lockedBalance =
                                    Number(
                                        wallet?.lockedBalance ||
                                        0
                                    );


                                const totalDeposit =
                                    Number(
                                        wallet?.totalDeposit ||
                                        0
                                    );


                                const totalWithdraw =
                                    Number(
                                        wallet?.totalWithdraw ||
                                        0
                                    );


                                return (

                                    <tr
                                        key={
                                            userId ||
                                            Math.random()
                                        }
                                        className="
                                            border-b
                                            border-white/[0.035]
                                            transition
                                            hover:bg-white/[0.015]
                                            last:border-0
                                        "
                                    >

                                        {/* PLAYER */}

                                        <td
                                            className="
                                                px-5
                                                py-4
                                            "
                                        >

                                            <div
                                                className="
                                                    flex
                                                    items-center
                                                    gap-3
                                                "
                                            >

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
                                                        text-xs
                                                        font-black
                                                        text-violet-300
                                                    "
                                                >

                                                    {
                                                        getInitial(
                                                            item
                                                        )
                                                    }

                                                </span>


                                                <div
                                                    className="
                                                        min-w-0
                                                    "
                                                >

                                                    <p
                                                        className="
                                                            truncate
                                                            text-sm
                                                            font-bold
                                                            text-white
                                                        "
                                                    >

                                                        {
                                                            getUserName(
                                                                item
                                                            )
                                                        }

                                                    </p>


                                                    <p
                                                        className="
                                                            mt-0.5
                                                            truncate
                                                            text-[11px]
                                                            text-slate-500
                                                        "
                                                    >

                                                        {
                                                            getUsername(
                                                                item
                                                            )
                                                                ? `@${getUsername(item)}`
                                                                : getEmail(item)
                                                        }

                                                    </p>

                                                </div>

                                            </div>

                                        </td>


                                        {/* BALANCE */}

                                        <td
                                            className="
                                                px-4
                                                py-4
                                                text-right
                                            "
                                        >

                                            <span
                                                className="
                                                    text-xs
                                                    font-black
                                                    text-white
                                                "
                                            >

                                                {
                                                    currency(
                                                        balance
                                                    )
                                                }

                                            </span>

                                        </td>


                                        {/* WINNING */}

                                        <td
                                            className="
                                                px-4
                                                py-4
                                                text-right
                                            "
                                        >

                                            <span
                                                className="
                                                    text-xs
                                                    font-bold
                                                    text-emerald-400
                                                "
                                            >

                                                {
                                                    currency(
                                                        winningBalance
                                                    )
                                                }

                                            </span>

                                        </td>


                                        {/* BONUS */}

                                        <td
                                            className="
                                                px-4
                                                py-4
                                                text-right
                                            "
                                        >

                                            <span
                                                className="
                                                    text-xs
                                                    font-semibold
                                                    text-pink-400
                                                "
                                            >

                                                {
                                                    currency(
                                                        bonusBalance
                                                    )
                                                }

                                            </span>

                                        </td>


                                        {/* LOCKED */}

                                        <td
                                            className="
                                                px-4
                                                py-4
                                                text-right
                                            "
                                        >

                                            <span
                                                className="
                                                    text-xs
                                                    font-semibold
                                                    text-yellow-400
                                                "
                                            >

                                                {
                                                    currency(
                                                        lockedBalance
                                                    )
                                                }

                                            </span>

                                        </td>


                                        {/* DEPOSIT */}

                                        <td
                                            className="
                                                px-4
                                                py-4
                                                text-right
                                            "
                                        >

                                            <span
                                                className="
                                                    text-xs
                                                    font-semibold
                                                    text-blue-400
                                                "
                                            >

                                                {
                                                    currency(
                                                        totalDeposit
                                                    )
                                                }

                                            </span>

                                        </td>


                                        {/* WITHDRAW */}

                                        <td
                                            className="
                                                px-4
                                                py-4
                                                text-right
                                            "
                                        >

                                            <span
                                                className="
                                                    text-xs
                                                    font-semibold
                                                    text-orange-400
                                                "
                                            >

                                                {
                                                    currency(
                                                        totalWithdraw
                                                    )
                                                }

                                            </span>

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
                                                    justify-center
                                                    gap-1.5
                                                "
                                            >

                                                {/* VIEW */}

                                                <button
                                                    type="button"
                                                    title="View wallet"
                                                    onClick={() => {

                                                        if (
                                                            typeof onViewUser ===
                                                            "function"
                                                        ) {

                                                            onViewUser(
                                                                item
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
                                                        hover:border-blue-500/20
                                                        hover:bg-blue-500/10
                                                        hover:text-blue-400
                                                    "
                                                >

                                                    <Eye
                                                        size={14}
                                                    />

                                                </button>


                                                {/* ADJUST */}

                                                <button
                                                    type="button"
                                                    title="Adjust wallet"
                                                    onClick={() => {

                                                        if (
                                                            typeof onAdjustWallet ===
                                                            "function"
                                                        ) {

                                                            onAdjustWallet(
                                                                item,
                                                                "admin_credit"
                                                            )

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

                                                    <Pencil
                                                        size={14}
                                                    />

                                                </button>

                                            </div>

                                        </td>

                                    </tr>

                                );

                            }
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

            {total > 0 && (

                <AdminPagination

                    page={
                        currentPage
                    }

                    totalPages={
                        totalPages
                    }

                    total={
                        total
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