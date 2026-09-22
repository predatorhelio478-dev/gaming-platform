"use client";

import {
    Wallet,
    TrendingUp,
    TrendingDown,
    Trophy,
    LockKeyhole,
} from "lucide-react";

import AdminStatCard from "../ui/AdminStatCard";


// ======================================================
// WALLET STATS
// ======================================================

export default function WalletStats({
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

    const totalBalance = number(stats?.totalBalance ?? stats?.balance ?? 0);
    const totalWinningBalance = number(stats?.totalWinningBalance ?? stats?.winningBalance ?? 0);
    const totalDeposits = number(stats?.totalDeposit ?? stats?.totalDeposits ?? 0);
    const totalWithdrawals = number(stats?.totalWithdraw ?? stats?.totalWithdrawals ?? 0);
    const totalLockedBalance = number(stats?.totalLockedBalance ?? stats?.lockedBalance ?? 0);

    const cards = [
        {
            label: "Total Balance",
            value: formatCurrency(totalBalance),
            hint: "All users wallet balance",
            icon: Wallet,
            color: "emerald",
        },
        {
            label: "Winning Balance",
            value: formatCurrency(totalWinningBalance),
            hint: "Total winning funds",
            icon: Trophy,
            color: "yellow",
        },
        {
            label: "Total Deposits",
            value: formatCurrency(totalDeposits),
            hint: "All successful deposits",
            icon: TrendingUp,
            color: "blue",
        },
        {
            label: "Total Withdrawals",
            value: formatCurrency(totalWithdrawals),
            hint: "All withdrawal requests",
            icon: TrendingDown,
            color: "red",
        },
        {
            label: "Locked Balance",
            value: formatCurrency(totalLockedBalance),
            hint: "Currently locked funds",
            icon: LockKeyhole,
            color: "purple",
        },
    ];

    return (
        <section className="mt-6 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">

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
