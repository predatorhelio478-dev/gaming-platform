const supportService =
    require("../services/supportService");


// ==========================================================
// CREATE TICKET
// ==========================================================

const createTicket = async (req, res) => {

    try {

        const userId =
            req.user?.id || req.user?._id;

        const { subject, category, priority, message, references } = req.body;

        const ticket =
            await supportService.createTicket(userId, {
                subject,
                category,
                priority,
                message,
                references,
            });

        return res.status(201).json({
            success: true,
            message: "Support ticket created.",
            data: ticket,
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
// CLOSE MY TICKET
// ==========================================================

const closeMyTicket = async (req, res) => {

    try {

        const userId =
            req.user?.id || req.user?._id;

        const { id } = req.params;

        const ticket =
            await supportService.closeTicketByUser(userId, id);

        return res.status(200).json({
            success: true,
            message: "Ticket closed.",
            data: ticket,
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message || "Unable to close ticket.",
        });

    }

};


// ==========================================================
// REOPEN MY TICKET
// ==========================================================

const reopenMyTicket = async (req, res) => {

    try {

        const userId =
            req.user?.id || req.user?._id;

        const { id } = req.params;

        const ticket =
            await supportService.reopenTicketByUser(userId, id);

        return res.status(200).json({
            success: true,
            message: "Ticket reopened.",
            data: ticket,
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message || "Unable to reopen ticket.",
        });

    }

};


module.exports = {
    createTicket,
    getMyTickets,
    getMyTicketById,
    replyToMyTicket,
    closeMyTicket,
    reopenMyTicket,
};
