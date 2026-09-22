"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
    Search, RefreshCw, Send, X, UserCog, Inbox, Clock3, Flame, UserX, LifeBuoy,
} from "lucide-react";

import AdminHeader from "../../../components/admin/AdminHeader";
import AdminPageHeader from "../../../components/admin/ui/AdminPageHeader";
import AdminTable, { AdminTableRow, AdminTableCell } from "../../../components/admin/ui/AdminTable";
import AdminBadge from "../../../components/admin/ui/AdminBadge";
import AdminDropdown from "../../../components/admin/ui/AdminDropdown";
import AdminPagination from "../../../components/admin/ui/AdminPagination";
import AdminStatCard from "../../../components/admin/ui/AdminStatCard";

import {
    getAdminSupportTickets,
    getAdminSupportTicketById,
    replyToAdminSupportTicket,
    changeAdminSupportTicketStatus,
    changeAdminSupportTicketPriority,
    assignAdminSupportTicket,
    getAdminSupportStats,
    getCurrentAdmin,
} from "../../../lib/adminApi";

const DEFAULT_LIMIT = 20;

const STATUS_OPTIONS = [
    { value: "all", label: "All Statuses" },
    { value: "open", label: "Open" },
    { value: "pending", label: "Pending" },
    { value: "replied", label: "Replied" },
    { value: "resolved", label: "Resolved" },
    { value: "closed", label: "Closed" },
];

const PRIORITY_OPTIONS = [
    { value: "all", label: "All Priorities" },
    { value: "low", label: "Low" },
    { value: "normal", label: "Normal" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
];

const CATEGORY_OPTIONS = [
    { value: "all", label: "All Categories" },
    ...["payment", "deposit", "withdrawal", "betting", "wallet", "referral", "account", "verification", "technical", "other"]
        .map((c) => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) })),
];

const ASSIGNED_OPTIONS = [
    { value: "all", label: "Anyone" },
    { value: "unassigned", label: "Unassigned" },
];

const STATUS_VARIANT = {
    open: "info",
    pending: "warning",
    replied: "purple",
    resolved: "success",
    closed: "default",
};

const PRIORITY_VARIANT = {
    low: "default",
    normal: "info",
    high: "warning",
    urgent: "danger",
};

function formatDate(value) {
    if (!value) return "-";
    return new Date(value).toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
}

