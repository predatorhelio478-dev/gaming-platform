const supportService =
    require("../services/supportService");


// ==========================================================
// STRIP ADMIN-INTERNAL FIELDS BEFORE RETURNING TO THE USER
// ==========================================================
//
// listMyTickets/getMyTicketById already exclude these at the
// query level (.select("-internalNote -internalNoteHistory")),
// but createTicket/replyToMyTicket return whatever
// SupportTicket.create()/ticket.save() hands back, which is the
// full document - this is the equivalent safety net for those
// two response paths, so a user can never see internal notes or
// note-edit history no matter which endpoint they call.

const sanitizeTicketForUser = (ticket) => {

    if (!ticket) {
        return ticket;
    }

    const plain =
        typeof ticket.toObject === "function"
            ? ticket.toObject()
            : { ...ticket };

    delete plain.internalNote;
    delete plain.internalNoteHistory;

    return plain;

};


// ==========================================================
// CREATE TICKET
// ==========================================================

const createTicket = async (req, res) => {

    try {

        const userId =
            req.user?.id || req.user?._id;

        // Priority is never accepted from the client - it's
        // always derived server-side from category (see
        // supportService.createTicket's getAutoPriorityForCategory).
        const { subject, category, message, references } = req.body;

        const ticket =
            await supportService.createTicket(userId, {
                subject,
                category,
                message,
                references,
            });

        return res.status(201).json({
            success: true,
            message: "Support ticket created.",
            data: sanitizeTicketForUser(ticket),
        });

    } catch (error) {

        console.error(
            "Create Support Ticket Error:",
            error.message
        );

        return res.status(400).json({
            success: false,
            message: error.message || "Unable to create ticket.",
        });

    }

};


// ==========================================================
// LIST MY TICKETS
// ==========================================================

const getMyTickets = async (req, res) => {

    try {

        const userId =
            req.user?.id || req.user?._id;

        const { page, limit, status } = req.query;

        const result =
            await supportService.listMyTickets(userId, { page, limit, status });

        return res.status(200).json({
            success: true,
            ...result,
        });

    } catch (error) {

        console.error(
            "Get My Tickets Error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to fetch tickets.",
        });

    }

};


// ==========================================================
// GET MY TICKET BY ID
// ==========================================================

const getMyTicketById = async (req, res) => {

    try {

        const userId =
            req.user?.id || req.user?._id;

        const { id } = req.params;

        const ticket =
            await supportService.getMyTicketById(userId, id);

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
// REPLY TO MY TICKET
// ==========================================================

const replyToMyTicket = async (req, res) => {

    try {

        const userId =
            req.user?.id || req.user?._id;

        const { id } = req.params;
        const { message } = req.body;

        const ticket =
            await supportService.userReplyToTicket(userId, id, message);

        return res.status(200).json({
            success: true,
            message: "Reply sent.",
            data: sanitizeTicketForUser(ticket),
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message || "Unable to send reply.",
        });

    }

};


// Closing AND reopening a ticket are both Admin/Super
// Admin-only - see adminSupportController.js's changeStatus.
// There is deliberately no user-facing reopen endpoint at all.


module.exports = {
    createTicket,
    getMyTickets,
    getMyTicketById,
    replyToMyTicket,
};
