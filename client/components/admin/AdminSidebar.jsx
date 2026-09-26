"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Gamepad2,
    RotateCcw,
    Receipt,
    WalletCards,
    Users,
    ShieldCheck,
    Wallet,
    Settings,
    FileText,
    LogOut,
    X,
    ArrowLeftRight,
    LifeBuoy,
    HelpCircle,
    Mail,
    UserRound,
} from "lucide-react";
import { getCurrentAdmin, adminLogout } from "../../lib/adminApi";
import useSiteSettings from "../../lib/useSiteSettings";

const menuItems = [
    { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Game Control", path: "/admin/game-control", icon: Gamepad2 },
    { label: "Rounds", path: "/admin/rounds", icon: RotateCcw },
    { label: "Bets", path: "/admin/bets", icon: Receipt },
    { label: "Payouts", path: "/admin/payouts", icon: WalletCards },
    { label: "Deposits & Withdrawals", path: "/admin/wallet-requests", icon: ArrowLeftRight },
    { label: "Support", path: "/admin/support", icon: LifeBuoy },
    { label: "FAQ", path: "/admin/faq", icon: HelpCircle },
    { label: "Email Templates", path: "/admin/email-templates", icon: Mail },
    { label: "Users", path: "/admin/users", icon: Users },
    { label: "Admins", path: "/admin/admins", icon: ShieldCheck },
    { label: "Wallet", path: "/admin/wallet", icon: Wallet },
    { label: "Settings", path: "/admin/settings", icon: Settings },
    { label: "Audit Logs", path: "/admin/audit-logs", icon: FileText },
    { label: "My Profile", path: "/admin/profile", icon: UserRound },
];

export default function AdminSidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const { siteName } = useSiteSettings();
    const [mobileMenu, setMobileMenu] = useState(false);
    const [admin, setAdmin] = useState(null);

    useEffect(() => {
        const loadAdmin = async () => {
            try {
                const response = await getCurrentAdmin();
                if (response?.success) setAdmin(response.admin);
            } catch (error) {
                console.error("Sidebar Admin Error:", error);
            }
        };

        loadAdmin();

        const openMenu = () => setMobileMenu(true);
        window.addEventListener("admin:open-menu", openMenu);

        return () => {
            window.removeEventListener("admin:open-menu", openMenu);
        };
    }, []);

    const handleNavigation = (path) => {
        setMobileMenu(false);
        router.push(path);
    };

    const handleLogout = () => {
        adminLogout();
        router.replace("/admin/login");
    };

    const isActive = (path) =>
        path === "/admin/dashboard"
            ? pathname === path
            : pathname.startsWith(path);

    return (
        <>
            {mobileMenu && (
                <button
                    type="button"
                    aria-label="Close menu"
                    onClick={() => setMobileMenu(false)}
                    className="fixed inset-0 z-40 cursor-pointer bg-black/60 lg:hidden"
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/[0.06] bg-[#0a0d18] transition-transform duration-200 lg:translate-x-0 ${mobileMenu ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="flex h-20 shrink-0 items-center justify-between border-b border-white/[0.06] px-5">
                    <div className="flex items-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600">
                            <span className="font-black"><Gamepad2
                                size={28}
                            /></span>
                        </div>

                        <div className="ml-3">
                            <p className="font-black tracking-wide">{siteName}</p>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-purple-400">
                                Admin Panel
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        aria-label="Close menu"
                        onClick={() => setMobileMenu(false)}
                        className="cursor-pointer rounded-lg p-2 text-slate-400 transition hover:bg-white/[0.06] hover:text-white lg:hidden"
                    >
                        <X size={20} strokeWidth={2} />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto p-4">
                    <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
                        Management
                    </p>

                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);

                        return (
                            <button
                                key={item.path}
                                type="button"
                                onClick={() => handleNavigation(item.path)}
                                className={`mb-1 flex w-full cursor-pointer items-center rounded-xl px-3 py-3 text-left text-sm font-medium transition  ${active
                                    ? `
                                                    bg-gradient-to-r
                                                    from-violet-600/40
                                                    to-fuchsia-500/20
                                                    text-white
                                                    shadow-[inset_0_0_25px_rgba(139,92,246,0.12)]
                                                `
                                    : `
                                                    text-slate-400
                                                    hover:bg-white/[0.04]
                                                    hover:text-white
                                                `
                                    }`}
                            >
                                <Icon
                                    size={18}
                                    strokeWidth={1.8}
                                    className="mr-3 shrink-0"
                                />
                                <span>{item.label}</span>

                                {/* ACTIVE DOT */}

                                {active &&
                                    (

                                        <span
                                            className="
                                                    ml-auto
                                                    h-1.5
                                                    w-1.5
                                                    shrink-0
                                                    rounded-full
                                                    bg-violet-400
                                                    shadow-[0_0_10px_#a78bfa]
                                                "
                                        />

                                    )}
                            </button>
                        );
                    })}
                </nav>

                <div className="shrink-0 border-t border-white/[0.06] p-4">
                    <div className="rounded-xl bg-white/[0.03] p-3">
                        <div className="flex items-center">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-600/20 text-sm font-bold text-purple-300">
                                {admin?.name?.charAt(0)?.toUpperCase() || "A"}
                            </div>

                            <div className="ml-3 min-w-0">
                                <p className="truncate text-sm font-semibold">
                                    {admin?.name || "Administrator"}
                                </p>
                                <p className="text-[10px] uppercase text-purple-400">
                                    {admin?.role || "admin"}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/[0.06] px-3 py-2 text-xs text-slate-500 transition hover:border-red-500/20 hover:bg-red-500/5 hover:text-red-400"
                        >
                            <LogOut size={15} />
                            Logout
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
