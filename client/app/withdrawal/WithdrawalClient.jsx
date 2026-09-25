"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ArrowUpFromLine } from "lucide-react";

import UserLayout from "../../components/user/UserLayout";
import UserPageHeader from "../../components/user/UserPageHeader";
import UserFilters from "../../components/user/UserFilters";
import { LoadingState, ErrorState } from "../../components/user/PageState";
import StatusBadge from "../../components/user/StatusBadge";
import Pagination from "../../components/user/Pagination";
import DataTable, { DataTableRow, DataTableCell } from "../../components/user/DataTable";
import { createWithdrawalRequest, getMyWithdrawalRequests, getPublicSettings } from "../../lib/api";
import { getStoredUser } from "../../lib/useAuth";
import useWallet from "../../lib/useWallet";

// ======================================================
// WITHDRAWAL PAGE
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
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "upi", label: "UPI" },
];

export default function WithdrawalPage() {

    const [withdrawalMode, setWithdrawalMode] = useState("manual");
    const [user, setUser] = useState(null);

    const [amount, setAmount] = useState("");
    const [payoutMethod, setPayoutMethod] = useState("bank_transfer");
    const [payoutDetails, setPayoutDetails] = useState("");
    const [upiId, setUpiId] = useState("");
    const [bankAccountNumber, setBankAccountNumber] = useState("");
    const [bankIfsc, setBankIfsc] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [formMessage, setFormMessage] = useState("");
    const [formError, setFormError] = useState("");

    const wallet = useWallet();
    const realBalance = wallet.balance;

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

            const requestsResponse = await getMyWithdrawalRequests({
                page: targetPage,
                limit: PAGE_LIMIT,
                status: statusFilter,
                method: methodFilter,
                search,
                dateFrom,
                dateTo,
            });

            if (requestsResponse?.requests) {
                setRequests(requestsResponse.requests);
                setTotal(Number(requestsResponse.total) || 0);
                setTotalPages(Math.max(Number(requestsResponse.totalPages) || 1, 1));
            }
        } catch (err) {
            setError(err.message || "Unable to load withdrawal requests.");
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
        setUser(getStoredUser());

        getPublicSettings()
            .then((response) => {
                const mode = response?.data?.payment?.withdrawal_mode;
                if (mode === "automatic") {
                    setWithdrawalMode("automatic");
                }
            })
            .catch(() => {});
    }, []);

    const missingVerification = [
        !user?.emailVerified && "email",
        !user?.mobileVerified && "mobile number",
    ].filter(Boolean);

    const handleSubmit = async (event) => {
        event.preventDefault();

        setFormMessage("");
        setFormError("");

        const numericAmount = Number(amount);

        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            setFormError("Please enter a valid amount.");
            return;
        }

        if (!payoutDetails.trim()) {
            setFormError("Payout details (bank/UPI) are required.");
            return;
        }

        if (withdrawalMode === "automatic") {

            if (payoutMethod === "upi" && !upiId.trim()) {
                setFormError("UPI ID is required for automatic payouts.");
                return;
            }

            if (payoutMethod === "bank_transfer" && (!bankAccountNumber.trim() || !bankIfsc.trim())) {
                setFormError("Bank account number and IFSC are required for automatic payouts.");
                return;
            }

        }

        try {
            setSubmitting(true);

            const response = await createWithdrawalRequest({
                amount: numericAmount,
                payoutMethod,
                payoutDetails: payoutDetails.trim(),
                ...(withdrawalMode === "automatic" && payoutMethod === "upi"
                    ? { upiId: upiId.trim() }
                    : {}),
                ...(withdrawalMode === "automatic" && payoutMethod === "bank_transfer"
                    ? { bankAccountNumber: bankAccountNumber.trim(), bankIfsc: bankIfsc.trim().toUpperCase() }
                    : {}),
            });

            setFormMessage(response?.message || "Withdrawal request submitted.");
            setAmount("");
            setPayoutDetails("");
            setUpiId("");
            setBankAccountNumber("");
            setBankIfsc("");

            setPage(1);
            await loadRequests(1);
            wallet.refresh();
        } catch (err) {
            setFormError(err.message || "Unable to submit withdrawal request.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <UserLayout title="Withdrawal">
            <div className="p-4 sm:p-6 lg:p-8">

                <UserPageHeader
                    icon={ArrowUpFromLine}
                    eyebrow="Wallet"
                    title="Withdrawal"
                    description={
                        <>
                            Only your Real balance (₹{realBalance.toLocaleString("en-IN")}) can be withdrawn.
                            Test and bonus balances are never included.
                            {withdrawalMode === "automatic"
                                ? " Payouts are processed automatically."
                                : " Requests are reviewed by an admin before payout."}
                        </>
                    }
                />

              <div className="mx-auto max-w-3xl">

                {missingVerification.length > 0 && (
                    <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                        Withdrawals require a verified account. Please verify your {missingVerification.join(" and ")} in{" "}
                        <a href="/settings" className="font-semibold underline">Settings</a> before withdrawing.
                    </div>
                )}

                <form
                    onSubmit={handleSubmit}
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
                        <label className="mb-2 block text-sm font-medium text-slate-300">Payout Method</label>
                        <select
                            value={payoutMethod}
                            onChange={(event) => setPayoutMethod(event.target.value)}
                            disabled={submitting}
                            className="w-full rounded-xl border border-white/10 bg-[#050a19] px-4 py-3 text-sm text-white outline-none focus:border-violet-500/60 disabled:opacity-50"
                        >
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="upi">UPI</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-300">
                            Payout Details (Account/UPI ID)
                        </label>
                        <input
                            type="text"
                            value={payoutDetails}
                            onChange={(event) => setPayoutDetails(event.target.value)}
                            disabled={submitting}
                            placeholder="e.g. your UPI ID or bank account + IFSC"
                            className="w-full rounded-xl border border-white/10 bg-[#050a19] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-500/60 disabled:opacity-50"
                        />
                        <p className="mt-1 text-[12px] text-slate-500">
                            Human-readable summary shown to admins during manual review.
                        </p>
                    </div>

                    {withdrawalMode === "automatic" && payoutMethod === "upi" && (
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-300">UPI ID</label>
                            <input
                                type="text"
                                value={upiId}
                                onChange={(event) => setUpiId(event.target.value)}
                                disabled={submitting}
                                placeholder="yourname@bank"
                                className="w-full rounded-xl border border-white/10 bg-[#050a19] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-500/60 disabled:opacity-50"
                            />
                        </div>
                    )}

                    {withdrawalMode === "automatic" && payoutMethod === "bank_transfer" && (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-300">Account Number</label>
                                <input
                                    type="text"
                                    value={bankAccountNumber}
                                    onChange={(event) => setBankAccountNumber(event.target.value)}
                                    disabled={submitting}
                                    placeholder="1234567890"
                                    className="w-full rounded-xl border border-white/10 bg-[#050a19] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-500/60 disabled:opacity-50"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-300">IFSC Code</label>
                                <input
                                    type="text"
                                    value={bankIfsc}
                                    onChange={(event) => setBankIfsc(event.target.value)}
                                    disabled={submitting}
                                    placeholder="HDFC0001234"
                                    className="w-full rounded-xl border border-white/10 bg-[#050a19] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-500/60 disabled:opacity-50"
                                />
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting || missingVerification.length > 0}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-900/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <ArrowUpFromLine size={16} />
                        {submitting ? "Submitting..." : "Submit Withdrawal Request"}
                    </button>

                </form>

              </div>

                <UserFilters
                    search={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="Search payout details or ID..."
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
                        title="Withdrawal Requests"
                        subtitle="Your Withdrawals"
                        count={requests.length}
                        minWidth="900px"
                        empty={requests.length === 0}
                        emptyTitle="No withdrawals yet"
                        emptyMessage="You haven't submitted any withdrawal requests yet."
                        headers={["Amount", "Method", "Details", "Mode", "Status", "Date"]}
                    >
                        {requests.map((request) => (
                            <DataTableRow key={request._id}>
                                <DataTableCell className="font-semibold text-white">
                                    ₹{Number(request.amount).toLocaleString("en-IN")}
                                </DataTableCell>
                                <DataTableCell className="text-slate-400">{request.payoutMethod}</DataTableCell>
                                <DataTableCell className="text-slate-400">{request.payoutDetails}</DataTableCell>
                                <DataTableCell className="text-slate-500">
                                    {request.mode === "automatic"
                                        ? `Automatic${request.gatewayStatus ? ` (${request.gatewayStatus})` : ""}`
                                        : "Manual"}
                                </DataTableCell>
                                <DataTableCell>
                                    <StatusBadge status={request.status} />
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
                        itemLabel="withdrawal requests"
                        onPageChange={setPage}
                    />
                )}
                </div>

            </div>
        </UserLayout>
    );
}
