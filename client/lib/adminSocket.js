import { io } from "socket.io-client";

const SOCKET_URL =
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    "http://localhost:5000";

let adminSocket = null;

export const getAdminSocket = () => {
    if (!adminSocket) {
        const adminToken =
            typeof window !== "undefined"
                ? localStorage.getItem("adminToken") ||
                  localStorage.getItem("token")
                : null;

        adminSocket = io(SOCKET_URL, {
            transports: ["websocket", "polling"],
            auth: { adminToken },
        });
    }

    return adminSocket;
};

export const subscribeToAdminGame = (handlers = {}) => {
    const socket = getAdminSocket();

    const events = {
        connect: handlers.onConnect,
        disconnect: handlers.onDisconnect,
        admin_game_state: handlers.onGameState,
        game_status: handlers.onGameStatus,
        new_round: handlers.onNewRound,
        timer: handlers.onTimer,
        betting_closed: handlers.onBettingClosed,
        admin_round_stats: handlers.onRoundStats,
        round_result: handlers.onRoundResult,
    };

    Object.entries(events).forEach(([event, handler]) => {
        if (typeof handler === "function") {
            socket.on(event, handler);
        }
    });

    if (socket.connected) {
        handlers.onConnect?.();
    }

    return () => {
        Object.entries(events).forEach(([event, handler]) => {
            if (typeof handler === "function") {
                socket.off(event, handler);
            }
        });
    };
};

export const subscribeToAdminNotifications = (handlers = {}) => {
    const socket = getAdminSocket();

    const events = {
        connect: handlers.onConnect,
        disconnect: handlers.onDisconnect,
        admin_notification: handlers.onNotification,
        admin_notification_unread_count: handlers.onUnreadCount,
        notification_error: handlers.onError,
    };

    Object.entries(events).forEach(([event, handler]) => {
        if (typeof handler === "function") {
            socket.on(event, handler);
        }
    });

    socket.emit("join_admin_notifications");

    if (socket.connected) {
        handlers.onConnect?.();
    }

    socket.on("connect", () => {
        socket.emit("join_admin_notifications");
    });

    return () => {
        Object.entries(events).forEach(([event, handler]) => {
            if (typeof handler === "function") {
                socket.off(event, handler);
            }
        });
    };
};

export const disconnectAdminSocket = () => {
    if (adminSocket) {
        adminSocket.disconnect();
        adminSocket = null;
    }
};