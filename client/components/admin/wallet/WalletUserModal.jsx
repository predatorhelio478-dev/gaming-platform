"use client";

import {
    ArrowDownLeft,
    ArrowDownRight,
    ArrowUpRight,
    Banknote,
    CircleDollarSign,
    Clock3,
    Copy,
    Eye,
    Info,
    LockKeyhole,
    Mail,
    Pencil,
    PiggyBank,
    ShieldCheck,
    Trophy,
    User,
    Wallet,
    X,
} from "lucide-react";


// ======================================================
// WALLET USER MODAL
// ======================================================

export default function WalletUserModal({

    user = null,

    open = false,

    onClose,

    onAdjustWallet,

    formatCurrency,

    formatDate,

}) {

    // ==================================================
    // CLOSED STATE
    // ==================================================

    if (
        !open ||
        !user
    ) {

        return null;

    }


    // ==================================================
    // USER DATA
    // ==================================================

    const userData =
        user?.user ||
        user;


    // ==================================================
    // WALLET DATA
    // ==================================================

    const wallet =
        user?.wallet ||
        user;


    // ==================================================
    // USER ID
    // ==================================================

    const userId =
        userData?._id ||
        userData?.id ||
        user?.userId ||
        "";


    // ==================================================
    // USER NAME
    // ==================================================

    const fullName =
        userData?.fullName ||
        userData?.username ||
        "Unknown User";


    // ==================================================
    // USERNAME
    // ==================================================

    const username =
        userData?.username ||
        "";


    // ==================================================
    // EMAIL
    // ==================================================

    const email =
        userData?.email ||
        "";


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
    // VALUES
    // ==================================================

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


    const totalBet =
        Number(
            wallet?.totalBet ||
            0
        );


    const totalWin =
        Number(
            wallet?.totalWin ||
            0
        );


    const netCashFlow =
        totalDeposit -
        totalWithdraw;


    // ==================================================
    // INITIAL
    // ==================================================

    const initial =
        fullName
            .trim()
            .charAt(0)
            .toUpperCase() ||
        "U";


    // ==================================================
    // COPY USER ID
    // ==================================================

    const copyUserId =
        async () => {

            if (!userId) {

                return;

            }


            try {

                await navigator.clipboard.writeText(
                    String(
                        userId
                    )
                );

            } catch (
            error
            ) {

                console.error(
                    "Copy User ID Error:",
                    error
                );

            }

        };


    // ==================================================
    // STAT CARDS
    // ==================================================

    const stats = [

        {
            label:
                "Available Balance",

            value:
                balance,

            icon:
                Wallet,

            className:
                "bg-violet-500/10 text-violet-400",

            valueClass:
                "text-white",
        },


        {
            label:
                "Winning Balance",

            value:
                winningBalance,

            icon:
                Trophy,

            className:
                "bg-emerald-500/10 text-emerald-400",

            valueClass:
                "text-emerald-400",
        },


        {
            label:
                "Bonus Balance",

            value:
                bonusBalance,

            icon:
                PiggyBank,

            className:
                "bg-pink-500/10 text-pink-400",

            valueClass:
                "text-pink-400",
        },


        {
            label:
                "Locked Balance",

            value:
                lockedBalance,

            icon:
                LockKeyhole,

            className:
                "bg-yellow-500/10 text-yellow-400",

            valueClass:
                "text-yellow-400",
        },


        {
            label:
                "Total Deposits",

            value:
                totalDeposit,

            icon:
                ArrowDownLeft,

            className:
                "bg-blue-500/10 text-blue-400",

            valueClass:
                "text-blue-400",
        },


        {
            label:
                "Total Withdrawals",

            value:
                totalWithdraw,

            icon:
                ArrowUpRight,

            className:
                "bg-orange-500/10 text-orange-400",

            valueClass:
                "text-orange-400",
        },


        {
            label:
                "Total Bets",

            value:
                totalBet,

            icon:
                CircleDollarSign,

            className:
                "bg-red-500/10 text-red-400",

            valueClass:
                "text-red-400",
        },


        {
            label:
                "Total Winnings",

            value:
                totalWin,

            icon:
                Banknote,

            className:
                "bg-cyan-500/10 text-cyan-400",

            valueClass:
                "text-cyan-400",
        },

    ];


    // ==================================================
    // RENDER
    // ==================================================

    return (

        <div
            className="
                fixed
                inset-0
                z-[100]
                flex
                items-center
                justify-center
                bg-black/75
                p-3
                backdrop-blur-sm
                sm:p-5
            "
            onMouseDown={(
                event
            ) => {

                if (
                    event.target ===
                    event.currentTarget
                ) {

                    if (
                        typeof onClose ===
                        "function"
                    ) {

                        onClose();

                    }

                }

            }}
        >

            {/* ==================================================
                MODAL
            ================================================== */}

            <div
                className="
                    flex
                    max-h-[92vh]
                    w-full
                    max-w-4xl
                    flex-col
                    overflow-hidden
                    rounded-2xl
                    border
                    border-white/[0.08]
                    bg-[#090d19]
                    shadow-[0_25px_100px_rgba(0,0,0,0.55)]
                "
            >

                {/* ==================================================
                    HEADER
                ================================================== */}

                <div
                    className="
                        shrink-0
                        border-b
                        border-white/[0.06]
                        bg-[#0d111f]
                        px-5
                        py-4
                        sm:px-6
                    "
                >

                    <div
                        className="
                            flex
                            items-start
                            justify-between
                            gap-4
                        "
                    >

                        {/* USER */}

                        <div
                            className="
                                flex
                                min-w-0
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
                                    rounded-2xl
                                    bg-violet-500/10
                                    text-sm
                                    font-black
                                    text-violet-300
                                "
                            >

                                {
                                    initial
                                }

                            </span>


                            <div
                                className="
                                    min-w-0
                                "
                            >

                                <div
                                    className="
                                        flex
                                        flex-wrap
                                        items-center
                                        gap-2
                                    "
                                >

                                    <h2
                                        className="
                                            truncate
                                            text-base
                                            font-black
                                            text-white
                                            sm:text-lg
                                        "
                                    >

                                        {
                                            fullName
                                        }

                                    </h2>


                                    <span
                                        className="
                                            rounded-full
                                            border
                                            border-emerald-500/15
                                            bg-emerald-500/10
                                            px-2
                                            py-0.5
                                            text-[8px]
                                            font-bold
                                            text-emerald-400
                                        "
                                    >

                                        PLAYER

                                    </span>

                                </div>


                                <div
                                    className="
                                        mt-1
                                        flex
                                        flex-wrap
                                        items-center
                                        gap-x-3
                                        gap-y-1
                                        text-[12px]
                                        text-slate-500
                                    "
                                >

                                    {username && (

                                        <span>
                                            @{username}
                                        </span>

                                    )}


                                    {email && (

                                        <span
                                            className="
                                                flex
                                                items-center
                                                gap-1
                                            "
                                        >

                                            <Mail
                                                size={10}
                                            />

                                            {
                                                email
                                            }

                                        </span>

                                    )}

                                </div>

                            </div>

                        </div>


                        {/* CLOSE */}

                        <button
                            type="button"
                            onClick={
                                onClose
                            }
                            aria-label="Close"
                            className="
                                flex
                                h-9
                                w-9
                                shrink-0
                                items-center
                                justify-center
                                rounded-xl
                                cursor-pointer
                                border
                                border-white/[0.06]
                                bg-white/[0.03]
                                text-slate-500
                                transition
                                hover:border-red-500/20
                                hover:bg-red-500/10
                                hover:text-red-400
                            "
                        >

                            <X
                                size={16}
                            />

                        </button>

                    </div>

                </div>


                {/* ==================================================
                    BODY
                ================================================== */}

                <div
                    className="
                        overflow-y-auto
                        p-4
                        sm:p-6
                    "
                >

                    {/* ==================================================
                        USER INFORMATION
                    ================================================== */}

                    <div
                        className="
                            rounded-2xl
                            border
                            border-white/[0.06]
                            bg-white/[0.015]
                            p-4
                        "
                    >

                        <div
                            className="
                                mb-3
                                flex
                                items-center
                                justify-between
                            "
                        >

                            <div
                                className="
                                    flex
                                    items-center
                                    gap-2
                                "
                            >

                                <User
                                    size={14}
                                    className="
                                        text-violet-400
                                    "
                                />

                                <h3
                                    className="
                                        text-xs
                                        font-bold
                                        text-white
                                    "
                                >

                                    User Information

                                </h3>

                            </div>


                            <span
                                className="
                                    text-[11px]
                                    text-slate-500
                                "
                            >

                                Account Details

                            </span>

                        </div>


                        <div
                            className="
                                grid
                                gap-3
                                sm:grid-cols-3
                            "
                        >

                            {/* USERNAME */}

                            <div
                                className="
                                    rounded-xl
                                    border
                                    border-white/[0.04]
                                    bg-[#080c16]
                                    p-3
                                "
                            >

                                <p
                                    className="
                                        text-[11px]
                                        uppercase
                                        tracking-wider
                                        text-slate-500
                                    "
                                >

                                    Username

                                </p>


                                <p
                                    className="
                                        mt-1
                                        truncate
                                        text-xs
                                        font-bold
                                        text-slate-300
                                    "
                                >

                                    {
                                        username
                                            ? `@${username}`
                                            : "—"
                                    }

                                </p>

                            </div>


                            {/* EMAIL */}

                            <div
                                className="
                                    rounded-xl
                                    border
                                    border-white/[0.04]
                                    bg-[#080c16]
                                    p-3
                                "
                            >

                                <p
                                    className="
                                        text-[11px]
                                        uppercase
                                        tracking-wider
                                        text-slate-500
                                    "
                                >

                                    Email

                                </p>


                                <p
                                    className="
                                        mt-1
                                        truncate
                                        text-xs
                                        font-bold
                                        text-slate-300
                                    "
                                >

                                    {
                                        email ||
                                        "—"
                                    }

                                </p>

                            </div>


                            {/* USER ID */}

                            <div
                                className="
                                    rounded-xl
                                    border
                                    border-white/[0.04]
                                    bg-[#080c16]
                                    p-3
                                "
                            >

                                <div
                                    className="
                                        flex
                                        items-center
                                        justify-between
                                    "
                                >

                                    <p
                                        className="
                                            text-[11px]
                                            uppercase
                                            tracking-wider
                                            text-slate-500
                                        "
                                    >

                                        User ID

                                    </p>


                                    <button
                                        type="button"
                                        onClick={
                                            copyUserId
                                        }
                                        disabled={
                                            !userId
                                        }
                                        title="Copy user ID"
                                        className="
                                            text-slate-600
                                            transition
                                            hover:text-violet-400
                                            disabled:opacity-30
                                        "
                                    >

                                        <Copy
                                            size={11}
                                        />

                                    </button>

                                </div>


                                <p
                                    className="
                                        mt-1
                                        truncate
                                        text-[10px]
                                        font-mono
                                        text-slate-400
                                    "
                                >

                                    {
                                        userId ||
                                        "—"
                                    }

                                </p>

                            </div>

                        </div>

                    </div>


                    {/* ==================================================
                        WALLET SUMMARY
                    ================================================== */}

                    <div
                        className="
                            mt-4
                            grid
                            gap-3
                            sm:grid-cols-2
                            lg:grid-cols-4
                        "
                    >

                        {stats.map(
                            (
                                item
                            ) => {

                                const Icon =
                                    item.icon;


                                return (

                                    <div
                                        key={
                                            item.label
                                        }
                                        className="
                                            rounded-2xl
                                            border
                                            border-white/[0.05]
                                            bg-[#0d111e]
                                            p-3.5
                                        "
                                    >

                                        <div
                                            className="
                                                flex
                                                items-center
                                                justify-between
                                            "
                                        >

                                            <span
                                                className={`
                                                    flex
                                                    h-8
                                                    w-8
                                                    items-center
                                                    justify-center
                                                    rounded-xl
                                                    ${item.className}
                                                `}
                                            >

                                                <Icon
                                                    size={14}
                                                />

                                            </span>

                                        </div>


                                        <p
                                            className="
                                                mt-3
                                                text-[12px]
                                                text-slate-500
                                            "
                                        >

                                            {
                                                item.label
                                            }

                                        </p>


                                        <p
                                            className={`
                                                mt-1
                                                text-base
                                                font-black
                                                ${item.valueClass}
                                            `}
                                        >

                                            {
                                                currency(
                                                    item.value
                                                )
                                            }

                                        </p>

                                    </div>

                                );

                            }
                        )}

                    </div>


                    {/* ==================================================
                        FINANCIAL SUMMARY
                    ================================================== */}

                    <div
                        className="
                            mt-4
                            grid
                            gap-4
                            lg:grid-cols-2
                        "
                    >

                        {/* CASH FLOW */}

                        <div
                            className="
                                rounded-2xl
                                border
                                border-white/[0.06]
                                bg-[#0d111e]
                                p-4
                            "
                        >

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
                                        h-8
                                        w-8
                                        items-center
                                        justify-center
                                        rounded-lg
                                        bg-blue-500/10
                                        text-blue-400
                                    "
                                >

                                    <ArrowDownRight
                                        size={14}
                                    />

                                </span>


                                <div>

                                    <h3
                                        className="
                                            text-xs
                                            font-bold
                                            text-white
                                        "
                                    >

                                        Cash Flow

                                    </h3>


                                    <p
                                        className="
                                            text-[12px]
                                            text-slate-500
                                        "
                                    >

                                        Deposit vs withdrawal

                                    </p>

                                </div>

                            </div>


                            <div
                                className="
                                    mt-4
                                    space-y-3
                                "
                            >

                                <div
                                    className="
                                        flex
                                        items-center
                                        justify-between
                                    "
                                >

                                    <span
                                        className="
                                            text-[12px]
                                            text-slate-500
                                        "
                                    >

                                        Deposited

                                    </span>


                                    <span
                                        className="
                                            text-xs
                                            font-bold
                                            text-blue-400
                                        "
                                    >

                                        +
                                        {
                                            currency(
                                                totalDeposit
                                            )
                                        }

                                    </span>

                                </div>


                                <div
                                    className="
                                        flex
                                        items-center
                                        justify-between
                                    "
                                >

                                    <span
                                        className="
                                            text-[12px]
                                            text-slate-500
                                        "
                                    >

                                        Withdrawn

                                    </span>


                                    <span
                                        className="
                                            text-xs
                                            font-bold
                                            text-orange-400
                                        "
                                    >

                                        -
                                        {
                                            currency(
                                                totalWithdraw
                                            )
                                        }

                                    </span>

                                </div>


                                <div
                                    className="
                                        border-t
                                        border-white/[0.05]
                                        pt-3
                                    "
                                >

                                    <div
                                        className="
                                            flex
                                            items-center
                                            justify-between
                                        "
                                    >

                                        <span
                                            className="
                                                text-[12px]
                                                font-semibold
                                                text-slate-500
                                            "
                                        >

                                            Net Cash Flow

                                        </span>


                                        <span
                                            className={`
                                                text-sm
                                                font-black
                                                ${netCashFlow >=
                                                    0
                                                    ? "text-emerald-400"
                                                    : "text-red-400"
                                                }
                                            `}
                                        >

                                            {
                                                netCashFlow >=
                                                    0
                                                    ? "+"
                                                    : "-"
                                            }

                                            {
                                                currency(
                                                    Math.abs(
                                                        netCashFlow
                                                    )
                                                )
                                            }

                                        </span>

                                    </div>

                                </div>

                            </div>

                        </div>


                        {/* GAME ACTIVITY */}

                        <div
                            className="
                                rounded-2xl
                                border
                                border-white/[0.06]
                                bg-[#0d111e]
                                p-4
                            "
                        >

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
                                        h-8
                                        w-8
                                        items-center
                                        justify-center
                                        rounded-lg
                                        bg-red-500/10
                                        text-red-400
                                    "
                                >

                                    <CircleDollarSign
                                        size={14}
                                    />

                                </span>


                                <div>

                                    <h3
                                        className="
                                            text-xs
                                            font-bold
                                            text-white
                                        "
                                    >

                                        Game Activity

                                    </h3>


                                    <p
                                        className="
                                            text-[12px]
                                            text-slate-500
                                        "
                                    >

                                        Betting and winnings

                                    </p>

                                </div>

                            </div>


                            <div
                                className="
                                    mt-4
                                    space-y-3
                                "
                            >

                                <div
                                    className="
                                        flex
                                        items-center
                                        justify-between
                                    "
                                >

                                    <span
                                        className="
                                            text-[12px]
                                            text-slate-500
                                        "
                                    >

                                        Total Bet

                                    </span>


                                    <span
                                        className="
                                            text-xs
                                            font-bold
                                            text-red-400
                                        "
                                    >

                                        {
                                            currency(
                                                totalBet
                                            )
                                        }

                                    </span>

                                </div>


                                <div
                                    className="
                                        flex
                                        items-center
                                        justify-between
                                    "
                                >

                                    <span
                                        className="
                                            text-[12px]
                                            text-slate-500
                                        "
                                    >

                                        Total Winnings

                                    </span>


                                    <span
                                        className="
                                            text-xs
                                            font-bold
                                            text-emerald-400
                                        "
                                    >

                                        +
                                        {
                                            currency(
                                                totalWin
                                            )
                                        }

                                    </span>

                                </div>


                                <div
                                    className="
                                        border-t
                                        border-white/[0.05]
                                        pt-3
                                    "
                                >

                                    <div
                                        className="
                                            flex
                                            items-center
                                            justify-between
                                        "
                                    >

                                        <span
                                            className="
                                                text-[12px]
                                                font-semibold
                                                text-slate-500
                                            "
                                        >

                                            Game P&amp;L

                                        </span>


                                        <span
                                            className={`
                                                text-sm
                                                font-black
                                                ${totalWin -
                                                    totalBet >=
                                                    0
                                                    ? "text-emerald-400"
                                                    : "text-red-400"
                                                }
                                            `}
                                        >

                                            {
                                                totalWin -
                                                    totalBet >=
                                                    0
                                                    ? "+"
                                                    : "-"
                                            }

                                            {
                                                currency(
                                                    Math.abs(
                                                        totalWin -
                                                        totalBet
                                                    )
                                                )
                                            }

                                        </span>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* ==================================================
                        ACCOUNT META
                    ================================================== */}

                    <div
                        className="
                            mt-4
                            flex
                            flex-wrap
                            items-center
                            gap-x-5
                            gap-y-2
                            rounded-2xl
                            border
                            border-white/[0.05]
                            bg-white/[0.015]
                            px-4
                            py-3
                        "
                    >

                        <span
                            className="
                                inline-flex
                                items-center
                                gap-1.5
                                text-[11px]
                                text-slate-600
                            "
                        >

                            <Clock3
                                size={11}
                            />

                            Created:

                            <span
                                className="
                                    text-slate-400
                                "
                            >

                                {
                                    dateFormat(
                                        userData?.createdAt ||
                                        user?.createdAt
                                    )
                                }

                            </span>

                        </span>


                        <span
                            className="
                                inline-flex
                                items-center
                                gap-1.5
                                text-[11px]
                                text-slate-500
                            "
                        >

                            <Info
                                size={11}
                            />

                            Wallet Updated:

                            <span
                                className="
                                    text-slate-400
                                "
                            >

                                {
                                    dateFormat(
                                        wallet?.updatedAt
                                    )
                                }

                            </span>

                        </span>


                        <span
                            className="
                                inline-flex
                                items-center
                                gap-1.5
                                text-[11px]
                                text-emerald-500
                            "
                        >

                            <ShieldCheck
                                size={11}
                            />

                            Wallet Active

                        </span>

                    </div>

                </div>


                {/* ==================================================
                    FOOTER
                ================================================== */}

                <div
                    className="
                        flex
                        shrink-0
                        flex-col-reverse
                        gap-2
                        border-t
                        border-white/[0.06]
                        bg-[#0d111f]
                        px-5
                        py-4
                        sm:flex-row
                        sm:items-center
                        sm:justify-between
                        sm:px-6
                    "
                >

                    <p
                        className="
                            text-[12px]
                            text-slate-500
                        "
                    >

                        Wallet information is read-only
                        from this view.

                    </p>


                    <div
                        className="
                            flex
                            gap-2
                        "
                    >

                        <button
                            type="button"
                            onClick={
                                onClose
                            }
                            className="
                                flex
                                items-center
                                justify-center
                                gap-2
                                rounded-xl
                                border
                                border-white/[0.07]
                                bg-white/[0.03]
                                px-4
                                py-2.5
                                cursor-pointer
                                text-[12px]
                                font-bold
                                text-slate-400
                                transition
                                hover:bg-white/[0.06]
                                hover:text-white
                            "
                        >

                            Close

                        </button>


                        <button
                            type="button"
                            onClick={() => {

                                if (
                                    typeof onAdjustWallet ===
                                    "function"
                                ) {

                                    onAdjustWallet(
                                        user
                                    );

                                }

                            }}
                            className="
                                flex
                                items-center
                                justify-center
                                gap-2
                                rounded-xl
                                bg-violet-600
                                px-4
                                py-2.5
                                text-[12px]
                                cursor-pointer
                                font-bold
                                text-white
                                shadow-lg
                                shadow-violet-600/10
                                transition
                                hover:bg-violet-500
                            "
                        >

                            <Pencil
                                size={13}
                            />

                            Adjust Wallet

                        </button>

                    </div>

                </div>

            </div>

        </div>

    );

}