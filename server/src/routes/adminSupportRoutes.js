const express = require("express");

const router = express.Router();

const adminAuth = require("../middleware/adminAuth");

const { supportReplyLimiter } = require("../middleware/rateLimiters");

const {
    ticketReplyValidators,
    ticketStatusValidators,
    ticketPriorityValidators,
    ticketAssignValidators,
} = require("../validators/requestValidators");

const {
    getTickets,
    getTicketById,
    replyToTicket,
    changeStatus,
    changePriority,
    assignTicket,
    getStats,
} = require("../controllers/adminSupportController");

router.use(adminAuth);

router.get("/stats", getStats);
router.get("/tickets", getTickets);
router.get("/tickets/:id", getTicketById);
router.post("/tickets/:id/reply", supportReplyLimiter, ticketReplyValidators, replyToTicket);
router.post("/tickets/:id/status", ticketStatusValidators, changeStatus);
router.post("/tickets/:id/priority", ticketPriorityValidators, changePriority);
router.post("/tickets/:id/assign", ticketAssignValidators, assignTicket);

module.exports = router;
