"use client";

import {
    Settings,
    CreditCard,
    Gamepad2,
    Users,
    Bell,
    ShieldCheck,
    FileText,
    Server,
} from "lucide-react";

const categories = [
    {
        value: "general",
        label: "General",
        icon: Settings,
        description: "Basic platform settings",
    },
    {
        value: "payment",
        label: "Payment",
        icon: CreditCard,
        description: "Deposit & withdrawal",
    },
    {
        value: "game",
        label: "Game",
        icon: Gamepad2,
        description: "Game configuration",
    },
    {
        value: "user",
        label: "Users",
        icon: Users,
        description: "User preferences",
    },
    {
        value: "notification",
        label: "Notifications",
        icon: Bell,
        description: "Notification controls",
    },
    {
        value: "security",
        label: "Security",
        icon: ShieldCheck,
        description: "Security configuration",
    },
    {
        value: "legal",
        label: "Legal",
        icon: FileText,
        description: "Legal documents",
    },
    {
        value: "system",
        label: "System",
        icon: Server,
        description: "System controls",
    },
];

export default function SettingsSidebar({
    activeCategory,
    onCategoryChange,
}) {
    return (
        <aside className="w-full shrink-0 lg:w-[250px]">
            <div className="rounded-2xl border border-white/[0.06] bg-[#0d101d] p-2">
                <div className="px-3 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
                        Configuration
                    </p>

                    <h2 className="mt-1 text-sm font-bold text-white">
                        Settings
                    </h2>
                </div>

                <div className="space-y-1">
                    {categories.map((category) => {
                        const Icon = category.icon;
                        const active =
                            activeCategory === category.value;

                        return (
                            <button
                                key={category.value}
                                type="button"
                                onClick={() =>
                                    onCategoryChange(
                                        category.value
                                    )
                                }
                                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${active
                                        ? "bg-purple-500/10 text-white"
                                        : "text-slate-300 hover:bg-white/[0.035] hover:text-slate-300"
                                    }`}
                            >
                                <span
                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${active
                                            ? "bg-purple-500/15 text-purple-400"
                                            : "bg-white/[0.03] text-slate-600 group-hover:text-slate-400"
                                        }`}
                                >
                                    <Icon size={17} />
                                </span>

                                <span className="min-w-0">
                                    <span className="block text-sm font-semibold">
                                        {category.label}
                                    </span>

                                    <span className="mt-0.5 block truncate text-[12px] text-slate-500">
                                        {category.description}
                                    </span>
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </aside>
    );
}