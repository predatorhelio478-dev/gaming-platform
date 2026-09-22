"use client";

import {
    ChevronLeft,
    ChevronRight,
    Gamepad2,
    LogIn,
    UserPlus,
} from "lucide-react";

import {
    usePathname,
    useRouter,
} from "next/navigation";

import useAuth from "../../lib/useAuth";


// ======================================================
// ICON
// ======================================================

function Icon({
    name,
    size = 18,
}) {

    const common = {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.8,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": true,
    };


    const paths = {

        // ==================================================
        // GRID
        // ==================================================

        grid: (
            <>
                <rect
                    x="3"
                    y="3"
                    width="7"
                    height="7"
                    rx="1"
                />

                <rect
                    x="14"
                    y="3"
                    width="7"
                    height="7"
                    rx="1"
                />

                <rect
                    x="3"
                    y="14"
                    width="7"
                    height="7"
                    rx="1"
                />

                <rect
                    x="14"
                    y="14"
                    width="7"
                    height="7"
                    rx="1"
                />
            </>
        ),


        // ==================================================
        // WALLET
        // ==================================================

        wallet: (
            <>
                <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H20v14H5.5A2.5 2.5 0 0 1 3 16.5v-9Z" />

                <path d="M3 8h14" />

                <path d="M16 13h5" />

                <circle
                    cx="16"
                    cy="13"
                    r=".5"
                    fill="currentColor"
                />
            </>
        ),


        // ==================================================
        // DEPOSIT
        // ==================================================

        deposit: (
            <>
                <path d="M12 3v13" />

                <path d="m7 11 5 5 5-5" />

                <path d="M4 21h16" />
            </>
        ),


        // ==================================================
        // WITHDRAW
        // ==================================================

        withdraw: (
            <>
                <path d="M12 21V8" />

                <path d="m7 13 5-5 5 5" />

                <path d="M4 3h16" />
            </>
        ),


        // ==================================================
        // BETS
        // ==================================================

        bets: (
            <>
                <path d="M5 4h14v16H5z" />

                <path d="M8 8h8" />

                <path d="M8 12h8" />

                <path d="M8 16h5" />
            </>
        ),


        // ==================================================
        // TRANSACTION
        // ==================================================

        transaction: (
            <>
                <path d="M4 7h12" />

                <path d="m13 4 3 3-3 3" />

                <path d="M20 17H8" />

                <path d="m11 14-3 3 3 3" />
            </>
        ),


        // ==================================================
        // USERS
        // ==================================================

        users: (
            <>
                <circle
                    cx="9"
                    cy="8"
                    r="3"
                />

                <path d="M3 20a6 6 0 0 1 12 0" />

                <path d="M16 5.5a3 3 0 0 1 0 5.8" />

                <path d="M18 14a5 5 0 0 1 3 4" />
            </>
        ),


        // ==================================================
        // GAME
        // ==================================================

        game: (
            <>
                <rect
                    x="3"
                    y="6"
                    width="18"
                    height="12"
                    rx="3"
                />

                <path d="M8 12h4" />

                <path d="M10 10v4" />

                <circle
                    cx="16"
                    cy="11"
                    r="1"
                />

                <circle
                    cx="18"
                    cy="13"
                    r="1"
                />
            </>
        ),


        // ==================================================
        // SUPPORT
        // ==================================================

        support: (
            <>
                <circle
                    cx="12"
                    cy="12"
                    r="9"
                />

                <path d="M9.5 9a2.6 2.6 0 1 1 4.8 1.3c-.9 1.2-2.3 1.5-2.3 3" />

                <path d="M12 17h.01" />
            </>
        ),


        // ==================================================
        // SETTINGS
        // ==================================================

        settings: (
            <>
                <circle
                    cx="12"
                    cy="12"
                    r="3"
                />

                <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.7 1.7-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-2.4v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1L8 17l.1-.1A1.7 1.7 0 0 0 8.4 15a1.7 1.7 0 0 0-1.5-1H6.7v-2.4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9L8 8.6l1.7-1.7.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5v-.2h2.4v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.7 1.7-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2V14h-.2a1.7 1.7 0 0 0-1.5 1Z" />
            </>
        ),


        // ==================================================
        // GIFT
        // ==================================================

        gift: (
            <>
                <rect
                    x="3"
                    y="9"
                    width="18"
                    height="12"
                    rx="2"
                />

                <path d="M12 9v12" />

                <path d="M3 13h18" />

                <path d="M12 9H8.5a2.5 2.5 0 1 1 2.5-2.5V9Z" />

                <path d="M12 9h3.5A2.5 2.5 0 1 0 13 6.5V9Z" />
            </>
        ),


        // ==================================================
        // LOGOUT
        // ==================================================

        logout: (
            <>
                <path d="M10 17l5-5-5-5" />

                <path d="M15 12H3" />

                <path d="M21 19V5a2 2 0 0 0-2-2h-6" />

                <path d="M13 21h6a2 2 0 0 0 2-2" />
            </>
        ),


        // ==================================================
        // CLOSE
        // ==================================================

        close: (
            <>
                <path d="M6 6l12 12" />

                <path d="M18 6L6 18" />
            </>
        ),


        // ==================================================
        // LEGAL (document/scale)
        // ==================================================

        legal: (
            <>
                <path d="M12 3v18" />

                <path d="M5 7h14" />

                <path d="M5 7 2.5 12a2.5 2.5 0 0 0 5 0L5 7Z" />

                <path d="M19 7l-2.5 5a2.5 2.5 0 0 0 5 0L19 7Z" />

                <path d="M8 21h8" />
            </>
        ),


        // ==================================================
        // TROPHY (leaderboard)
        // ==================================================

        trophy: (
            <>
                <path d="M8 4h8v4a4 4 0 0 1-8 0V4Z" />

                <path d="M8 5H5a2 2 0 0 0 2 4" />

                <path d="M16 5h3a2 2 0 0 1-2 4" />

                <path d="M12 12v3" />

                <path d="M9 19h6" />

                <path d="M10 19v-2a2 2 0 0 1 4 0v2" />
            </>
        ),


        // ==================================================
        // FAQ (question mark)
        // ==================================================

        faq: (
            <>
                <circle cx="12" cy="12" r="9" />

                <path d="M9.2 9.2a2.8 2.8 0 1 1 3.9 2.6c-.8.4-1.4 1-1.4 1.9" />

                <path d="M12 17h.01" />
            </>
        ),

    };


    return (
        <svg {...common}>
            {paths[name] || paths.grid}
        </svg>
    );

}


