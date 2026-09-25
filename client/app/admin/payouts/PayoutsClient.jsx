"use client";

import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import {
    RefreshCw,
    X,
    User,
    Hash,
    CreditCard,
    Trophy,
    Clock3,
    Receipt,
    AlertTriangle,
    RotateCcw,
    Ban,
    Banknote,
    CheckCircle2,
} from "lucide-react";

import AdminHeader from "../../../components/admin/AdminHeader";

import PayoutStats from "../../../components/admin/payouts/PayoutStats";
import PayoutFilters from "../../../components/admin/payouts/PayoutFilters";
import PayoutTable from "../../../components/admin/payouts/PayoutTable";

import {
    getAdminPayouts,
    retryAdminPayout,
    manualReviewAdminPayout,
    cancelAdminPayout,
    reverseAdminPayout,
    refundAdminPayout,
    restoreAdminPayout,
} from "../../../lib/adminApi";


const AUTO_REFRESH_INTERVAL = 10000;


export default function PayoutsPage() {

    const [refundModal, setRefundModal] = useState({
        open: false,
        payout: null,
    });

    const [refundAmount, setRefundAmount] = useState("");

    const [refundReason, setRefundReason] = useState("");

    const [refundError, setRefundError] = useState("");

    const [refundBalances, setRefundBalances] = useState({});

    const [actionModal, setActionModal] = useState({
        open: false,
        type: null,
        payout: null,
    });

    const [actionReason, setActionReason] = useState("");

    const [actionError, setActionError] = useState("");

    /*
    |--------------------------------------------------------------------------
    | DATA
    |--------------------------------------------------------------------------
    */

    const [payouts, setPayouts] = useState([]);

    const [summary, setSummary] = useState({
        totalPayouts: 0,
        totalBetAmount: 0,
        totalPayoutAmount: 0,
    });

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
    });


    /*
    |--------------------------------------------------------------------------
    | FILTERS
    |--------------------------------------------------------------------------
    */

    const [search, setSearch] = useState("");

    const [status, setStatus] = useState("all");


    /*
    |--------------------------------------------------------------------------
    | UI STATES
    |--------------------------------------------------------------------------
    */

    const [loading, setLoading] = useState(true);

    const [refreshing, setRefreshing] = useState(false);

    const [actionLoading, setActionLoading] = useState(false);

    const [error, setError] = useState("");

    const [lastUpdated, setLastUpdated] = useState(null);


    /*
    |--------------------------------------------------------------------------
    | SELECTED PAYOUT
    |--------------------------------------------------------------------------
    */

    const [selectedPayout, setSelectedPayout] = useState(null);


    const searchTimer = useRef(null);

    const mountedRef = useRef(false);


    /*
    |--------------------------------------------------------------------------
    | FORMAT CURRENCY
    |--------------------------------------------------------------------------
    */

    const formatCurrency = useCallback(
        (value) => {

            return new Intl.NumberFormat(
                "en-IN",
                {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 0,
                }
            ).format(
                Number(value || 0)
            );

        },
        []
    );


    /*
    |--------------------------------------------------------------------------
    | FORMAT DATE
    |--------------------------------------------------------------------------
    */

    const formatDate = useCallback(
        (value) => {

            if (!value) {
                return "—";
            }


            const date = new Date(value);


            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {
                return "—";
            }


            return date.toLocaleString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                }
            );

        },
        []
    );


    /*
    |--------------------------------------------------------------------------
    | FETCH PAYOUTS
    |--------------------------------------------------------------------------
    */

    const fetchPayouts = useCallback(
        async ({
            page = 1,
            initial = false,
        } = {}) => {

            try {

                if (initial) {
                    setLoading(true);
                } else {
                    setRefreshing(true);
                }


                setError("");


                const response =
                    await getAdminPayouts({
                        page,

                        limit:
                            pagination.limit ||
                            20,

                        search:
                            search.trim(),

                        status,
                    });


                if (
                    response?.success === false
                ) {

                    throw new Error(
                        response?.message ||
                        "Unable to load payouts."
                    );

                }


                /*
                |--------------------------------------------------------------------------
                | PAYOUT DATA
                |--------------------------------------------------------------------------
                */

                setPayouts(
                    Array.isArray(
                        response?.data
                    )
                        ? response.data
                        : []
                );


                /*
                |--------------------------------------------------------------------------
                | SUMMARY
                |--------------------------------------------------------------------------
                */

                setSummary(
                    response?.summary ||
                    {
                        totalPayouts: 0,
                        totalBetAmount: 0,
                        totalPayoutAmount: 0,
                    }
                );


                /*
                |--------------------------------------------------------------------------
                | PAGINATION
                |--------------------------------------------------------------------------
                */

                setPagination(
                    response?.pagination ||
                    {
                        page,

                        limit:
                            pagination.limit ||
                            20,

                        total: 0,

                        totalPages: 1,

                        hasNextPage:
                            false,

                        hasPreviousPage:
                            false,
                    }
                );


                setLastUpdated(
                    new Date()
                );


                /*
                |--------------------------------------------------------------------------
                | UPDATE SELECTED PAYOUT
                |--------------------------------------------------------------------------
                |
                | If drawer is open and auto refresh happens,
                | update drawer data too.
                |
                */

                setSelectedPayout(
                    (current) => {

                        if (!current) {
                            return null;
                        }


                        const updated =
                            (
                                Array.isArray(
                                    response?.data
                                )
                                    ? response.data
                                    : []
                            ).find(
                                (item) =>
                                    item?._id ===
                                    current?._id
                            );


                        if (!updated) {
                            return current;
                        }


                        const localRemaining =
                            Number(
                                refundBalances?.[
                                current?._id
                                ]
                            );


                        if (
                            Number.isFinite(
                                localRemaining
                            ) &&
                            !Number.isFinite(
                                Number(
                                    updated?.remainingRefundable
                                )
                            )
                        ) {

                            return {
                                ...updated,

                                remainingRefundable:
                                    localRemaining,
                            };

                        }


                        return updated;

                    }
                );


            } catch (err) {

                console.error(
                    "Payout Fetch Error:",
                    err
                );


                setError(
                    err?.message ||
                    "Unable to load payouts."
                );


            } finally {

                setLoading(false);

                setRefreshing(false);

            }

        },
        [
            pagination.limit,
            search,
            status,
            refundBalances,
        ]
    );


    /*
    |--------------------------------------------------------------------------
    | INITIAL LOAD
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        if (
            mountedRef.current
        ) {
            return;
        }


        mountedRef.current = true;


        fetchPayouts({
            page: 1,
            initial: true,
        });

    }, [fetchPayouts]);


    /*
    |--------------------------------------------------------------------------
    | STATUS CHANGE
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        if (
            !mountedRef.current
        ) {
            return;
        }


        fetchPayouts({
            page: 1,
            initial: false,
        });

    }, [status]);


    /*
    |--------------------------------------------------------------------------
    | SEARCH
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        if (
            !mountedRef.current
        ) {
            return;
        }


        if (
            searchTimer.current
        ) {

            clearTimeout(
                searchTimer.current
            );

        }


        searchTimer.current =
            setTimeout(() => {

                fetchPayouts({
                    page: 1,
                    initial: false,
                });

            }, 500);


        return () => {

            if (
                searchTimer.current
            ) {

                clearTimeout(
                    searchTimer.current
                );

            }

        };

    }, [search]);


    /*
    |--------------------------------------------------------------------------
    | AUTO REFRESH
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        const interval =
            setInterval(() => {

                fetchPayouts({
                    page:
                        pagination.page ||
                        1,

                    initial: false,
                });

            }, AUTO_REFRESH_INTERVAL);


        return () => {

            clearInterval(
                interval
            );

        };

    }, [
        fetchPayouts,
        pagination.page,
    ]);


    /*
    |--------------------------------------------------------------------------
    | MANUAL REFRESH
    |--------------------------------------------------------------------------
    */

    const handleRefresh = () => {

        fetchPayouts({
            page:
                pagination.page ||
                1,

            initial: false,
        });

    };


    /*
    |--------------------------------------------------------------------------
    | RESET
    |--------------------------------------------------------------------------
    */

    const handleReset = () => {

        setSearch("");

        setStatus("all");

    };


    /*
    |--------------------------------------------------------------------------
    | PAGE CHANGE
    |--------------------------------------------------------------------------
    */

    const handlePageChange = (
        page
    ) => {

        if (
            page ===
            pagination.page
        ) {
            return;
        }


        fetchPayouts({
            page,
            initial: true,
        });

    };


    /*
    |--------------------------------------------------------------------------
    | VIEW PAYOUT
    |--------------------------------------------------------------------------
    */

    const handleView = (
        payout
    ) => {

        setSelectedPayout(
            payout
        );

    };


    /*
    |--------------------------------------------------------------------------
    | CLOSE DRAWER
    |--------------------------------------------------------------------------
    */

    const handleCloseDrawer = () => {

        setSelectedPayout(
            null
        );

    };


    /*
    |--------------------------------------------------------------------------
    | OPEN ACTION MODAL
    |--------------------------------------------------------------------------
    */

    const openActionModal = (
        payout,
        type
    ) => {

        setActionModal({
            open: true,
            type,
            payout,
        });

        setActionReason("");
        setActionError("");
        setError("");

    };


    /*
    |--------------------------------------------------------------------------
    | CLOSE ACTION MODAL
    |--------------------------------------------------------------------------
    */

    const closeActionModal = () => {

        if (actionLoading) {
            return;
        }

        setActionModal({
            open: false,
            type: null,
            payout: null,
        });

        setActionReason("");
        setActionError("");

    };


    /*
    |--------------------------------------------------------------------------
    | RETRY PAYOUT
    |--------------------------------------------------------------------------
    */

    const handleRetry = (
        payout
    ) => {

        openActionModal(
            payout,
            "retry"
        );

    };


    /*
    |--------------------------------------------------------------------------
    | APPROVE & RETRY MANUAL REVIEW PAYOUT
    |--------------------------------------------------------------------------
    */

    const handleApproveAndRetry = (
        payout
    ) => {

        openActionModal(
            payout,
            "approve_retry"
        );

    };


    /*
    |--------------------------------------------------------------------------
    | MANUAL REVIEW
    |--------------------------------------------------------------------------
    */

    const handleManualReview = (
        payout
    ) => {

        openActionModal(
            payout,
            "manual_review"
        );

    };


    /*
    |--------------------------------------------------------------------------
    | CANCEL PAYOUT
    |--------------------------------------------------------------------------
    */

    const handleCancel = (
        payout
    ) => {

        openActionModal(
            payout,
            "cancel"
        );

    };


    /*
    |--------------------------------------------------------------------------
    | REVERSE PAYOUT
    |--------------------------------------------------------------------------
    */

    const handleReverse = (
        payout
    ) => {

        openActionModal(
            payout,
            "reverse"
        );

    };


    /*
    |--------------------------------------------------------------------------
    | OPEN REFUND MODAL
    |--------------------------------------------------------------------------
    */

    /*
|--------------------------------------------------------------------------
| OPEN REFUND MODAL
|--------------------------------------------------------------------------
*/

    const handleRefund = (
        payout
    ) => {

        const payoutId =
            payout?._id;


        if (!payoutId) {

            setError(
                "Payout not found."
            );

            return;

        }


        /*
         * Prefer backend-provided remainingRefundable.
         *
         * If backend doesn't provide it, use our local
         * refund balance maintained after successful refunds.
         *
         * Only as a last fallback use payoutAmount.
         */

        const backendRemaining =
            Number(
                payout?.remainingRefundable
            );


        const localRemaining =
            Number(
                refundBalances?.[payoutId]
            );


        const refundedAmount =
            Number(
                payout?.refundedAmount ||
                payout?.totalRefunded ||
                0
            );


        const originalAmount =
            Number(
                payout?.payoutAmount ||
                0
            );


        let maxRefundable;


        if (
            Number.isFinite(
                backendRemaining
            )
        ) {

            maxRefundable =
                Math.max(
                    backendRemaining,
                    0
                );

        } else if (
            Number.isFinite(
                localRemaining
            )
        ) {

            maxRefundable =
                Math.max(
                    localRemaining,
                    0
                );

        } else if (
            refundedAmount > 0
        ) {

            maxRefundable =
                Math.max(
                    originalAmount -
                    refundedAmount,
                    0
                );

        } else {

            maxRefundable =
                Math.max(
                    originalAmount,
                    0
                );

        }


        if (
            !Number.isFinite(
                maxRefundable
            ) ||
            maxRefundable <= 0
        ) {

            setError(
                "No refundable amount remaining."
            );

            return;

        }


        /*
         * Store latest calculated remaining amount.
         */

        setRefundBalances(
            (current) => ({

                ...current,

                [payoutId]:
                    maxRefundable,

            })
        );


        setRefundModal({

            open:
                true,

            payout:
            {
                ...payout,

                remainingRefundable:
                    maxRefundable,
            },

        });


        /*
         * Default refund amount = maximum remaining amount.
         */

        setRefundAmount(
            String(
                maxRefundable
            )
        );


        setRefundReason("");
        setRefundError("");
        setError("");

    };


    /*
    |--------------------------------------------------------------------------
    | CLOSE REFUND MODAL
    |--------------------------------------------------------------------------
    */

    const closeRefundModal = () => {

        if (actionLoading) {
            return;
        }

        setRefundModal({
            open: false,
            payout: null,
        });

        setRefundAmount("");
        setRefundReason("");
        setRefundError("");

    };


    /*
    |--------------------------------------------------------------------------
    | SUBMIT REFUND
    |--------------------------------------------------------------------------
    */

    const submitRefund = async () => {

        const payout =
            refundModal?.payout;


        if (
            !payout?._id
        ) {

            setRefundError(
                "Payout not found."
            );

            return;

        }


        const payoutId =
            payout._id;


        const amount =
            Number(
                refundAmount
            );


        /*
         * IMPORTANT:
         *
         * Use the locally maintained balance first.
         * This prevents the modal from reverting to
         * the original payout amount.
         */

        const storedRemaining =
            Number(
                refundBalances?.[payoutId]
            );


        const payoutRemaining =
            Number(
                payout?.remainingRefundable
            );


        const originalAmount =
            Number(
                payout?.payoutAmount ||
                0
            );


        let maximum;


        if (
            Number.isFinite(
                storedRemaining
            )
        ) {

            maximum =
                Math.max(
                    storedRemaining,
                    0
                );

        } else if (
            Number.isFinite(
                payoutRemaining
            )
        ) {

            maximum =
                Math.max(
                    payoutRemaining,
                    0
                );

        } else {

            maximum =
                Math.max(
                    originalAmount,
                    0
                );

        }


        if (
            !Number.isFinite(
                amount
            ) ||
            amount <= 0
        ) {

            setRefundError(
                "Enter a valid refund amount."
            );

            return;

        }


        if (
            maximum <= 0
        ) {

            setRefundError(
                "No refundable amount remaining."
            );

            return;

        }


        if (
            amount >
            maximum
        ) {

            setRefundError(
                `Maximum refundable amount is ${formatCurrency(maximum)}.`
            );

            return;

        }


        if (
            !refundReason.trim()
        ) {

            setRefundError(
                "Refund reason is required."
            );

            return;

        }


        try {

            setActionLoading(
                true
            );

            setRefundError("");
            setError("");


            /*
             * ==========================================
             * CALL REFUND API
             * ==========================================
             */

            const response =
                await refundAdminPayout(

                    payoutId,

                    amount,

                    refundReason.trim()

                );


            /*
             * ==========================================
             * GET LATEST REMAINING AMOUNT
             * ==========================================
             *
             * Backend refund response should ideally
             * contain remainingRefundable.
             *
             * If it does, trust it.
             *
             * Otherwise calculate locally.
             */

            const responseData =
                response?.data ||
                response;


            const backendRemaining =
                Number(
                    responseData
                        ?.remainingRefundable
                );


            const backendRefunded =
                Number(
                    responseData
                        ?.refundedAmount
                );


            let newRemaining;


            if (
                Number.isFinite(
                    backendRemaining
                )
            ) {

                newRemaining =
                    Math.max(
                        backendRemaining,
                        0
                    );

            } else if (
                Number.isFinite(
                    backendRefunded
                )
            ) {

                newRemaining =
                    Math.max(
                        originalAmount -
                        backendRefunded,
                        0
                    );

            } else {

                newRemaining =
                    Math.max(
                        maximum -
                        amount,
                        0
                    );

            }


            /*
             * ==========================================
             * SAVE FRONTEND REFUND BALANCE
             * ==========================================
             */

            setRefundBalances(
                (current) => ({

                    ...current,

                    [payoutId]:
                        newRemaining,

                })
            );


            /*
             * ==========================================
             * CLOSE REFUND MODAL
             * ==========================================
             */

            setRefundModal({

                open:
                    false,

                payout:
                    null,

            });


            setRefundAmount("");
            setRefundReason("");
            setRefundError("");


            /*
             * ==========================================
             * REFRESH PAYOUT LIST
             * ==========================================
             */

            await fetchPayouts({

                page:
                    pagination.page ||
                    1,

                initial:
                    false,

            });


            /*
             * ==========================================
             * KEEP LOCAL BALANCE AFTER REFRESH
             * ==========================================
             *
             * The API list may not yet expose
             * remainingRefundable.
             *
             * Therefore our local balance remains
             * the source of truth until backend data
             * provides a newer explicit value.
             */

            setRefundBalances(
                (current) => ({

                    ...current,

                    [payoutId]:
                        newRemaining,

                })
            );


            /*
             * Close drawer so the latest payout
             * data can be opened again.
             */

            setSelectedPayout(
                null
            );


        } catch (
        err
        ) {

            console.error(
                "Refund Payout Error:",
                err
            );


            setRefundError(
                err?.message ||
                "Unable to refund payout."
            );


        } finally {

            setActionLoading(
                false
            );

        }

    };


    /*
    |--------------------------------------------------------------------------
    | RESTORE PAYOUT
    |--------------------------------------------------------------------------
    */

    const handleRestore = (
        payout
    ) => {

        openActionModal(
            payout,
            "restore"
        );

    };


    /*
    |--------------------------------------------------------------------------
    | SUBMIT ACTION MODAL
    |--------------------------------------------------------------------------
    */

    const submitActionModal = async () => {

        const payout =
            actionModal?.payout;

        const type =
            actionModal?.type;


        if (!payout?._id) {

            setActionError(
                "Payout not found."
            );

            return;

        }


        const requiresReason =
            type !== "retry" &&
            type !== "approve_retry";


        if (
            requiresReason &&
            !actionReason.trim()
        ) {

            setActionError(
                "Reason is required."
            );

            return;

        }


        try {

            setActionLoading(
                true
            );

            setActionError("");
            setError("");


            if (
                type === "retry" ||
                type === "approve_retry"
            ) {

                await retryAdminPayout(
                    payout._id
                );

            }


            if (
                type === "manual_review"
            ) {

                await manualReviewAdminPayout(
                    payout._id,
                    actionReason.trim()
                );

            }


            if (
                type === "cancel"
            ) {

                await cancelAdminPayout(
                    payout._id,
                    actionReason.trim()
                );

            }


            if (
                type === "reverse"
            ) {

                await reverseAdminPayout(
                    payout._id,
                    actionReason.trim()
                );

            }


            if (
                type === "restore"
            ) {

                await restoreAdminPayout(
                    payout._id,
                    actionReason.trim()
                );

            }


            await fetchPayouts({
                page:
                    pagination.page ||
                    1,

                initial:
                    false,
            });


            setActionModal({
                open: false,
                type: null,
                payout: null,
            });

            setActionReason("");
            setActionError("");

            setSelectedPayout(
                null
            );


        } catch (err) {

            console.error(
                "Payout Action Error:",
                err
            );


            setActionError(
                err?.message ||
                "Unable to complete payout action."
            );


        } finally {

            setActionLoading(
                false
            );

        }

    };

    return (
        <div className="min-h-screen bg-[#070914] text-white">

            {/* =====================================================
                HEADER
            ===================================================== */}

            <AdminHeader
                title="Payouts"
                subtitle="Payout Management"
                connected={true}
            />


            <main className="p-4 sm:p-6 lg:p-8">

                {/* =================================================
                    PAGE HEADER
                ================================================= */}

                <div className="mb-5 rounded-2xl border border-white/[0.06] bg-[#070914] px-5 py-5 sm:px-6">

                    <div className="flex flex-col gap-5">

                        <div className="flex items-start justify-between gap-4">

                            <div className="min-w-0">

                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-400">
                                    PAYOUT MANAGEMENT
                                </p>

                                <h2 className="mt-2 text-2xl font-black text-white">
                                    Payouts
                                </h2>

                                <p className="mt-2 text-sm text-slate-500">
                                    Monitor all player payouts and winning activity.
                                </p>

                            </div>


                            <div className="flex shrink-0 items-center gap-2">

                                <div className="hidden items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/[0.04] px-3 py-2.5 text-xs font-semibold text-green-400 sm:flex">

                                    <span className="relative flex h-2 w-2">

                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />

                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />

                                    </span>

                                    Auto Refresh

                                </div>


                                <button
                                    type="button"
                                    onClick={
                                        handleRefresh
                                    }
                                    disabled={
                                        refreshing
                                    }
                                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-2.5 text-xs font-semibold text-slate-400 transition hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                >

                                    <RefreshCw
                                        size={14}
                                        className={
                                            refreshing
                                                ? "animate-spin"
                                                : ""
                                        }
                                    />

                                    Refresh

                                </button>

                            </div>

                        </div>


                        <div className="flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">

                            <div className="flex items-center gap-2 text-slate-700">

                                <span className="h-1.5 w-1.5 rounded-full bg-green-400" />

                                Automatic refresh every 10 seconds

                            </div>


                            <div className="text-slate-700">

                                {lastUpdated
                                    ? `Last refreshed: ${lastUpdated.toLocaleTimeString(
                                        "en-IN",
                                        {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            second: "2-digit",
                                        }
                                    )}`
                                    : "Not refreshed yet"}

                            </div>

                        </div>

                    </div>

                </div>


                {/* =================================================
                    ERROR
                ================================================== */}

                {error && (

                    <div className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-red-500/20 bg-red-500/[0.04] px-4 py-3">

                        <p className="text-xs text-red-400">
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={
                                handleRefresh
                            }
                            className="cursor-pointer text-xs font-semibold text-red-300 hover:text-white"
                        >
                            Retry
                        </button>

                    </div>

                )}


                {/* =================================================
                    STATS
                ================================================== */}

                <PayoutStats
                    summary={
                        summary
                    }
                />


                {/* =================================================
                    FILTERS
                ================================================== */}

                <PayoutFilters
                    search={
                        search
                    }
                    setSearch={
                        setSearch
                    }
                    status={
                        status
                    }
                    setStatus={
                        setStatus
                    }
                    onReset={
                        handleReset
                    }
                />


                {/* =================================================
                    TABLE
                ================================================== */}

                {loading ? (

                    <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0d101d]">

                        <div className="flex min-h-[360px] flex-col items-center justify-center">

                            <RefreshCw
                                size={22}
                                className="animate-spin text-purple-400"
                            />

                            <p className="mt-4 text-sm font-semibold text-slate-500">
                                Loading payouts...
                            </p>

                            <p className="mt-1 text-xs text-slate-700">
                                Fetching payout history
                            </p>

                        </div>

                    </div>

                ) : (

                    <PayoutTable
                        payouts={payouts}
                        pagination={pagination}
                        refreshing={refreshing}
                        formatCurrency={formatCurrency}
                        formatDate={formatDate}
                        onView={handleView}
                        onRetry={handleRetry}
                        onManualReview={handleManualReview}
                        onCancel={handleCancel}
                        onReverse={handleReverse}
                        onRefund={handleRefund}
                        onRestore={handleRestore}
                        actionLoading={actionLoading}
                        onPageChange={handlePageChange}
                    />

                )}


                {/* =================================================
                    FOOTER
                ================================================== */}

                <div className="mt-4 flex items-center justify-between gap-3 text-[10px] text-slate-700">

                    <div className="flex items-center gap-2">

                        <span className="relative flex h-1.5 w-1.5">

                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-50" />

                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-400" />

                        </span>

                        Auto refresh enabled

                    </div>


                    <span>
                        10 second interval
                    </span>

                </div>

            </main>


            {/* =====================================================
                RIGHT SIDE PAYOUT DRAWER
            ===================================================== */}

            {selectedPayout && (

                <PayoutDetailDrawer
                    payout={
                        selectedPayout
                    }
                    formatCurrency={
                        formatCurrency
                    }
                    formatDate={
                        formatDate
                    }
                    actionLoading={
                        actionLoading
                    }
                    onClose={
                        handleCloseDrawer
                    }
                    onRetry={
                        handleRetry
                    }
                    onManualReview={
                        handleManualReview
                    }

                    onApproveAndRetry={
                        handleApproveAndRetry
                    }

                    onCancel={
                        handleCancel
                    }

                    onReverse={handleReverse}

                    onRefund={handleRefund}

                    onRestore={handleRestore}
                />

            )}


            {/* =====================================================
                PAYOUT ACTION MODAL
            ===================================================== */}

            <PayoutActionModal
                open={
                    actionModal.open
                }
                type={
                    actionModal.type
                }
                payout={
                    actionModal.payout
                }
                reason={
                    actionReason
                }
                error={
                    actionError
                }
                actionLoading={
                    actionLoading
                }
                formatCurrency={
                    formatCurrency
                }
                onReasonChange={
                    setActionReason
                }
                onClose={
                    closeActionModal
                }
                onSubmit={
                    submitActionModal
                }
            />


            {/* =====================================================
                REFUND MODAL
            ===================================================== */}

            <RefundModal
                open={refundModal.open}
                payout={refundModal.payout}
                remainingRefundable={
                    refundModal?.payout?._id
                        ? refundBalances?.[
                        refundModal.payout._id
                        ]
                        : undefined
                }
                amount={refundAmount}
                reason={refundReason}
                actionLoading={actionLoading}
                error={refundError}
                formatCurrency={formatCurrency}
                onAmountChange={setRefundAmount}
                onReasonChange={setRefundReason}
                onClose={closeRefundModal}
                onSubmit={submitRefund}
            />

        </div>
    );
}


