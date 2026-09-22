"use client";

import {
    Users,
    UserCheck,
    UserX,
    ShieldCheck,
    Clock3,
} from "lucide-react";

import AdminStatCard from "../ui/AdminStatCard";


// ======================================================
// USER STATS
// ======================================================

export default function UserStats({
    stats = {},
}) {

    const cards = [

        {
            label: "Total Users",
            value: stats?.totalUsers ?? 0,
            icon: Users,
            color: "purple",
        },

        {
            label: "Active Users",
            value: stats?.activeUsers ?? 0,
            icon: UserCheck,
            color: "green",
        },

        {
            label: "Blocked Users",
            value: stats?.blockedUsers ?? 0,
            icon: UserX,
            color: "red",
        },

        {
            label: "Verified Users",
            value: stats?.verifiedUsers ?? 0,
            icon: ShieldCheck,
            color: "blue",
        },

        {
            label: "New · 24 Hours",
            value: stats?.newUsers24Hours ?? 0,
            icon: Clock3,
            color: "yellow",
        },

    ];


    return (

        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">

            {cards.map((card) => (

                <AdminStatCard
                    key={card.label}
                    icon={card.icon}
                    label={card.label}
                    value={Number(card.value || 0).toLocaleString("en-IN")}
                    color={card.color}
                />

            ))}

        </div>

    );

}
