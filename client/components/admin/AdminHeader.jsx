"use client";

import { useEffect, useState } from "react";
import { Menu } from "lucide-react";

import { getCurrentAdmin } from "../../lib/adminApi";
import AdminNotificationBell from "./AdminNotificationBell";

export default function AdminHeader({
    title = "Dashboard",
    subtitle = "Control Center",

    // Socket status
    connected = false,

    // Show / hide socket status
    showSocketStatus = false,

    // Optional menu callback
    onMenuClick,
}) {
    const [admin, setAdmin] =
        useState(null);

    /*
    |--------------------------------------------------------------------------
    | LOAD ADMIN
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        let mounted = true;

        const loadAdmin = async () => {
            try {
                const response =
                    await getCurrentAdmin();

                if (
                    mounted &&
                    response?.success
                ) {
                    setAdmin(
                        response.admin
                    );
                }
            } catch (error) {
                console.error(
                    "Header Admin Error:",
                    error
                );
            }
        };

        loadAdmin();

        return () => {
            mounted = false;
        };
    }, []);

    /*
    |--------------------------------------------------------------------------
    | MENU
    |--------------------------------------------------------------------------
    */

    const handleMenuClick = () => {
        if (
            typeof onMenuClick ===
            "function"
        ) {
            onMenuClick();

            return;
        }

        window.dispatchEvent(
            new Event(
                "admin:open-menu"
            )
        );
    };

    return (
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-white/[0.06] bg-[#070914]/95 pl-16 pr-4 backdrop-blur-md sm:px-6 lg:px-8">

            {/* =========================================================
                LEFT
            ========================================================= */}

            <div className="flex min-w-0 items-center">

                {/* MOBILE MENU */}

                <button
                    type="button"
                    aria-label="Open admin menu"
                    onClick={
                        handleMenuClick
                    }
                    className="fixed left-4 top-4 z-[45] cursor-pointer rounded-lg border border-white/[0.08] bg-[#0a0d18] p-2 text-slate-300 shadow-lg transition hover:bg-white/[0.06] hover:text-white lg:hidden"
                >
                    <Menu
                        size={20}
                        strokeWidth={2}
                    />
                </button>

                {/* PAGE TITLE */}

                <div className="min-w-0">

                    <p className="truncate text-xs uppercase tracking-[0.18em] text-slate-500">
                        {subtitle}
                    </p>

                    <h1 className="truncate text-xl font-bold text-white">
                        {title}
                    </h1>

                </div>

            </div>

            {/* =========================================================
                RIGHT
            ========================================================= */}

            <div className="flex shrink-0 items-center gap-3">

                {/* =====================================================
                    SOCKET STATUS

                    Only pages using live socket should show this.
                ===================================================== */}

                {showSocketStatus && (
                    <div
                        className={`hidden items-center rounded-full border px-3 py-2 text-xs sm:flex ${connected
                                ? "border-green-500/20 bg-green-500/5"
                                : "border-red-500/20 bg-red-500/5"
                            }`}
                    >

                        <span
                            className={
                                connected
                                    ? "text-green-400"
                                    : "text-red-400"
                            }
                        >
                            ●
                        </span>

                        <span className="ml-2 text-slate-400">
                            {connected
                                ? "Game Server Live"
                                : "Disconnected"}
                        </span>

                    </div>
                )}

                {/* =====================================================
                    NOTIFICATIONS
                ===================================================== */}

                <AdminNotificationBell />

                {/* =====================================================
                    ADMIN
                ===================================================== */}

                <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-2">

                    <p className="text-[11px] uppercase text-slate-400">
                        Admin
                    </p>

                    <p className="max-w-[120px] truncate text-sm font-semibold text-white">
                        {admin?.username ||
                            admin?.name ||
                            "admin"}
                    </p>

                </div>

            </div>

        </header>
    );
}