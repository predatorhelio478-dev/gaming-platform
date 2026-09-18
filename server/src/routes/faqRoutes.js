const express = require("express");

const router = express.Router();

const { getPublicFaq } = require("../controllers/faqController");

// Public, no auth - matches the pattern of /api/game/history
// and /api/settings/public (read-only, non-sensitive content).
router.get("/", getPublicFaq);

module.exports = router;
