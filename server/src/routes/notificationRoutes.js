const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");

const {
    getMyNotifications,
    getMyUnreadCount,
    markMyNotificationRead,
    markAllMyNotificationsRead,
} = require("../controllers/notificationController");

router.use(auth);

router.get("/", getMyNotifications);
router.get("/unread-count", getMyUnreadCount);
router.post("/:id/read", markMyNotificationRead);
router.post("/read-all", markAllMyNotificationsRead);

module.exports = router;