export default function AdminSupportPage() {

    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [priority, setPriority] = useState("all");
    const [category, setCategory] = useState("all");
    const [assignedAdmin, setAssignedAdmin] = useState("all");

    const [stats, setStats] = useState(null);

    const [selectedTicketId, setSelectedTicketId] = useState(null);
    const [ticket, setTicket] = useState(null);
    const [ticketLoading, setTicketLoading] = useState(false);
    const [ticketError, setTicketError] = useState("");

    const [replyMessage, setReplyMessage] = useState("");
    const [replyBusy, setReplyBusy] = useState(false);
    const [actionBusy, setActionBusy] = useState(false);
    const [currentAdmin, setCurrentAdmin] = useState(null);

    const messagesEndRef = useRef(null);

    const loadStats = useCallback(async () => {
        try {
            const response = await getAdminSupportStats();
            if (response?.data) setStats(response.data);
        } catch (err) {
            // Non-critical - stats row just stays empty on failure.
        }
    }, []);

    const loadTickets = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await getAdminSupportTickets({
                page, limit: DEFAULT_LIMIT, status, priority, category, assignedAdmin, search,
            });

            if (response?.tickets) {
                setTickets(response.tickets);
                setTotal(response.total || 0);
                setTotalPages(Math.max(response.totalPages || 1, 1));
            }
        } catch (err) {
            setError(err.message || "Unable to load tickets.");
        } finally {
            setLoading(false);
        }
    }, [page, status, priority, category, assignedAdmin, search]);

    useEffect(() => { loadTickets(); }, [loadTickets]);
    useEffect(() => { loadStats(); }, [loadStats]);

    useEffect(() => {
        getCurrentAdmin()
            .then((response) => { if (response?.success) setCurrentAdmin(response.admin); })
            .catch(() => {});
    }, []);

    useEffect(() => { setPage(1); }, [status, priority, category, assignedAdmin, search]);

    const openTicket = async (id) => {
        setSelectedTicketId(id);
        setTicketError("");
        setTicketLoading(true);
        try {
            const response = await getAdminSupportTicketById(id);
            if (response?.data) setTicket(response.data);
        } catch (err) {
            setTicketError(err.message || "Unable to load ticket.");
        } finally {
            setTicketLoading(false);
        }
    };

    const closeModal = () => {
        setSelectedTicketId(null);
        setTicket(null);
        setReplyMessage("");
        loadTickets();
        loadStats();
    };

    useEffect(() => {
        if (ticket) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [ticket?.messages?.length]);

    const handleReply = async (event) => {
        event.preventDefault();
        if (!replyMessage.trim()) return;

        try {
            setReplyBusy(true);
            const response = await replyToAdminSupportTicket(selectedTicketId, replyMessage.trim());
            if (response?.data) setTicket(response.data);
            setReplyMessage("");
        } catch (err) {
            setTicketError(err.message || "Unable to send reply.");
        } finally {
            setReplyBusy(false);
        }
    };

    const handleStatusChange = async (value) => {
        try {
            setActionBusy(true);
            const response = await changeAdminSupportTicketStatus(selectedTicketId, value);
            if (response?.data) setTicket(response.data);
        } catch (err) {
            setTicketError(err.message || "Unable to update status.");
        } finally {
            setActionBusy(false);
        }
    };

    const handlePriorityChange = async (value) => {
        try {
            setActionBusy(true);
            const response = await changeAdminSupportTicketPriority(selectedTicketId, value);
            if (response?.data) setTicket(response.data);
        } catch (err) {
            setTicketError(err.message || "Unable to update priority.");
        } finally {
            setActionBusy(false);
        }
    };

    const handleAssignToggle = async () => {
        const isAssignedToMe =
            ticket?.assignedAdmin && String(ticket.assignedAdmin._id || ticket.assignedAdmin) === String(currentAdmin?.id);

        try {
            setActionBusy(true);
            const response = await assignAdminSupportTicket(selectedTicketId, isAssignedToMe ? null : currentAdmin?.id);
            if (response?.data) setTicket(response.data);
        } catch (err) {
            setTicketError(err.message || "Unable to update assignment.");
        } finally {
            setActionBusy(false);
        }
    };

    const isAssignedToMe =
        ticket?.assignedAdmin && String(ticket.assignedAdmin._id || ticket.assignedAdmin) === String(currentAdmin?.id);

    return (
        <main className="min-h-screen bg-[#070914] text-white">
            <AdminHeader title="Support" subtitle="Support Management" showSocketStatus={false} />

            <div className="p-4 sm:p-6 lg:p-8">

                <AdminPageHeader
                    icon={LifeBuoy}
                    eyebrow="Support Management"
                    title="Support"
                    description="Review, assign and respond to user support tickets."
                />

                {/* STATS */}
                <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    <AdminStatCard icon={Inbox} label="Open" value={stats?.open ?? "-"} color="blue" />
                    <AdminStatCard icon={Clock3} label="Pending" value={stats?.pending ?? "-"} color="amber" />
                    <AdminStatCard icon={Flame} label="Urgent" value={stats?.urgent ?? "-"} color="red" />
                    <AdminStatCard icon={UserX} label="Unassigned" value={stats?.unassigned ?? "-"} color="slate" />
                    <AdminStatCard icon={Inbox} label="Resolved" value={stats?.resolved ?? "-"} color="emerald" />
                    <AdminStatCard icon={Inbox} label="Closed" value={stats?.closed ?? "-"} color="slate" />
                </div>

                {/* FILTERS */}
                <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-[#0c0f1c] p-4 lg:flex-row lg:items-center">
                    <div className="relative flex-1">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search subject or ticket number..."
                            className="w-full rounded-xl border border-white/[0.07] bg-[#070914] py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-600"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:w-[560px]">
                        <AdminDropdown value={status} onChange={setStatus} options={STATUS_OPTIONS} />
                        <AdminDropdown value={priority} onChange={setPriority} options={PRIORITY_OPTIONS} />
                        <AdminDropdown value={category} onChange={setCategory} options={CATEGORY_OPTIONS} />
                        <AdminDropdown value={assignedAdmin} onChange={setAssignedAdmin} options={ASSIGNED_OPTIONS} />
                    </div>

                    <button
                        type="button"
                        onClick={() => { loadTickets(); loadStats(); }}
                        className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
                    </button>
                </div>

                {error && (
                    <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs font-semibold text-red-400">
                        {error}
                    </div>
                )}

                {/* TABLE */}
                <AdminTable
                    title="Support Tickets"
                    count={tickets.length}
                    minWidth="1100px"
                    empty={!loading && tickets.length === 0}
                    emptyTitle="No tickets found"
                    emptyMessage="Try adjusting your filters."
                    headers={[
                        { label: "Ticket" },
                        { label: "User" },
                        { label: "Category" },
                        { label: "Priority" },
                        { label: "Status" },
                        { label: "Assigned" },
                        { label: "Last Update" },
                    ]}
                >
                    {loading ? (
                        <AdminTableRow>
                            <AdminTableCell className="text-slate-500" colSpan={7}>Loading...</AdminTableCell>
                        </AdminTableRow>
                    ) : tickets.map((item) => (
                        <AdminTableRow key={item._id} onClick={() => openTicket(item._id)}>
                            <AdminTableCell>
                                <div className="flex items-center gap-2">
                                    {item.adminUnreadCount > 0 && (
                                        <span className="h-2 w-2 shrink-0 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)]" />
                                    )}
                                    <div>
                                        <p className="font-semibold text-white">{item.subject}</p>
                                        <p className="text-[11px] text-slate-600">{item.ticketNumber}</p>
                                    </div>
                                </div>
                            </AdminTableCell>
                            <AdminTableCell className="text-slate-400">
                                {item.user?.fullName || item.user?.username || "-"}
                            </AdminTableCell>
                            <AdminTableCell className="capitalize text-slate-400">{item.category}</AdminTableCell>
                            <AdminTableCell>
                                <AdminBadge variant={PRIORITY_VARIANT[item.priority]}>{item.priority}</AdminBadge>
                            </AdminTableCell>
                            <AdminTableCell>
                                <AdminBadge variant={STATUS_VARIANT[item.status]}>{item.status}</AdminBadge>
                            </AdminTableCell>
                            <AdminTableCell className="text-slate-400">
                                {item.assignedAdmin?.name || item.assignedAdmin?.username || "Unassigned"}
                            </AdminTableCell>
                            <AdminTableCell className="text-slate-500">{formatDate(item.lastMessageAt)}</AdminTableCell>
                        </AdminTableRow>
                    ))}
                </AdminTable>

                {!loading && tickets.length > 0 && (
                    <AdminPagination
                        page={page}
                        totalPages={totalPages}
                        total={total}
                        limit={DEFAULT_LIMIT}
                        loading={loading}
                        itemLabel="tickets"
                        onPageChange={setPage}
                    />
                )}

            </div>

            {/* TICKET DETAIL MODAL */}
            {selectedTicketId && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
                    onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal(); }}
                >
                    <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0f1c] shadow-2xl">

                        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                            <p className="text-sm font-bold text-white">{ticket?.ticketNumber || "Ticket"}</p>
                            <button type="button" onClick={closeModal} className="text-slate-500 hover:text-white">
                                <X size={18} />
                            </button>
                        </div>

                        {ticketLoading ? (
                            <div className="px-5 py-10 text-center text-sm text-slate-500">Loading...</div>
                        ) : ticket ? (
                            <>
                                <div className="border-b border-white/[0.06] px-5 py-4">
                                    <h2 className="text-lg font-bold text-white">{ticket.subject}</h2>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {ticket.user?.fullName || ticket.user?.username} ({ticket.user?.email})
                                    </p>

                                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                                        <AdminDropdown
                                            value={ticket.status}
                                            onChange={handleStatusChange}
                                            options={STATUS_OPTIONS.filter((o) => o.value !== "all")}
                                        />
                                        <AdminDropdown
                                            value={ticket.priority}
                                            onChange={handlePriorityChange}
                                            options={PRIORITY_OPTIONS.filter((o) => o.value !== "all")}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAssignToggle}
                                            disabled={actionBusy}
                                            className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition disabled:opacity-50 ${isAssignedToMe ? "border-violet-500/30 bg-violet-500/10 text-violet-300" : "border-white/[0.07] bg-[#070914] text-slate-400 hover:text-white"}`}
                                        >
                                            <UserCog size={14} />
                                            {isAssignedToMe ? "Assigned to me" : ticket.assignedAdmin ? `${ticket.assignedAdmin.name || ticket.assignedAdmin.username}` : "Assign to me"}
                                        </button>
                                    </div>

                                    {ticketError && (
                                        <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{ticketError}</div>
                                    )}
                                </div>

                                <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                                    {ticket.messages.map((msg) => {
                                        const isAdmin = msg.senderType === "admin";
                                        return (
                                            <div key={msg._id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                                                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${isAdmin ? "bg-violet-600 text-white" : "border border-white/10 bg-white/[0.04] text-slate-200"}`}>
                                                    <p className="text-[10px] uppercase tracking-wide opacity-70">{isAdmin ? "Support" : "User"}</p>
                                                    <p className="mt-1 whitespace-pre-wrap break-words">{msg.message}</p>
                                                    <p className="mt-1 text-[10px] opacity-60">{formatDate(msg.createdAt)}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                <form onSubmit={handleReply} className="border-t border-white/[0.06] p-4">
                                    <div className="flex gap-2">
                                        <textarea
                                            value={replyMessage}
                                            onChange={(e) => setReplyMessage(e.target.value)}
                                            disabled={replyBusy || ticket.status === "closed"}
                                            maxLength={2000}
                                            rows={2}
                                            placeholder={ticket.status === "closed" ? "Ticket is closed - reopen it to reply" : "Type your reply..."}
                                            className="flex-1 rounded-xl border border-white/10 bg-[#070914] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 disabled:opacity-50"
                                        />
                                        <button
                                            type="submit"
                                            disabled={replyBusy || ticket.status === "closed"}
                                            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <Send size={14} /> Send
                                        </button>
                                    </div>
                                </form>
                            </>
                        ) : null}
                    </div>
                </div>
            )}
        </main>
    );
}

