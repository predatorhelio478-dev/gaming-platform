"use client";

import {
    Receipt,
    CircleDollarSign,
    Banknote,
} from "lucide-react";

import AdminStatCard from "../ui/AdminStatCard";

export default function PayoutStats({
    summary = {},
}) {
    const formatCurrency = (value) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(Number(value || 0));
    };

    const cards = [
        {
            label: "Total Payouts",
            value: Number(
                summary.totalPayouts || 0
            ).toLocaleString("en-IN"),
            icon: Receipt,
            color: "violet",
        },
        {
            label: "Total Bet Amount",
            value: formatCurrency(
                summary.totalBetAmount
            ),
            icon: CircleDollarSign,
            color: "orange",
        },
        {
            label: "Total Payout Amount",
            value: formatCurrency(
                summary.totalPayoutAmount
            ),
            icon: Banknote,
            color: "emerald",
        },
    ];

    return (
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">

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
