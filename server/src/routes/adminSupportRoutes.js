const express = require("express");

const router = express.Router();

const adminAuth = require("../middleware/adminAuth");

const requireAdminRole = require("../middleware/requireAdminRole");

const { supportReplyLimiter } = require("../middleware/rateLimiters");

const {
    ticketReplyValidators,
    ticketStatusValidators,
    ticketPriorityValidators,
    ticketAssignValidators,
    ticketNoteValidators,
} = require("../validators/requestValidators");

const {
    getTickets,
    getTicketById,
    replyToTicket,
    changeStatus,
    changePriority,
    assignTicket,
    updateNote,
    getStats,
} = require("../controllers/adminSupportController");

router.use(adminAuth);

// Reading tickets and replying stay open to any admin role
// (day-to-day support work). Closing/reopening (status),
// setting priority, reassigning, and editing the internal note
// are Admin/Super Admin only - support was previously the one
// admin feature with no role gate at all; this brings it in
// line with every other privileged mutation in the panel.
router.get("/stats", getStats);
router.get("/tickets", getTickets);
router.get("/tickets/:id", getTicketById);
router.post("/tickets/:id/reply", supportReplyLimiter, ticketReplyValidators, replyToTicket);

router.post(
    "/tickets/:id/status",
    requireAdminRole("super_admin", "admin"),
    ticketStatusValidators,
    changeStatus
);

router.post(
    "/tickets/:id/priority",
    requireAdminRole("super_admin", "admin"),
    ticketPriorityValidators,
    changePriority
);

router.post(
    "/tickets/:id/assign",
    requireAdminRole("super_admin", "admin"),
    ticketAssignValidators,
    assignTicket
);

router.post(
    "/tickets/:id/note",
    requireAdminRole("super_admin", "admin"),
    ticketNoteValidators,
    updateNote
);

module.exports = router;
