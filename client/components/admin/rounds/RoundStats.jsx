"use client";

import {
    RotateCcw,
    Users,
    Hash,
    WalletCards,
} from "lucide-react";

import AdminStatCard from "../ui/AdminStatCard";

export default function RoundStats({
    summary,
    formatCurrency,
}) {
    const stats = [
        {
            label: "Total Rounds",
            value: summary?.totalRounds || 0,
            icon: RotateCcw,
            color: "violet",
        },
        {
            label: "Total Players",
            value: summary?.totalPlayers || 0,
            icon: Users,
            color: "cyan",
        },
        {
            label: "Total Bets",
            value: summary?.totalBets || 0,
            icon: Hash,
            color: "orange",
        },
        {
            label: "Total Payout",
            value: formatCurrency(
                summary?.totalPayout || 0
            ),
            icon: WalletCards,
            color: "emerald",
        },
    ];

    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            {stats.map((stat) => (

                <AdminStatCard
                    key={stat.label}
                    icon={stat.icon}
                    label={stat.label}
                    value={stat.value}
                    color={stat.color}
                />

            ))}

        </div>
    );
}
