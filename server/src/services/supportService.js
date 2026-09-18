const mongoose = require("mongoose");

const SupportTicket =
    require("../models/SupportTicket");

const DepositRequest =
    require("../models/DepositRequest");

const WithdrawalRequest =
    require("../models/WithdrawalRequest");

const Transaction =
    require("../models/Transaction");

const Payout =
    require("../models/Payout");

const Bet =
    require("../models/Bet");

const GameRound =
    require("../models/GameRound");

const Admin =
    require("../models/Admin");

const { createAuditLog } =
    require("./auditLogService");

const notificationService =
    require("./notificationService");


const REFERENCE_MODELS = {
    deposit: DepositRequest,
    withdrawal: WithdrawalRequest,
    transaction: Transaction,
    payout: Payout,
    bet: Bet,
};


// ==========================================================
// GENERATE TICKET NUMBER
// ==========================================================

const generateTicketNumber = () => {

    const random =
        Math.random().toString(36).slice(2, 10).toUpperCase();

    return `TKT-${random}`;

};


// ==========================================================
// VALIDATE + NORMALIZE FINANCIAL REFERENCES
// ==========================================================
//
// Every reference is re-checked against the DATABASE, scoped
// to the requesting user - a reference id that exists but
// belongs to someone else is silently dropped rather than
// either exposing it or failing the whole ticket. `round`
// references have no per-user owner (round state is shared),
// so they're only checked for existence.
// ==========================================================

const validateReferences = async (
    userId,
    references = []
) => {

    if (!Array.isArray(references) || references.length === 0) {

        return [];

    }

    const validated = [];

    for (const reference of references.slice(0, 10)) {

        const type =
            String(reference?.type || "").trim();

        const refId =
            reference?.refId;

        if (!refId || !mongoose.isValidObjectId(refId)) {

            continue;

        }

        if (type === "round") {

            const round =
                await GameRound.findById(refId).select("_id");

            if (round) {

                validated.push({ type, refId });

            }

            continue;

        }

        const Model =
            REFERENCE_MODELS[type];

        if (!Model) {

            continue;

        }

        const owned =
            await Model.findOne({ _id: refId, user: userId }).select("_id");

        if (owned) {

            validated.push({ type, refId });

        }

    }

    return validated;

};


// ==========================================================
// CREATE TICKET
// ==========================================================

const createTicket = async (
    userId,
    {
        subject,
        category = "other",
        priority = "normal",
        message,
        references = [],
    }
) => {

    const cleanSubject =
        String(subject || "").trim();

    const cleanMessage =
        String(message || "").trim();

    if (!cleanSubject) {

        throw new Error("Subject is required.");

    }

    if (!cleanMessage) {

        throw new Error("Message is required.");

    }

    if (cleanSubject.length > 150) {

        throw new Error("Subject is too long.");

    }

    if (cleanMessage.length > 2000) {

        throw new Error("Message is too long (max 2000 characters).");

    }

    const validatedReferences =
        await validateReferences(userId, references);

    let ticket = null;

    for (let attempt = 0; attempt < 3 && !ticket; attempt++) {

        try {

            ticket = await SupportTicket.create({
                ticketNumber: generateTicketNumber(),
                user: userId,
                subject: cleanSubject,
                category,
                priority,
                status: "open",
                references: validatedReferences,
                messages: [
                    {
                        senderType: "user",
                        senderId: userId,
                        message: cleanMessage,
                    },
                ],
                lastMessageAt: new Date(),
                lastMessageBySenderType: "user",
                userUnreadCount: 0,
                adminUnreadCount: 1,
            });

        } catch (error) {

            if (error?.code !== 11000) {

                throw error;

            }

            // Ticket number collision (astronomically rare) -
            // retry with a freshly generated number.

        }

    }

    if (!ticket) {

        throw new Error("Unable to create ticket. Please try again.");

    }

    notificationService
        .notifyAdmins(
            "support",
            "New support ticket",
            `New ${category} ticket "${cleanSubject}" (${ticket.ticketNumber}) was opened.`,
            { ticketId: String(ticket._id), ticketNumber: ticket.ticketNumber }
        )
        .catch(() => {});

    return ticket;

};


// ==========================================================
// LIST MY TICKETS (paginated)
// ==========================================================

