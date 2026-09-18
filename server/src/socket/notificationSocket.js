const jwt =
    require("jsonwebtoken");

const User =
    require("../models/User");

const Admin =
    require("../models/Admin");

const notificationService =
    require("../services/notificationService");


// ==========================================================
// VERIFY USER SOCKET TOKEN
// ==========================================================
//
// Mirrors verifyAdminSocket in gameSocket.js - the room a
// socket joins is never trusted from a client-supplied user
// id, only from a verified JWT, so one user can never read
// another user's notifications.
// ==========================================================

const verifyUserSocket = async (socket) => {

    const token =
        socket.handshake?.auth?.token;

    if (!token) {

        return null;

    }

    try {

        const decoded =
            jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded?.id) {

            return null;

        }

        const user =
            await User.findById(decoded.id);

        if (!user || user.status === "blocked" || user.isDeleted) {

            return null;

        }

        return user;

    } catch (error) {

        return null;

    }

};


// ==========================================================
// VERIFY ADMIN SOCKET TOKEN
// ==========================================================

const verifyAdminSocket = async (socket) => {

    const token =
        socket.handshake?.auth?.adminToken;

    if (!token) {

        return null;

    }

    try {

        const decoded =
            jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.type !== "admin") {

            return null;

        }

        const admin =
            await Admin.findById(decoded.adminId);

        if (!admin || !admin.isActive) {

            return null;

        }

        return admin;

    } catch (error) {

        return null;

    }

};


// ==========================================================
// REGISTER NOTIFICATION SOCKET EVENTS
// ==========================================================

const registerNotificationSocket = (io, socket) => {

    // ======================================================
    // USER: JOIN OWN NOTIFICATION ROOM
    // ======================================================

    socket.on("join_user_notifications", async () => {

        const user =
            await verifyUserSocket(socket);

        if (!user) {

            socket.emit("notification_error", {
                message: "Authorization required.",
            });

            return;

        }

        socket.join(`user_${user._id}`);

        try {

            const unreadCount =
                await notificationService.getUnreadCount({
                    userId: user._id,
                });

            socket.emit("notification_unread_count", { unreadCount });

        } catch (error) {

            console.error(
                "Notification unread count error:",
                error.message
            );

        }

    });


    // ======================================================
    // ADMIN: JOIN SHARED ADMIN NOTIFICATION ROOM
    // ======================================================

    socket.on("join_admin_notifications", async () => {

        const admin =
            await verifyAdminSocket(socket);

        if (!admin) {

            socket.emit("notification_error", {
                message: "Admin authorization required.",
            });

            return;

        }

        socket.join("admin_notifications");

        try {

            const unreadCount =
                await notificationService.getUnreadCount({
                    isAdmin: true,
                });

            socket.emit("admin_notification_unread_count", { unreadCount });

        } catch (error) {

            console.error(
                "Admin notification unread count error:",
                error.message
            );

        }

    });

};


module.exports = registerNotificationSocket;
