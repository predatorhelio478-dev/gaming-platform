"use client";

import {
    Users,
    Receipt,
    CircleDollarSign,
    Trophy,
} from "lucide-react";

import AdminStatCard from "../ui/AdminStatCard";

export default function DashboardKpiCards({
    stats,
    formatCurrency,
}) {
    const cards = [
        {
            label: "Total Players",
            value: stats?.totalPlayers || 0,
            hint: "Current round",
            icon: Users,
            color: "cyan",
        },
        {
            label: "Total Bets",
            value: stats?.totalBets || 0,
            hint: "Current round",
            icon: Receipt,
            color: "violet",
        },
        {
            label: "Total Bet Amount",
            value: formatCurrency(
                stats?.totalBetAmount || 0
            ),
            hint: "Current round",
            icon: CircleDollarSign,
            color: "orange",
        },
        {
            label: "Total Payout",
            value: formatCurrency(
                stats?.totalPayout || 0
            ),
            hint: "Current round",
            icon: Trophy,
            color: "emerald",
        },
    ];

    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            {cards.map((card) => (

                <AdminStatCard
                    key={card.label}
                    icon={card.icon}
                    label={card.label}
                    value={card.value}
                    hint={card.hint}
                    color={card.color}
                />

            ))}

        </div>
    );
}