"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
    Search, RefreshCw, Send, X, UserCog, Inbox, Clock3, Flame, UserX, LifeBuoy,
    History, Pencil, Save, ChevronDown, ChevronUp,
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
    updateAdminSupportTicketNote,
    getAdminSupportStats,
    getCurrentAdmin,
    getAdminAdmins,
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

const CATEGORY_LABEL = (value) =>
    value ? value.charAt(0).toUpperCase() + value.slice(1) : "-";

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
    const [currentAdmin, setCurrentAdmin] = useState(null);
    const [adminsList, setAdminsList] = useState([]);

    // Dropdown selections are DRAFTS now - nothing saves until
    // "Update" is clicked. Seeded from the loaded ticket whenever
    // it (re)loads, see seedDraftsFromTicket below.
    const [draftStatus, setDraftStatus] = useState("open");
    const [draftPriority, setDraftPriority] = useState("normal");
    const [draftAssignedAdminId, setDraftAssignedAdminId] = useState("");
    const [assignNote, setAssignNote] = useState("");
    const [closingNoteDraft, setClosingNoteDraft] = useState("");
    const [updateBusy, setUpdateBusy] = useState(false);
    const [updateError, setUpdateError] = useState("");

    // Internal note (assignment note) + its edit history.
    const [noteEditing, setNoteEditing] = useState(false);
    const [noteDraft, setNoteDraft] = useState("");
    const [noteBusy, setNoteBusy] = useState(false);
    const [noteError, setNoteError] = useState("");
    const [showNoteHistory, setShowNoteHistory] = useState(false);

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

    useEffect(() => {
        getAdminAdmins({ limit: 200, status: "active" })
            .then((response) => { if (response?.admins) setAdminsList(response.admins); })
            .catch(() => {});
    }, []);

    const seedDraftsFromTicket = (t) => {
        setDraftStatus(t?.status || "open");
        setDraftPriority(t?.priority || "normal");
        setDraftAssignedAdminId(String(t?.assignedAdmin?._id || t?.assignedAdmin || ""));
        setAssignNote("");
        setClosingNoteDraft(t?.closingNote || "");
        setUpdateError("");
        setNoteEditing(false);
        setNoteDraft(t?.internalNote?.text || "");
        setNoteError("");
        setShowNoteHistory(false);
    };

    useEffect(() => { setPage(1); }, [status, priority, category, assignedAdmin, search]);

    const openTicket = async (id) => {
        setSelectedTicketId(id);
        setTicketError("");
        setTicketLoading(true);
        try {
            const response = await getAdminSupportTicketById(id);
            if (response?.data) {
                setTicket(response.data);
                seedDraftsFromTicket(response.data);
            }
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

    // ==================================================
    // UPDATE (batches status/priority/assignment - nothing
    // saves until this is clicked, per the dropdowns being
    // draft-only now)
    // ==================================================

    const currentAssignedId =
        String(ticket?.assignedAdmin?._id || ticket?.assignedAdmin || "");

    const assignmentChanged =
        draftAssignedAdminId !== currentAssignedId;

    const statusChanged =
        draftStatus !== ticket?.status;

    const priorityChanged =
        draftPriority !== ticket?.priority;

    const hasPendingChanges =
        statusChanged || priorityChanged || assignmentChanged;

    const handleUpdate = async () => {

        if (!ticket || !hasPendingChanges) return;

        setUpdateError("");

        if (assignmentChanged && !assignNote.trim()) {
            setUpdateError("A note is required before changing the assignment.");
            return;
        }

        try {

            setUpdateBusy(true);

            let latest = ticket;

            if (statusChanged) {

                const response = await changeAdminSupportTicketStatus(
                    selectedTicketId,
                    draftStatus,
                    draftStatus === "closed" ? closingNoteDraft.trim() : undefined
                );

                if (response?.data) latest = response.data;

            }

            if (priorityChanged) {

                const response = await changeAdminSupportTicketPriority(selectedTicketId, draftPriority);

                if (response?.data) latest = response.data;

            }

            if (assignmentChanged) {

                const response = await assignAdminSupportTicket(
                    selectedTicketId,
                    draftAssignedAdminId || null,
                    assignNote.trim()
                );

                if (response?.data) latest = response.data;

            }

            setTicket(latest);
            seedDraftsFromTicket(latest);

        } catch (err) {

            setUpdateError(err.message || "Unable to update ticket.");

        } finally {

            setUpdateBusy(false);

        }

    };

    // ==================================================
    // INTERNAL NOTE (independent of assignment)
    // ==================================================

    const handleSaveNote = async () => {

        setNoteError("");

        if (!noteDraft.trim()) {
            setNoteError("Note cannot be empty.");
            return;
        }

        try {

            setNoteBusy(true);

            const response = await updateAdminSupportTicketNote(selectedTicketId, noteDraft.trim());

            if (response?.data) {
                setTicket(response.data);
                setNoteEditing(false);
            }

        } catch (err) {

            setNoteError(err.message || "Unable to update note.");

        } finally {

            setNoteBusy(false);

        }

    };

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
                                        <p className="max-w-[150px] truncate text-sm font-bold text-white">{item.subject}</p>
                                        <p className="mt-0.5 max-w-[170px] truncate text-[12px] text-slate-500">{item.ticketNumber}</p>
                                    </div>
                                </div>
                            </AdminTableCell>
                            <AdminTableCell className="text-slate-400 text-sm">
                                {item.user?.fullName || item.user?.username || "-"}
                            </AdminTableCell>
                            <AdminTableCell className="capitalize text-slate-400 text-sm">{item.category}</AdminTableCell>
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
                                <div className="flex-1 overflow-y-auto">

                                <div className="border-b border-white/[0.06] px-5 py-4">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-bold text-white">{ticket.subject}</h2>
                                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-400">
                                            {CATEGORY_LABEL(ticket.category)}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {ticket.user?.fullName || ticket.user?.username} ({ticket.user?.email})
                                    </p>

                                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                                        <AdminDropdown
                                            value={draftStatus}
                                            onChange={setDraftStatus}
                                            options={STATUS_OPTIONS.filter((o) => o.value !== "all")}
                                        />
                                        <AdminDropdown
                                            value={draftPriority}
                                            onChange={setDraftPriority}
                                            options={PRIORITY_OPTIONS.filter((o) => o.value !== "all")}
                                        />
                                        <AdminDropdown
                                            value={draftAssignedAdminId}
                                            onChange={setDraftAssignedAdminId}
                                            options={[
                                                { value: "", label: "Unassigned" },
                                                ...adminsList.map((a) => ({
                                                    value: String(a._id),
                                                    label: String(a._id) === String(currentAdmin?.id) ? `${a.fullName || a.name || a.username} (You)` : (a.fullName || a.name || a.username),
                                                })),
                                            ]}
                                        />
                                    </div>

                                    {assignmentChanged && (
                                        <div className="mt-3">
                                            <label className="mb-1.5 block text-[11px] font-bold text-amber-400">
                                                Assignment note (required before updating)
                                            </label>
                                            <textarea
                                                value={assignNote}
                                                onChange={(e) => setAssignNote(e.target.value)}
                                                disabled={updateBusy}
                                                rows={2}
                                                maxLength={2000}
                                                placeholder="Why are you assigning/reassigning this ticket?"
                                                className="w-full rounded-xl border border-amber-500/20 bg-[#070914] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 disabled:opacity-50"
                                            />
                                        </div>
                                    )}

                                    {draftStatus === "closed" && (
                                        <div className="mt-3">
                                            <label className="mb-1.5 block text-[11px] font-bold text-violet-400">
                                                Closing note (shown to the user)
                                            </label>
                                            <textarea
                                                value={closingNoteDraft}
                                                onChange={(e) => setClosingNoteDraft(e.target.value)}
                                                disabled={updateBusy}
                                                rows={2}
                                                maxLength={2000}
                                                placeholder="Let the user know why this was closed..."
                                                className="w-full rounded-xl border border-violet-500/20 bg-[#070914] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 disabled:opacity-50"
                                            />
                                        </div>
                                    )}

                                    {updateError && (
                                        <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{updateError}</div>
                                    )}

                                    {hasPendingChanges && (
                                        <button
                                            type="button"
                                            onClick={handleUpdate}
                                            disabled={updateBusy}
                                            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2.5 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {updateBusy ? "Updating..." : "Update"}
                                        </button>
                                    )}

                                    {ticketError && (
                                        <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{ticketError}</div>
                                    )}
                                </div>

                                {/* ===========================================
                                    INTERNAL NOTE + HISTORY (admin/super admin
                                    only - never shown to the ticket owner)
                                =========================================== */}

                                <div className="border-b border-white/[0.06] px-5 py-4">

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                            <UserCog size={13} /> Internal Note
                                        </div>
                                        {!noteEditing && (
                                            <button
                                                type="button"
                                                onClick={() => { setNoteEditing(true); setNoteDraft(ticket.internalNote?.text || ""); setNoteError(""); }}
                                                className="flex items-center gap-1 text-[11px] font-bold text-violet-400 hover:text-violet-300"
                                            >
                                                <Pencil size={11} /> Edit
                                            </button>
                                        )}
                                    </div>

                                    {noteEditing ? (
                                        <div className="mt-2">
                                            {noteError && (
                                                <div className="mb-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{noteError}</div>
                                            )}
                                            <textarea
                                                value={noteDraft}
                                                onChange={(e) => setNoteDraft(e.target.value)}
                                                disabled={noteBusy}
                                                rows={3}
                                                maxLength={2000}
                                                className="w-full rounded-xl border border-white/10 bg-[#070914] px-3 py-2 text-sm text-white outline-none disabled:opacity-50"
                                            />
                                            <div className="mt-2 flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => { setNoteEditing(false); setNoteError(""); }}
                                                    disabled={noteBusy}
                                                    className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleSaveNote}
                                                    disabled={noteBusy}
                                                    className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-500 disabled:opacity-50"
                                                >
                                                    <Save size={12} /> {noteBusy ? "Saving..." : "Save"}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-300">
                                            {ticket.internalNote?.text || <span className="text-slate-600">No note yet.</span>}
                                        </p>
                                    )}

                                    {ticket.internalNote?.text && !noteEditing && (
                                        <p className="mt-1 text-[12px] text-slate-400">
                                            Last updated by {ticket.internalNote.updatedByName || "an admin"} on {formatDate(ticket.internalNote.updatedAt)}
                                        </p>
                                    )}

                                    {ticket.internalNoteHistory?.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setShowNoteHistory((current) => !current)}
                                            className="mt-2 flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-300"
                                        >
                                            <History size={12} />
                                            {showNoteHistory ? "Hide" : "View"} history ({ticket.internalNoteHistory.length})
                                            {showNoteHistory ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                        </button>
                                    )}

                                    {showNoteHistory && (
                                        <div className="mt-2 space-y-2 rounded-xl border border-white/[0.06] bg-black/10 p-3">
                                            {[...ticket.internalNoteHistory].reverse().map((entry) => (
                                                <div key={entry._id} className="text-[12px] leading-5 text-slate-500">
                                                    <p className="font-bold text-slate-400">
                                                        {entry.changedByName || "An admin"} - {formatDate(entry.changedAt)}
                                                    </p>
                                                    <p>
                                                        <span className="text-slate-500">{entry.previousText || "(empty)"}</span>
                                                        {" -> "}
                                                        <span className="text-slate-300">{entry.newText || "(empty)"}</span>
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                </div>

                                <div className="space-y-3 px-5 py-4">
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

                                </div>

                                <form onSubmit={handleReply} className="border-t border-white/[0.06] p-4">
                                    <div className="flex gap-2">
                                        <textarea
                                            value={replyMessage}
                                            onChange={(e) => setReplyMessage(e.target.value)}
                                            disabled={replyBusy || ticket.status === "closed"}
                                            maxLength={2000}
                                            rows={1}
                                            placeholder={ticket.status === "closed" ? "Ticket is closed - change status to reopen" : "Type your reply..."}
                                            className="flex-1 rounded-xl border border-white/10 bg-[#070914] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-400 disabled:opacity-70"
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