// ======================================================
// NAVIGATION
// ======================================================

const NAV_ITEMS = [

    {
        label: "Wallet",
        icon: "wallet",
        href: "/wallet",
    },

    {
        label: "Deposit",
        icon: "deposit",
        href: "/deposit",
    },

    {
        label: "Withdrawal",
        icon: "withdraw",
        href: "/withdrawal",
    },

    {
        label: "My Bets",
        icon: "bets",
        href: "/bets",
    },

    {
        label: "Transactions",
        icon: "transaction",
        href: "/transactions",
    },

    {
        label: "Referrals",
        icon: "users",
        href: "/referrals",
    },

    {
        label: "Leaderboard",
        icon: "trophy",
        href: "/leaderboard",
    },

    {
        label: "Color Prediction",
        icon: "game",
        href: "/games/color-prediction",
    },

    {
        label: "Support",
        icon: "support",
        href: "/support",
    },

    {
        label: "FAQ",
        icon: "faq",
        href: "/faq",
    },

    {
        label: "Legal & Help",
        icon: "legal",
        href: "/legal-help",
    },

    {
        label: "Settings",
        icon: "settings",
        href: "/settings",
    },

];


// ======================================================
// GUEST NAVIGATION
// ======================================================
//
// Logged-out visitors only get the public game page plus
// Login/Register - no wallet/account-sensitive items.

const GUEST_NAV_ITEMS = [

    {
        label: "Color Prediction",
        icon: "game",
        href: "/games/color-prediction",
    },

    {
        label: "FAQ",
        icon: "faq",
        href: "/faq",
    },

    {
        label: "Legal & Help",
        icon: "legal",
        href: "/legal-help",
    },

];


// ======================================================
// USER SIDEBAR
// ======================================================

