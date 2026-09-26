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
} = require("../controllers/supportController");

router.use(auth);

// Users can create/reply to their own tickets, but cannot close
// OR reopen one - both are Admin/Super Admin-only (see
// adminSupportRoutes.js's POST /tickets/:id/status, which
// handles both directions).
router.post("/tickets", supportCreateLimiter, createTicketValidators, createTicket);
router.get("/tickets", getMyTickets);
router.get("/tickets/:id", getMyTicketById);
router.post("/tickets/:id/reply", supportReplyLimiter, ticketReplyValidators, replyToMyTicket);

module.exports = router;