const listMyTickets = async (
    userId,
    { page = 1, limit = 20, status = "all" } = {}
) => {

    const safeLimit =
        Math.min(Math.max(Number(limit) || 20, 1), 100);

    const safePage =
        Math.max(Number(page) || 1, 1);

    const filter = { user: userId };

    if (status && status !== "all") {

        filter.status = status;

    }

    const [tickets, total] = await Promise.all([

        SupportTicket.find(filter)
            .select("-messages")
            .sort({ lastMessageAt: -1 })
            .skip((safePage - 1) * safeLimit)
            .limit(safeLimit)
            .populate("assignedAdmin", "name username"),

        SupportTicket.countDocuments(filter),

    ]);

    const totalPages =
        Math.max(Math.ceil(total / safeLimit), 1);

    return {
        tickets,
        total,
        page: safePage,
        totalPages,
        hasNextPage: safePage < totalPages,
        hasPreviousPage: safePage > 1,
    };

};


// ==========================================================
// GET MY TICKET BY ID (ownership enforced)
// ==========================================================

const getMyTicketById = async (
    userId,
    ticketId
) => {

    if (!mongoose.isValidObjectId(ticketId)) {

        throw new Error("Ticket not found.");

    }

    const ticket =
        await SupportTicket.findOne({ _id: ticketId, user: userId })
            .populate("assignedAdmin", "name username");

    if (!ticket) {

        throw new Error("Ticket not found.");

    }

    if (ticket.userUnreadCount > 0) {

        ticket.userUnreadCount = 0;

        await ticket.save();

    }

    return ticket;

};


// ==========================================================
// USER REPLY
// ==========================================================

const userReplyToTicket = async (
    userId,
    ticketId,
    message
) => {

    const cleanMessage =
        String(message || "").trim();

    if (!cleanMessage) {

        throw new Error("Message is required.");

    }

    if (cleanMessage.length > 2000) {

        throw new Error("Message is too long (max 2000 characters).");

    }

    if (!mongoose.isValidObjectId(ticketId)) {

        throw new Error("Ticket not found.");

    }

    const ticket =
        await SupportTicket.findOne({ _id: ticketId, user: userId });

    if (!ticket) {

        throw new Error("Ticket not found.");

    }

    if (ticket.status === "closed") {

        throw new Error("This ticket is closed. Reopen it before replying.");

    }

    ticket.messages.push({
        senderType: "user",
        senderId: userId,
        message: cleanMessage,
    });

    ticket.lastMessageAt = new Date();
    ticket.lastMessageBySenderType = "user";
    ticket.userUnreadCount = 0;
    ticket.adminUnreadCount += 1;

    if (ticket.status !== "open") {

        ticket.status = "pending";

    }

    await ticket.save();

    // Phase 8's notify() only targets a single user, and
    // notifyAdmins() is a single shared row for every admin -
    // there is no per-admin targeted channel to single out
    // just the assignee, so the assigned-ticket case and the
    // general case both go through the same shared admin alert.

    notificationService
        .notifyAdmins(
            "support",
            "New user reply",
            `User replied on ticket ${ticket.ticketNumber} ("${ticket.subject}").`,
            { ticketId: String(ticket._id), ticketNumber: ticket.ticketNumber }
        )
        .catch(() => {});

    return ticket;

};


// ==========================================================
// USER CLOSE TICKET
// ==========================================================

const closeTicketByUser = async (
    userId,
    ticketId
) => {

    const ticket =
        await SupportTicket.findOne({ _id: ticketId, user: userId });

    if (!ticket) {

        throw new Error("Ticket not found.");

    }

    if (ticket.status === "closed") {

        return ticket;

    }

    ticket.status = "closed";
    ticket.closedAt = new Date();

    await ticket.save();

    return ticket;

};


// ==========================================================
// USER REOPEN TICKET
// ==========================================================

const reopenTicketByUser = async (
    userId,
    ticketId
) => {

    const ticket =
        await SupportTicket.findOne({ _id: ticketId, user: userId });

    if (!ticket) {

        throw new Error("Ticket not found.");

    }

    if (ticket.status !== "closed") {

        return ticket;

    }

    ticket.status = "pending";
    ticket.closedAt = null;
    ticket.adminUnreadCount += 1;

    await ticket.save();

    notificationService
        .notifyAdmins(
            "support",
            "Ticket reopened",
            `Ticket ${ticket.ticketNumber} was reopened by the user.`,
            { ticketId: String(ticket._id), ticketNumber: ticket.ticketNumber }
        )
        .catch(() => {});

    return ticket;

};


// ==========================================================
// ADMIN: LIST TICKETS (paginated, filterable)
// ==========================================================