export default function UserSidebar({

    open = false,

    collapsed = false,

    onClose,

    onToggle,

}) {

    const router = useRouter();

    const pathname = usePathname();

    const auth = useAuth();


    const userName =
        auth.user?.fullName ||
        auth.user?.username ||
        "Player";


    const navItems =
        auth.isAuthenticated
            ? NAV_ITEMS
            : GUEST_NAV_ITEMS;


    // ==================================================
    // NAVIGATION
    // ==================================================

    const handleNavigation =
        (href) => {

            if (!href) {
                return;
            }


            /*
             * Navigation ke baad mobile
             * sidebar close ho jayega.
             */

            onClose?.();


            router.push(
                href
            );

        };


    // ==================================================
    // LOGOUT
    // ==================================================

    const handleLogout =
        () => {

            auth.logout();


            onClose?.();


            router.replace(
                "/login"
            );

        };


    // ==================================================
    // ACTIVE
    // ==================================================

    const isActive =
        (href) => {

            if (!pathname) {
                return false;
            }


            if (
                pathname === href
            ) {

                return true;

            }


            return (
                href !== "/" &&
                pathname.startsWith(
                    `${href}/`
                )
            );

        };


    return (

        <>

            {/* ==================================================
                MOBILE BACKDROP
                IMPORTANT:
                This is NOT clickable.
                Clicking outside will NOT close sidebar.
            ================================================== */}

            {open && (

                <div
                    aria-hidden="true"
                    className="
                        fixed
                        inset-0
                        z-40
                        bg-black/70
                        lg:hidden
                    "
                />

            )}


            {/* ==================================================
                SIDEBAR
            ================================================== */}

            <aside
                className={`
        fixed
        inset-y-0
        left-0
        z-50
        flex
        w-[250px]
        flex-col
        border-r
        border-white/5
        bg-[#070b1b]/95
        py-5
        backdrop-blur-xl

        transform
        transition-all
        duration-300
        ease-[cubic-bezier(0.4,0,0.2,1)]

        lg:translate-x-0

        ${collapsed
                        ? "lg:w-[76px]"
                        : "lg:w-[250px]"
                    }

        ${open
                        ? "translate-x-0 opacity-100"
                        : "-translate-x-full opacity-95"
                    }
    `}
            >

                {/* ==================================================
                    MOBILE CLOSE BUTTON
                ================================================== */}

                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close sidebar"
                    title="Close sidebar"
                    className="
                        absolute
                        right-4
                        top-4
                        z-[70]
                        flex
                        h-9
                        w-9
                        items-center
                        justify-center
                        rounded-xl
                        border
                        border-white/[0.08]
                        bg-[#101426]
                        text-slate-400
                        shadow-lg
                        shadow-black/30
                        transition-all
                        duration-200
                        hover:border-violet-500/30
                        hover:bg-violet-500/10
                        hover:text-white
                        active:scale-95
                        lg:hidden
                    "
                >

                    <Icon
                        name="close"
                        size={17}
                    />

                </button>


                {/* ==================================================
                    BRAND
                ================================================== */}

                <div
                    className={`
                        relative
                        mb-8
                        flex
                        items-center
                        transition-all
                        duration-300

                        ${collapsed
                            ? "justify-center px-0"
                            : "gap-3 px-4 pr-14"
                        }
                    `}
                >

                    {/* LOGO */}

                    <div
                        className="
                            flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600
                        "
                    >

                        <span className="text-xl">
                            <Gamepad2
                                size={28}
                            />
                        </span>

                    </div>


                    {/* BRAND TEXT */}

                    <div
                        className={`
                            min-w-0
                            overflow-hidden
                            transition-all
                            duration-300

                            ${collapsed
                                ? "w-0 opacity-0"
                                : "w-auto opacity-100"
                            }
                        `}
                    >

                        <p
                            className="
                                whitespace-nowrap
                                text-xl
                                font-black
                                tracking-tight
                            "
                        >
                            GAMEZ
                        </p>


                        <p
                            className="
                                whitespace-nowrap
                               text-[10px] uppercase tracking-[0.2em] text-purple-400
                            "
                        >
                            Gaming Platform
                        </p>

                    </div>

                </div>


                {/* ==================================================
                    NAVIGATION
                ================================================== */}

                <nav
                    className="
                        min-h-0
                        flex-1
                        space-y-1
                        overflow-y-auto
                        px-3
                    "
                >

                    {navItems.map(
                        (item) => {

                            const active =
                                isActive(
                                    item.href
                                );


                            return (

                                <button
                                    key={
                                        item.href
                                    }
                                    type="button"
                                    onClick={() =>
                                        handleNavigation(
                                            item.href
                                        )
                                    }
                                    title={
                                        collapsed
                                            ? item.label
                                            : undefined
                                    }
                                    className={`
                                        group
                                        flex
                                        w-full
                                        items-center
                                        rounded-xl
                                        py-3
                                        text-left
                                        text-sm
                                        transition-all
                                        duration-300

                                        ${collapsed
                                            ? "justify-center px-0"
                                            : "gap-3 px-3"
                                        }

                                        ${active
                                            ? `
                                                    bg-gradient-to-r
                                                    from-violet-600/40
                                                    to-fuchsia-500/20
                                                    text-white
                                                    shadow-[inset_0_0_25px_rgba(139,92,246,0.12)]
                                                `
                                            : `
                                                    text-slate-400
                                                    hover:bg-white/[0.04]
                                                    hover:text-white
                                                `
                                        }
                                    `}
                                >

                                    {/* ICON */}

                                    <span
                                        className={
                                            active
                                                ? "shrink-0 text-violet-300"
                                                : "shrink-0 text-slate-500 group-hover:text-slate-300"
                                        }
                                    >

                                        <Icon
                                            name={
                                                item.icon
                                            }
                                        />

                                    </span>


                                    {/* LABEL */}

                                    <span
                                        className={`
                                            min-w-0
                                            truncate
                                            whitespace-nowrap
                                            transition-all
                                            duration-300

                                            ${collapsed
                                                ? "hidden"
                                                : "block"
                                            }
                                        `}
                                    >
                                        {
                                            item.label
                                        }
                                    </span>


                                    {/* ACTIVE DOT */}

                                    {active &&
                                        !collapsed && (

                                            <span
                                                className="
                                                    ml-auto
                                                    h-1.5
                                                    w-1.5
                                                    shrink-0
                                                    rounded-full
                                                    bg-violet-400
                                                    shadow-[0_0_10px_#a78bfa]
                                                "
                                            />

                                        )}

                                </button>

                            );

                        }
                    )}

                </nav>


                {/* ==================================================
                    INVITE & EARN (logged-in users only)
                ================================================== */}

                {auth.isAuthenticated && (!collapsed ? (

                    <div
                        className="
                            mx-3
                            mt-4
                            rounded-2xl
                            border
                            border-violet-400/10
                            bg-gradient-to-b
                            from-violet-500/10
                            to-fuchsia-500/5
                            p-4
                            text-center
                        "
                    >

                        <div
                            className="
                                mx-auto
                                mb-3
                                flex
                                h-14
                                w-14
                                items-center
                                justify-center
                                rounded-2xl
                                bg-violet-500/10
                                text-3xl
                                shadow-[0_0_30px_rgba(168,85,247,0.18)]
                            "
                        >

                            <Icon
                                name="gift"
                                size={25}
                            />

                        </div>


                        <p className="font-bold">
                            Invite &amp; Earn
                        </p>


                        <p
                            className="
                                mt-1
                                text-xs
                                leading-5
                                text-slate-500
                            "
                        >
                            Invite your friends and earn exciting rewards
                        </p>


                        <button
                            type="button"
                            onClick={() =>
                                handleNavigation(
                                    "/referrals"
                                )
                            }
                            className="
                                mt-3
                                w-full
                                rounded-xl
                                bg-gradient-to-r
                                from-violet-600
                                to-fuchsia-500
                                px-3
                                py-2.5
                                text-sm
                                font-bold
                                shadow-[0_0_25px_rgba(168,85,247,0.22)]
                                transition
                                hover:brightness-110
                            "
                        >
                            Invite Now
                        </button>

                    </div>

                ) : (

                    <button
                        type="button"
                        onClick={() =>
                            handleNavigation(
                                "/referrals"
                            )
                        }
                        title="Invite & Earn"
                        className="
                            mx-auto
                            mt-4
                            flex
                            h-11
                            w-11
                            items-center
                            justify-center
                            rounded-xl
                            border
                            border-violet-400/10
                            bg-violet-500/10
                            text-violet-300
                            transition
                            hover:bg-violet-500/20
                        "
                    >

                        <Icon
                            name="gift"
                            size={20}
                        />

                    </button>

                ))}


                {/* ==================================================
                    USER + LOGOUT (logged-in) / LOGIN + REGISTER (guest)
                ================================================== */}

                {auth.isAuthenticated ? (

                <div
                    className={`
                        mt-4
                        border-t
                        border-white/5
                        pt-4

                        ${collapsed
                            ? "px-2"
                            : "px-3"
                        }
                    `}
                >

                    {/* USER INFO */}

                    {!collapsed ? (

                        <div
                            className="
                                mb-2
                                flex
                                items-center
                                gap-3
                                rounded-xl
                                bg-white/[0.025]
                                px-3
                                py-2.5
                            "
                        >

                            <span
                                className="
                                    flex
                                    h-8
                                    w-8
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-full
                                    bg-gradient-to-br
                                    from-slate-500
                                    to-slate-700
                                    text-sm
                                    font-bold
                                "
                            >
                                {userName
                                    .charAt(0)
                                    .toUpperCase()}
                            </span>


                            <div className="min-w-0">

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
                                        text-[10px]
                                        text-slate-600
                                    "
                                >
                                    Player Account
                                </p>

                            </div>

                        </div>

                    ) : (

                        <div
                            className="
                                mb-2
                                flex
                                justify-center
                            "
                            title={userName}
                        >

                            <span
                                className="
                                    flex
                                    h-9
                                    w-9
                                    items-center
                                    justify-center
                                    rounded-full
                                    bg-gradient-to-br
                                    from-slate-500
                                    to-slate-700
                                    text-sm
                                    font-bold
                                "
                            >
                                {userName
                                    .charAt(0)
                                    .toUpperCase()}
                            </span>

                        </div>

                    )}


                    {/* LOGOUT */}

                    <button
                        type="button"
                        onClick={
                            handleLogout
                        }
                        title={
                            collapsed
                                ? "Logout"
                                : undefined
                        }
                        className={`
                            group
                            flex
                            w-full
                            items-center
                            rounded-xl
                            py-3
                            text-left
                            text-sm
                            font-semibold
                            text-red-400
                            transition
                            hover:bg-red-500/[0.08]
                            hover:text-red-300

                            ${collapsed
                                ? "justify-center px-0"
                                : "gap-3 px-3"
                            }
                        `}
                    >

                        <span
                            className="
                                shrink-0
                                text-red-400
                                transition
                                group-hover:text-red-300
                            "
                        >

                            <Icon
                                name="logout"
                                size={18}
                            />

                        </span>


                        {!collapsed && (
                            <span>
                                Logout
                            </span>
                        )}

                    </button>

                </div>

                ) : (

                <div
                    className={`
                        mt-4
                        space-y-2
                        border-t
                        border-white/5
                        pt-4

                        ${collapsed
                            ? "px-2"
                            : "px-3"
                        }
                    `}
                >

                    <button
                        type="button"
                        onClick={() =>
                            handleNavigation("/login")
                        }
                        title={
                            collapsed
                                ? "Login"
                                : undefined
                        }
                        className={`
                            flex
                            w-full
                            items-center
                            rounded-xl
                            border
                            border-violet-500/20
                            bg-violet-500/10
                            py-3
                            text-left
                            text-sm
                            font-semibold
                            text-violet-300
                            transition
                            hover:bg-violet-500/20

                            ${collapsed
                                ? "justify-center px-0"
                                : "gap-3 px-3"
                            }
                        `}
                    >

                        <LogIn size={18} className="shrink-0" />

                        {!collapsed && <span>Login</span>}

                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            handleNavigation("/register")
                        }
                        title={
                            collapsed
                                ? "Register"
                                : undefined
                        }
                        className={`
                            flex
                            w-full
                            items-center
                            rounded-xl
                            py-3
                            text-left
                            text-sm
                            font-semibold
                            text-slate-300
                            transition
                            hover:bg-white/[0.04]
                            hover:text-white

                            ${collapsed
                                ? "justify-center px-0"
                                : "gap-3 px-3"
                            }
                        `}
                    >

                        <UserPlus size={18} className="shrink-0" />

                        {!collapsed && <span>Register</span>}

                    </button>

                </div>

                )}


                {/* ==================================================
    DESKTOP SIDEBAR TOGGLE
================================================== */}

                <button
                    type="button"
                    onClick={onToggle}
                    aria-label={
                        collapsed
                            ? "Expand sidebar"
                            : "Collapse sidebar"
                    }
                    title={
                        collapsed
                            ? "Expand sidebar"
                            : "Collapse sidebar"
                    }
                    className="
        absolute
        right-0
        top-1/2
        z-[70]

        hidden
        h-8
        w-8

        -translate-y-1/2
        translate-x-1/2

        items-center
        justify-center

        rounded-full
        border
        border-white/[0.10]

        bg-[#101426]

        text-slate-400

        shadow-lg
        shadow-black/40

        transition-all
        duration-200
        ease-out

        hover:border-violet-500/40
        hover:bg-violet-500/10
        hover:text-violet-300

        active:scale-90

        lg:flex
    "
                >
                    {collapsed ? (
                        <ChevronRight
                            size={16}
                            strokeWidth={2}
                        />
                    ) : (
                        <ChevronLeft
                            size={16}
                            strokeWidth={2}
                        />
                    )}
                </button>

            </aside>

        </>

    );

}