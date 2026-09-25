"use client";

import {
    ShieldCheck,
    Crown,
    UserCog,
    Headset,
} from "lucide-react";

import AdminStatCard from "../ui/AdminStatCard";


// ======================================================
// ADMIN MANAGEMENT STATS
// ======================================================

export default function AdminManagementStats({
    counts = {},
}) {

    const cards = [

        {
            label: "Total Admin Accounts",
            value: counts?.total ?? 0,
            icon: ShieldCheck,
            color: "purple",
        },

        {
            label: "Super Admins",
            value: counts?.super_admin ?? 0,
            icon: Crown,
            color: "yellow",
        },

        {
            label: "Admins",
            value: counts?.admin ?? 0,
            icon: UserCog,
            color: "blue",
        },

        {
            label: "Operators",
            value: counts?.operator ?? 0,
            icon: Headset,
            color: "green",
        },

    ];


    return (

        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

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