/*
|--------------------------------------------------------------------------
| PAYOUT DETAIL DRAWER
|--------------------------------------------------------------------------
*/

function PayoutDetailDrawer({
    payout,
    formatCurrency,
    formatDate,
    actionLoading,
    onClose,
    onRetry,
    onApproveAndRetry,
    onManualReview,
    onCancel,
    onReverse,
    onRefund,
    onRestore,
}) {

    const status = String(
        payout?.status ||
        "pending"
    ).toLowerCase();


    const color = String(
        payout?.winningColor ||
        ""
    ).toLowerCase();


    const statusClass = {

        paid:
            "border-green-500/20 bg-green-500/10 text-green-400",

        pending:
            "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",

        processing:
            "border-blue-500/20 bg-blue-500/10 text-blue-400",

        failed:
            "border-red-500/20 bg-red-500/10 text-red-400",

        cancelled:
            "border-slate-500/20 bg-slate-500/10 text-slate-400",

        reversed:
            "border-orange-500/20 bg-orange-500/10 text-orange-400",

        manual_review:
            "border-purple-500/20 bg-purple-500/10 text-purple-400",

    };


    return (
        <div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-[2px]"
            onMouseDown={(event) => {

                if (
                    event.target ===
                    event.currentTarget
                ) {

                    onClose();

                }

            }}
        >

            {/* =================================================
                DRAWER
            ================================================== */}

            <aside
                className="
                    absolute
                    right-0
                    top-0
                    flex
                    h-full
                    w-full
                    max-w-xl
                    flex-col
                    border-l
                    border-white/[0.08]
                    bg-[#0a0d18]
                    shadow-2xl
                "
                onMouseDown={(event) =>
                    event.stopPropagation()
                }
            >

                {/* =================================================
                    DRAWER HEADER
                ================================================== */}

                <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-5 py-5">

                    <div className="min-w-0">

                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-purple-400">
                            PAYOUT MANAGEMENT
                        </p>

                        <h2 className="mt-1 text-xl font-black text-white">
                            Payout Details
                        </h2>

                        <p className="mt-1 text-xs text-slate-600">
                            Complete payout transaction information.
                        </p>

                    </div>


                    <button
                        type="button"
                        onClick={
                            onClose
                        }
                        className="
                            flex
                            h-9
                            w-9
                            shrink-0
                            cursor-pointer
                            items-center
                            justify-center
                            rounded-lg
                            border
                            border-white/[0.07]
                            bg-white/[0.02]
                            text-slate-500
                            transition
                            hover:bg-white/[0.05]
                            hover:text-white
                        "
                    >

                        <X size={18} />

                    </button>

                </div>


                {/* =================================================
                    DRAWER CONTENT
                ================================================== */}

                <div className="flex-1 overflow-y-auto">

                    <div className="space-y-4 p-5">

                        {/* STATUS */}

                        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">

                            <div className="flex items-center justify-between gap-4">

                                <div>

                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                        Current Status
                                    </p>

                                    <span
                                        className={`
                                            mt-2
                                            inline-flex
                                            rounded-full
                                            border
                                            px-3
                                            py-1.5
                                            text-[10px]
                                            font-bold
                                            uppercase
                                            ${statusClass[
                                            status
                                            ] ||
                                            "border-slate-500/20 bg-slate-500/10 text-slate-400"
                                            }
                                        `}
                                    >

                                        {status.replace(
                                            "_",
                                            " "
                                        )}

                                    </span>

                                </div>


                                <div className="text-right">

                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                        Payout
                                    </p>

                                    <p className="mt-1 text-2xl font-black text-green-400">

                                        {formatCurrency(
                                            payout?.payoutAmount
                                        )}

                                    </p>

                                </div>

                            </div>

                        </div>


                        {/* USER */}

                        <PayoutDrawerSection
                            title="User Information"
                        >

                            <PayoutDrawerItem
                                icon={
                                    <User
                                        size={15}
                                    />
                                }
                                label="Username"
                                value={
                                    payout?.user
                                        ?.username ||
                                    payout?.user
                                        ?.fullName ||
                                    "—"
                                }
                            />


                            <PayoutDrawerItem
                                icon={
                                    <Receipt
                                        size={15}
                                    />
                                }
                                label="Email"
                                value={
                                    payout?.user
                                        ?.email ||
                                    "—"
                                }
                            />

                        </PayoutDrawerSection>


                        {/* ROUND */}

                        <PayoutDrawerSection
                            title="Round Information"
                        >

                            <PayoutDrawerItem
                                icon={
                                    <Hash
                                        size={15}
                                    />
                                }
                                label="Round"
                                value={
                                    payout?.round
                                        ?.roundNumber
                                        ? `#${payout.round.roundNumber}`
                                        : "—"
                                }
                            />


                            <PayoutDrawerItem
                                icon={
                                    <Trophy
                                        size={15}
                                    />
                                }
                                label="Winning Color"
                                value={
                                    color
                                        ? color.toUpperCase()
                                        : "—"
                                }
                            />

                        </PayoutDrawerSection>


                        {/* PAYMENT */}

                        <PayoutDrawerSection
                            title="Payment Information"
                        >

                            <PayoutDrawerItem
                                icon={
                                    <CreditCard
                                        size={15}
                                    />
                                }
                                label="Bet Amount"
                                value={
                                    formatCurrency(
                                        payout?.betAmount
                                    )
                                }
                            />


                            <PayoutDrawerItem
                                icon={
                                    <Trophy
                                        size={15}
                                    />
                                }
                                label="Payout Amount"
                                value={
                                    formatCurrency(
                                        payout?.payoutAmount
                                    )
                                }
                                valueClass="text-green-400"
                            />


                            <PayoutDrawerItem
                                icon={
                                    <Receipt
                                        size={15}
                                    />
                                }
                                label="Transaction ID"
                                value={
                                    payout?.transactionId ||
                                    "Not available"
                                }
                            />

                        </PayoutDrawerSection>


                        {/* TIMELINE */}

                        <PayoutDrawerSection
                            title="Timeline"
                        >

                            <PayoutDrawerItem
                                icon={
                                    <Clock3
                                        size={15}
                                    />
                                }
                                label="Created"
                                value={
                                    formatDate(
                                        payout?.createdAt
                                    )
                                }
                            />


                            <PayoutDrawerItem
                                icon={
                                    <Clock3
                                        size={15}
                                    />
                                }
                                label="Processed"
                                value={
                                    formatDate(
                                        payout?.processedAt
                                    )
                                }
                            />

                        </PayoutDrawerSection>


                        {/* FAILURE */}

                        {payout?.failureReason && (

                            <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-4">

                                <div className="flex items-center gap-2 text-red-400">

                                    <AlertTriangle
                                        size={16}
                                    />

                                    <p className="text-xs font-bold">
                                        Failure Reason
                                    </p>

                                </div>


                                <p className="mt-2 text-sm leading-6 text-red-300">
                                    {
                                        payout.failureReason
                                    }
                                </p>

                            </div>

                        )}


                        {/* PROCESSING */}

                        <PayoutDrawerSection
                            title="Processing Information"
                        >

                            <PayoutDrawerItem
                                icon={
                                    <RotateCcw
                                        size={15}
                                    />
                                }
                                label="Retry Count"
                                value={String(
                                    payout?.retryCount ||
                                    0
                                )}
                            />


                            <PayoutDrawerItem
                                icon={
                                    <Receipt
                                        size={15}
                                    />
                                }
                                label="Remark"
                                value={
                                    payout?.remark ||
                                    "—"
                                }
                            />

                        </PayoutDrawerSection>

                    </div>

                </div>


                {/* =================================================
                    ACTION FOOTER
                ================================================== */}

                {(
                    status === "failed" ||
                    status === "pending" ||
                    status === "manual_review" ||
                    status === "paid" ||
                    status === "reversed"
                ) && (

                        <div className="shrink-0 border-t border-white/[0.06] bg-[#0a0d18] px-5 py-4">

                            <div className="flex flex-wrap justify-end gap-2">

                                {/* RETRY */}

                                {status === "failed" && (

                                    <button
                                        type="button"
                                        disabled={actionLoading}
                                        onClick={() =>
                                            onRetry(payout)
                                        }
                                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/[0.05] px-4 py-2.5 text-xs font-semibold text-yellow-400 transition hover:bg-yellow-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                                    >

                                        <RotateCcw size={14} />

                                        Retry Payout

                                    </button>

                                )}


                                {/* MANUAL REVIEW */}

                                {(status === "failed" ||
                                    status === "pending") && (

                                        <button
                                            type="button"
                                            disabled={actionLoading}
                                            onClick={() =>
                                                onManualReview(payout)
                                            }
                                            className="flex cursor-pointer items-center gap-2 rounded-lg border border-purple-500/20 bg-purple-500/[0.05] px-4 py-2.5 text-xs font-semibold text-purple-400 transition hover:bg-purple-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                                        >

                                            <AlertTriangle size={14} />

                                            Manual Review

                                        </button>

                                    )}


                                {/* APPROVE & RETRY */}

                                {status === "manual_review" && (

                                    <button
                                        type="button"
                                        disabled={actionLoading}
                                        onClick={() =>
                                            onApproveAndRetry(payout)
                                        }
                                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/[0.05] px-4 py-2.5 text-xs font-semibold text-green-400 transition hover:bg-green-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                                    >

                                        <RotateCcw size={14} />

                                        Approve & Retry

                                    </button>

                                )}


                                {/* CANCEL */}

                                {(status === "failed" ||
                                    status === "pending" ||
                                    status === "manual_review") && (

                                        <button
                                            type="button"
                                            disabled={actionLoading}
                                            onClick={() =>
                                                onCancel(payout)
                                            }
                                            className="flex cursor-pointer items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/[0.05] px-4 py-2.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                                        >

                                            <Ban size={14} />

                                            Cancel

                                        </button>

                                    )}


                                {/* REVERSE PAYOUT */}

                                {status === "paid" && (

                                    <button
                                        type="button"
                                        disabled={actionLoading}
                                        onClick={() =>
                                            onReverse(payout)
                                        }
                                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/[0.05] px-4 py-2.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                                    >

                                        <RotateCcw size={14} />

                                        Reverse Payout

                                    </button>

                                )}

                                {status === "failed" && (

                                    <button
                                        type="button"
                                        disabled={actionLoading}
                                        onClick={() =>
                                            onRefund(payout)
                                        }
                                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/[0.05] px-4 py-2.5 text-xs font-semibold text-blue-400 transition hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                                    >

                                        <Banknote size={14} />

                                        Refund User

                                    </button>

                                )}

                                {/* RESTORE PAYOUT */}

                                {status === "reversed" && (

                                    <button
                                        type="button"
                                        disabled={actionLoading}
                                        onClick={() =>
                                            onRestore(payout)
                                        }
                                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/[0.05] px-4 py-2.5 text-xs font-semibold text-green-400 transition hover:bg-green-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                                    >

                                        <RotateCcw size={14} />

                                        Restore Payout

                                    </button>

                                )}

                            </div>

                        </div>

                    )}

            </aside>

        </div>
    );
}


/*
|--------------------------------------------------------------------------
| PAYOUT ACTION MODAL
|--------------------------------------------------------------------------
*/

function PayoutActionModal({
    open,
    type,
    payout,
    reason,
    error,
    actionLoading,
    formatCurrency,
    onReasonChange,
    onClose,
    onSubmit,
}) {

    if (
        !open ||
        !payout
    ) {
        return null;
    }


    const config = {

        retry: {
            title:
                "Retry Payout",
            description:
                "Retry this failed payout.",
            button:
                "Retry Payout",
            className:
                "bg-yellow-500 hover:bg-yellow-400",
            requiresReason:
                false,
        },

        approve_retry: {
            title:
                "Approve & Retry",
            description:
                "Approve this payout and retry the payout process.",
            button:
                "Approve & Retry",
            className:
                "bg-green-500 hover:bg-green-400",
            requiresReason:
                false,
        },

        manual_review: {
            title:
                "Manual Review",
            description:
                "Move this payout to manual review for further verification.",
            button:
                "Move to Manual Review",
            className:
                "bg-purple-500 hover:bg-purple-400",
            requiresReason:
                true,
        },

        cancel: {
            title:
                "Cancel Payout",
            description:
                "Cancel this payout. This action cannot be undone.",
            button:
                "Cancel Payout",
            className:
                "bg-red-500 hover:bg-red-400",
            requiresReason:
                true,
        },

        reverse: {
            title:
                "Reverse Payout",
            description:
                "Reverse this paid payout and debit the payout amount from the user's wallet.",
            button:
                "Reverse Payout",
            className:
                "bg-orange-500 hover:bg-orange-400",
            requiresReason:
                true,
        },

        restore: {
            title:
                "Restore Payout",
            description:
                "Restore this reversed payout and credit the payout amount back to the user's wallet.",
            button:
                "Restore Payout",
            className:
                "bg-green-500 hover:bg-green-400",
            requiresReason:
                true,
        },

    };


    const current =
        config[type] ||
        config.retry;


    return (
        <div
            className="fixed inset-0 z-[250] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
            onMouseDown={(event) => {

                if (
                    event.target ===
                    event.currentTarget
                ) {

                    onClose();

                }

            }}
        >

            <div
                className="w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d111d] shadow-2xl"
                onMouseDown={(event) =>
                    event.stopPropagation()
                }
            >

                {/* HEADER */}

                <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">

                    <div className="min-w-0">

                        <h3 className="text-sm font-semibold text-white">
                            {current.title}
                        </h3>

                        <p className="mt-1 text-xs leading-5 text-white/40">
                            {current.description}
                        </p>

                    </div>


                    <button
                        type="button"
                        onClick={
                            onClose
                        }
                        disabled={
                            actionLoading
                        }
                        className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-white/40 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >

                        <X size={16} />

                    </button>

                </div>


                {/* BODY */}

                <div className="space-y-4 px-5 py-5">

                    {/* PAYOUT SUMMARY */}

                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">

                        <div className="flex items-center justify-between gap-4">

                            <div className="min-w-0">

                                <p className="text-[10px] uppercase tracking-wider text-white/30">
                                    Payout
                                </p>

                                <p className="mt-1 text-lg font-bold text-white">
                                    {formatCurrency(
                                        payout?.payoutAmount
                                    )}
                                </p>

                            </div>


                            <div className="text-right">

                                <p className="text-[10px] uppercase tracking-wider text-white/30">
                                    Status
                                </p>

                                <p className="mt-1 text-xs font-bold uppercase text-white/60">
                                    {String(
                                        payout?.status ||
                                        ""
                                    ).replace(
                                        /_/g,
                                        " "
                                    )}
                                </p>

                            </div>

                        </div>

                    </div>


                    {/* RETRY WARNING */}

                    {(type === "retry" ||
                        type === "approve_retry") && (

                            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/[0.05] px-4 py-3">

                                <div className="flex gap-2">

                                    <AlertTriangle
                                        size={16}
                                        className="mt-0.5 shrink-0 text-yellow-400"
                                    />

                                    <p className="text-xs leading-5 text-yellow-300">
                                        The payout retry will attempt to credit the payout to the user's wallet.
                                    </p>

                                </div>

                            </div>

                        )}


                    {/* REVERSE WARNING */}

                    {type === "reverse" && (

                        <div className="rounded-xl border border-orange-500/20 bg-orange-500/[0.05] px-4 py-3">

                            <div className="flex gap-2">

                                <AlertTriangle
                                    size={16}
                                    className="mt-0.5 shrink-0 text-orange-400"
                                />

                                <p className="text-xs leading-5 text-orange-300">
                                    This will debit{" "}
                                    <strong>
                                        {formatCurrency(
                                            payout?.payoutAmount
                                        )}
                                    </strong>{" "}
                                    from the user's wallet.
                                </p>

                            </div>

                        </div>

                    )}


                    {/* RESTORE WARNING */}

                    {type === "restore" && (

                        <div className="rounded-xl border border-green-500/20 bg-green-500/[0.05] px-4 py-3">

                            <div className="flex gap-2">

                                <CheckCircle2
                                    size={16}
                                    className="mt-0.5 shrink-0 text-green-400"
                                />

                                <p className="text-xs leading-5 text-green-300">
                                    This will credit{" "}
                                    <strong>
                                        {formatCurrency(
                                            payout?.payoutAmount
                                        )}
                                    </strong>{" "}
                                    back to the user's wallet.
                                </p>

                            </div>

                        </div>

                    )}


                    {/* REASON */}

                    {current.requiresReason && (

                        <div>

                            <label className="mb-2 block text-xs font-medium text-white/70">
                                Reason
                            </label>

                            <textarea
                                value={
                                    reason
                                }
                                onChange={(
                                    event
                                ) =>
                                    onReasonChange(
                                        event.target.value
                                    )
                                }
                                disabled={
                                    actionLoading
                                }
                                rows={4}
                                maxLength={500}
                                autoFocus
                                placeholder={
                                    type ===
                                        "manual_review"
                                        ? "Enter manual review reason..."
                                        : type ===
                                            "cancel"
                                            ? "Enter cancellation reason..."
                                            : type ===
                                                "reverse"
                                                ? "Enter reversal reason..."
                                                : "Enter restore reason..."
                                }
                                className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-purple-500/40"
                            />

                            <div className="mt-1 text-right text-[10px] text-white/25">
                                {reason.length}/500
                            </div>

                        </div>

                    )}


                    {/* ERROR */}

                    {error && (

                        <div className="rounded-xl border border-red-500/20 bg-red-500/[0.05] px-3 py-2.5 text-xs text-red-400">
                            {error}
                        </div>

                    )}

                </div>


                {/* FOOTER */}

                <div className="flex justify-end gap-2 border-t border-white/[0.06] px-5 py-4">

                    <button
                        type="button"
                        onClick={
                            onClose
                        }
                        disabled={
                            actionLoading
                        }
                        className="cursor-pointer rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-white/60 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancel
                    </button>


                    <button
                        type="button"
                        onClick={
                            onSubmit
                        }
                        disabled={
                            actionLoading ||
                            (
                                current.requiresReason &&
                                !reason.trim()
                            )
                        }
                        className={`flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${current.className}`}
                    >

                        {actionLoading ? (

                            <>
                                <RefreshCw
                                    size={14}
                                    className="animate-spin"
                                />

                                Processing...
                            </>

                        ) : (

                            <>
                                <CheckCircle2
                                    size={14}
                                />

                                {current.button}

                            </>

                        )}

                    </button>

                </div>

            </div>

        </div>
    );
}


/*
|--------------------------------------------------------------------------
| REFUND MODAL
|--------------------------------------------------------------------------
*/

function RefundModal({
    open,
    payout,
    remainingRefundable,
    amount,
    reason,
    actionLoading,
    error,
    formatCurrency,
    onAmountChange,
    onReasonChange,
    onClose,
    onSubmit,
}) {

    if (!open || !payout) {
        return null;
    }

    const originalAmount =
        Number(
            payout?.payoutAmount || 0
        );

    const explicitRemaining =
        Number(
            remainingRefundable
        );


    const payoutRemaining =
        Number(
            payout?.remainingRefundable
        );


    const remainingAmount =
        Math.max(

            Number.isFinite(
                explicitRemaining
            )
                ? explicitRemaining
                : Number.isFinite(
                    payoutRemaining
                )
                    ? payoutRemaining
                    : originalAmount,

            0

        );

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
            onMouseDown={(event) => {
                if (
                    event.target ===
                    event.currentTarget
                ) {
                    onClose();
                }
            }}
        >

            <div
                className="w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d111d] shadow-2xl"
                onMouseDown={(event) =>
                    event.stopPropagation()
                }
            >

                {/* HEADER */}

                <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">

                    <div>
                        <h3 className="text-sm font-semibold text-white">
                            Refund User
                        </h3>

                        <p className="mt-1 text-xs text-white/40">
                            Return payout amount to the user's wallet.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={actionLoading}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-white/40 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <X size={16} />
                    </button>

                </div>


                {/* BODY */}

                <div className="space-y-5 px-5 py-5">

                    {/* SUMMARY */}

                    <div className="grid grid-cols-2 gap-3">

                        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                            <p className="text-[10px] uppercase tracking-wider text-white/35">
                                Original Payout
                            </p>

                            <p className="mt-1 text-sm font-semibold text-white">
                                {formatCurrency(
                                    originalAmount
                                )}
                            </p>
                        </div>

                        <div className="rounded-xl border border-blue-500/10 bg-blue-500/[0.04] p-3">
                            <p className="text-[10px] uppercase tracking-wider text-white/35">
                                Remaining Refundable
                            </p>

                            <p className="mt-1 text-sm font-semibold text-blue-400">
                                {formatCurrency(
                                    remainingAmount
                                )}
                            </p>
                        </div>

                    </div>


                    {/* AMOUNT */}

                    <div>
                        <label className="mb-2 block text-xs font-medium text-white/70">
                            Refund Amount
                        </label>

                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/40">
                                ₹
                            </span>

                            <input
                                type="number"
                                min="0.01"
                                max={remainingAmount}
                                step="0.01"
                                value={amount}
                                onChange={(event) =>
                                    onAmountChange(
                                        event.target.value
                                    )
                                }
                                disabled={
                                    actionLoading ||
                                    remainingAmount <= 0
                                }
                                placeholder="Enter amount"
                                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-3 pl-8 pr-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-blue-500/40"
                            />
                        </div>

                        <button
                            type="button"
                            disabled={
                                actionLoading ||
                                remainingAmount <= 0 ||
                                !amount ||
                                !reason.trim() ||
                                Number(amount) <= 0 ||
                                Number(amount) > remainingAmount
                            }
                            onClick={() =>
                                onAmountChange(
                                    String(remainingAmount)
                                )
                            }
                            className="mt-2 cursor-pointer text-[11px] font-medium text-blue-400 hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Refund maximum amount
                        </button>
                    </div>


                    {/* REASON */}

                    <div>
                        <label className="mb-2 block text-xs font-medium text-white/70">
                            Refund Reason
                        </label>

                        <textarea
                            value={reason}
                            onChange={(event) =>
                                onReasonChange(
                                    event.target.value
                                )
                            }
                            disabled={actionLoading}
                            rows={4}
                            maxLength={500}
                            placeholder="Enter the reason for this refund..."
                            className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-blue-500/40"
                        />

                        <div className="mt-1 text-right text-[10px] text-white/25">
                            {reason.length}/500
                        </div>
                    </div>


                    {/* ERROR */}

                    {error && (
                        <div className="rounded-xl border border-red-500/20 bg-red-500/[0.05] px-3 py-2.5 text-xs text-red-400">
                            {error}
                        </div>
                    )}

                </div>


                {/* FOOTER */}

                <div className="flex justify-end gap-2 border-t border-white/[0.06] px-5 py-4">

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={actionLoading}
                        className="cursor-pointer rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-white/60 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={
                            actionLoading ||
                            !amount ||
                            !reason.trim()
                        }
                        className="flex cursor-pointer items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {actionLoading ? (
                            <>
                                <RefreshCw
                                    size={14}
                                    className="animate-spin"
                                />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Banknote size={14} />
                                Confirm Refund
                            </>
                        )}
                    </button>

                </div>

            </div>

        </div>
    );
}


/*
|--------------------------------------------------------------------------
| DRAWER SECTION
|--------------------------------------------------------------------------
*/

function PayoutDrawerSection({
    title,
    children,
}) {

    return (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015]">

            <div className="border-b border-white/[0.05] px-4 py-3">

                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
                    {title}
                </p>

            </div>


            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">

                {children}

            </div>

        </div>
    );
}


/*
|--------------------------------------------------------------------------
| DRAWER ITEM
|--------------------------------------------------------------------------
*/

function PayoutDrawerItem({
    icon,
    label,
    value,
    valueClass = "text-white",
}) {

    return (
        <div className="rounded-xl border border-white/[0.05] bg-[#070914] p-3.5">

            <div className="flex items-center gap-2 text-slate-600">

                {icon}

                <p className="text-[10px] font-bold uppercase tracking-wider">
                    {label}
                </p>

            </div>


            <p
                className={`mt-2 break-all text-sm font-semibold ${valueClass}`}
            >
                {value}
            </p>

        </div>
    );
}