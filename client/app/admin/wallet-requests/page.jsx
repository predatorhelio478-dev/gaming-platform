"use client";

import { useCallback, useEffect, useState } from "react";
import {
    ArrowDownToLine,
    ArrowUpFromLine,
    RefreshCw,
    Check,
    X as XIcon,
    RotateCcw,
    SearchCheck,
    Undo2,
} from "lucide-react";

import AdminHeader from "../../../components/admin/AdminHeader";
import AdminPageHeader from "../../../components/admin/ui/AdminPageHeader";
import AdminPagination from "../../../components/admin/ui/AdminPagination";

import {
    getAdminDepositRequests,
    approveAdminDepositRequest,
    rejectAdminDepositRequest,
    reconcileAdminDepositRequest,
    refundAdminDepositRequest,
    reconcileAdminDepositRefund,
    getAdminWithdrawalRequests,
    approveAdminWithdrawalRequest,
    rejectAdminWithdrawalRequest,
    reconcileAdminWithdrawalRequest,
    retryAdminWithdrawalRequest,
} from "../../../lib/adminApi";

const DEFAULT_LIMIT = 20;

const STATUS_STYLES = {
    pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    rejected: "bg-red-500/10 text-red-400 border-red-500/20",
};

function StatusPill({ status }) {
    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${STATUS_STYLES[status] || "border-white/10 bg-white/5 text-slate-400"}`}
        >
            {status}
        </span>
    );
}

function formatCurrency(value) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(Number(value) || 0);
}

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

export default function WalletRequestsPage() {

    const [tab, setTab] = useState("withdrawals");

    const [deposits, setDeposits] = useState([]);
    const [depositPage, setDepositPage] = useState(1);
    const [depositTotalPages, setDepositTotalPages] = useState(1);
    const [depositTotal, setDepositTotal] = useState(0);
    const [depositStatus, setDepositStatus] = useState("pending");
    const [loadingDeposits, setLoadingDeposits] = useState(true);

    const [withdrawals, setWithdrawals] = useState([]);
    const [withdrawalPage, setWithdrawalPage] = useState(1);
    const [withdrawalTotalPages, setWithdrawalTotalPages] = useState(1);
    const [withdrawalTotal, setWithdrawalTotal] = useState(0);
    const [withdrawalStatus, setWithdrawalStatus] = useState("pending");
    const [loadingWithdrawals, setLoadingWithdrawals] = useState(true);

    const [busyId, setBusyId] = useState(null);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const loadDeposits = useCallback(async () => {
        try {
            setLoadingDeposits(true);
            const response = await getAdminDepositRequests({
                page: depositPage,
                limit: DEFAULT_LIMIT,
                status: depositStatus,
            });
            setDeposits(Array.isArray(response?.requests) ? response.requests : []);
            setDepositTotal(Number(response?.total) || 0);
            setDepositTotalPages(Math.max(Number(response?.totalPages) || 1, 1));
        } catch (err) {
            setError(err.message || "Unable to load deposit requests.");
        } finally {
            setLoadingDeposits(false);
        }
    }, [depositPage, depositStatus]);

    const loadWithdrawals = useCallback(async () => {
        try {
            setLoadingWithdrawals(true);
            const response = await getAdminWithdrawalRequests({
                page: withdrawalPage,
                limit: DEFAULT_LIMIT,
                status: withdrawalStatus,
            });
            setWithdrawals(Array.isArray(response?.requests) ? response.requests : []);
            setWithdrawalTotal(Number(response?.total) || 0);
            setWithdrawalTotalPages(Math.max(Number(response?.totalPages) || 1, 1));
        } catch (err) {
            setError(err.message || "Unable to load withdrawal requests.");
        } finally {
            setLoadingWithdrawals(false);
        }
    }, [withdrawalPage, withdrawalStatus]);

    useEffect(() => { loadDeposits(); }, [loadDeposits]);
    useEffect(() => { loadWithdrawals(); }, [loadWithdrawals]);

    useEffect(() => {
        if (!successMessage) return;
        const timer = setTimeout(() => setSuccessMessage(""), 4000);
        return () => clearTimeout(timer);
    }, [successMessage]);

    const runAction = async (id, label, action) => {
        try {
            setBusyId(id);
            setError("");
            setSuccessMessage("");
            const response = await action();
            setSuccessMessage(response?.message || `${label} successful.`);
            await Promise.all([loadDeposits(), loadWithdrawals()]);
        } catch (err) {
            setError(err.message || `Unable to ${label.toLowerCase()}.`);
        } finally {
            setBusyId(null);
        }
    };

    const promptNotes = (message) => {
        if (typeof window === "undefined") return "";
        return window.prompt(message, "") || "";
    };

    return (
        <main className="min-h-screen bg-[#070914] text-white">

            <AdminHeader title="Deposits & Withdrawals" subtitle="Wallet Requests" showSocketStatus={false} />

            <div className="p-4 sm:p-6 lg:p-8">

                <AdminPageHeader
                    icon={ArrowDownToLine}
                    eyebrow="Wallet Requests"
                    title="Deposits & Withdrawals"
                    description="Review manual requests and reconcile Razorpay-initiated payments/payouts."
                    actions={
                        <button
                            type="button"
                            onClick={() => { loadDeposits(); loadWithdrawals(); }}
                            disabled={loadingDeposits || loadingWithdrawals}
                            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={loadingDeposits || loadingWithdrawals ? "animate-spin" : ""} />
                            Refresh
                        </button>
                    }
                />

                {successMessage && (
                    <div className="mb-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs font-semibold text-emerald-400">
                        {successMessage}
                    </div>
                )}

                {error && (
                    <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs font-semibold text-red-400">
                        {error}
                    </div>
                )}

                <div className="mb-5 flex gap-2">
                    <button
                        type="button"
                        onClick={() => setTab("withdrawals")}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${tab === "withdrawals" ? "bg-violet-600 text-white" : "bg-white/[0.03] text-slate-400 hover:text-white"}`}
                    >
                        <ArrowUpFromLine size={14} /> Withdrawals ({withdrawalTotal})
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab("deposits")}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${tab === "deposits" ? "bg-violet-600 text-white" : "bg-white/[0.03] text-slate-400 hover:text-white"}`}
                    >
                        <ArrowDownToLine size={14} /> Deposits ({depositTotal})
                    </button>
                </div>

                {tab === "withdrawals" && (
                    <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0d101d]">
                        <div className="flex items-center justify-between border-b border-white/[0.06] p-4">
                            <h2 className="text-sm font-bold text-white">Withdrawal Requests</h2>
                            <select
                                value={withdrawalStatus}
                                onChange={(e) => { setWithdrawalStatus(e.target.value); setWithdrawalPage(1); }}
                                className="rounded-lg border border-white/10 bg-[#050a19] px-3 py-1.5 text-xs text-white outline-none"
                            >
                                <option value="all">All</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-left text-sm">
                                <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3">User</th>
                                        <th className="px-4 py-3">Amount</th>
                                        <th className="px-4 py-3">Method / Details</th>
                                        <th className="px-4 py-3">Mode</th>
                                        <th className="px-4 py-3">Gateway Status</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.05]">
                                    {loadingWithdrawals ? (
                                        <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
                                    ) : withdrawals.length === 0 ? (
                                        <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">No withdrawal requests found.</td></tr>
                                    ) : withdrawals.map((request) => (
                                        <tr key={request._id}>
                                            <td className="px-4 py-3 text-slate-300">
                                                {request.user?.fullName || request.user?.username || "—"}
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-white">{formatCurrency(request.amount)}</td>
                                            <td className="px-4 py-3 text-slate-400">
                                                {request.payoutMethod}
                                                <div className="text-[11px] text-slate-600">{request.payoutDetails}</div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-400 capitalize">{request.mode}</td>
                                            <td className="px-4 py-3 text-slate-500">{request.gatewayStatus || "—"}</td>
                                            <td className="px-4 py-3"><StatusPill status={request.status} /></td>
                                            <td className="px-4 py-3 text-slate-500">{formatDate(request.createdAt)}</td>
                                            <td className="px-4 py-3">
                                                {request.status === "pending" && (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {request.mode === "manual" && (
                                                            <>
                                                                <ActionButton
                                                                    icon={Check}
                                                                    label="Approve"
                                                                    color="emerald"
                                                                    busy={busyId === request._id}
                                                                    onClick={() => runAction(request._id, "Approve", () => approveAdminWithdrawalRequest(request._id, promptNotes("Approval notes (optional):")))}
                                                                />
                                                                <ActionButton
                                                                    icon={XIcon}
                                                                    label="Reject"
                                                                    color="red"
                                                                    busy={busyId === request._id}
                                                                    onClick={() => runAction(request._id, "Reject", () => rejectAdminWithdrawalRequest(request._id, promptNotes("Rejection reason:")))}
                                                                />
                                                            </>
                                                        )}
                                                        {request.mode === "automatic" && request.razorpayPayoutId && (
                                                            <ActionButton
                                                                icon={SearchCheck}
                                                                label="Reconcile"
                                                                color="violet"
                                                                busy={busyId === request._id}
                                                                onClick={() => runAction(request._id, "Reconcile", () => reconcileAdminWithdrawalRequest(request._id))}
                                                            />
                                                        )}
                                                        {request.mode === "automatic" && !request.razorpayPayoutId && (
                                                            <ActionButton
                                                                icon={RotateCcw}
                                                                label="Retry"
                                                                color="violet"
                                                                busy={busyId === request._id}
                                                                onClick={() => runAction(request._id, "Retry", () => retryAdminWithdrawalRequest(request._id))}
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {!loadingWithdrawals && withdrawals.length > 0 && (
                            <AdminPagination
                                page={withdrawalPage}
                                totalPages={withdrawalTotalPages}
                                total={withdrawalTotal}
                                limit={DEFAULT_LIMIT}
                                loading={loadingWithdrawals}
                                itemLabel="withdrawal requests"
                                onPageChange={setWithdrawalPage}
                            />
                        )}
                    </div>
                )}

                {tab === "deposits" && (
                    <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0d101d]">
                        <div className="flex items-center justify-between border-b border-white/[0.06] p-4">
                            <h2 className="text-sm font-bold text-white">Deposit Requests</h2>
                            <select
                                value={depositStatus}
                                onChange={(e) => { setDepositStatus(e.target.value); setDepositPage(1); }}
                                className="rounded-lg border border-white/10 bg-[#050a19] px-3 py-1.5 text-xs text-white outline-none"
                            >
                                <option value="all">All</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-left text-sm">
                                <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3">User</th>
                                        <th className="px-4 py-3">Amount</th>
                                        <th className="px-4 py-3">Reference / Method</th>
                                        <th className="px-4 py-3">Via</th>
                                        <th className="px-4 py-3">Gateway Status</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.05]">
                                    {loadingDeposits ? (
                                        <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
                                    ) : deposits.length === 0 ? (
                                        <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">No deposit requests found.</td></tr>
                                    ) : deposits.map((request) => (
                                        <tr key={request._id}>
                                            <td className="px-4 py-3 text-slate-300">
                                                {request.user?.fullName || request.user?.username || "—"}
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-white">{formatCurrency(request.amount)}</td>
                                            <td className="px-4 py-3 text-slate-400">
                                                {request.referenceId}
                                                <div className="text-[11px] text-slate-600">{request.method}</div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-400 capitalize">{request.initiatedVia}</td>
                                            <td className="px-4 py-3 text-slate-500">
                                                {request.gatewayStatus || "—"}
                                                {request.refundStatus && (
                                                    <div className="text-[11px] text-amber-500">refund: {request.refundStatus}</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3"><StatusPill status={request.status} /></td>
                                            <td className="px-4 py-3 text-slate-500">{formatDate(request.createdAt)}</td>
                                            <td className="px-4 py-3">
                                                {request.status === "pending" && (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {request.initiatedVia === "manual" && (
                                                            <>
                                                                <ActionButton
                                                                    icon={Check}
                                                                    label="Approve"
                                                                    color="emerald"
                                                                    busy={busyId === request._id}
                                                                    onClick={() => runAction(request._id, "Approve", () => approveAdminDepositRequest(request._id, promptNotes("Approval notes (optional):")))}
                                                                />
                                                                <ActionButton
                                                                    icon={XIcon}
                                                                    label="Reject"
                                                                    color="red"
                                                                    busy={busyId === request._id}
                                                                    onClick={() => runAction(request._id, "Reject", () => rejectAdminDepositRequest(request._id, promptNotes("Rejection reason:")))}
                                                                />
                                                            </>
                                                        )}
                                        {request.initiatedVia === "razorpay" && (
                                                            <ActionButton
                                                                icon={SearchCheck}
                                                                label="Reconcile"
                                                                color="violet"
                                                                busy={busyId === request._id}
                                                                onClick={() => runAction(request._id, "Reconcile", () => reconcileAdminDepositRequest(request._id))}
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                                {request.status === "approved" && request.initiatedVia === "razorpay" && request.refundStatus !== "processed" && (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {request.refundStatus === "pending" ? (
                                                            <ActionButton
                                                                icon={SearchCheck}
                                                                label="Reconcile Refund"
                                                                color="violet"
                                                                busy={busyId === request._id}
                                                                onClick={() => runAction(request._id, "Reconcile refund", () => reconcileAdminDepositRefund(request._id))}
                                                            />
                                                        ) : (
                                                            <ActionButton
                                                                icon={Undo2}
                                                                label="Refund"
                                                                color="red"
                                                                busy={busyId === request._id}
                                                                onClick={() => {
                                                                    const reason = promptNotes("Refund reason:");
                                                                    if (!reason) return;
                                                                    runAction(request._id, "Refund", () => refundAdminDepositRequest(request._id, reason));
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {!loadingDeposits && deposits.length > 0 && (
                            <AdminPagination
                                page={depositPage}
                                totalPages={depositTotalPages}
                                total={depositTotal}
                                limit={DEFAULT_LIMIT}
                                loading={loadingDeposits}
                                itemLabel="deposit requests"
                                onPageChange={setDepositPage}
                            />
                        )}
                    </div>
                )}

            </div>
        </main>
    );
}

function ActionButton({ icon: Icon, label, color, busy, onClick }) {
    const colors = {
        emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20",
        red: "border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20",
        violet: "border-violet-500/20 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20",
    };

    return (
        <button
            type="button"
            disabled={busy}
            onClick={onClick}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${colors[color]}`}
        >
            <Icon size={13} />
            {busy ? "..." : label}
        </button>
    );
}
