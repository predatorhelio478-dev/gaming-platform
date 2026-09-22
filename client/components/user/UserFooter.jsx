"use client";

import Link from "next/link";
import { ShieldCheck, Gamepad2 } from "lucide-react";

import { openCookieSettings } from "../common/CookieConsent";


// ======================================================
// USER FOOTER
// ======================================================

export default function UserFooter() {

    const currentYear =
        new Date().getFullYear();


    return (

        <footer
            className="
                border-t
                border-white/[0.06]
                bg-[#070914]
            "
        >

            <div
                className="
                    px-4
                    py-6
                    sm:px-6
                    lg:px-8
                "
            >

                {/* ==================================================
                    TOP
                ================================================== */}

                <div
                    className="
                        flex
                        flex-col
                        gap-5
                        md:flex-row
                        md:items-center
                        md:justify-between
                    "
                >

                    {/* BRAND */}

                    <div>

                        <Link
                            href="/games/color-prediction"
                            className="
                                inline-flex
                                items-center
                                gap-2
                                text-sm
                                font-black
                                text-white
                                transition
                                hover:text-violet-300
                            "
                        >

                            <span
                                className="
                                   flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600
                                "
                            >
                                <Gamepad2
                                    size={28}
                                />
                            </span>

                            GAMEZ

                        </Link>


                        <p
                            className="
                                mt-2
                                max-w-md
                                text-[12px]
                                leading-5
                                text-slate-500
                            "
                        >
                            Your gaming platform for exciting
                            games, predictions and rewards.
                        </p>

                    </div>


                    {/* ==================================================
                        LINKS
                    ================================================== */}

                    <div
                        className="
                            flex
                            flex-wrap
                            items-center
                            gap-x-5
                            gap-y-2
                        "
                    >

                        <Link
                            href="/games/color-prediction"
                            className="
                                text-[14px]
                                text-slate-500
                                transition
                                hover:text-white
                            "
                        >
                            Play Now
                        </Link>


                        <Link
                            href="/wallet"
                            className="
                                text-[14px]
                                text-slate-500
                                transition
                                hover:text-white
                            "
                        >
                            Wallet
                        </Link>


                        <Link
                            href="/bets"
                            className="
                                text-[14px]
                                text-slate-500
                                transition
                                hover:text-white
                            "
                        >
                            My Bets
                        </Link>


                        <Link
                            href="/referrals"
                            className="
                                text-[14px]
                                text-slate-500
                                transition
                                hover:text-white
                            "
                        >
                            Referrals
                        </Link>


                        <Link
                            href="/support"
                            className="
                                text-[14px]
                                text-slate-500
                                transition
                                hover:text-white
                            "
                        >
                            Support
                        </Link>


                        <Link
                            href="/faq"
                            className="
                                text-[14px]
                                text-slate-500
                                transition
                                hover:text-white
                            "
                        >
                            FAQ
                        </Link>


                        <Link
                            href="/legal-help"
                            className="
                                text-[14px]
                                text-slate-500
                                transition
                                hover:text-white
                            "
                        >
                            Legal & Help
                        </Link>


                        <button
                            type="button"
                            onClick={openCookieSettings}
                            className="
                                text-[14px]
                                text-slate-500
                                transition
                                hover:text-white
                            "
                        >
                            Cookie Settings
                        </button>


                        <Link
                            href="/settings"
                            className="
                                text-[14px]
                                text-slate-500
                                transition
                                hover:text-white
                            "
                        >
                            Settings
                        </Link>

                    </div>

                </div>


                {/* ==================================================
                    DIVIDER
                ================================================== */}

                <div
                    className="
                        my-5
                        h-px
                        bg-white/[0.05]
                    "
                />


                {/* ==================================================
                    BOTTOM
                ================================================== */}

                <div
                    className="
                        flex
                        flex-col
                        gap-3
                        text-[12px]
                        text-slate-500
                        sm:flex-row
                        sm:items-center
                        sm:justify-between
                    "
                >

                    {/* COPYRIGHT */}

                    <p>
                        © {currentYear} GAMEZ.
                        All rights reserved.
                    </p>


                    {/* RESPONSIBLE GAMING */}

                    <div
                        className="
                            flex
                            items-center
                            gap-1.5
                        "
                    >

                        <ShieldCheck
                            size={13}
                            className="text-emerald-500"
                        />

                        <span>
                            Play responsibly
                        </span>

                    </div>

                </div>

            </div>

        </footer>

    );

}