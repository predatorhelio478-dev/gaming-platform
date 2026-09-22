"use client";

import {
    Receipt,
    CircleDollarSign,
    Trophy,
    XCircle,
    Clock3,
} from "lucide-react";

import AdminStatCard from "../ui/AdminStatCard";

export default function BetStats({
    summary = {},
    formatCurrency,
}) {
    const cards = [
        {
            label: "Total Bets",
            value: Number(
                summary.totalBets || 0
            ).toLocaleString("en-IN"),
            icon: Receipt,
            color: "violet",
        },
        {
            label: "Total Amount",
            value: formatCurrency(
                summary.totalAmount || 0
            ),
            icon: CircleDollarSign,
            color: "orange",
        },
        {
            label: "Won Bets",
            value: Number(
                summary.wonBets || 0
            ).toLocaleString("en-IN"),
            icon: Trophy,
            color: "yellow",
        },
        {
            label: "Lost Bets",
            value: Number(
                summary.lostBets || 0
            ).toLocaleString("en-IN"),
            icon: XCircle,
            color: "red",
        },
        {
            label: "Pending Bets",
            value: Number(
                summary.pendingBets || 0
            ).toLocaleString("en-IN"),
            icon: Clock3,
            color: "blue",
        },
    ];

    return (
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">

            {cards.map((card) => (

                <AdminStatCard
                    key={card.label}
                    icon={card.icon}
                    label={card.label}
                    value={card.value}
                    color={card.color}
                />

            ))}

        </div>
    );
}
