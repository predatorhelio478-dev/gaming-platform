const supportService =
    require("../services/supportService");

const { createAuditLog } =
    require("../services/auditLogService");


const getRequestContext = (req) => ({

    ipAddress:
        req.ip ||
        req.headers["x-forwarded-for"] ||
        req.socket?.remoteAddress ||
        null,

    userAgent:
        req.headers["user-agent"] || null,

});


// ==========================================================
// LIST TICKETS
// ==========================================================

const getTickets = async (req, res) => {

    try {

        const {
            page, limit, status, priority, category, assignedAdmin, search,
        } = req.query;

        const result =
            await supportService.listAdminTickets({
                page, limit, status, priority, category, assignedAdmin, search,
            });

        return res.status(200).json({
            success: true,
            ...result,
        });

    } catch (error) {

        console.error(
            "Admin List Tickets Error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to fetch tickets.",
        });

    }

};


// ==========================================================
// GET TICKET BY ID
// ==========================================================

const getTicketById = async (req, res) => {

    try {

        const { id } = req.params;

        const ticket =
            await supportService.getAdminTicketById(id);

        return res.status(200).json({
            success: true,
            data: ticket,
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message: error.message || "Ticket not found.",
        });

    }

};


// ==========================================================
// REPLY TO TICKET
// ==========================================================

const replyToTicket = async (req, res) => {

    try {

        const { id } = req.params;
        const { message } = req.body;

        const ticket =
            await supportService.adminReplyToTicket(
                req.admin?._id || null,
                id,
                message
            );

        await createAuditLog({
            actorType: "admin",
            actorId: req.admin?._id || null,
            action: "support.reply",
            module: "support",
            key: String(ticket._id),
            metadata: { ticketNumber: ticket.ticketNumber, userId: String(ticket.user) },
            ...getRequestContext(req),
        }).catch(() => {});

        return res.status(200).json({
            success: true,
            message: "Reply sent.",
            data: ticket,
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message || "Unable to send reply.",
        });

    }

};


// ==========================================================
// CHANGE STATUS
// ==========================================================

const changeStatus = async (req, res) => {

    try {

        const { id } = req.params;
        const { status } = req.body;

        const { ticket } =
            await supportService.changeTicketStatus(
                req.admin?._id || null,
                id,
                status
            );

        return res.status(200).json({
            success: true,
            message: `Ticket status updated to ${status}.`,
            data: ticket,
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message || "Unable to update status.",
        });

    }

};


// ==========================================================
// CHANGE PRIORITY
// ==========================================================

const changePriority = async (req, res) => {

    try {

        const { id } = req.params;
        const { priority } = req.body;

        const { ticket } =
            await supportService.changeTicketPriority(
                req.admin?._id || null,
                id,
                priority
            );

        return res.status(200).json({
            success: true,
            message: `Ticket priority updated to ${priority}.`,
            data: ticket,
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message || "Unable to update priority.",
        });

    }

};


// ==========================================================
// ASSIGN TICKET
// ==========================================================
//
// Omitting `adminId` self-assigns to the requesting admin;
// passing `adminId: null` explicitly unassigns.
// ==========================================================

const assignTicket = async (req, res) => {

    try {

        const { id } = req.params;

        const hasExplicitAdminId =
            Object.prototype.hasOwnProperty.call(req.body, "adminId");

        const targetAdminId =
            hasExplicitAdminId
                ? req.body.adminId
                : req.admin?._id;

        const { ticket } =
            await supportService.assignTicket(
                req.admin?._id || null,
                id,
                targetAdminId
            );

        return res.status(200).json({
            success: true,
            message: targetAdminId ? "Ticket assigned." : "Ticket unassigned.",
            data: ticket,
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message || "Unable to assign ticket.",
        });

    }

};


// ==========================================================
// DASHBOARD STATS
// ==========================================================

const getStats = async (req, res) => {

    try {

        const stats =
            await supportService.getTicketStats();

        return res.status(200).json({
            success: true,
            data: stats,
        });

    } catch (error) {

        console.error(
            "Admin Support Stats Error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to fetch support stats.",
        });

    }

};


module.exports = {
    getTickets,
    getTicketById,
    replyToTicket,
    changeStatus,
    changePriority,
    assignTicket,
    getStats,
};
