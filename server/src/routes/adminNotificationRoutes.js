const express = require("express");

const router = express.Router();

const adminAuth = require("../middleware/adminAuth");

const {
    getAdminNotifications,
    getAdminUnreadCount,
    markAdminNotificationRead,
    markAllAdminNotificationsRead,
} = require("../controllers/notificationController");

router.use(adminAuth);

router.get("/", getAdminNotifications);
router.get("/unread-count", getAdminUnreadCount);
router.post("/:id/read", markAdminNotificationRead);
router.post("/read-all", markAllAdminNotificationsRead);

module.exports = router;
