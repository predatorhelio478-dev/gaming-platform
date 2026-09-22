"use client";

import {
    X,
    User,
    Mail,
    Phone,
    ShieldCheck,
    ShieldAlert,
    Wallet,
    Trophy,
    Receipt,
    Hash,
    Users,
    Ban,
    CheckCircle2,
    CalendarDays,
    LogIn,
    Copy,
} from "lucide-react";


// ======================================================
// USER DETAIL DRAWER
// ROUND DETAILS STYLE
// ======================================================

export default function UserDetailDrawer({
    user = null,
    loading = false,
    error = "",
    formatCurrency,
    formatDate,
    actionLoading = false,
    onClose,
    onEdit,
    onBalance,
    onBlock,
    onUnblock,
}) {

    // ==================================================
    // NO USER
    // ==================================================

    if (!user) {
        return null;
    }


    // ==================================================
    // USER STATUS
    // ==================================================

    const isAdmin =
        user?.role === "admin";


    const isBlocked =
        user?.status === "blocked";


    // ==================================================
    // WALLET DATA
    // ==================================================

    const wallet =
        user?.wallet ||
        user?.walletData ||
        {};


    const walletBalance =
        wallet?.balance ??
        user?.walletBalance ??
        user?.balance ??
        0;


    // ==================================================
    // BETTING DATA
    // ==================================================

    const bettingStats =
        user?.bettingStats ||
        user?.betStats ||
        {};


    const totalBets =
        bettingStats?.totalBets ??
        bettingStats?.count ??
        user?.totalBets ??
        0;


    const totalBetAmount =
        bettingStats?.totalBetAmount ??
        bettingStats?.amount ??
        user?.totalBetAmount ??
        0;


    const totalWins =
        bettingStats?.totalWins ??
        bettingStats?.wins ??
        user?.totalWins ??
        0;


    const totalWinAmount =
        bettingStats?.totalWinAmount ??
        bettingStats?.winAmount ??
        user?.totalWinAmount ??
        0;


    // ==================================================
    // TRANSACTION DATA
    // ==================================================

    const transactionStats =
        user?.transactionStats ||
        user?.transactions ||
        {};


    const totalTransactions =
        transactionStats?.totalTransactions ??
        transactionStats?.count ??
        user?.totalTransactions ??
        0;


    const totalDeposits =
        transactionStats?.totalDeposits ??
        transactionStats?.deposits ??
        user?.totalDeposits ??
        0;


    const totalWithdrawals =
        transactionStats?.totalWithdrawals ??
        transactionStats?.withdrawals ??
        user?.totalWithdrawals ??
        0;


    // ==================================================
    // PAYOUT DATA
    // ==================================================

    const payoutStats =
        user?.payoutStats ||
        user?.payouts ||
        {};


    const totalPayouts =
        payoutStats?.totalPayouts ??
        payoutStats?.count ??
        user?.totalPayouts ??
        0;


    const totalPayoutAmount =
        payoutStats?.totalPayoutAmount ??
        payoutStats?.amount ??
        user?.totalPayoutAmount ??
        0;


    // ==================================================
    // USER NAME
    // ==================================================

    const userName =
        user?.fullName ||
        user?.name ||
        user?.username ||
        "Unknown User";


    const username =
        user?.username
            ? `@${user.username}`
            : "@unknown";


    // ==================================================
    // INITIALS
    // ==================================================

    const getInitials =
        () => {

            const parts =
                String(
                    userName
                )
                    .trim()
                    .split(
                        /\s+/
                    )
                    .filter(
                        Boolean
                    );


            if (
                parts.length >= 2
            ) {

                return (
                    parts[0][0] +
                    parts[1][0]
                ).toUpperCase();

            }


            return String(
                userName
            )
                .slice(
                    0,
                    2
                )
                .toUpperCase();

        };


    // ==================================================
    // CURRENCY
    // ==================================================

    const currency =
        (value) => {

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
                Number(
                    value || 0
                )
            );

        };


    // ==================================================
    // DATE
    // ==================================================

    const date =
        (value) => {

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
                new Date(
                    value
                );


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
                    hour: "2-digit",
                    minute: "2-digit",
                }
            ).format(
                parsed
            );

        };


    // ==================================================
    // DRAWER
    // ==================================================

    return (

        <div
            className="
                fixed
                inset-0
                z-[100]
            "
        >

            {/* ==================================================
                BACKDROP
            ================================================== */}

            <button
                type="button"
                aria-label="Close user details"
                onClick={
                    onClose
                }
                className="
                    absolute
                    inset-0
                    cursor-pointer
                    bg-black/70
                    backdrop-blur-[2px]
                "
            />


            {/* ==================================================
                DRAWER
                SAME ROUND DETAIL WIDTH
            ================================================== */}

            <aside
                className="
                    absolute
                    right-0
                    top-0
                    flex
                    h-full
                    w-full
                    max-w-2xl
                    flex-col
                    border-l
                    border-white/[0.06]
                    bg-[#0a0d18]
                    shadow-2xl
                "
            >

                {/* ==================================================
                    HEADER
                ================================================== */}

                <div
                    className="
                        flex
                        shrink-0
                        items-center
                        justify-between
                        border-b
                        border-white/[0.06]
                        px-5
                        py-5
                        sm:px-6
                    "
                >

                    <div
                        className="
                            min-w-0
                        "
                    >

                        <p
                            className="
                                text-[10px]
                                font-bold
                                uppercase
                                tracking-[0.2em]
                                text-purple-400
                            "
                        >
                            User Management
                        </p>


                        <h2
                            className="
                                mt-1
                                truncate
                                text-xl
                                font-black
                                text-white
                            "
                        >
                            User Details
                        </h2>


                        <p
                            className="
                                mt-1
                                text-xs
                                text-slate-600
                            "
                        >
                            Complete account information.
                        </p>

                    </div>


                    {/* CLOSE */}

                    <button
                        type="button"
                        onClick={
                            onClose
                        }
                        disabled={
                            actionLoading
                        }
                        aria-label="Close"
                        className="
                            shrink-0
                            cursor-pointer
                            rounded-lg
                            p-2
                            text-slate-600
                            transition
                            hover:bg-white/[0.05]
                            hover:text-white
                            disabled:cursor-not-allowed
                            disabled:opacity-40
                        "
                    >

                        <X
                            size={20}
                        />

                    </button>

                </div>


                {/* ==================================================
                    BODY
                ================================================== */}

                <div
                    className="
                        min-h-0
                        flex-1
                        overflow-y-auto
                        p-5
                        sm:p-6
                    "
                >

                    {loading ? (

                        <LoadingState />

                    ) : error ? (

                        <ErrorState
                            error={
                                error
                            }
                            onClose={
                                onClose
                            }
                        />

                    ) : (

                        <div
                            className="
                                space-y-4
                            "
                        >

                            {/* ==================================================
                                USER OVERVIEW
                            ================================================== */}

                            <section
                                className="
                                    rounded-2xl
                                    border
                                    border-white/[0.06]
                                    bg-white/[0.02]
                                    p-5
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

                                        <div
                                            className="
                                                flex
                                                h-11
                                                w-11
                                                shrink-0
                                                items-center
                                                justify-center
                                                rounded-xl
                                                border
                                                border-purple-500/20
                                                bg-purple-500/[0.06]
                                                text-xs
                                                font-black
                                                text-purple-300
                                            "
                                        >
                                            {
                                                getInitials()
                                            }
                                        </div>


                                        <div
                                            className="
                                                min-w-0
                                            "
                                        >

                                            <h3
                                                className="
                                                    truncate
                                                    text-lg
                                                    font-black
                                                    text-white
                                                "
                                            >
                                                {
                                                    userName
                                                }
                                            </h3>


                                            <p
                                                className="
                                                    mt-0.5
                                                    truncate
                                                    text-xs
                                                    text-slate-600
                                                "
                                            >
                                                {
                                                    username
                                                }
                                            </p>

                                        </div>

                                    </div>


                                    {/* STATUS */}

                                    <StatusBadge
                                        blocked={
                                            isBlocked
                                        }
                                    />

                                </div>


                                {/* ROLE / VERIFICATION */}

                                <div
                                    className="
                                        mt-4
                                        flex
                                        flex-wrap
                                        gap-2
                                    "
                                >

                                    <RoleBadge
                                        role={
                                            user?.role
                                        }
                                    />


                                    <VerificationBadge
                                        label="Email "
                                        verified={
                                            Boolean(
                                                user?.emailVerified
                                            )
                                        }
                                    />

                                    <VerificationBadge
                                        label="Mobile "
                                        verified={
                                            Boolean(
                                                user?.mobileVerified
                                            )
                                        }
                                    />

                                </div>


                                {/* PROFILE DETAILS */}

                                <div
                                    className="
                                        mt-5
                                        grid
                                        grid-cols-1
                                        gap-3
                                        sm:grid-cols-2
                                    "
                                >

                                    <DetailItem
                                        icon={
                                            Mail
                                        }
                                        label="Email"
                                        value={
                                            user?.email ||
                                            "Not provided"
                                        }
                                    />


                                    <DetailItem
                                        icon={
                                            Phone
                                        }
                                        label="Mobile"
                                        value={
                                            user?.mobile ||
                                            user?.phone ||
                                            "Not provided"
                                        }
                                    />


                                    <DetailItem
                                        icon={
                                            Hash
                                        }
                                        label="User ID"
                                        value={
                                            user?._id ||
                                            "—"
                                        }
                                        copyable
                                    />


                                    <DetailItem
                                        icon={
                                            CalendarDays
                                        }
                                        label="Joined"
                                        value={
                                            date(
                                                user?.createdAt
                                            )
                                        }
                                    />


                                    <DetailItem
                                        icon={
                                            LogIn
                                        }
                                        label="Last Login"
                                        value={
                                            user?.lastLogin
                                                ? date(
                                                    user.lastLogin
                                                )
                                                : "Never"
                                        }
                                    />


                                    <DetailItem
                                        icon={
                                            Hash
                                        }
                                        label="Referral Code"
                                        value={
                                            user?.referralCode ||
                                            "—"
                                        }
                                        copyable={
                                            Boolean(
                                                user?.referralCode
                                            )
                                        }
                                    />

                                </div>

                            </section>


                            {/* ==================================================
                                WALLET
                            ================================================== */}

                            <section
                                className="
                                    rounded-2xl
                                    border
                                    border-white/[0.06]
                                    bg-white/[0.02]
                                    p-5
                                "
                            >

                                <SectionTitle
                                    icon={
                                        Wallet
                                    }
                                    title="Wallet"
                                />


                                <div
                                    className="
                                        mt-4
                                        rounded-xl
                                        border
                                        border-white/[0.05]
                                        bg-black/10
                                        p-4
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
                                                h-10
                                                w-10
                                                shrink-0
                                                items-center
                                                justify-center
                                                rounded-xl
                                                bg-yellow-500/[0.06]
                                            "
                                        >

                                            <Wallet
                                                size={
                                                    17
                                                }
                                                className="
                                                    text-yellow-400
                                                "
                                            />

                                        </div>


                                        <div>

                                            <p
                                                className="
                                                    text-[10px]
                                                    font-bold
                                                    uppercase
                                                    tracking-wider
                                                    text-slate-700
                                                "
                                            >
                                                Wallet Balance
                                            </p>


                                            <p
                                                className="
                                                    mt-1
                                                    text-lg
                                                    font-black
                                                    text-white
                                                "
                                            >
                                                {
                                                    currency(
                                                        walletBalance
                                                    )
                                                }
                                            </p>

                                        </div>

                                    </div>

                                </div>

                            </section>


                            {/* ==================================================
                                BETTING STATISTICS
                            ================================================== */}

                            <section
                                className="
                                    rounded-2xl
                                    border
                                    border-white/[0.06]
                                    bg-white/[0.02]
                                    p-5
                                "
                            >

                                <SectionTitle
                                    icon={
                                        Trophy
                                    }
                                    title="Betting Statistics"
                                />


                                <div
                                    className="
                                        mt-4
                                        grid
                                        grid-cols-2
                                        gap-3
                                    "
                                >

                                    <StatCard
                                        label="Total Bets"
                                        value={
                                            Number(
                                                totalBets
                                            ).toLocaleString(
                                                "en-IN"
                                            )
                                        }
                                    />


                                    <StatCard
                                        label="Bet Amount"
                                        value={
                                            currency(
                                                totalBetAmount
                                            )
                                        }
                                    />


                                    <StatCard
                                        label="Total Wins"
                                        value={
                                            Number(
                                                totalWins
                                            ).toLocaleString(
                                                "en-IN"
                                            )
                                        }
                                    />


                                    <StatCard
                                        label="Win Amount"
                                        value={
                                            currency(
                                                totalWinAmount
                                            )
                                        }
                                    />

                                </div>

                            </section>


                            {/* ==================================================
                                TRANSACTION STATISTICS
                            ================================================== */}

                            <section
                                className="
                                    rounded-2xl
                                    border
                                    border-white/[0.06]
                                    bg-white/[0.02]
                                    p-5
                                "
                            >

                                <SectionTitle
                                    icon={
                                        Receipt
                                    }
                                    title="Transaction Statistics"
                                />


                                <div
                                    className="
                                        mt-4
                                        grid
                                        grid-cols-2
                                        gap-3
                                    "
                                >

                                    <StatCard
                                        label="Transactions"
                                        value={
                                            Number(
                                                totalTransactions
                                            ).toLocaleString(
                                                "en-IN"
                                            )
                                        }
                                    />


                                    <StatCard
                                        label="Deposits"
                                        value={
                                            currency(
                                                totalDeposits
                                            )
                                        }
                                    />


                                    <StatCard
                                        label="Withdrawals"
                                        value={
                                            currency(
                                                totalWithdrawals
                                            )
                                        }
                                    />

                                </div>

                            </section>


                            {/* ==================================================
                                PAYOUT STATISTICS
                            ================================================== */}

                            <section
                                className="
                                    rounded-2xl
                                    border
                                    border-white/[0.06]
                                    bg-white/[0.02]
                                    p-5
                                "
                            >

                                <SectionTitle
                                    icon={
                                        Receipt
                                    }
                                    title="Payout Statistics"
                                />


                                <div
                                    className="
                                        mt-4
                                        grid
                                        grid-cols-2
                                        gap-3
                                    "
                                >

                                    <StatCard
                                        label="Total Payouts"
                                        value={
                                            Number(
                                                totalPayouts
                                            ).toLocaleString(
                                                "en-IN"
                                            )
                                        }
                                    />


                                    <StatCard
                                        label="Payout Amount"
                                        value={
                                            currency(
                                                totalPayoutAmount
                                            )
                                        }
                                    />

                                </div>

                            </section>


                            {/* ==================================================
                                REFERRAL INFORMATION
                            ================================================== */}

                            <section
                                className="
                                    rounded-2xl
                                    border
                                    border-white/[0.06]
                                    bg-white/[0.02]
                                    p-5
                                "
                            >

                                <SectionTitle
                                    icon={
                                        Users
                                    }
                                    title="Referral Information"
                                />


                                <div
                                    className="
                                        mt-4
                                        grid
                                        grid-cols-1
                                        gap-3
                                        sm:grid-cols-2
                                    "
                                >

                                    <DetailItem
                                        icon={
                                            Hash
                                        }
                                        label="Referral Code"
                                        value={
                                            user?.referralCode ||
                                            "—"
                                        }
                                    />


                                    <DetailItem
                                        icon={
                                            User
                                        }
                                        label="Referred By"
                                        value={
                                            getReferredBy(
                                                user?.referredBy
                                            )
                                        }
                                    />

                                </div>

                            </section>

                        </div>

                    )}

                </div>


                {/* ==================================================
    FOOTER
================================================== */}

                <div
                    className="
        shrink-0
        border-t
        border-white/[0.06]
        bg-[#0a0d18]
        px-5
        py-4
        sm:px-6
    "
                >

                    <div
                        className="
            flex
            flex-wrap
            items-center
            justify-between
            gap-2
        "
                    >

                        {/* ==================================================
            LEFT — CLOSE
        ================================================== */}

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={actionLoading}
                            className="
                inline-flex
                cursor-pointer
                items-center
                justify-center
                rounded-lg
                border
                border-white/[0.06]
                bg-white/[0.02]
                px-4
                py-2
                text-xs
                font-semibold
                text-slate-500
                transition
                hover:bg-white/[0.05]
                hover:text-white
                disabled:cursor-not-allowed
                disabled:opacity-40
            "
                        >
                            Close
                        </button>


                        {/* ==================================================
            RIGHT — ACTIONS
        ================================================== */}

                        {!loading && !error && (

                            <div
                                className="
                    flex
                    flex-wrap
                    items-center
                    justify-end
                    gap-2
                "
                            >

                                {/* ==================================================
                    EDIT USER
                ================================================== */}

                                <button
                                    type="button"
                                    onClick={() =>
                                        onEdit?.(user)
                                    }
                                    disabled={actionLoading}
                                    className="
                        inline-flex
                        cursor-pointer
                        items-center
                        gap-2
                        rounded-lg
                        border
                        border-purple-500/20
                        bg-purple-500/[0.05]
                        px-4
                        py-2
                        text-xs
                        font-semibold
                        text-purple-400
                        transition
                        hover:bg-purple-500/[0.10]
                        hover:text-purple-300
                        disabled:cursor-not-allowed
                        disabled:opacity-40
                    "
                                >

                                    <User
                                        size={14}
                                    />

                                    Edit User

                                </button>


                                {/* ==================================================
                    ADJUST BALANCE
                ================================================== */}

                                <button
                                    type="button"
                                    onClick={() =>
                                        onBalance?.(user)
                                    }
                                    disabled={actionLoading}
                                    className="
                        inline-flex
                        cursor-pointer
                        items-center
                        gap-2
                        rounded-lg
                        border
                        border-yellow-500/20
                        bg-yellow-500/[0.05]
                        px-4
                        py-2
                        text-xs
                        font-semibold
                        text-yellow-400
                        transition
                        hover:bg-yellow-500/[0.10]
                        hover:text-yellow-300
                        disabled:cursor-not-allowed
                        disabled:opacity-40
                    "
                                >

                                    <Wallet
                                        size={14}
                                    />

                                    Adjust Balance

                                </button>


                                {/* ==================================================
                    BLOCK / UNBLOCK
                    ADMIN CANNOT BE BLOCKED
                ================================================== */}

                                {!isAdmin && (

                                    isBlocked ? (

                                        <button
                                            type="button"
                                            onClick={() =>
                                                onUnblock?.(user)
                                            }
                                            disabled={actionLoading}
                                            className="
                                inline-flex
                                cursor-pointer
                                items-center
                                gap-2
                                rounded-lg
                                border
                                border-green-500/20
                                bg-green-500/[0.05]
                                px-4
                                py-2
                                text-xs
                                font-semibold
                                text-green-400
                                transition
                                hover:bg-green-500/[0.10]
                                hover:text-green-300
                                disabled:cursor-not-allowed
                                disabled:opacity-40
                            "
                                        >

                                            <CheckCircle2
                                                size={14}
                                            />

                                            Unblock User

                                        </button>

                                    ) : (

                                        <button
                                            type="button"
                                            onClick={() =>
                                                onBlock?.(user)
                                            }
                                            disabled={actionLoading}
                                            className="
                                inline-flex
                                cursor-pointer
                                items-center
                                gap-2
                                rounded-lg
                                border
                                border-red-500/20
                                bg-red-500/[0.05]
                                px-4
                                py-2
                                text-xs
                                font-semibold
                                text-red-400
                                transition
                                hover:bg-red-500/[0.10]
                                hover:text-red-300
                                disabled:cursor-not-allowed
                                disabled:opacity-40
                            "
                                        >

                                            <Ban
                                                size={14}
                                            />

                                            Block User

                                        </button>

                                    )

                                )}

                            </div>

                        )}

                    </div>

                </div>

            </aside>

        </div>

    );

}


// ======================================================
// SECTION TITLE
// ======================================================

function SectionTitle({
    icon: Icon,
    title,
}) {

    return (

        <div
            className="
                flex
                items-center
                gap-2
            "
        >

            <Icon
                size={15}
                className="
                    text-slate-600
                "
            />


            <p
                className="
                    text-xs
                    font-semibold
                    text-slate-400
                "
            >
                {title}
            </p>

        </div>

    );

}


// ======================================================
// STAT CARD
// ======================================================

function StatCard({
    label,
    value,
}) {

    return (

        <div
            className="
                min-w-0
                rounded-xl
                border
                border-white/[0.05]
                bg-black/10
                p-4
            "
        >

            <p
                className="
                    truncate
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-wider
                    text-slate-700
                "
            >
                {label}
            </p>


            <p
                className="
                    mt-2
                    truncate
                    text-sm
                    font-black
                    text-white
                "
            >
                {value}
            </p>

        </div>

    );

}


// ======================================================
// DETAIL ITEM
// ======================================================

function DetailItem({
    icon: Icon,
    label,
    value,
    copyable = false,
}) {

    const safeValue =
        value ||
        "—";


    const handleCopy =
        async () => {

            if (
                !copyable ||
                safeValue === "—"
            ) {

                return;

            }


            try {

                await navigator.clipboard.writeText(
                    String(
                        safeValue
                    )
                );

            } catch (
            copyError
            ) {

                console.error(
                    "Copy failed:",
                    copyError
                );

            }

        };


    return (

        <div
            className="
                min-w-0
                rounded-xl
                border
                border-white/[0.05]
                bg-black/10
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

                <Icon
                    size={12}
                    className="
                        shrink-0
                        text-slate-700
                    "
                />


                <p
                    className="
                        truncate
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-wider
                        text-slate-600
                    "
                >
                    {label}
                </p>

            </div>


            <div
                className="
                    mt-2
                    flex
                    min-w-0
                    items-center
                    gap-2
                "
            >

                <p
                    className="
                        min-w-0
                        flex-1
                        truncate
                        text-xs
                        font-semibold
                        text-slate-400
                    "
                >
                    {safeValue}
                </p>


                {copyable &&
                    safeValue !== "—" && (

                        <button
                            type="button"
                            onClick={
                                handleCopy
                            }
                            title="Copy"
                            className="
                                shrink-0
                                cursor-pointer
                                text-slate-700
                                transition
                                hover:text-purple-300
                            "
                        >

                            <Copy
                                size={12}
                            />

                        </button>

                    )}

            </div>

        </div>

    );

}


// ======================================================
// STATUS BADGE
// ======================================================

function StatusBadge({
    blocked,
}) {

    return (

        <span
            className={
                blocked
                    ? `
                        inline-flex
                        shrink-0
                        items-center
                        gap-2
                        rounded-full
                        border
                        border-red-500/20
                        bg-red-500/10
                        px-2.5
                        py-1
                        text-[10px]
                        font-bold
                        uppercase
                        text-red-400
                    `
                    : `
                        inline-flex
                        shrink-0
                        items-center
                        gap-2
                        rounded-full
                        border
                        border-green-500/20
                        bg-green-500/10
                        px-2.5
                        py-1
                        text-[10px]
                        font-bold
                        uppercase
                        text-green-400
                    `
            }
        >

            <span
                className={
                    blocked
                        ? "h-1.5 w-1.5 rounded-full bg-red-400"
                        : "h-1.5 w-1.5 rounded-full bg-green-400"
                }
            />

            {blocked
                ? "Blocked"
                : "Active"}

        </span>

    );

}


// ======================================================
// ROLE BADGE
// ======================================================

function RoleBadge({
    role,
}) {

    const admin =
        role === "admin";


    return (

        <span
            className={
                admin
                    ? `
                        inline-flex
                        items-center
                        gap-1.5
                        rounded-full
                        border
                        border-purple-500/20
                        bg-purple-500/10
                        px-2.5
                        py-1
                        text-[10px]
                        font-bold
                        uppercase
                        text-purple-300
                    `
                    : `
                        inline-flex
                        items-center
                        rounded-full
                        border
                        border-white/[0.07]
                        bg-white/[0.03]
                        px-2.5
                        py-1
                        text-[10px]
                        font-bold
                        uppercase
                        text-slate-500
                    `
            }
        >

            {admin && (

                <ShieldCheck
                    size={11}
                />

            )}

            {admin
                ? "Admin"
                : "Player"}

        </span>

    );

}


// ======================================================
// VERIFICATION BADGE
// ======================================================

function VerificationBadge({
    verified,
    label = "",
}) {

    return (

        <span
            className={
                verified
                    ? `
                        inline-flex
                        items-center
                        gap-1.5
                        rounded-full
                        border
                        border-green-500/20
                        bg-green-500/10
                        px-2.5
                        py-1
                        text-[10px]
                        font-bold
                        uppercase
                        text-green-400
                    `
                    : `
                        inline-flex
                        items-center
                        gap-1.5
                        rounded-full
                        border
                        border-yellow-500/20
                        bg-yellow-500/10
                        px-2.5
                        py-1
                        text-[10px]
                        font-bold
                        uppercase
                        text-yellow-400
                    `
            }
        >

            {verified ? (

                <ShieldCheck
                    size={11}
                />

            ) : (

                <ShieldAlert
                    size={11}
                />

            )}


            {label}
            {verified
                ? "Verified"
                : "Unverified"}

        </span>

    );

}


// ======================================================
// REFERRED BY
// ======================================================

function getReferredBy(
    referredBy
) {

    if (!referredBy) {
        return "No referrer";
    }


    if (
        typeof referredBy ===
        "string"
    ) {

        return referredBy;

    }


    return (
        referredBy?.fullName ||
        referredBy?.username ||
        referredBy?._id ||
        "No referrer"
    );

}


// ======================================================
// LOADING
// ======================================================

function LoadingState() {

    return (

        <div
            className="
                flex
                min-h-[500px]
                flex-col
                items-center
                justify-center
            "
        >

            <div
                className="
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-white/[0.06]
                    bg-white/[0.02]
                "
            >

                <div
                    className="
                        h-5
                        w-5
                        animate-spin
                        rounded-full
                        border-2
                        border-white/10
                        border-t-purple-500
                    "
                />

            </div>


            <p
                className="
                    mt-4
                    text-xs
                    text-slate-600
                "
            >
                Loading user details...
            </p>

        </div>

    );

}


// ======================================================
// ERROR
// ======================================================

function ErrorState({
    error,
    onClose,
}) {

    return (

        <div
            className="
                flex
                min-h-[500px]
                items-center
                justify-center
            "
        >

            <div
                className="
                    w-full
                    max-w-md
                    rounded-2xl
                    border
                    border-red-500/10
                    bg-red-500/[0.04]
                    p-6
                    text-center
                "
            >

                <div
                    className="
                        mx-auto
                        flex
                        h-10
                        w-10
                        items-center
                        justify-center
                        rounded-xl
                        bg-red-500/10
                    "
                >

                    <ShieldAlert
                        size={18}
                        className="
                            text-red-400
                        "
                    />

                </div>


                <p
                    className="
                        mt-4
                        text-sm
                        font-semibold
                        text-red-400
                    "
                >
                    Unable to load user details
                </p>


                <p
                    className="
                        mt-2
                        text-xs
                        leading-5
                        text-slate-600
                    "
                >
                    {error ||
                        "Something went wrong while loading this account."}
                </p>


                <button
                    type="button"
                    onClick={
                        onClose
                    }
                    className="
                        mt-5
                        cursor-pointer
                        rounded-lg
                        border
                        border-white/[0.06]
                        bg-white/[0.02]
                        px-4
                        py-2
                        text-xs
                        font-semibold
                        text-slate-500
                        transition
                        hover:bg-white/[0.05]
                        hover:text-white
                    "
                >
                    Close
                </button>

            </div>

        </div>

    );

}