const listAdminTickets = async ({
    page = 1,
    limit = 20,
    status = "all",
    priority = "all",
    category = "all",
    assignedAdmin = "all",
    search = "",
} = {}) => {

    const safeLimit =
        Math.min(Math.max(Number(limit) || 20, 1), 100);

    const safePage =
        Math.max(Number(page) || 1, 1);

    const filter = {};

    if (status && status !== "all") filter.status = status;
    if (priority && priority !== "all") filter.priority = priority;
    if (category && category !== "all") filter.category = category;

    if (assignedAdmin === "unassigned") {

        filter.assignedAdmin = null;

    } else if (assignedAdmin && assignedAdmin !== "all" && mongoose.isValidObjectId(assignedAdmin)) {

        filter.assignedAdmin = assignedAdmin;

    }

    if (search && search.trim()) {

        const escaped =
            search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        filter.$or = [
            { subject: { $regex: escaped, $options: "i" } },
            { ticketNumber: { $regex: escaped, $options: "i" } },
        ];

    }

    const [tickets, total] = await Promise.all([

        SupportTicket.find(filter)
            .select("-messages")
            .sort({ lastMessageAt: -1 })
            .skip((safePage - 1) * safeLimit)
            .limit(safeLimit)
            .populate("user", "fullName username email")
            .populate("assignedAdmin", "name username"),

        SupportTicket.countDocuments(filter),

    ]);

    const totalPages =
        Math.max(Math.ceil(total / safeLimit), 1);

    return {
        tickets,
        total,
        page: safePage,
        totalPages,
        hasNextPage: safePage < totalPages,
        hasPreviousPage: safePage > 1,
    };

};


// ==========================================================
// ADMIN: GET TICKET BY ID
// ==========================================================

const getAdminTicketById = async (
    ticketId
) => {

    if (!mongoose.isValidObjectId(ticketId)) {

        throw new Error("Ticket not found.");

    }

    const ticket =
        await SupportTicket.findById(ticketId)
            .populate("user", "fullName username email")
            .populate("assignedAdmin", "name username");

    if (!ticket) {

        throw new Error("Ticket not found.");

    }

    if (ticket.adminUnreadCount > 0) {

        ticket.adminUnreadCount = 0;

        await ticket.save();

    }

    return ticket;

};


// ==========================================================
// ADMIN REPLY
// ==========================================================

const adminReplyToTicket = async (
    adminId,
    ticketId,
    message
) => {

    const cleanMessage =
        String(message || "").trim();

    if (!cleanMessage) {

        throw new Error("Message is required.");

    }

    if (cleanMessage.length > 2000) {

        throw new Error("Message is too long (max 2000 characters).");

    }

    if (!mongoose.isValidObjectId(ticketId)) {

        throw new Error("Ticket not found.");

    }

    const ticket =
        await SupportTicket.findById(ticketId);

    if (!ticket) {

        throw new Error("Ticket not found.");

    }

    if (ticket.status === "closed") {

        throw new Error("This ticket is closed. Reopen it before replying.");

    }

    ticket.messages.push({
        senderType: "admin",
        senderId: adminId,
        message: cleanMessage,
    });

    ticket.lastMessageAt = new Date();
    ticket.lastMessageBySenderType = "admin";
    ticket.adminUnreadCount = 0;
    ticket.userUnreadCount += 1;
    ticket.status = "replied";

    await ticket.save();

    notificationService
        .notify(
            ticket.user,
            "support",
            "Support replied to your ticket",
            `A support agent replied to your ticket "${ticket.subject}" (${ticket.ticketNumber}).`,
            { ticketId: String(ticket._id) }
        )
        .catch(() => {});

    return ticket;

};


// ==========================================================
// ADMIN: CHANGE STATUS
// ==========================================================

const changeTicketStatus = async (
    adminId,
    ticketId,
    status
) => {

    if (!SupportTicket.STATUSES.includes(status)) {

        throw new Error("Invalid status.");

    }

    const ticket =
        await SupportTicket.findById(ticketId);

    if (!ticket) {

        throw new Error("Ticket not found.");

    }

    const oldStatus =
        ticket.status;

    if (oldStatus === status) {

        return { ticket, changed: false };

    }

    ticket.status = status;

    if (status === "resolved") {

        ticket.resolvedAt = new Date();

    }

    if (status === "closed") {

        ticket.closedAt = new Date();

    }

    if (oldStatus === "closed" && status !== "closed") {

        ticket.closedAt = null;

    }

    await ticket.save();

    await createAuditLog({
        actorType: "admin",
        actorId: adminId,
        action: "support.status_changed",
        module: "support",
        key: String(ticket._id),
        oldValue: oldStatus,
        newValue: status,
        metadata: { ticketNumber: ticket.ticketNumber },
    }).catch(() => {});

    if (status === "resolved" || status === "closed") {

        notificationService
            .notify(
                ticket.user,
                "support",
                status === "resolved" ? "Ticket resolved" : "Ticket closed",
                `Your ticket "${ticket.subject}" (${ticket.ticketNumber}) has been ${status}.`,
                { ticketId: String(ticket._id) }
            )
            .catch(() => {});

    }

    if (oldStatus === "closed" && status !== "closed") {

        notificationService
            .notify(
                ticket.user,
                "support",
                "Ticket reopened",
                `Your ticket "${ticket.subject}" (${ticket.ticketNumber}) has been reopened.`,
                { ticketId: String(ticket._id) }
            )
            .catch(() => {});

    }

    return { ticket, changed: true };

};


