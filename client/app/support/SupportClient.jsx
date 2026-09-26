"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
    Mail, Phone, LifeBuoy, Plus, ArrowLeft, Send, Lock,
} from "lucide-react";

import UserLayout from "../../components/user/UserLayout";
import UserPageHeader from "../../components/user/UserPageHeader";
import { LoadingState, ErrorState } from "../../components/user/PageState";
import StatusBadge from "../../components/user/StatusBadge";
import Pagination from "../../components/user/Pagination";
import DataTable, { DataTableRow, DataTableCell } from "../../components/user/DataTable";
import {
    getPublicSettings,
    createSupportTicket,
    getMySupportTickets,
    getMySupportTicketById,
    replyToMySupportTicket,
} from "../../lib/api";
import { getStoredUser } from "../../lib/useAuth";

// ======================================================
// SUPPORT PAGE - real ticket system + static contact info
// ======================================================

const PAGE_LIMIT = 20;

const CATEGORIES = [
    "payment", "deposit", "withdrawal", "betting", "wallet",
    "referral", "account", "verification", "technical", "other",
];

const PRIORITY_STYLES = {
    low: "border-slate-500/20 bg-slate-500/10 text-slate-400",
    normal: "border-blue-500/20 bg-blue-500/10 text-blue-300",
    high: "border-amber-500/20 bg-amber-500/10 text-amber-400",
    urgent: "border-red-500/20 bg-red-500/10 text-red-400",
};

