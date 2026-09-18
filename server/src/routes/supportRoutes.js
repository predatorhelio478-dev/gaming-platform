const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");

const {
    supportCreateLimiter,
    supportReplyLimiter,
} = require("../middleware/rateLimiters");

const {
    createTicketValidators,
    ticketReplyValidators,
} = require("../validators/requestValidators");

const {
    createTicket,
    getMyTickets,
    getMyTicketById,
    replyToMyTicket,
    closeMyTicket,
    reopenMyTicket,
} = require("../controllers/supportController");

router.use(auth);

router.post("/tickets", supportCreateLimiter, createTicketValidators, createTicket);
router.get("/tickets", getMyTickets);
router.get("/tickets/:id", getMyTicketById);
router.post("/tickets/:id/reply", supportReplyLimiter, ticketReplyValidators, replyToMyTicket);
router.post("/tickets/:id/close", closeMyTicket);
router.post("/tickets/:id/reopen", supportReplyLimiter, reopenMyTicket);

module.exports = router;
