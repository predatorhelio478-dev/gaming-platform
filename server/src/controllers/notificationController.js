const notificationService =
    require("../services/notificationService");


// ==========================================================
// USER: LIST MY NOTIFICATIONS
// ==========================================================

const getMyNotifications = async (req, res) => {

    try {

        const userId =
            req.user?.id || req.user?._id;

        const { page, limit } = req.query;

        const result =
            await notificationService.listMyNotifications(
                userId,
                { page, limit }
            );

        return res.status(200).json({
            success: true,
            ...result,
        });

    } catch (error) {

        console.error(
            "Get My Notifications Error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to fetch notifications.",
        });

    }

};


// ==========================================================
// USER: UNREAD COUNT
// ==========================================================

const getMyUnreadCount = async (req, res) => {

    try {

        const userId =
            req.user?.id || req.user?._id;

        const unreadCount =
            await notificationService.getUnreadCount({ userId });

        return res.status(200).json({
            success: true,
            unreadCount,
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Unable to fetch unread count.",
        });

    }

};


// ==========================================================
// USER: MARK ONE READ
// ==========================================================

const markMyNotificationRead = async (req, res) => {

    try {

        const userId =
            req.user?.id || req.user?._id;

        const { id } = req.params;

        const notification =
            await notificationService.markRead(id, { userId });

        return res.status(200).json({
            success: true,
            data: notification,
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message || "Unable to mark notification as read.",
        });

    }

};


// ==========================================================
// USER: MARK ALL READ
// ==========================================================

const markAllMyNotificationsRead = async (req, res) => {

    try {

        const userId =
            req.user?.id || req.user?._id;

        const result =
            await notificationService.markAllRead({ userId });

        return res.status(200).json({
            success: true,
            message: `${result.modifiedCount} notification(s) marked as read.`,
            ...result,
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Unable to mark notifications as read.",
        });

    }

};


// ==========================================================
// ADMIN: LIST NOTIFICATIONS
// ==========================================================

const getAdminNotifications = async (req, res) => {

    try {

        const { page, limit } = req.query;

        const result =
            await notificationService.listAdminNotifications(
                { page, limit }
            );

        return res.status(200).json({
            success: true,
            ...result,
        });

    } catch (error) {

        console.error(
            "Get Admin Notifications Error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to fetch notifications.",
        });

    }

};


// ==========================================================
// ADMIN: UNREAD COUNT
// ==========================================================

const getAdminUnreadCount = async (req, res) => {

    try {

        const unreadCount =
            await notificationService.getUnreadCount({ isAdmin: true });

        return res.status(200).json({
            success: true,
            unreadCount,
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Unable to fetch unread count.",
        });

    }

};


// ==========================================================
// ADMIN: MARK ONE READ
// ==========================================================

const markAdminNotificationRead = async (req, res) => {

    try {

        const { id } = req.params;

        const notification =
            await notificationService.markRead(id, { isAdmin: true });

        return res.status(200).json({
            success: true,
            data: notification,
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message || "Unable to mark notification as read.",
        });

    }

};


// ==========================================================
// ADMIN: MARK ALL READ
// ==========================================================

const markAllAdminNotificationsRead = async (req, res) => {

    try {

        const result =
            await notificationService.markAllRead({ isAdmin: true });

        return res.status(200).json({
            success: true,
            message: `${result.modifiedCount} notification(s) marked as read.`,
            ...result,
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Unable to mark notifications as read.",
        });

    }

};


module.exports = {
    getMyNotifications,
    getMyUnreadCount,
    markMyNotificationRead,
    markAllMyNotificationsRead,
    getAdminNotifications,
    getAdminUnreadCount,
    markAdminNotificationRead,
    markAllAdminNotificationsRead,
};
