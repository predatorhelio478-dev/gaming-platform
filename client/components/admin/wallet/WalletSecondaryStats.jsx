"use client";

import {
    Users,
    CircleDollarSign,
    Trophy,
    Gift,
    Activity,
} from "lucide-react";

import AdminStatCard from "../ui/AdminStatCard";


// ======================================================
// WALLET SECONDARY STATS
// ======================================================

export default function WalletSecondaryStats({
    stats = {},
}) {

    const number = (value) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2,
        }).format(number(value));
    };

    const totalUsers = number(stats?.totalUsers ?? stats?.users ?? 0);
    const usersWithBalance = number(stats?.usersWithBalance ?? stats?.fundedUsers ?? 0);
    const totalBet = number(stats?.totalBet ?? stats?.totalBets ?? 0);
    const totalWin = number(stats?.totalWin ?? stats?.totalWins ?? 0);
    const totalBonus = number(stats?.totalBonus ?? stats?.bonusBalance ?? 0);

    const cards = [
        {
            label: "Total Users",
            value: totalUsers.toLocaleString("en-IN"),
            hint: "Registered platform users",
            icon: Users,
            color: "cyan",
        },
        {
            label: "Users With Balance",
            value: usersWithBalance.toLocaleString("en-IN"),
            hint: "Users holding wallet funds",
            icon: Activity,
            color: "emerald",
        },
        {
            label: "Total Bet",
            value: formatCurrency(totalBet),
            hint: "Total amount wagered",
            icon: CircleDollarSign,
            color: "orange",
        },
        {
            label: "Total Win",
            value: formatCurrency(totalWin),
            hint: "Total winning payouts",
            icon: Trophy,
            color: "yellow",
        },
        {
            label: "Bonus Balance",
            value: formatCurrency(totalBonus),
            hint: "Total bonus funds",
            icon: Gift,
            color: "pink",
        },
    ];

    return (
        <section className="mt-3 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">

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

        </section>
    );

}
