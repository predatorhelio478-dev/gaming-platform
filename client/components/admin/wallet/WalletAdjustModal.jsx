"use client";

import {
    useEffect,
    useState,
} from "react";

import {
    X,
    Wallet,
    ArrowDownToLine,
    ArrowUpFromLine,
    AlertTriangle,
    CheckCircle2,
    Loader2,
} from "lucide-react";


// ======================================================
// WALLET ADJUST MODAL
// ======================================================

export default function WalletAdjustModal({

    open = false,

    user = null,

    mode = "credit",

    loading = false,

    error = "",

    onClose,

    onSubmit,

}) {

    // ==================================================
    // FORM
    // ==================================================

    const [
        amount,
        setAmount,
    ] = useState("");


    const [
        remark,
        setRemark,
    ] = useState("");


    const [
        localError,
        setLocalError,
    ] = useState("");


    // ==================================================
    // RESET FORM
    // ==================================================

    useEffect(() => {

        if (!open) {

            return;

        }


        setAmount("");

        setRemark("");

        setLocalError("");

    }, [
        open,
        mode,
        user?._id,
    ]);


    // ==================================================
    // ESC KEY
    // ==================================================

    useEffect(() => {

        if (!open) {

            return;

        }


        const handleKeyDown = (
            event
        ) => {

            if (
                event.key ===
                "Escape" &&
                !loading
            ) {

                if (
                    typeof onClose ===
                    "function"
                ) {

                    onClose();

                }

            }

        };


        document.addEventListener(
            "keydown",
            handleKeyDown
        );


        return () => {

            document.removeEventListener(
                "keydown",
                handleKeyDown
            );

        };

    }, [
        open,
        loading,
        onClose,
    ]);


    // ==================================================
    // BODY SCROLL
    // ==================================================

    useEffect(() => {

        if (!open) {

            return;

        }


        const previousOverflow =
            document.body.style.overflow;


        document.body.style.overflow =
            "hidden";


        return () => {

            document.body.style.overflow =
                previousOverflow;

        };

    }, [
        open,
    ]);


    // ==================================================
    // SAFE NUMBER
    // ==================================================

    const number = (
        value
    ) => {

        const parsed =
            Number(value);


        return Number.isFinite(
            parsed
        )
            ? parsed
            : 0;

    };


    // ==================================================
    // CURRENCY
    // ==================================================

    const currency = (
        value
    ) => {

        return new Intl.NumberFormat(
            "en-IN",
            {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 2,
            }
        ).format(
            number(value)
        );

    };


    // ==================================================
    // USER
    // ==================================================

    const userName =
        user?.fullName ||
        user?.username ||
        "Unknown User";


    const username =
        user?.username ||
        "—";


    const currentBalance =
        number(
            user?.wallet?.balance ??
            user?.balance
        );


    // ==================================================
    // MODE
    // ==================================================

    const isDebit =
        mode === "debit";


    const title =
        isDebit
            ? "Debit Wallet"
            : "Credit Wallet";


    const description =
        isDebit
            ? "Remove funds from this user's wallet."
            : "Add funds to this user's wallet.";


    const submitText =
        isDebit
            ? "Debit Wallet"
            : "Credit Wallet";


    // ==================================================
    // VALIDATION
    // ==================================================

    const validate = () => {

        const value =
            Number(amount);


        if (
            amount === "" ||
            amount === null ||
            amount === undefined
        ) {

            return "Please enter an amount.";

        }


        if (
            !Number.isFinite(
                value
            )
        ) {

            return "Please enter a valid amount.";

        }


        if (
            value <= 0
        ) {

            return "Amount must be greater than ₹0.";

        }


        if (
            value > 1000000
        ) {

            return "Maximum adjustment amount is ₹10,00,000.";

        }


        if (
            isDebit &&
            value > currentBalance
        ) {

            return "Debit amount cannot be greater than the available wallet balance.";

        }


        if (
            !remark.trim()
        ) {

            return "Please enter a reason for this adjustment.";

        }


        if (
            remark.trim().length < 3
        ) {

            return "Reason must contain at least 3 characters.";

        }


        if (
            remark.trim().length > 250
        ) {

            return "Reason cannot exceed 250 characters.";

        }


        return "";

    };


    // ==================================================
    // SUBMIT
    // ==================================================

    const handleSubmit = async (
        event
    ) => {

        event.preventDefault();


        if (loading) {

            return;

        }


        setLocalError("");


        const validationError =
            validate();


        if (
            validationError
        ) {

            setLocalError(
                validationError
            );

            return;

        }


        try {

            if (
                typeof onSubmit ===
                "function"
            ) {

                await onSubmit({

                    userId:
                        user?._id ||
                        user?.id,

                    amount:
                        Number(amount),

                    remark:
                        remark.trim(),

                    type:
                        mode,

                });

            }

        } catch (
        submitError
        ) {

            setLocalError(
                submitError?.message ||
                "Unable to update wallet."
            );

        }

    };


    // ==================================================
    // DO NOT RENDER
    // ==================================================

    if (!open) {

        return null;

    }


    // ==================================================
    // RENDER
    // ==================================================

    return (

        <div
            className="
                fixed
                inset-0
                z-[120]
                flex
                items-center
                justify-center
                bg-black/75
                p-4
                backdrop-blur-sm
            "
            onMouseDown={(
                event
            ) => {

                if (
                    event.target ===
                    event.currentTarget &&
                    !loading
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

            <div
                className="
                    w-full
                    max-w-md
                    overflow-hidden
                    rounded-2xl
                    border
                    border-white/[0.08]
                    bg-[#0b0f1c]
                    shadow-[0_25px_100px_rgba(0,0,0,0.65)]
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
                                ${isDebit
                                    ? "bg-red-500/10 text-red-400"
                                    : "bg-emerald-500/10 text-emerald-400"
                                }
                            `}
                        >

                            {
                                isDebit
                                    ? (
                                        <ArrowUpFromLine
                                            size={18}
                                        />
                                    )
                                    : (
                                        <ArrowDownToLine
                                            size={18}
                                        />
                                    )
                            }

                        </div>


                        <div>

                            <h2
                                className="
                                    text-base
                                    font-bold
                                    text-white
                                "
                            >

                                {
                                    title
                                }

                            </h2>


                            <p
                                className="
                                    mt-0.5
                                    text-[12px]
                                    text-slate-500
                                "
                            >

                                {
                                    description
                                }

                            </p>

                        </div>

                    </div>


                    <button
                        type="button"
                        disabled={
                            loading
                        }
                        onClick={
                            onClose
                        }
                        className="
                            flex
                            h-8
                            w-8
                            items-center
                            justify-center
                            rounded-lg
                            text-slate-600
                            transition
                            hover:bg-white/[0.05]
                            hover:text-white
                            disabled:cursor-not-allowed
                            disabled:opacity-40
                        "
                        aria-label="Close"
                    >

                        <X
                            size={17}
                        />

                    </button>

                </div>


                {/* ==================================================
                    BODY
                ================================================== */}

                <form
                    onSubmit={
                        handleSubmit
                    }
                >

                    <div
                        className="
                            space-y-5
                            p-5
                        "
                    >

                        {/* ==================================================
                            USER
                        ================================================== */}

                        <div
                            className="
                                flex
                                items-center
                                justify-between
                                rounded-2xl
                                border
                                border-white/[0.06]
                                bg-white/[0.02]
                                p-3
                            "
                        >

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
                                            .charAt(0)
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


                            <div
                                className="
                                    ml-3
                                    shrink-0
                                    text-right
                                "
                            >

                                <p
                                    className="
                                        text-[12px]
                                        uppercase
                                        tracking-wider
                                        text-slate-500
                                    "
                                >

                                    Balance

                                </p>


                                <p
                                    className="
                                        mt-0.5
                                        text-xs
                                        font-black
                                        text-emerald-400
                                    "
                                >

                                    {
                                        currency(
                                            currentBalance
                                        )
                                    }

                                </p>

                            </div>

                        </div>


                        {/* ==================================================
                            AMOUNT
                        ================================================== */}

                        <div>

                            <label
                                htmlFor="wallet-adjust-amount"
                                className="
                                    mb-2
                                    block
                                    text-[12px]
                                    font-semibold
                                    text-slate-400
                                "
                            >

                                Amount

                            </label>


                            <div
                                className={`
                                    flex
                                    overflow-hidden
                                    rounded-xl
                                    border
                                    bg-[#070b15]
                                    ${isDebit
                                        ? "border-red-500/20 focus-within:border-red-500/50"
                                        : "border-emerald-500/20 focus-within:border-emerald-500/50"
                                    }
                                `}
                            >

                                <span
                                    className="
                                        flex
                                        items-center
                                        px-4
                                        text-sm
                                        font-bold
                                        text-slate-600
                                    "
                                >

                                    ₹

                                </span>


                                <input
                                    id="wallet-adjust-amount"
                                    type="number"
                                    min="1"
                                    max="1000000"
                                    step="0.01"
                                    value={
                                        amount
                                    }
                                    disabled={
                                        loading
                                    }
                                    onChange={(
                                        event
                                    ) => {

                                        setAmount(
                                            event.target.value
                                        );

                                        if (
                                            localError
                                        ) {

                                            setLocalError(
                                                ""
                                            );

                                        }

                                    }}
                                    placeholder="Enter amount"
                                    className="
                                        min-w-0
                                        flex-1
                                        bg-transparent
                                        px-2
                                        py-3.5
                                        text-sm
                                        font-semibold
                                        text-white
                                        outline-none
                                        placeholder:text-slate-500
                                        disabled:cursor-not-allowed
                                    "
                                />

                            </div>


                            <p
                                className="
                                    mt-1.5
                                    text-[11px]
                                    text-slate-500
                                "
                            >

                                Maximum adjustment:
                                ₹10,00,000

                            </p>

                        </div>


                        {/* ==================================================
                            REMARK
                        ================================================== */}

                        <div>

                            <div
                                className="
                                    mb-2
                                    flex
                                    items-center
                                    justify-between
                                "
                            >

                                <label
                                    htmlFor="wallet-adjust-remark"
                                    className="
                                        text-[11px]
                                        font-semibold
                                        text-slate-400
                                    "
                                >

                                    Reason / Remark

                                </label>


                                <span
                                    className="
                                        text-[11px]
                                        text-slate-500
                                    "
                                >

                                    {
                                        remark.length
                                    }
                                    /250

                                </span>

                            </div>


                            <textarea
                                id="wallet-adjust-remark"
                                value={
                                    remark
                                }
                                disabled={
                                    loading
                                }
                                maxLength={
                                    250
                                }
                                rows={
                                    3
                                }
                                onChange={(
                                    event
                                ) => {

                                    setRemark(
                                        event.target.value
                                    );

                                    if (
                                        localError
                                    ) {

                                        setLocalError(
                                            ""
                                        );

                                    }

                                }}
                                placeholder={
                                    isDebit
                                        ? "Why are you debiting this wallet?"
                                        : "Why are you crediting this wallet?"
                                }
                                className="
                                    w-full
                                    resize-none
                                    rounded-xl
                                    border
                                    border-white/[0.07]
                                    bg-[#070b15]
                                    px-3
                                    py-3
                                    text-xs
                                    text-white
                                    outline-none
                                    transition
                                    placeholder:text-slate-600
                                    focus:border-violet-500/50
                                    disabled:cursor-not-allowed
                                "
                            />

                        </div>


                        {/* ==================================================
                            WARNING
                        ================================================== */}

                        <div
                            className={`
                                flex
                                gap-3
                                rounded-xl
                                border
                                p-3
                                ${isDebit
                                    ? "border-red-500/15 bg-red-500/[0.04]"
                                    : "border-yellow-500/15 bg-yellow-500/[0.04]"
                                }
                            `}
                        >

                            <AlertTriangle
                                size={15}
                                className={`
                                    mt-0.5
                                    shrink-0
                                    ${isDebit
                                        ? "text-red-400"
                                        : "text-yellow-400"
                                    }
                                `}
                            />


                            <p
                                className="
                                    text-[12px]
                                    leading-5
                                    text-slate-500
                                "
                            >

                                {isDebit ? (

                                    <>
                                        This amount will be
                                        deducted from the
                                        user's wallet.
                                        Make sure the debit
                                        is authorized.
                                    </>

                                ) : (

                                    <>
                                        This amount will be
                                        added to the user's
                                        wallet. The action
                                        will be recorded in
                                        the transaction
                                        history.
                                    </>

                                )}

                            </p>

                        </div>


                        {/* ==================================================
                            ERROR
                        ================================================== */}

                        {(localError ||
                            error) && (

                                <div
                                    className="
                                    flex
                                    items-start
                                    gap-2
                                    rounded-xl
                                    border
                                    border-red-500/20
                                    bg-red-500/[0.05]
                                    px-3
                                    py-2.5
                                    text-[10px]
                                    font-medium
                                    text-red-400
                                "
                                >

                                    <AlertTriangle
                                        size={13}
                                        className="
                                        mt-0.5
                                        shrink-0
                                    "
                                    />


                                    <span>

                                        {
                                            localError ||
                                            error
                                        }

                                    </span>

                                </div>

                            )}

                    </div>


                    {/* ==================================================
                        FOOTER
                    ================================================== */}

                    <div
                        className="
                            flex
                            gap-2
                            border-t
                            border-white/[0.06]
                            p-4
                        "
                    >

                        <button
                            type="button"
                            disabled={
                                loading
                            }
                            onClick={
                                onClose
                            }
                            className="
                                flex-1
                                rounded-xl
                                border
                                border-white/[0.07]
                                bg-white/[0.02]
                                px-4
                                py-3
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

                            Cancel

                        </button>


                        <button
                            type="submit"
                            disabled={
                                loading
                            }
                            className={`
                                flex
                                flex-1
                                items-center
                                justify-center
                                gap-2
                                rounded-xl
                                px-4
                                py-3
                                text-xs
                                font-bold
                                text-white
                                transition
                                disabled:cursor-not-allowed
                                disabled:opacity-50
                                ${isDebit
                                    ? "bg-red-600 hover:bg-red-500"
                                    : "bg-emerald-600 hover:bg-emerald-500"
                                }
                            `}
                        >

                            {loading ? (

                                <>

                                    <Loader2
                                        size={14}
                                        className="
                                            animate-spin
                                        "
                                    />

                                    Processing...

                                </>

                            ) : (

                                <>

                                    {
                                        isDebit
                                            ? (
                                                <ArrowUpFromLine
                                                    size={14}
                                                />
                                            )
                                            : (
                                                <CheckCircle2
                                                    size={14}
                                                />
                                            )
                                    }

                                    {
                                        submitText
                                    }

                                </>

                            )}

                        </button>

                    </div>

                </form>

            </div>

        </div>

    );

}