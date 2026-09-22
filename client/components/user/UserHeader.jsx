"use client";

import {
    useEffect,
    useRef,
    useState,
} from "react";

import { useRouter } from "next/navigation";

import {
    Menu,
    Wallet,
    UserRound,
    LogIn,
    ChevronDown,
    UserCircle,
    LogOut,
} from "lucide-react";

import NotificationBell from "./NotificationBell";
import useAuth from "../../lib/useAuth";


// ======================================================
// USER HEADER
// ======================================================

export default function UserHeader({

    title = "Dashboard",

    subtitle = "Gaming Platform",

    walletBalance = 0,

    loadingWallet = false,

    userName = "Player",

    isAuthenticated = true,

    onMenuClick,

}) {

    const router =
        useRouter();

    const auth =
        useAuth();

    const [
        menuOpen,
        setMenuOpen,
    ] = useState(false);

    const menuRef =
        useRef(null);


    // ==================================================
    // CLOSE ON OUTSIDE CLICK
    // ==================================================

    useEffect(() => {

        const handleClickOutside =
            (event) => {

                if (
                    menuRef.current &&
                    !menuRef.current.contains(
                        event.target
                    )
                ) {

                    setMenuOpen(
                        false
                    );

                }

            };


        document.addEventListener(
            "mousedown",
            handleClickOutside
        );


        return () => {

            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );

        };

    }, []);


    // ==================================================
    // LOGOUT (same session helper the sidebar already uses)
    // ==================================================

    const handleLogout =
        () => {

            auth.logout();


            setMenuOpen(
                false
            );


            router.replace(
                "/login"
            );

        };


    const formattedBalance =
        new Intl.NumberFormat(
            "en-IN",
            {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 2,
            }
        ).format(
            Number(
                walletBalance || 0
            )
        );


    return (

        <header
            className="
                sticky
                top-0
                z-30
                flex
                h-20
                items-center
                justify-between
                border-b
                border-white/[0.06]
                bg-[#070914]/95
                px-4
                backdrop-blur-md
                sm:px-6
                lg:px-8
            "
        >

            {/* ==================================================
                LEFT
            ================================================== */}

            <div
                className="
                    flex
                    min-w-0
                    items-center
                    gap-3
                "
            >

                {/* MOBILE MENU */}

                <button
                    type="button"
                    onClick={
                        onMenuClick
                    }
                    aria-label="Open menu"
                    className="
                        flex
                        h-9
                        w-9
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        border
                        border-white/[0.07]
                        bg-white/[0.025]
                        text-slate-400
                        transition
                        hover:bg-white/[0.06]
                        hover:text-white
                        lg:hidden
                    "
                >

                    <Menu
                        size={19}
                    />

                </button>


                {/* PAGE TITLE */}

                <div
                    className="
                        min-w-0
                    "
                >

                    <p
                        className="
                            hidden
                            truncate
                            text-xs
                            uppercase
                            tracking-[0.18em]
                            text-slate-600
                            sm:block
                        "
                    >
                        {subtitle}
                    </p>


                    <h1
                        className="
                            truncate
                            text-base
                            font-bold
                            text-white
                            sm:text-xl
                        "
                    >
                        {title}
                    </h1>

                </div>

            </div>


            {/* ==================================================
                RIGHT
            ================================================== */}

            <div
                className="
                    flex
                    items-center
                    gap-2
                    sm:gap-3
                "
            >

                {/* ==================================================
                    WALLET (logged-in users only)
                ================================================== */}

                {isAuthenticated && (
                <div
                    className="
                        flex
                        items-center
                        gap-2
                        rounded-xl
                        border
                        border-violet-500/15
                        bg-violet-500/[0.06]
                        px-3
                        py-2
                    "
                >

                    <div
                        className="
                            flex
                            h-9
                            w-9
                            items-center
                            justify-center
                            rounded-lg
                            bg-violet-500/10
                            text-violet-300
                        "
                    >

                        <Wallet
                            size={16}
                        />

                    </div>


                    <div
                        className="
                            hidden
                            sm:block
                        "
                    >

                        <p
                            className="
                                text-[11px]
                                uppercase
                                tracking-[0.12em]
                                text-slate-400
                            "
                        >
                            Balance
                        </p>


                        <p
                            className="
                                mt-0.5
                                text-xs
                                font-bold
                                text-white
                            "
                        >

                            {loadingWallet
                                ? "Loading..."
                                : formattedBalance
                            }

                        </p>

                    </div>


                    {/* Mobile balance */}

                    <p
                        className="
                            text-xs
                            font-bold
                            text-white
                            sm:hidden
                        "
                    >

                        {loadingWallet
                            ? "..."
                            : formattedBalance
                        }

                    </p>

                </div>
                )}


                {/* ==================================================
                    LOGIN CTA (guests only)
                ================================================== */}

                {!isAuthenticated && (

                    <a
                        href="/login"
                        className="
                            flex
                            items-center
                            gap-1.5
                            rounded-xl
                            border
                            border-violet-500/20
                            bg-violet-500/10
                            px-3
                            py-2
                            text-xs
                            font-semibold
                            text-violet-300
                            transition
                            hover:bg-violet-500/20
                        "
                    >

                        <LogIn size={15} />

                        Login

                    </a>

                )}


                {/* ==================================================
                    NOTIFICATION (logged-in users only)
                ================================================== */}

                {isAuthenticated && (
                    <NotificationBell />
                )}


                {/* ==================================================
                    USER (logged-in users only) - clickable,
                    opens a dropdown with View Profile / Logout
                ================================================== */}

                {isAuthenticated && (
                <div
                    ref={menuRef}
                    className="
                        relative
                        hidden
                        sm:block
                    "
                >

                    <button
                        type="button"
                        onClick={() =>
                            setMenuOpen(
                                (previous) => !previous
                            )
                        }
                        aria-haspopup="menu"
                        aria-expanded={menuOpen}
                        className="
                            flex
                            items-center
                            gap-2
                            rounded-xl
                            border-l
                            border-white/[0.06]
                            py-1.5
                            pl-3
                            pr-2
                            transition
                            hover:bg-white/[0.04]
                        "
                    >

                        <div
                            className="
                                flex
                                h-8
                                w-8
                                items-center
                                justify-center
                                rounded-full
                                bg-gradient-to-br
                                from-violet-500/30
                                to-fuchsia-500/20
                                text-violet-300
                            "
                        >

                            <UserRound
                                size={15}
                            />

                        </div>


                        <div
                            className="
                                max-w-[120px]
                                text-left
                            "
                        >

                            <p
                                className="
                                    truncate
                                    text-xs
                                    font-semibold
                                    text-white
                                "
                            >
                                {userName}
                            </p>


                            <p
                                className="
                                    text-[12px]
                                    text-slate-400
                                "
                            >
                                Player
                            </p>

                        </div>


                        <ChevronDown
                            size={14}
                            className={`
                                shrink-0
                                text-slate-500
                                transition-transform
                                ${menuOpen ? "rotate-180" : ""}
                            `}
                        />

                    </button>


                    {menuOpen && (

                        <div
                            role="menu"
                            className="
                                absolute
                                right-0
                                top-[calc(100%+8px)]
                                z-40
                                w-48
                                overflow-hidden
                                rounded-xl
                                border
                                border-white/[0.08]
                                bg-[#0d101d]
                                py-1.5
                                shadow-2xl
                            "
                        >

                            <button
                                type="button"
                                role="menuitem"
                                onClick={() => {

                                    setMenuOpen(
                                        false
                                    );

                                    router.push(
                                        "/settings"
                                    );

                                }}
                                className="
                                    flex
                                    w-full
                                    items-center
                                    gap-2.5
                                    px-4
                                    py-2.5
                                    text-left
                                    text-xs
                                    font-semibold
                                    text-slate-300
                                    transition
                                    hover:bg-white/[0.05]
                                    hover:text-white
                                "
                            >

                                <UserCircle
                                    size={15}
                                />

                                View Profile

                            </button>


                            <div
                                className="
                                    my-1
                                    h-px
                                    bg-white/[0.06]
                                "
                            />


                            <button
                                type="button"
                                role="menuitem"
                                onClick={
                                    handleLogout
                                }
                                className="
                                    flex
                                    w-full
                                    items-center
                                    gap-2.5
                                    px-4
                                    py-2.5
                                    text-left
                                    text-xs
                                    font-semibold
                                    text-red-400
                                    transition
                                    hover:bg-red-500/10
                                "
                            >

                                <LogOut
                                    size={15}
                                />

                                Logout

                            </button>

                        </div>

                    )}

                </div>
                )}

            </div>

        </header>

    );

}