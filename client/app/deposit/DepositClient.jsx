"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Script from "next/script";
import { ArrowDownToLine, Zap } from "lucide-react";

import UserLayout from "../../components/user/UserLayout";
import UserPageHeader from "../../components/user/UserPageHeader";
import UserFilters from "../../components/user/UserFilters";
import { LoadingState, ErrorState } from "../../components/user/PageState";
import StatusBadge from "../../components/user/StatusBadge";
import Pagination from "../../components/user/Pagination";
import DataTable, { DataTableRow, DataTableCell } from "../../components/user/DataTable";
import {
    createDepositRequest,
    getMyDepositRequests,
    createRazorpayOrder,
    verifyRazorpayPayment,
    getPublicSettings,
} from "../../lib/api";
import { getStoredUser } from "../../lib/useAuth";
import { refreshWallet } from "../../lib/useWallet";
import useSiteSettings from "../../lib/useSiteSettings";

// ======================================================
// DEPOSIT PAGE
// ======================================================

const PAGE_LIMIT = 20;

const STATUS_OPTIONS = [
    { value: "all", label: "All Status" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
];

const METHOD_OPTIONS = [
    { value: "all", label: "All Methods" },
    { value: "upi", label: "UPI" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "other", label: "Other" },
];

export default function DepositPage() {

    const { siteName } = useSiteSettings();

    const [paymentMode, setPaymentMode] = useState("manual");

    const [amount, setAmount] = useState("");
    const [method, setMethod] = useState("upi");
    const [referenceId, setReferenceId] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [formMessage, setFormMessage] = useState("");
    const [formError, setFormError] = useState("");

    const [razorpayReady, setRazorpayReady] = useState(false);

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const [statusFilter, setStatusFilter] = useState("all");
    const [methodFilter, setMethodFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const loadRequests = useCallback(async (targetPage = page) => {
        try {
            setLoading(true);
            setError("");

            const response = await getMyDepositRequests({
                page: targetPage,
                limit: PAGE_LIMIT,
                status: statusFilter,
                method: methodFilter,
                search,
                dateFrom,
                dateTo,
            });

            if (response?.requests) {
                setRequests(response.requests);
                setTotal(Number(response.total) || 0);
                setTotalPages(Math.max(Number(response.totalPages) || 1, 1));
            }
        } catch (err) {
            setError(err.message || "Unable to load deposit requests.");
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter, methodFilter, search, dateFrom, dateTo]);

    useEffect(() => {
        loadRequests(page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    const isFirstFilterRun = useRef(true);

    useEffect(() => {

        if (isFirstFilterRun.current) {
            isFirstFilterRun.current = false;
            return;
        }

        const timeout = setTimeout(() => {
            setPage(1);
            loadRequests(1);
        }, 400);

        return () => clearTimeout(timeout);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter, methodFilter, search, dateFrom, dateTo]);

    useEffect(() => {
        getPublicSettings()
            .then((response) => {
                const mode = response?.data?.payment?.payment_mode;
                if (mode === "automatic") {
                    setPaymentMode("automatic");
                }
            })
            .catch(() => {});
    }, []);

    const handleManualSubmit = async (event) => {
        event.preventDefault();

        setFormMessage("");
        setFormError("");

        const numericAmount = Number(amount);

        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            setFormError("Please enter a valid amount.");
            return;
        }

        if (!referenceId.trim()) {
            setFormError("Payment reference/UTR is required.");
            return;
        }

        try {
            setSubmitting(true);

            await createDepositRequest({
                amount: numericAmount,
                referenceId: referenceId.trim(),
                method,
            });

            setFormMessage("Deposit request submitted. It will be reviewed by an admin.");
            setAmount("");
            setReferenceId("");

            setPage(1);
            await loadRequests(1);
        } catch (err) {
            setFormError(err.message || "Unable to submit deposit request.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleRazorpayPay = async () => {

        setFormMessage("");
        setFormError("");

        const numericAmount = Number(amount);

        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            setFormError("Please enter a valid amount.");
            return;
        }

        if (!razorpayReady || typeof window === "undefined" || !window.Razorpay) {
            setFormError("Payment gateway is still loading - please try again in a moment.");
            return;
        }

        try {
            setSubmitting(true);

            const order = await createRazorpayOrder(numericAmount);

            const user = getStoredUser();

            const checkout = new window.Razorpay({
                key: order.keyId,
                amount: Math.round(order.amount * 100),
                currency: order.currency,
                order_id: order.orderId,
                name: siteName,
                description: "Wallet deposit",
                prefill: {
                    name: user?.fullName || "",
                    email: user?.email || "",
                    contact: user?.mobile || "",
                },
                theme: {
                    color: "#7c3aed",
                },
                handler: async (response) => {

                    try {

                        await verifyRazorpayPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });

                        setFormMessage("Payment successful! Your wallet has been credited.");
                        setAmount("");

                        setPage(1);
                        await loadRequests(1);
                        refreshWallet();

                    } catch (verifyError) {

                        setFormError(
                            verifyError.message ||
                            "Payment received but verification failed - it will be reconciled shortly. Contact support if your balance doesn't update."
                        );

                    } finally {

                        setSubmitting(false);

                    }

                },
                modal: {
                    ondismiss: () => {
                        setSubmitting(false);
                        setFormError("Payment was cancelled.");
                    },
                },
            });

            checkout.on("payment.failed", (response) => {
                setSubmitting(false);
                setFormError(
                    response?.error?.description ||
                    "Payment failed. Please try again."
                );
            });

            checkout.open();

        } catch (err) {
            setFormError(err.message || "Unable to start payment.");
            setSubmitting(false);
        }

    };

    return (
        <UserLayout title="Deposit">
            <div className="p-4 sm:p-6 lg:p-8">

                <UserPageHeader
                    icon={ArrowDownToLine}
                    eyebrow="Wallet"
                    title="Deposit"
                    description={
                        paymentMode === "automatic"
                            ? "Pay instantly and your real balance is credited automatically."
                            : "Submit your payment reference - an admin will review and credit your real balance."
                    }
                />

              <div className="mx-auto max-w-3xl">

                {paymentMode === "automatic" && (
                    <Script
                        src="https://checkout.razorpay.com/v1/checkout.js"
                        onLoad={() => setRazorpayReady(true)}
                    />
                )}

                {paymentMode === "automatic" ? (

                    <div className="mt-6 space-y-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">

                        {formError && (
                            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                                {formError}
                            </div>
                        )}

                        {formMessage && (
                            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                                {formMessage}
                            </div>
                        )}

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-300">Amount (₹)</label>
                            <input
                                type="number"
                                min="1"
                                value={amount}
                                onChange={(event) => setAmount(event.target.value)}
                                disabled={submitting}
                                placeholder="Enter amount"
                                className="w-full rounded-xl border border-white/10 bg-[#050a19] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-500/60 disabled:opacity-50"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={handleRazorpayPay}
                            disabled={submitting || !razorpayReady}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-900/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Zap size={16} />
                            {submitting ? "Processing..." : "Pay Now"}
                        </button>

                        <p className="text-center mt-0.5 max-w-[170px] truncate text-[12px] text-slate-500">
                            Secured by Razorpay. Your wallet is credited only after payment is verified.
                        </p>

                    </div>

                ) : (

                    <form
                        onSubmit={handleManualSubmit}
                        className="mt-6 space-y-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
                    >

                        {formError && (
                            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                                {formError}
                            </div>
                        )}

                        {formMessage && (
                            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                                {formMessage}
                            </div>
                        )}

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-300">Amount (₹)</label>
                            <input
                                type="number"
                                min="1"
                                value={amount}
                                onChange={(event) => setAmount(event.target.value)}
                                disabled={submitting}
                                placeholder="Enter amount"
                                className="w-full rounded-xl border border-white/10 bg-[#050a19] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-500/60 disabled:opacity-50"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-300">Payment Method</label>
                            <select
                                value={method}
                                onChange={(event) => setMethod(event.target.value)}
                                disabled={submitting}
                                className="w-full rounded-xl border border-white/10 bg-[#050a19] px-4 py-3 text-sm text-white outline-none focus:border-violet-500/60 disabled:opacity-50"
                            >
                                <option value="upi">UPI</option>
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-300">
                                Payment Reference / UTR
                            </label>
                            <input
                                type="text"
                                value={referenceId}
                                onChange={(event) => setReferenceId(event.target.value)}
                                disabled={submitting}
                                placeholder="e.g. UTR number from your payment app"
                                className="w-full rounded-xl border border-white/10 bg-[#050a19] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-500/60 disabled:opacity-50"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-900/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <ArrowDownToLine size={16} />
                            {submitting ? "Submitting..." : "Submit Deposit Request"}
                        </button>

                    </form>

                )}

              </div>

                <UserFilters
                    search={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="Search reference or payment ID..."
                    filters={[
                        {
                            key: "status",
                            label: "Status",
                            value: statusFilter,
                            onChange: setStatusFilter,
                            placeholder: "All Status",
                            options: STATUS_OPTIONS,
                        },
                        {
                            key: "method",
                            label: "Method",
                            value: methodFilter,
                            onChange: setMethodFilter,
                            placeholder: "All Methods",
                            options: METHOD_OPTIONS,
                        },
                    ]}
                    dateRange={{
                        from: dateFrom,
                        to: dateTo,
                        onFromChange: setDateFrom,
                        onToChange: setDateTo,
                    }}
                />

                <div className="mt-6">
                {loading ? (
                    <LoadingState label="Loading requests..." />
                ) : error ? (
                    <ErrorState message={error} onRetry={loadRequests} />
                ) : (
                    <DataTable
                        title="Deposit Requests"
                        subtitle="Your Deposits"
                        count={requests.length}
                        minWidth="1000px"
                        empty={requests.length === 0}
                        emptyTitle="No deposits yet"
                        emptyMessage="You haven't submitted any deposit requests yet."
                        headers={["Amount", "Reference", "Payment ID", "Method", "Status", "Notes", "Date"]}
                    >
                        {requests.map((request) => (
                            <DataTableRow key={request._id}>
                                <DataTableCell className="font-semibold text-white">
                                    ₹{Number(request.amount).toLocaleString("en-IN")}
                                </DataTableCell>
                                <DataTableCell className="text-slate-400">{request.referenceId}</DataTableCell>
                                <DataTableCell className="text-slate-500">
                                    {request.razorpayPaymentId || "-"}
                                </DataTableCell>
                                <DataTableCell className="text-slate-400">{request.method}</DataTableCell>
                                <DataTableCell>
                                    <StatusBadge status={request.status} />
                                </DataTableCell>
                                <DataTableCell className="max-w-[220px] text-[12px] leading-4 text-slate-500">
                                    {request.status === "rejected" && request.reviewNotes
                                        ? request.reviewNotes
                                        : request.refundStatus === "processed"
                                            ? "Refunded"
                                            : request.gatewayStatus === "failed"
                                                ? "Payment failed - not credited"
                                                : request.status === "pending" && request.initiatedVia === "razorpay"
                                                    ? "Awaiting payment confirmation"
                                                    : "-"}
                                </DataTableCell>
                                <DataTableCell className="text-slate-500">
                                    {new Date(request.createdAt).toLocaleString("en-IN")}
                                </DataTableCell>
                            </DataTableRow>
                        ))}
                    </DataTable>
                )}

                {!loading && !error && requests.length > 0 && (
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        total={total}
                        limit={PAGE_LIMIT}
                        loading={loading}
                        itemLabel="deposit requests"
                        onPageChange={setPage}
                    />
                )}
                </div>

            </div>
        </UserLayout>
    );
}
