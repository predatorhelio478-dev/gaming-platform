"use client";

import { useRouter } from "next/navigation";

import {
    ArrowUpRight,
    Receipt,
    RotateCcw,
    WalletCards,
    Users,
} from "lucide-react";


const items = [

    {
        title: "Bets",
        description: "View all player bets",
        path: "/admin/bets",
        icon: Receipt,
        iconClass: "text-orange-400",
        iconBg: "bg-orange-500/10",
    },

    {
        title: "Rounds",
        description: "Manage game rounds",
        path: "/admin/rounds",
        icon: RotateCcw,
        iconClass: "text-violet-400",
        iconBg: "bg-violet-500/10",
    },

    {
        title: "Payouts",
        description: "Review payouts",
        path: "/admin/payouts",
        icon: WalletCards,
        iconClass: "text-emerald-400",
        iconBg: "bg-emerald-500/10",
    },

    {
        title: "Users",
        description: "Manage players",
        path: "/admin/users",
        icon: Users,
        iconClass: "text-cyan-400",
        iconBg: "bg-cyan-500/10",
    },

];


export default function QuickAccess() {

    const router =
        useRouter();


    return (

        <section
            className="
                mt-6
                rounded-2xl
                border
                border-white/[0.06]
                bg-[#0d101d]
                p-5
                sm:p-6
            "
        >

            {/* HEADER */}

            <p
                className="
                    text-xs
                    uppercase
                    tracking-wider
                    text-slate-600
                "
            >
                Management
            </p>


            <h3
                className="
                    mt-1
                    text-lg
                    font-bold
                    text-white
                "
            >
                Quick Access
            </h3>


            {/* ITEMS */}

            <div
                className="
                    mt-5
                    grid
                    gap-3
                    sm:grid-cols-2
                    lg:grid-cols-4
                "
            >

                {items.map((item) => {

                    const Icon =
                        item.icon;


                    return (

                        <button
                            key={
                                item.path
                            }
                            type="button"
                            onClick={() =>
                                router.push(
                                    item.path
                                )
                            }
                            className="
                                group
                                cursor-pointer
                                rounded-xl
                                border
                                border-white/[0.06]
                                bg-white/[0.02]
                                p-4
                                text-left
                                transition
                                duration-200
                                hover:border-white/[0.10]
                                hover:bg-white/[0.04]
                            "
                        >

                            {/* TOP */}

                            <div
                                className="
                                    flex
                                    items-center
                                    justify-between
                                    gap-3
                                "
                            >

                                {/* ICON */}

                                <span
                                    className={`
                                        flex
                                        h-10
                                        w-10
                                        items-center
                                        justify-center
                                        rounded-xl
                                        ${item.iconBg}
                                        ${item.iconClass}
                                    `}
                                >

                                    <Icon
                                        size={19}
                                        strokeWidth={1.8}
                                    />

                                </span>


                                {/* ARROW */}

                                <span
                                    className="
                                        flex
                                        h-8
                                        w-8
                                        items-center
                                        justify-center
                                        rounded-lg
                                        bg-white/[0.02]
                                        text-slate-700
                                        transition
                                        group-hover:bg-white/[0.05]
                                        group-hover:text-white
                                    "
                                >

                                    <ArrowUpRight
                                        size={15}
                                    />

                                </span>

                            </div>


                            {/* TITLE */}

                            <p
                                className="
                                    mt-4
                                    font-semibold
                                    text-white
                                    transition
                                    group-hover:text-violet-300
                                "
                            >
                                {
                                    item.title
                                }
                            </p>


                            {/* DESCRIPTION */}

                            <p
                                className="
                                    mt-1
                                    text-xs
                                    text-slate-600
                                "
                            >
                                {
                                    item.description
                                }
                            </p>

                        </button>

                    );

                })}

            </div>

        </section>

    );

}