function PriorityBadge({ priority }) {
    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${PRIORITY_STYLES[priority] || PRIORITY_STYLES.normal}`}>
            {priority}
        </span>
    );
}

function formatDate(value) {
    if (!value) return "-";
    return new Date(value).toLocaleString("en-IN");
}

export default function SupportPage() {

    const currentUser = getStoredUser();

    // Contact info (static supplement)
    const [general, setGeneral] = useState(null);

    // View state
    const [view, setView] = useState("list"); // list | create | detail
    const [selectedTicketId, setSelectedTicketId] = useState(null);

    // List state
    const [tickets, setTickets] = useState([]);
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [listLoading, setListLoading] = useState(true);
    const [listError, setListError] = useState("");

    // Create form state
    const [subject, setSubject] = useState("");
    const [category, setCategory] = useState("other");
    const [message, setMessage] = useState("");
    const [createBusy, setCreateBusy] = useState(false);
    const [createError, setCreateError] = useState("");

    // Detail state
    const [ticket, setTicket] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState("");
    const [replyMessage, setReplyMessage] = useState("");
    const [replyBusy, setReplyBusy] = useState(false);
    const [replyError, setReplyError] = useState("");
    const messagesEndRef = useRef(null);

    useEffect(() => {
        getPublicSettings()
            .then((response) => {
                if (response?.data?.general) setGeneral(response.data.general);
            })
            .catch(() => {});
    }, []);

    const loadTickets = useCallback(async () => {
        try {
            setListLoading(true);
            setListError("");

            const response = await getMySupportTickets({ page, limit: PAGE_LIMIT, status: statusFilter });

            if (response?.tickets) {
                setTickets(response.tickets);
                setTotal(response.total || 0);
                setTotalPages(Math.max(response.totalPages || 1, 1));
            }
        } catch (err) {
            setListError(err.message || "Unable to load support tickets.");
        } finally {
            setListLoading(false);
        }
    }, [page, statusFilter]);

    useEffect(() => {
        if (view === "list") {
            loadTickets();
        }
    }, [view, loadTickets]);

    const loadTicketDetail = useCallback(async (id) => {
        try {
            setDetailLoading(true);
            setDetailError("");

            const response = await getMySupportTicketById(id);

            if (response?.data) {
                setTicket(response.data);
            }
        } catch (err) {
            setDetailError(err.message || "Unable to load ticket.");
        } finally {
            setDetailLoading(false);
        }
    }, []);

    useEffect(() => {
        if (view === "detail" && selectedTicketId) {
            loadTicketDetail(selectedTicketId);
        }
    }, [view, selectedTicketId, loadTicketDetail]);

    useEffect(() => {
        if (ticket) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [ticket?.messages?.length]);

    const openTicket = (id) => {
        setSelectedTicketId(id);
        setView("detail");
    };

    const backToList = () => {
        setView("list");
        setTicket(null);
        setSelectedTicketId(null);
        loadTickets();
    };

    const handleCreateTicket = async (event) => {
        event.preventDefault();
        setCreateError("");

        if (!subject.trim() || !message.trim()) {
            setCreateError("Subject and message are required.");
            return;
        }

        try {
            setCreateBusy(true);
            const response = await createSupportTicket({
                subject: subject.trim(),
                category,
                message: message.trim(),
            });

            setSubject("");
            setCategory("other");
            setMessage("");

            if (response?.data?._id) {
                setSelectedTicketId(response.data._id);
                setView("detail");
                setTicket(response.data);
            } else {
                setView("list");
            }
        } catch (err) {
            setCreateError(err.message || "Unable to create ticket.");
        } finally {
            setCreateBusy(false);
        }
    };

    const handleReply = async (event) => {
        event.preventDefault();
        setReplyError("");

        if (!replyMessage.trim()) {
            setReplyError("Message is required.");
            return;
        }

        try {
            setReplyBusy(true);
            const response = await replyToMySupportTicket(selectedTicketId, replyMessage.trim());
            setReplyMessage("");
            if (response?.data) setTicket(response.data);
        } catch (err) {
            setReplyError(err.message || "Unable to send reply.");
        } finally {
            setReplyBusy(false);
        }
    };

    const supportEmail = general?.support_email;
    const supportPhone = general?.support_phone;

    const inputClass =
        "w-full rounded-xl border border-white/10 bg-[#050a19] px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-500/60 disabled:opacity-50";

    return (
        <UserLayout title="Support">
            <div className="p-4 sm:p-6 lg:p-8">

                {view === "list" && (
                    <>
                        <UserPageHeader
                            icon={LifeBuoy}
                            eyebrow="Help"
                            title="Support"
                            description="Get help with your account, deposits, withdrawals, or bets."
                            actions={
                                <button
                                    type="button"
                                    onClick={() => setView("create")}
                                    className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-900/20 transition hover:brightness-110"
                                >
                                    <Plus size={16} /> New Ticket
                                </button>
                            }
                        />

                        <div className="mt-5 flex flex-wrap gap-2">
                            {["all", "open", "pending", "replied", "resolved", "closed"].map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => { setStatusFilter(option); setPage(1); }}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition ${statusFilter === option ? "bg-violet-600 text-white" : "bg-white/[0.03] text-slate-400 hover:text-white"}`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>

                        <div className="mt-4">
                            {listLoading ? (
                                <LoadingState label="Loading your tickets..." />
                            ) : listError ? (
                                <ErrorState message={listError} onRetry={loadTickets} />
                            ) : (
                                <>
                                    <DataTable
                                        title="Your Tickets"
                                        subtitle="Support History"
                                        count={tickets.length}
                                        minWidth="800px"
                                        empty={tickets.length === 0}
                                        emptyTitle="No support tickets yet"
                                        emptyMessage="You haven't created any support tickets yet."
                                        headers={["Subject", "Category", "Priority", "Status", "Last Update"]}
                                    >
                                        {tickets.map((item) => (
                                            <DataTableRow key={item._id} onClick={() => openTicket(item._id)}>
                                                <DataTableCell>
                                                    <div className="flex items-center gap-2">
                                                        {item.userUnreadCount > 0 && (
                                                            <span className="h-2 w-2 shrink-0 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
                                                        )}
                                                        <span className="font-semibold text-white">{item.subject}</span>
                                                    </div>
                                                    <p className="mt-0.5 mt-0.5 max-w-[170px] truncate text-[12px] text-slate-500">{item.ticketNumber}</p>
                                                </DataTableCell>
                                                <DataTableCell className="capitalize text-slate-400">{item.category}</DataTableCell>
                                                <DataTableCell><PriorityBadge priority={item.priority} /></DataTableCell>
                                                <DataTableCell><StatusBadge status={item.status} /></DataTableCell>
                                                <DataTableCell className="text-slate-500">{formatDate(item.lastMessageAt)}</DataTableCell>
                                            </DataTableRow>
                                        ))}
                                    </DataTable>

                                    {tickets.length > 0 && (
                                        <Pagination
                                            page={page}
                                            totalPages={totalPages}
                                            total={total}
                                            limit={PAGE_LIMIT}
                                            loading={listLoading}
                                            itemLabel="tickets"
                                            onPageChange={setPage}
                                        />
                                    )}
                                </>
                            )}
                        </div>

                        <h2 className="mb-3 mt-10 text-sm font-bold text-white">Other Ways to Reach Us</h2>

                        <div className="space-y-3">
                            {supportEmail ? (
                                <a href={`mailto:${supportEmail}`} className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 transition hover:bg-white/[0.04]">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300"><Mail size={17} /></span>
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-slate-500">Email</p>
                                        <p className="text-sm font-semibold text-white">{supportEmail}</p>
                                    </div>
                                </a>
                            ) : null}

                            {supportPhone ? (
                                <a href={`tel:${supportPhone}`} className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 transition hover:bg-white/[0.04]">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300"><Phone size={17} /></span>
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-slate-500">Phone</p>
                                        <p className="text-sm font-semibold text-white">{supportPhone}</p>
                                    </div>
                                </a>
                            ) : null}

                            {!supportEmail && !supportPhone && (
                                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] py-10 text-center">
                                    <LifeBuoy size={20} className="text-slate-600" />
                                    <p className="text-sm text-slate-500">No additional contact details configured.</p>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {view === "create" && (
                    <div className="mx-auto max-w-2xl">
                        <button type="button" onClick={() => setView("list")} className="mb-4 flex items-center gap-2 text-sm text-slate-400 hover:text-white">
                            <ArrowLeft size={15} /> Back to tickets
                        </button>

                        <h1 className="text-2xl font-bold text-white">New Support Ticket</h1>

                        <form onSubmit={handleCreateTicket} className="mt-6 space-y-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">

                            {createError && (
                                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{createError}</div>
                            )}

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-300">Subject</label>
                                <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} disabled={createBusy} maxLength={150} placeholder="Brief summary of your issue" className={inputClass} />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-300">Category</label>
                                <select value={category} onChange={(e) => setCategory(e.target.value)} disabled={createBusy} className={inputClass}>
                                    {CATEGORIES.map((c) => (
                                        <option key={c} value={c} className="capitalize">{c}</option>
                                    ))}
                                </select>
                                <p className="mt-1 mt-0.5 max-w-[170px] truncate text-[12px] text-slate-500">Priority is set automatically based on category.</p>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-300">Message</label>
                                <textarea value={message} onChange={(e) => setMessage(e.target.value)} disabled={createBusy} maxLength={2000} rows={6} placeholder="Describe your issue in detail..." className={inputClass} />
                                <p className="mt-1 text-right mt-0.5 max-w-[170px] truncate text-[12px] text-slate-500">{message.length}/2000</p>
                            </div>

                            <button type="submit" disabled={createBusy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-900/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
                                {createBusy ? "Submitting..." : "Submit Ticket"}
                            </button>
                        </form>
                    </div>
                )}

                {view === "detail" && (
                    <div className="mx-auto max-w-3xl">
                        <button type="button" onClick={backToList} className="mb-4 flex items-center gap-2 text-sm text-slate-400 hover:text-white">
                            <ArrowLeft size={15} /> Back to tickets
                        </button>

                        {detailLoading ? (
                            <LoadingState label="Loading ticket..." />
                        ) : detailError ? (
                            <ErrorState message={detailError} onRetry={() => loadTicketDetail(selectedTicketId)} />
                        ) : ticket ? (
                            <div>
                                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <StatusBadge status={ticket.status} />
                                        <PriorityBadge priority={ticket.priority} />
                                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold capitalize text-slate-400">{ticket.category}</span>
                                    </div>
                                    <h1 className="mt-3 text-xl font-bold text-white">{ticket.subject}</h1>
                                    <p className="mt-1 text-[12px] text-slate-400">{ticket.ticketNumber} - Created {formatDate(ticket.createdAt)}</p>
                                </div>

                                <div className="mt-4 max-h-[480px] space-y-3 overflow-y-auto rounded-2xl border border-white/[0.06] bg-white/[0.01] p-4">
                                    {ticket.messages.map((msg) => {
                                        const isMe = msg.senderType === "user";
                                        return (
                                            <div key={msg._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${isMe ? "bg-violet-600 text-white" : "border border-white/10 bg-white/[0.04] text-slate-200"}`}>
                                                    <p className="text-[10px] uppercase tracking-wide opacity-70">{isMe ? currentUser?.fullName || "You" : "Support Team"}</p>
                                                    <p className="mt-1 whitespace-pre-wrap break-words">{msg.message}</p>
                                                    <p className="mt-1 text-[10px] opacity-60">{formatDate(msg.createdAt)}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                {ticket.status === "closed" ? (
                                    <div className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4">
                                        <p className="flex items-center gap-2 text-sm text-slate-500"><Lock size={15} /> This ticket is closed. Only our support team can reopen it.</p>
                                        {ticket.closingNote && (
                                            <div className="mt-3 rounded-xl border border-violet-500/15 bg-violet-500/[0.05] px-4 py-3">
                                                <p className="text-[10px] font-bold uppercase tracking-wide text-violet-400">Note from our team</p>
                                                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-300">{ticket.closingNote}</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <form onSubmit={handleReply} className="mt-4 space-y-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                                        {replyError && (
                                            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs text-red-400">{replyError}</div>
                                        )}
                                        <textarea value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} disabled={replyBusy} maxLength={2000} rows={3} placeholder="Type your reply..." className={inputClass} />
                                        <div className="flex items-center justify-end gap-2">
                                            <button type="submit" disabled={replyBusy} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-900/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
                                                <Send size={14} /> {replyBusy ? "Sending..." : "Send Reply"}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        ) : null}
                    </div>
                )}

            </div>
        </UserLayout>
    );
}
