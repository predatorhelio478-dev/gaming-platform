const Notification =
    require("../models/Notification");

const User =
    require("../models/User");

const settingsService =
    require("./settingsService");


// ==========================================================
// TYPE -> SETTING GATE
// ==========================================================
//
// Only deposit/withdrawal in-app notifications are gated by
// an existing on/off setting (matching what was already
// exposed in Admin Settings but previously unused). Every
// other type (bet outcomes, bonuses, referrals, verification,
// security, admin alerts) always fires - there's no setting
// promising to gate those specifically, so silently dropping
// them would be a bigger surprise than always sending them.
// ==========================================================

const SETTING_GATED_TYPES = {
    deposit: "deposit_notification",
    withdrawal: "withdrawal_notification",
};


// ==========================================================
// EMIT OVER SOCKET (best-effort - notifications still persist
// in the DB even if no socket server is up, e.g. in tests)
// ==========================================================

const emit = (room, event, payload) => {

    try {

        const { getIO } = require("../socket/socket");

        getIO().to(room).emit(event, payload);

    } catch (error) {

        // Socket.IO not initialized (e.g. script/test context) -
        // the notification is still persisted, just not pushed
        // live. Not an error worth surfacing to the caller.

    }

};


// ==========================================================
// SEND EMAIL/SMS SIDE-CHANNEL (best-effort, respects both the
// global admin setting AND the user's own opt-out)
// ==========================================================

const sendSideChannel = async (user, title, message) => {

    try {

        const [emailEnabled, smsEnabled] = await Promise.all([
            settingsService.getValue("notification", "email_enabled", true),
            settingsService.getValue("notification", "sms_enabled", false),
        ]);

        if (
            emailEnabled &&
            user?.notificationPreferences?.email !== false &&
            user?.email
        ) {

            const emailService = require("./emailService");

            await emailService.sendEmail({
                to: user.email,
                subject: title,
                text: message,
            });

        }

        if (
            smsEnabled &&
            user?.notificationPreferences?.sms !== false &&
            user?.mobile
        ) {

            const smsService = require("./smsService");

            await smsService.sendSms({
                to: user.mobile,
                message: `${title}: ${message}`,
            });

        }

    } catch (error) {

        console.error(
            "[notificationService] Side-channel delivery failed:",
            error.message
        );

    }

};


// ==========================================================
// NOTIFY A USER
// ==========================================================
//
// Fire-and-forget by convention (matches the existing
// referral-qualification pattern) - never let a notification
// failure break the caller's primary flow.
// ==========================================================

const notify = async (
    userId,
    type,
    title,
    message,
    data = {}
) => {

    try {

        const settingKey =
            SETTING_GATED_TYPES[type];

        if (settingKey) {

            const enabled =
                await settingsService.getValue(
                    "notification",
                    settingKey,
                    true
                );

            if (!enabled) {

                return null;

            }

        }

        const notification =
            await Notification.create({
                audience: "user",
                user: userId,
                type,
                title,
                message,
                data,
            });

        emit(`user_${userId}`, "notification", notification);

        const user =
            await User.findById(userId).select(
                "email mobile notificationPreferences"
            );

        if (user) {

            sendSideChannel(user, title, message).catch(() => {});

        }

        return notification;

    } catch (error) {

        console.error(
            "[notificationService] notify() failed:",
            error.message
        );

        return null;

    }

};


// ==========================================================
// NOTIFY ADMINS (single shared row, all admins see it)
// ==========================================================

const notifyAdmins = async (
    type,
    title,
    message,
    data = {}
) => {

    try {

        const notification =
            await Notification.create({
                audience: "admin",
                user: null,
                type,
                title,
                message,
                data,
            });

        emit("admin_notifications", "admin_notification", notification);

        return notification;

    } catch (error) {

        console.error(
            "[notificationService] notifyAdmins() failed:",
            error.message
        );

        return null;

    }

};


// ==========================================================
// LIST MY NOTIFICATIONS (paginated)
// ==========================================================

const listMyNotifications = async (
    userId,
    { page = 1, limit = 20 } = {}
) => {

    const safeLimit =
        Math.min(Math.max(Number(limit) || 20, 1), 100);

    const safePage =
        Math.max(Number(page) || 1, 1);

    const filter = {
        audience: "user",
        user: userId,
    };

    const [notifications, total, unreadCount] = await Promise.all([

        Notification.find(filter)
            .sort({ createdAt: -1 })
            .skip((safePage - 1) * safeLimit)
            .limit(safeLimit),

        Notification.countDocuments(filter),

        Notification.countDocuments({ ...filter, isRead: false }),

    ]);

    return {
        notifications,
        total,
        page: safePage,
        totalPages: Math.max(Math.ceil(total / safeLimit), 1),
        unreadCount,
    };

};


// ==========================================================
// LIST ADMIN NOTIFICATIONS (paginated)
// ==========================================================

const listAdminNotifications = async (
    { page = 1, limit = 20 } = {}
) => {

    const safeLimit =
        Math.min(Math.max(Number(limit) || 20, 1), 100);

    const safePage =
        Math.max(Number(page) || 1, 1);

    const filter = { audience: "admin" };

    const [notifications, total, unreadCount] = await Promise.all([

        Notification.find(filter)
            .sort({ createdAt: -1 })
            .skip((safePage - 1) * safeLimit)
            .limit(safeLimit),

        Notification.countDocuments(filter),

        Notification.countDocuments({ ...filter, isRead: false }),

    ]);

    return {
        notifications,
        total,
        page: safePage,
        totalPages: Math.max(Math.ceil(total / safeLimit), 1),
        unreadCount,
    };

};


// ==========================================================
// MARK ONE READ (scoped to the caller - a user can only mark
// their own; an admin can mark any admin-audience row)
// ==========================================================

const markRead = async (
    notificationId,
    { userId = null, isAdmin = false } = {}
) => {

    const filter = { _id: notificationId };

    if (isAdmin) {

        filter.audience = "admin";

    } else {

        filter.audience = "user";
        filter.user = userId;

    }

    const notification =
        await Notification.findOneAndUpdate(
            filter,
            { $set: { isRead: true, readAt: new Date() } },
            { new: true }
        );

    if (!notification) {

        throw new Error("Notification not found.");

    }

    return notification;

};


// ==========================================================
// MARK ALL READ
// ==========================================================

const markAllRead = async (
    { userId = null, isAdmin = false } = {}
) => {

    const filter =
        isAdmin
            ? { audience: "admin", isRead: false }
            : { audience: "user", user: userId, isRead: false };

    const result =
        await Notification.updateMany(
            filter,
            { $set: { isRead: true, readAt: new Date() } }
        );

    return {
        modifiedCount: result.modifiedCount || 0,
    };

};


// ==========================================================
// UNREAD COUNT
// ==========================================================

const getUnreadCount = async (
    { userId = null, isAdmin = false } = {}
) => {

    const filter =
        isAdmin
            ? { audience: "admin", isRead: false }
            : { audience: "user", user: userId, isRead: false };

    return await Notification.countDocuments(filter);

};


module.exports = {
    notify,
    notifyAdmins,
    listMyNotifications,
    listAdminNotifications,
    markRead,
    markAllRead,
    getUnreadCount,
};
