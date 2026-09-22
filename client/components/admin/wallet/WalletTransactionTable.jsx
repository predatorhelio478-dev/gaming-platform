"use client";

import {
    ArrowDownLeft,
    ArrowDownRight,
    ArrowUpRight,
    Banknote,
    ChevronLeft,
    ChevronRight,
    CircleDollarSign,
    Clock3,
    Eye,
    FileText,
    Loader2,
    RefreshCw,
    RotateCcw,
    ShieldCheck,
    WalletCards,
    XCircle,
} from "lucide-react";


import AdminPagination
    from "../../admin/ui/AdminPagination";

// ======================================================
// WALLET TRANSACTION TABLE
// ======================================================

export default function WalletTransactionTable({

    transactions = [],

    loading = false,

    search = "",

    type = "all",

    status = "all",

    onSearchChange,

    onTypeChange,

    onStatusChange,

    onReset,

    pagination = {},

    onPageChange,

    formatCurrency,

    formatDate,

    onViewTransaction,

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

    const dateFormat = (
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


        const date =
            new Date(
                value
            );


        if (
            Number.isNaN(
                date.getTime()
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
                hour: "2-digit",
                minute: "2-digit",
            }
        ).format(
            date
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
            pagination?.total ??
            transactions.length
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
    // USER
    // ==================================================

    const getUser =
        (
            transaction
        ) => {

            return (
                transaction?.user ||
                {}
            );

        };


    const getUserName =
        (
            transaction
        ) => {

            const user =
                getUser(
                    transaction
                );


            return (
                user?.fullName ||
                user?.username ||
                "Unknown User"
            );

        };


    const getUserEmail =
        (
            transaction
        ) => {

            const user =
                getUser(
                    transaction
                );


            return (
                user?.email ||
                ""
            );

        };


    const getInitial =
        (
            transaction
        ) => {

            const name =
                getUserName(
                    transaction
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
    // TRANSACTION TYPE META
    // ==================================================

    const getTypeMeta =
        (
            transactionType
        ) => {

            const normalized =
                String(
                    transactionType ||
                    ""
                )
                    .toLowerCase()
                    .trim();


            const map = {

                deposit: {

                    label:
                        "Deposit",

                    icon:
                        ArrowDownLeft,

                    className:
                        "bg-blue-500/10 text-blue-400 border-blue-500/15",

                },


                withdraw: {

                    label:
                        "Withdrawal",

                    icon:
                        ArrowUpRight,

                    className:
                        "bg-orange-500/10 text-orange-400 border-orange-500/15",

                },


                bet: {

                    label:
                        "Bet",

                    icon:
                        CircleDollarSign,

                    className:
                        "bg-red-500/10 text-red-400 border-red-500/15",

                },


                win: {

                    label:
                        "Win",

                    icon:
                        ArrowDownLeft,

                    className:
                        "bg-emerald-500/10 text-emerald-400 border-emerald-500/15",

                },


                refund: {

                    label:
                        "Refund",

                    icon:
                        RotateCcw,

                    className:
                        "bg-cyan-500/10 text-cyan-400 border-cyan-500/15",

                },


                payout_reverse: {

                    label:
                        "Payout Reverse",

                    icon:
                        ArrowDownRight,

                    className:
                        "bg-yellow-500/10 text-yellow-400 border-yellow-500/15",

                },


                payout_restore: {

                    label:
                        "Payout Restore",

                    icon:
                        RefreshCw,

                    className:
                        "bg-violet-500/10 text-violet-400 border-violet-500/15",

                },


                bonus: {

                    label:
                        "Bonus",

                    icon:
                        Banknote,

                    className:
                        "bg-pink-500/10 text-pink-400 border-pink-500/15",

                },


                admin_credit: {

                    label:
                        "Admin Credit",

                    icon:
                        ShieldCheck,

                    className:
                        "bg-emerald-500/10 text-emerald-400 border-emerald-500/15",

                },


                admin_debit: {

                    label:
                        "Admin Debit",

                    icon:
                        ShieldCheck,

                    className:
                        "bg-red-500/10 text-red-400 border-red-500/15",

                },

            };


            return (
                map[
                normalized
                ] || {

                    label:
                        transactionType ||
                        "Unknown",

                    icon:
                        WalletCards,

                    className:
                        "bg-white/[0.04] text-slate-400 border-white/[0.06]",

                }
            );

        };


    // ==================================================
    // AMOUNT TYPE
    // ==================================================

    const isCredit =
        (
            transaction
        ) => {

            const transactionType =
                String(
                    transaction?.type ||
                    ""
                )
                    .toLowerCase();


            return [
                "deposit",
                "win",
                "refund",
                "payout_restore",
                "bonus",
                "admin_credit",
            ].includes(
                transactionType
            );

        };


    // ==================================================
    // STATUS META
    // ==================================================

    const getStatusMeta =
        (
            transactionStatus
        ) => {

            const normalized =
                String(
                    transactionStatus ||
                    "success"
                )
                    .toLowerCase();


            if (
                normalized ===
                "success"
            ) {

                return {

                    label:
                        "Success",

                    icon:
                        ShieldCheck,

                    className:
                        "bg-emerald-500/10 text-emerald-400 border-emerald-500/15",

                };

            }


            if (
                normalized ===
                "pending"
            ) {

                return {

                    label:
                        "Pending",

                    icon:
                        Clock3,

                    className:
                        "bg-yellow-500/10 text-yellow-400 border-yellow-500/15",

                };

            }


            if (
                normalized ===
                "failed"
            ) {

                return {

                    label:
                        "Failed",

                    icon:
                        XCircle,

                    className:
                        "bg-red-500/10 text-red-400 border-red-500/15",

                };

            }


            return {

                label:
                    transactionStatus ||
                    "Unknown",

                icon:
                    Clock3,

                className:
                    "bg-white/[0.04] text-slate-500 border-white/[0.06]",

            };

        };


    // ==================================================
    // LOADING
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
                                w-36
                                animate-pulse
                                rounded
                                bg-white/[0.06]
                            "
                        />

                        <div
                            className="
                                mt-2
                                h-3
                                w-52
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


                <div
                    className="
                        divide-y
                        divide-white/[0.035]
                    "
                >

                    {Array.from(
                        {
                            length: 7,
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
        transactions.length ===
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

                    <FileText
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

                    No transactions found

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

                    No wallet transactions match
                    the current filters.

                </p>


                {(search ||
                    type !== "all" ||
                    status !== "all") && (

                        <button
                            type="button"
                            onClick={
                                onReset
                            }
                            className="
                            mt-4
                            inline-flex
                            items-center
                            gap-2
                            rounded-xl
                            border
                            border-white/[0.06]
                            bg-white/[0.03]
                            px-4
                            py-2
                            text-[10px]
                            font-semibold
                            text-slate-400
                            transition
                            hover:bg-white/[0.06]
                            hover:text-white
                        "
                        >

                            <RotateCcw
                                size={12}
                            />

                            Clear Filters

                        </button>

                    )}

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
                            gap-2.5
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

                            <WalletCards
                                size={20}
                            />

                        </span>


                        <div>
                            <h2
                                className="
                                text-sm
                                font-bold
                                text-white
                            "
                            >

                                Wallet Transactions

                            </h2>
                            <p
                                className="
                            mt-1
                            text-[12px]
                            text-slate-500
                        "
                            >

                                Complete financial transaction history.

                            </p>
                        </div>
                    </div>




                </div>


                <span
                    className="
                        w-fit
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
                    )} Transactions

                </span>

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
                        min-w-[1100px]
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
                                Transaction
                            </th>


                            <th
                                className="
                                    px-4
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
                                    text-[12px]
                                    font-bold
                                    uppercase
                                    tracking-wider
                                    text-slate-500
                                "
                            >
                                Type
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
                                Amount
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
                                    text-center
                                    text-[12px]
                                    font-bold
                                    uppercase
                                    tracking-wider
                                    text-slate-500
                                "
                            >
                                Status
                            </th>


                            <th
                                className="
                                    px-4
                                    py-3
                                    text-[12px]
                                    font-bold
                                    uppercase
                                    tracking-wider
                                    text-slate-500
                                "
                            >
                                Date
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
                                Action
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        {transactions.map(
                            (
                                transaction
                            ) => {

                                const transactionId =
                                    transaction?._id ||
                                    transaction?.transactionId;


                                const typeMeta =
                                    getTypeMeta(
                                        transaction?.type
                                    );


                                const TypeIcon =
                                    typeMeta.icon;


                                const statusMeta =
                                    getStatusMeta(
                                        transaction?.status
                                    );


                                const StatusIcon =
                                    statusMeta.icon;


                                const credit =
                                    isCredit(
                                        transaction
                                    );


                                const amount =
                                    Number(
                                        transaction?.amount ||
                                        0
                                    );


                                const previousBalance =
                                    Number(
                                        transaction?.previousBalance ||
                                        0
                                    );


                                const currentBalance =
                                    Number(
                                        transaction?.currentBalance ||
                                        0
                                    );


                                return (

                                    <tr
                                        key={
                                            transactionId ||
                                            `${transaction?.createdAt}-${Math.random()}`
                                        }
                                        className="
                                            border-b
                                            border-white/[0.035]
                                            transition
                                            hover:bg-white/[0.015]
                                            last:border-0
                                        "
                                    >

                                        {/* TRANSACTION */}

                                        <td
                                            className="
                                                px-5
                                                py-4
                                            "
                                        >

                                            <div>

                                                <p
                                                    className="
                                                        max-w-[180px]
                                                        truncate
                                                        text-[12px]
                                                        font-bold
                                                        text-slate-400
                                                    "
                                                    title={
                                                        transaction?.transactionId ||
                                                        transaction?._id
                                                    }
                                                >

                                                    {
                                                        transaction?.transactionId ||
                                                        transaction?._id ||
                                                        "—"
                                                    }

                                                </p>


                                                {transaction?.remark && (

                                                    <p
                                                        className="
                                                            mt-1
                                                            max-w-[190px]
                                                            truncate
                                                            text-[12px]
                                                            text-slate-500
                                                        "
                                                        title={
                                                            transaction.remark
                                                        }
                                                    >

                                                        {
                                                            transaction.remark
                                                        }

                                                    </p>

                                                )}

                                            </div>

                                        </td>


                                        {/* PLAYER */}

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
                                                    gap-2.5
                                                "
                                            >

                                                <span
                                                    className="
                                                        flex
                                                        h-8
                                                        w-8
                                                        shrink-0
                                                        items-center
                                                        justify-center
                                                        rounded-lg
                                                        bg-violet-500/10
                                                        text-[12px]
                                                        font-black
                                                        text-violet-500
                                                    "
                                                >

                                                    {
                                                        getInitial(
                                                            transaction
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
                                                            max-w-[150px]
                                                            truncate
                                                            text-[12px]
                                                            font-bold
                                                            text-white
                                                        "
                                                    >

                                                        {
                                                            getUserName(
                                                                transaction
                                                            )
                                                        }

                                                    </p>


                                                    <p
                                                        className="
                                                            mt-0.5
                                                            max-w-[150px]
                                                            truncate
                                                            text-[11px]
                                                            text-slate-500
                                                        "
                                                    >

                                                        {
                                                            getUserEmail(
                                                                transaction
                                                            )
                                                        }

                                                    </p>

                                                </div>

                                            </div>

                                        </td>


                                        {/* TYPE */}

                                        <td
                                            className="
                                                px-4
                                                py-4
                                            "
                                        >

                                            <span
                                                className={`
                                                    inline-flex
                                                    items-center
                                                    gap-1.5
                                                    rounded-lg
                                                    border
                                                    px-2.5
                                                    py-1.5
                                                    text-[11px]
                                                    font-bold
                                                    ${typeMeta.className}
                                                `}
                                            >

                                                <TypeIcon
                                                    size={11}
                                                />

                                                {
                                                    typeMeta.label
                                                }

                                            </span>

                                        </td>


                                        {/* AMOUNT */}

                                        <td
                                            className="
                                                px-4
                                                py-4
                                                text-right
                                            "
                                        >

                                            <span
                                                className={`
                                                    text-xs
                                                    font-black
                                                    ${credit
                                                        ? "text-emerald-400"
                                                        : "text-red-400"
                                                    }
                                                `}
                                            >

                                                {credit
                                                    ? "+"
                                                    : "-"
                                                }

                                                {
                                                    currency(
                                                        amount
                                                    )
                                                }

                                            </span>

                                        </td>


                                        {/* BALANCE */}

                                        <td
                                            className="
                                                px-4
                                                py-4
                                                text-right
                                            "
                                        >

                                            <div>

                                                <p
                                                    className="
                                                        text-[12px]
                                                        font-semibold
                                                        text-slate-500
                                                    "
                                                >

                                                    Before:{" "}
                                                    {
                                                        currency(
                                                            previousBalance
                                                        )
                                                    }

                                                </p>


                                                <p
                                                    className="
                                                        mt-0.5
                                                        text-[12px]
                                                        font-bold
                                                        text-slate-300
                                                    "
                                                >

                                                    After:{" "}
                                                    {
                                                        currency(
                                                            currentBalance
                                                        )
                                                    }

                                                </p>

                                            </div>

                                        </td>


                                        {/* STATUS */}

                                        <td
                                            className="
                                                px-4
                                                py-4
                                                text-center
                                            "
                                        >

                                            <span
                                                className={`
                                                    inline-flex
                                                    items-center
                                                    gap-1.5
                                                    rounded-lg
                                                    border
                                                    px-2.5
                                                    py-1.5
                                                    text-[11px]
                                                    font-bold
                                                    ${statusMeta.className}
                                                `}
                                            >

                                                <StatusIcon
                                                    size={12}
                                                />

                                                {
                                                    statusMeta.label
                                                }

                                            </span>

                                        </td>


                                        {/* DATE */}

                                        <td
                                            className="
                                                whitespace-nowrap
                                                px-4
                                                py-4
                                            "
                                        >

                                            <p
                                                className="
                                                    text-[12px]
                                                    font-medium
                                                    text-slate-400
                                                "
                                            >

                                                {
                                                    dateFormat(
                                                        transaction?.createdAt
                                                    )
                                                }

                                            </p>

                                        </td>


                                        {/* ACTION */}

                                        <td
                                            className="
                                                px-4
                                                py-4
                                                text-center
                                            "
                                        >

                                            <button
                                                type="button"
                                                title="View transaction"
                                                onClick={() => {

                                                    if (
                                                        typeof onViewTransaction ===
                                                        "function"
                                                    ) {

                                                        onViewTransaction(
                                                            transaction
                                                        );

                                                    }

                                                }}
                                                className="
                                                    inline-flex
                                                    h-10
                                                    w-10
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
                                                    size={16}
                                                />

                                            </button>

                                        </td>

                                    </tr>

                                );

                            }
                        )}

                    </tbody>

                </table>

            </div>


            <AdminPagination
                page={pagination?.currentPage || 1}
                totalPages={pagination?.totalPages || 1}
                total={pagination?.total || 0}
                limit={20}
                loading={loading}
                itemLabel="transactions"
                onPageChange={onPageChange}
            />

        </section>

    );

}