"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";

import {
    getAdminNotifications,
    getAdminNotificationUnreadCount,
    markAdminNotificationRead,
    markAllAdminNotificationsRead,
} from "../../lib/adminApi";
import { subscribeToAdminNotifications } from "../../lib/adminSocket";

// ======================================================
// ADMIN NOTIFICATION BELL
// ======================================================

const timeAgo = (value) => {
    const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
};

export default function AdminNotificationBell() {

    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef(null);

    const loadNotifications = async () => {
        try {
            setLoading(true);
            const response = await getAdminNotifications({ page: 1, limit: 20 });
            if (response?.notifications) {
                setNotifications(response.notifications);
                setUnreadCount(response.unreadCount || 0);
            }
        } catch (err) {
            // Silent.
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getAdminNotificationUnreadCount()
            .then((response) => setUnreadCount(response?.unreadCount || 0))
            .catch(() => {});

        const unsubscribe = subscribeToAdminNotifications({
            onNotification: (notification) => {
                setNotifications((prev) => [notification, ...prev].slice(0, 20));
                setUnreadCount((prev) => prev + 1);
            },
            onUnreadCount: ({ unreadCount: count }) => setUnreadCount(count),
        });

        return unsubscribe;
    }, []);

    useEffect(() => {
        if (!open) return;

        loadNotifications();

        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    const handleMarkRead = async (id) => {
        try {
            await markAdminNotificationRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (err) {
            // Ignore.
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllAdminNotificationsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            // Ignore.
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                aria-label="Notifications"
                onClick={() => setOpen((prev) => !prev)}
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
            >
                <Bell size={16} />

                {unreadCount > 0 && (
                    <span className="absolute right-1.5 top-1.5 flex h-2 w-2 items-center justify-center rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)]" />
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-11 z-50 w-80 max-w-[90vw] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0d18] shadow-2xl">
                    <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                        <p className="text-sm font-bold text-white">Admin Alerts</p>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={handleMarkAllRead}
                                className="flex items-center gap-1 text-[11px] font-semibold text-violet-400 hover:underline"
                            >
                                <CheckCheck size={12} /> Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <p className="px-4 py-6 text-center text-xs text-slate-500">Loading...</p>
                        ) : notifications.length === 0 ? (
                            <p className="px-4 py-6 text-center text-xs text-slate-500">No alerts yet.</p>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    className={`border-b border-white/[0.04] px-4 py-3 ${notification.isRead ? "opacity-60" : ""}`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-xs font-bold text-white">{notification.title}</p>
                                        {!notification.isRead && (
                                            <button
                                                type="button"
                                                onClick={() => handleMarkRead(notification._id)}
                                                aria-label="Mark as read"
                                                className="shrink-0 text-slate-500 hover:text-violet-400"
                                            >
                                                <Check size={13} />
                                            </button>
                                        )}
                                    </div>
                                    <p className="mt-0.5 text-[11px] leading-5 text-slate-400">{notification.message}</p>
                                    <p className="mt-1 text-[10px] text-slate-600">{timeAgo(notification.createdAt)}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
