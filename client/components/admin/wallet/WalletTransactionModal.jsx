"use client";

import {
    X,
    ArrowDownLeft,
    ArrowUpRight,
    Wallet,
    User,
    Hash,
    CalendarDays,
    CreditCard,
    FileText,
} from "lucide-react";


// ======================================================
// WALLET TRANSACTION MODAL
// ======================================================

export default function WalletTransactionModal({

    transaction = null,

    onClose,

    formatCurrency,

    formatDate,

}) {

    if (!transaction) {
        return null;
    }


    // ==================================================
    // HELPERS
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
                dateStyle: "medium",
                timeStyle: "short",
            }
        ).format(
            parsed
        );

    };


    // ==================================================
    // USER
    // ==================================================

    const user =
        transaction?.user ||
        {};


    const userName =
        user?.fullName ||
        user?.username ||
        "Unknown User";


    const username =
        user?.username ||
        "—";


    // ==================================================
    // TRANSACTION
    // ==================================================

    const type =
        String(
            transaction?.type ||
            ""
        ).toLowerCase();


    const status =
        String(
            transaction?.status ||
            "pending"
        ).toLowerCase();


    const amount =
        Number(
            transaction?.amount
        ) || 0;


    const normalizedType =
        String(
            transaction?.type ||
            ""
        )
            .trim()
            .toLowerCase();


    const isCredit =
        [
            "credit",
            "deposit",
            "win",
            "bonus",
            "refund",
            "admin_credit",
            "admin-credit",
            "wallet_credit",
        ].includes(
            normalizedType
        );


    const isDebit =
        [
            "debit",
            "withdraw",
            "bet",
            "admin_debit",
            "admin-debit",
            "wallet_debit",
        ].includes(
            normalizedType
        );


    const TypeIcon =
        isCredit
            ? ArrowDownLeft
            : ArrowUpRight;


    // ==================================================
    // STATUS CLASS
    // ==================================================

    const statusClass = {

        completed:
            "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",

        success:
            "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",

        pending:
            "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",

        failed:
            "border-red-500/20 bg-red-500/10 text-red-400",

        cancelled:
            "border-red-500/20 bg-red-500/10 text-red-400",

        reversed:
            "border-orange-500/20 bg-orange-500/10 text-orange-400",

    }[status] ||
        "border-white/[0.08] bg-white/[0.04] text-slate-400";


    // ==================================================
    // CLOSE
    // ==================================================

    const handleClose = () => {

        onClose?.();

    };


    return (

        <div
            className="
                fixed
                inset-0
                z-[100]
                flex
                items-center
                justify-center
                bg-black/70
                p-4
                backdrop-blur-sm
            "
            onMouseDown={(
                event
            ) => {

                if (
                    event.target ===
                    event.currentTarget
                ) {

                    handleClose();

                }

            }}
        >

            {/* ==================================================
                MODAL
            ================================================== */}

            <div
                className="
                    w-full
                    max-w-xl
                    overflow-hidden
                    rounded-2xl
                    border
                    border-white/[0.08]
                    bg-[#0d101d]
                    shadow-2xl
                    shadow-black/50
                "
            >

                {/* ==================================================
                    HEADER
                ================================================== */}

                <div
                    className="
                        flex
                        items-center
                        justify-between
                        border-b
                        border-white/[0.06]
                        px-5
                        py-4
                        sm:px-6
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
                            className={`
                                flex
                                h-10
                                w-10
                                items-center
                                justify-center
                                rounded-xl
                                ${isCredit
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : "bg-red-500/10 text-red-400"
                                }
                            `}
                        >

                            <TypeIcon
                                size={18}
                            />

                        </div>


                        <div>

                            <h3
                                className="
                                    text-base
                                    font-bold
                                    text-white
                                "
                            >
                                Transaction Details
                            </h3>


                            <p
                                className="
                                    mt-0.5
                                    text-[11px]
                                    text-slate-600
                                "
                            >
                                View complete wallet transaction
                            </p>

                        </div>

                    </div>


                    <button
                        type="button"
                        onClick={
                            handleClose
                        }
                        className="
                            flex
                            h-9
                            w-9
                            items-center
                            justify-center
                            rounded-xl
                            border
                            border-white/[0.06]
                            bg-white/[0.02]
                            text-slate-500
                            transition
                            hover:bg-white/[0.06]
                            hover:text-white
                        "
                    >

                        <X
                            size={17}
                        />

                    </button>

                </div>


                {/* ==================================================
                    BODY
                ================================================== */}

                <div
                    className="
                        max-h-[75vh]
                        overflow-y-auto
                        p-5
                        sm:p-6
                    "
                >

                    {/* ==================================================
                        AMOUNT
                    ================================================== */}

                    <div
                        className="
                            rounded-2xl
                            border
                            border-white/[0.06]
                            bg-white/[0.02]
                            p-5
                        "
                    >

                        <p
                            className="
                                text-[10px]
                                font-semibold
                                uppercase
                                tracking-[0.15em]
                                text-slate-600
                            "
                        >
                            Transaction Amount
                        </p>


                        <div
                            className="
                                mt-2
                                flex
                                items-center
                                justify-between
                                gap-4
                            "
                        >

                            <p
                                className={`
                                    text-3xl
                                    font-black
                                    tracking-tight
                                    ${isCredit
                                        ? "text-emerald-400"
                                        : "text-red-400"
                                    }
                                `}
                            >

                                {isCredit
                                    ? "+"
                                    : "-"}

                                {currency(
                                    Math.abs(
                                        amount
                                    )
                                )}

                            </p>


                            <span
                                className={`
                                    rounded-full
                                    border
                                    px-3
                                    py-1
                                    text-[12px]
                                    font-bold
                                    capitalize
                                    ${isCredit
                                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                                        : "border-red-500/20 bg-red-500/10 text-red-400"
                                    }
                                `}
                            >
                                {
                                    transaction?.type ||
                                    "Transaction"
                                }
                            </span>

                        </div>

                    </div>


                    {/* ==================================================
                        USER
                    ================================================== */}

                    <div
                        className="
                            mt-4
                            rounded-2xl
                            border
                            border-white/[0.06]
                            bg-white/[0.02]
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
                                    items-center
                                    justify-center
                                    rounded-xl
                                    bg-violet-500/10
                                    text-violet-400
                                "
                            >

                                <User
                                    size={17}
                                />

                            </div>


                            <div>

                                <p
                                    className="
                                        text-sm
                                        font-bold
                                        text-white
                                    "
                                >
                                    {
                                        userName
                                    }
                                </p>


                                <p
                                    className="
                                        mt-0.5
                                        text-[12px]
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

                    </div>


                    {/* ==================================================
                        DETAILS GRID
                    ================================================== */}

                    <div
                        className="
                            mt-4
                            grid
                            gap-3
                            sm:grid-cols-2
                        "
                    >

                        {/* TRANSACTION ID */}

                        <Detail
                            icon={
                                <Hash
                                    size={15}
                                />
                            }
                            label="Transaction ID"
                            value={
                                transaction?.transactionId ||
                                transaction?._id ||
                                "—"
                            }
                        />


                        {/* STATUS */}

                        <Detail
                            icon={
                                <FileText
                                    size={15}
                                />
                            }
                            label="Status"
                            value={
                                <span
                                    className={`
                                        inline-flex
                                        rounded-full
                                        border
                                        px-2.5
                                        py-1
                                        text-[9px]
                                        font-bold
                                        capitalize
                                        ${statusClass}
                                    `}
                                >
                                    {
                                        status
                                    }
                                </span>
                            }
                        />


                        {/* PREVIOUS BALANCE */}

                        <Detail
                            icon={
                                <Wallet
                                    size={15}
                                />
                            }
                            label="Previous Balance"
                            value={
                                currency(
                                    transaction?.previousBalance
                                )
                            }
                        />


                        {/* CURRENT BALANCE */}

                        <Detail
                            icon={
                                <Wallet
                                    size={15}
                                />
                            }
                            label="Current Balance"
                            value={
                                currency(
                                    transaction?.currentBalance
                                )
                            }
                        />


                        {/* PAYMENT METHOD */}

                        <Detail
                            icon={
                                <CreditCard
                                    size={15}
                                />
                            }
                            label="Payment Method"
                            value={
                                transaction?.paymentMethod ||
                                "—"
                            }
                        />


                        {/* DATE */}

                        <Detail
                            icon={
                                <CalendarDays
                                    size={15}
                                />
                            }
                            label="Created"
                            value={
                                date(
                                    transaction?.createdAt
                                )
                            }
                        />

                    </div>


                    {/* ==================================================
                        DESCRIPTION
                    ================================================== */}

                    {(transaction?.description ||
                        transaction?.remark ||
                        transaction?.reference) && (

                            <div
                                className="
                                mt-4
                                rounded-2xl
                                border
                                border-white/[0.06]
                                bg-white/[0.02]
                                p-4
                            "
                            >

                                <p
                                    className="
                                    text-[10px]
                                    font-semibold
                                    uppercase
                                    tracking-[0.15em]
                                    text-slate-600
                                "
                                >
                                    Description
                                </p>


                                <p
                                    className="
                                    mt-2
                                    text-xs
                                    leading-5
                                    text-slate-400
                                "
                                >
                                    {
                                        transaction?.description ||
                                        transaction?.remark ||
                                        transaction?.reference ||
                                        "—"
                                    }
                                </p>

                            </div>

                        )}

                </div>


                {/* ==================================================
                    FOOTER
                ================================================== */}

                <div
                    className="
                        flex
                        justify-end
                        border-t
                        border-white/[0.06]
                        px-5
                        py-4
                        sm:px-6
                    "
                >

                    <button
                        type="button"
                        onClick={
                            handleClose
                        }
                        className="
                            rounded-xl
                            border
                            border-white/[0.07]
                            bg-white/[0.03]
                            px-4
                            py-2.5
                            text-xs
                            font-semibold
                            text-slate-400
                            transition
                            hover:bg-white/[0.06]
                            hover:text-white
                        "
                    >
                        Close
                    </button>

                </div>

            </div>

        </div>

    );

}


// ======================================================
// DETAIL
// ======================================================

function Detail({
    icon,
    label,
    value,
}) {

    return (

        <div
            className="
                rounded-2xl
                border
                border-white/[0.06]
                bg-white/[0.02]
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
                        text-slate-600
                    "
                >
                    {icon}
                </span>


                <p
                    className="
                        text-[10px]
                        font-semibold
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
                    break-all
                    text-xs
                    font-semibold
                    text-slate-300
                "
            >
                {value}
            </div>

        </div>

    );

}