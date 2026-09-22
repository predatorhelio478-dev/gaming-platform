"use client";

import {
    useEffect,
    useState,
} from "react";

import {
    X,
    Wallet,
    Plus,
    Minus,
    IndianRupee,
    AlertTriangle,
    Save,
} from "lucide-react";

import AdminDropdown
    from "@/components/admin/ui/AdminDropdown";


// ======================================================
// USER BALANCE MODAL
// ======================================================

export default function UserBalanceModal({
    open = false,
    user = null,
    actionLoading = false,
    onClose,
    onSubmit,
}) {

    const [formData, setFormData] =
        useState({

            action: "add",

            amount: "",

            remark: "",

        });


    const [errors, setErrors] =
        useState({});


    // ==================================================
    // RESET / LOAD USER
    // ==================================================

    useEffect(() => {

        if (!open) {

            setFormData({

                action: "add",

                amount: "",

                remark: "",

            });

            setErrors({});

            return;

        }


        setFormData({

            action: "add",

            amount: "",

            remark: "",

        });

        setErrors({});

    }, [open, user]);


    // ==================================================
    // CURRENT BALANCE
    // ==================================================

    const currentBalance =
        Number(
            user?.wallet?.balance ??
            user?.walletBalance ??
            user?.balance ??
            0
        );


    // ==================================================
    // USER NAME
    // ==================================================

    const userName =
        user?.fullName ||
        user?.username ||
        "Unknown User";


    const username =
        user?.username
            ? `@${user.username}`
            : "";


    // ==================================================
    // HANDLE CHANGE
    // ==================================================

    const handleChange = (
        event
    ) => {

        const {
            name,
            value,
        } = event.target;


        setFormData(
            (current) => ({

                ...current,

                [name]:
                    value,

            })
        );


        setErrors(
            (current) => ({

                ...current,

                [name]: "",

                submit: "",

            })
        );

    };


    // ==================================================
    // VALIDATE
    // ==================================================

    const validate = () => {

        const nextErrors = {};


        const numericAmount =
            Number(
                formData.amount
            );


        if (
            !formData.amount ||
            !Number.isFinite(
                numericAmount
            )
        ) {

            nextErrors.amount =
                "Amount is required.";

        } else if (
            numericAmount <= 0
        ) {

            nextErrors.amount =
                "Amount must be greater than 0.";

        }


        /*
         * Prevent deducting more than
         * current wallet balance.
         *
         * Backend also validates this,
         * but frontend gives immediate feedback.
         */

        if (
            formData.action === "deduct" &&
            numericAmount > currentBalance
        ) {

            nextErrors.amount =
                "Insufficient wallet balance.";

        }


        if (
            !formData.remark.trim()
        ) {

            nextErrors.remark =
                "Reason is required.";

        }


        setErrors(
            nextErrors
        );


        return (
            Object.keys(
                nextErrors
            ).length === 0
        );

    };


    // ==================================================
    // SUBMIT
    // ==================================================

    const handleSubmit = async (
        event
    ) => {

        event.preventDefault();


        if (actionLoading) {
            return;
        }


        if (!validate()) {
            return;
        }


        try {

            await onSubmit?.({

                amount:
                    Number(
                        formData.amount
                    ),

                action:
                    formData.action,

                remark:
                    formData.remark.trim(),

            });

        } catch (
        submitError
        ) {

            setErrors({

                submit:
                    submitError?.message ||
                    "Unable to adjust wallet balance.",

            });

        }

    };


    // ==================================================
    // CLOSE
    // ==================================================

    const handleClose = () => {

        if (actionLoading) {
            return;
        }

        onClose?.();

    };


    // ==================================================
    // FORMAT CURRENCY
    // ==================================================

    const formatCurrency =
        (value) => {

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
    // ACTION LABEL
    // ==================================================

    const isAdd =
        formData.action === "add";


    const submitLabel =
        isAdd
            ? "Add Balance"
            : "Deduct Balance";


    if (!open) {
        return null;
    }


    return (

        <div
            className="
                fixed
                inset-0
                z-[110]
                flex
                items-center
                justify-center
                bg-black/70
                p-4
                backdrop-blur-sm
            "
            onMouseDown={(event) => {

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
                    max-w-lg
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
                            className="
                                flex
                                h-10
                                w-10
                                items-center
                                justify-center
                                rounded-xl
                                bg-yellow-500/10
                            "
                        >

                            <Wallet
                                size={18}
                                className="text-yellow-400"
                            />

                        </div>


                        <div>

                            <h2
                                className="
                                    text-base
                                    font-bold
                                    text-white
                                "
                            >
                                Adjust Wallet
                            </h2>


                            <p
                                className="
                                    mt-0.5
                                    text-xs
                                    text-slate-600
                                "
                            >
                                Add or deduct player balance
                            </p>

                        </div>

                    </div>


                    <button
                        type="button"
                        onClick={
                            handleClose
                        }
                        disabled={
                            actionLoading
                        }
                        className="
                            flex
                            h-9
                            w-9
                            items-center
                            justify-center
                            rounded-lg
                            text-slate-600
                            transition
                            hover:bg-white/[0.04]
                            hover:text-white
                            disabled:cursor-not-allowed
                            disabled:opacity-40
                        "
                    >

                        <X
                            size={18}
                        />

                    </button>

                </div>


                {/* ==================================================
                    FORM
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
                            sm:p-6
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
                                rounded-xl
                                border
                                border-white/[0.06]
                                bg-white/[0.02]
                                px-4
                                py-3
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
                                        border
                                        border-purple-500/20
                                        bg-purple-500/[0.07]
                                        text-xs
                                        font-black
                                        text-purple-300
                                    "
                                >

                                    {userName
                                        .slice(
                                            0,
                                            2
                                        )
                                        .toUpperCase()
                                    }

                                </div>


                                <div
                                    className="min-w-0"
                                >

                                    <p
                                        className="
                                            truncate
                                            text-xs
                                            font-bold
                                            text-white
                                        "
                                    >
                                        {userName}
                                    </p>


                                    {username && (

                                        <p
                                            className="
                                                mt-0.5
                                                truncate
                                                text-[10px]
                                                text-slate-600
                                            "
                                        >
                                            {username}
                                        </p>

                                    )}

                                </div>

                            </div>


                            <div
                                className="
                                    ml-4
                                    shrink-0
                                    text-right
                                "
                            >

                                <p
                                    className="
                                        text-[9px]
                                        font-bold
                                        uppercase
                                        tracking-[0.12em]
                                        text-slate-600
                                    "
                                >
                                    Current Balance
                                </p>


                                <p
                                    className="
                                        mt-0.5
                                        text-sm
                                        font-black
                                        text-white
                                    "
                                >
                                    {formatCurrency(
                                        currentBalance
                                    )}
                                </p>

                            </div>

                        </div>


                        {/* ==================================================
                            ERROR
                        ================================================== */}

                        {errors.submit && (

                            <div
                                className="
                                    flex
                                    items-start
                                    gap-2
                                    rounded-xl
                                    border
                                    border-red-500/20
                                    bg-red-500/[0.05]
                                    px-4
                                    py-3
                                "
                            >

                                <AlertTriangle
                                    size={14}
                                    className="
                                        mt-0.5
                                        shrink-0
                                        text-red-400
                                    "
                                />


                                <p
                                    className="
                                        text-xs
                                        leading-5
                                        text-red-300
                                    "
                                >
                                    {errors.submit}
                                </p>

                            </div>

                        )}


                        {/* ==================================================
                            ACTION
                        ================================================== */}

                        <div>

                            <label
                                className="
                                    mb-1.5
                                    block
                                    text-[10px]
                                    font-bold
                                    uppercase
                                    tracking-[0.12em]
                                    text-slate-600
                                "
                            >
                                Action
                            </label>


                            <AdminDropdown
                                value={
                                    formData.action
                                }
                                onChange={(
                                    value
                                ) =>
                                    setFormData(
                                        (
                                            current
                                        ) => ({

                                            ...current,

                                            action:
                                                value,

                                        })
                                    )
                                }
                                options={[
                                    {
                                        value: "add",
                                        label: "Add Balance",
                                    },
                                    {
                                        value: "deduct",
                                        label: "Deduct Balance",
                                    },
                                ]}
                            />

                        </div>


                        {/* ==================================================
                            AMOUNT
                        ================================================== */}

                        <div>

                            <label
                                className="
                                    mb-1.5
                                    block
                                    text-[10px]
                                    font-bold
                                    uppercase
                                    tracking-[0.12em]
                                    text-slate-600
                                "
                            >
                                Amount
                            </label>


                            <div
                                className="relative"
                            >

                                <div
                                    className="
                                        pointer-events-none
                                        absolute
                                        left-3
                                        top-1/2
                                        flex
                                        -translate-y-1/2
                                        items-center
                                        text-slate-600
                                    "
                                >

                                    <IndianRupee
                                        size={14}
                                    />

                                </div>


                                <input
                                    type="number"
                                    name="amount"
                                    value={
                                        formData.amount
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    disabled={
                                        actionLoading
                                    }
                                    min="1"
                                    step="0.01"
                                    placeholder="Enter amount"
                                    className={`
                                        h-11
                                        w-full
                                        rounded-xl
                                        border
                                        bg-[#070914]
                                        pl-9
                                        pr-3
                                        text-sm
                                        text-slate-300
                                        outline-none
                                        transition
                                        placeholder:text-slate-700
                                        ${errors.amount
                                            ? "border-red-500/30 focus:border-red-500/50"
                                            : "border-white/[0.07] focus:border-purple-500/30"
                                        }
                                    `}
                                />

                            </div>


                            {errors.amount && (

                                <p
                                    className="
                                        mt-1.5
                                        text-[11px]
                                        text-red-400
                                    "
                                >
                                    {errors.amount}
                                </p>

                            )}

                        </div>


                        {/* ==================================================
                            QUICK AMOUNTS
                        ================================================== */}

                        <div>

                            <p
                                className="
                                    mb-2
                                    text-[10px]
                                    font-bold
                                    uppercase
                                    tracking-[0.12em]
                                    text-slate-700
                                "
                            >
                                Quick Amount
                            </p>


                            <div
                                className="
                                    flex
                                    flex-wrap
                                    gap-2
                                "
                            >

                                {[
                                    100,
                                    500,
                                    1000,
                                    5000,
                                ].map(
                                    (amount) => (

                                        <button
                                            key={
                                                amount
                                            }
                                            type="button"
                                            disabled={
                                                actionLoading
                                            }
                                            onClick={() => {

                                                setFormData(
                                                    (
                                                        current
                                                    ) => ({

                                                        ...current,

                                                        amount:
                                                            String(
                                                                amount
                                                            ),

                                                    })
                                                );

                                                setErrors(
                                                    (
                                                        current
                                                    ) => ({

                                                        ...current,

                                                        amount:
                                                            "",

                                                        submit:
                                                            "",

                                                    })
                                                );

                                            }}
                                            className="
                                                rounded-lg
                                                border
                                                border-white/[0.07]
                                                bg-white/[0.025]
                                                px-3
                                                py-1.5
                                                text-[11px]
                                                font-semibold
                                                text-slate-500
                                                transition
                                                hover:border-purple-500/20
                                                hover:bg-purple-500/[0.05]
                                                hover:text-purple-300
                                                disabled:cursor-not-allowed
                                                disabled:opacity-40
                                            "
                                        >

                                            ₹{amount.toLocaleString(
                                                "en-IN"
                                            )}

                                        </button>

                                    )
                                )}

                            </div>

                        </div>


                        {/* ==================================================
                            REMARK
                        ================================================== */}

                        <div>

                            <label
                                className="
                                    mb-1.5
                                    block
                                    text-[10px]
                                    font-bold
                                    uppercase
                                    tracking-[0.12em]
                                    text-slate-600
                                "
                            >
                                Reason
                            </label>


                            <textarea
                                name="remark"
                                value={
                                    formData.remark
                                }
                                onChange={
                                    handleChange
                                }
                                disabled={
                                    actionLoading
                                }
                                rows={3}
                                maxLength={500}
                                placeholder={
                                    isAdd
                                        ? "Why are you adding balance?"
                                        : "Why are you deducting balance?"
                                }
                                className={`
                                    w-full
                                    resize-none
                                    rounded-xl
                                    border
                                    bg-[#070914]
                                    px-3
                                    py-3
                                    text-sm
                                    text-slate-300
                                    outline-none
                                    transition
                                    placeholder:text-slate-700
                                    ${errors.remark
                                        ? "border-red-500/30 focus:border-red-500/50"
                                        : "border-white/[0.07] focus:border-purple-500/30"
                                    }
                                `}
                            />


                            <div
                                className="
                                    mt-1.5
                                    flex
                                    items-center
                                    justify-between
                                "
                            >

                                {errors.remark ? (

                                    <p
                                        className="
                                            text-[11px]
                                            text-red-400
                                        "
                                    >
                                        {errors.remark}
                                    </p>

                                ) : (

                                    <p
                                        className="
                                            text-[10px]
                                            text-slate-700
                                        "
                                    >
                                        Reason will be saved with the transaction.
                                    </p>

                                )}


                                <span
                                    className="
                                        text-[10px]
                                        text-slate-700
                                    "
                                >
                                    {formData.remark.length}/500
                                </span>

                            </div>

                        </div>


                        {/* ==================================================
                            WARNING FOR DEDUCT
                        ================================================== */}

                        {!isAdd && (

                            <div
                                className="
                                    flex
                                    items-start
                                    gap-2
                                    rounded-xl
                                    border
                                    border-yellow-500/15
                                    bg-yellow-500/[0.04]
                                    px-4
                                    py-3
                                "
                            >

                                <AlertTriangle
                                    size={14}
                                    className="
                                        mt-0.5
                                        shrink-0
                                        text-yellow-400
                                    "
                                />


                                <p
                                    className="
                                        text-[11px]
                                        leading-5
                                        text-slate-500
                                    "
                                >
                                    Deducting balance will immediately
                                    reduce the player's wallet balance.
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
                            shrink-0
                            items-center
                            justify-end
                            gap-2
                            border-t
                            border-white/[0.06]
                            bg-[#0b0e19]
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
                            disabled={
                                actionLoading
                            }
                            className="
                                h-10
                                rounded-xl
                                border
                                border-white/[0.07]
                                px-4
                                text-xs
                                font-semibold
                                text-slate-500
                                transition
                                hover:border-white/[0.12]
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
                                actionLoading
                            }
                            className={`
                                flex
                                h-10
                                min-w-[145px]
                                items-center
                                justify-center
                                gap-2
                                rounded-xl
                                px-4
                                text-xs
                                font-bold
                                text-white
                                transition
                                disabled:cursor-not-allowed
                                disabled:opacity-50
                                ${isAdd
                                    ? "bg-purple-600 hover:bg-purple-500"
                                    : "bg-red-600 hover:bg-red-500"
                                }
                            `}
                        >

                            {actionLoading ? (

                                "Processing..."

                            ) : (

                                <>

                                    {isAdd ? (
                                        <Plus size={14} />
                                    ) : (
                                        <Minus size={14} />
                                    )}

                                    {submitLabel}

                                </>

                            )}

                        </button>

                    </div>

                </form>

            </div>

        </div>

    );

}