// ==========================================================
// ADMIN: CHANGE PRIORITY
// ==========================================================

const changeTicketPriority = async (
    adminId,
    ticketId,
    priority
) => {

    if (!SupportTicket.PRIORITIES.includes(priority)) {

        throw new Error("Invalid priority.");

    }

    const ticket =
        await SupportTicket.findById(ticketId);

    if (!ticket) {

        throw new Error("Ticket not found.");

    }

    const oldPriority =
        ticket.priority;

    if (oldPriority === priority) {

        return { ticket, changed: false };

    }

    ticket.priority = priority;

    await ticket.save();

    await createAuditLog({
        actorType: "admin",
        actorId: adminId,
        action: "support.priority_changed",
        module: "support",
        key: String(ticket._id),
        oldValue: oldPriority,
        newValue: priority,
        metadata: { ticketNumber: ticket.ticketNumber },
    }).catch(() => {});

    return { ticket, changed: true };

};


// ==========================================================
// ADMIN: ASSIGN TICKET
// ==========================================================

const assignTicket = async (
    adminId,
    ticketId,
    assignToAdminId
) => {

    const ticket =
        await SupportTicket.findById(ticketId);

    if (!ticket) {

        throw new Error("Ticket not found.");

    }

    let targetAdmin = null;

    if (assignToAdminId) {

        if (!mongoose.isValidObjectId(assignToAdminId)) {

            throw new Error("Invalid admin id.");

        }

        targetAdmin =
            await Admin.findById(assignToAdminId).select("_id name username isActive");

        if (!targetAdmin || !targetAdmin.isActive) {

            throw new Error("Target admin not found or inactive.");

        }

    }

    const previousAssignee =
        ticket.assignedAdmin ? String(ticket.assignedAdmin) : null;

    const newAssignee =
        targetAdmin ? String(targetAdmin._id) : null;

    if (previousAssignee === newAssignee) {

        return { ticket, changed: false };

    }

    ticket.assignedAdmin = targetAdmin ? targetAdmin._id : null;

    await ticket.save();

    await createAuditLog({
        actorType: "admin",
        actorId: adminId,
        action: "support.ticket_assigned",
        module: "support",
        key: String(ticket._id),
        oldValue: previousAssignee,
        newValue: newAssignee,
        metadata: { ticketNumber: ticket.ticketNumber },
    }).catch(() => {});

    if (targetAdmin) {

        notificationService
            .notifyAdmins(
                "support",
                "Ticket assigned",
                `Ticket ${ticket.ticketNumber} was assigned to ${targetAdmin.name || targetAdmin.username}.`,
                { ticketId: String(ticket._id), assignedAdmin: String(targetAdmin._id) }
            )
            .catch(() => {});

    }

    return { ticket, changed: true };

};


// ==========================================================
// ADMIN: DASHBOARD STATS (real counts only, never fabricated)
// ==========================================================

const getTicketStats = async () => {

    const [open, pending, urgent, unassigned, resolved, closed] =
        await Promise.all([

            SupportTicket.countDocuments({ status: "open" }),
            SupportTicket.countDocuments({ status: "pending" }),
            SupportTicket.countDocuments({
                priority: "urgent",
                status: { $nin: ["resolved", "closed"] },
            }),
            SupportTicket.countDocuments({
                assignedAdmin: null,
                status: { $nin: ["resolved", "closed"] },
            }),
            SupportTicket.countDocuments({ status: "resolved" }),
            SupportTicket.countDocuments({ status: "closed" }),

        ]);

    return { open, pending, urgent, unassigned, resolved, closed };

};


module.exports = {
    createTicket,
    listMyTickets,
    getMyTicketById,
    userReplyToTicket,
    closeTicketByUser,
    reopenTicketByUser,
    listAdminTickets,
    getAdminTicketById,
    adminReplyToTicket,
    changeTicketStatus,
    changeTicketPriority,
    assignTicket,
    getTicketStats,
};
