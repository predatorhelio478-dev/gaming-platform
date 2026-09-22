import { io } from "socket.io-client";

const SOCKET_URL =
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    "http://localhost:5000";

let userSocket = null;

// ======================================================
// SHARED USER SOCKET (notifications)
// ======================================================
//
// Mirrors lib/adminSocket.js's singleton pattern. Kept
// separate from the anonymous game socket in
// app/games/color-prediction (that one never needs auth -
// game state is public) since this one carries a private,
// per-user notification stream.

export const getUserSocket = () => {
    if (!userSocket) {
        const token =
            typeof window !== "undefined"
                ? localStorage.getItem("token")
                : null;

        userSocket = io(SOCKET_URL, {
            transports: ["websocket", "polling"],
            auth: { token },
        });
    }

    return userSocket;
};

export const subscribeToUserNotifications = (handlers = {}) => {
    const socket = getUserSocket();

    const events = {
        connect: handlers.onConnect,
        disconnect: handlers.onDisconnect,
        notification: handlers.onNotification,
        notification_unread_count: handlers.onUnreadCount,
        notification_error: handlers.onError,
    };

    Object.entries(events).forEach(([event, handler]) => {
        if (typeof handler === "function") {
            socket.on(event, handler);
        }
    });

    socket.emit("join_user_notifications");

    if (socket.connected) {
        handlers.onConnect?.();
    }

    // Re-join after a reconnect (a fresh connection loses room membership).
    socket.on("connect", () => {
        socket.emit("join_user_notifications");
    });

    return () => {
        Object.entries(events).forEach(([event, handler]) => {
            if (typeof handler === "function") {
                socket.off(event, handler);
            }
        });
    };
};

export const disconnectUserSocket = () => {
    if (userSocket) {
        userSocket.disconnect();
        userSocket = null;
    }
};
