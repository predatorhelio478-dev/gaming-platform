"use client";

import {
    useEffect,
    useState,
} from "react";

import UserSidebar
    from "./UserSidebar";

import UserHeader
    from "./UserHeader";

import UserFooter
    from "./UserFooter";

import useAuth, { getStoredToken }
    from "../../lib/useAuth";

import useWallet
    from "../../lib/useWallet";

import { handleSessionExpiry }
    from "../../lib/api";

import useSiteSettings
    from "../../lib/useSiteSettings";


// ======================================================
// USER LAYOUT
// ======================================================
//
// Wallet balance is sourced from the shared useWallet() store
// (single fetch, reactive to auth changes) rather than a prop
// each page had to remember to pass down - this is the fix
// for the "shows 0 until you visit /wallet" bug, which was
// caused by each page independently fetching its own wallet
// balance inside a one-shot mount effect that could race
// ahead of auth hydration. `walletBalance`/`loadingWallet`
// props are still accepted (a page can override the header
// display with its own already-fetched value if it wants to),
// but default to the shared store so pages that pass nothing
// still show the correct balance immediately.

export default function UserLayout({

    children,

    title = "Dashboard",

    subtitle,

    walletBalance,

    loadingWallet,

    // Some pages (Color Prediction, Legal & Help, FAQ) must be
    // viewable without being logged in - only the actions on
    // top of them (placing a bet, etc.) require auth, checked
    // separately at the point of that action. Every other page
    // using this layout stays hard-gated by default.
    requireAuth = true,

}) {

    const { siteDescription } =
        useSiteSettings();

    const resolvedSubtitle =
        subtitle || siteDescription;

    const sharedWallet =
        useWallet();

    const resolvedWalletBalance =
        walletBalance !== undefined
            ? walletBalance
            : sharedWallet.balance;

    const resolvedLoadingWallet =
        loadingWallet !== undefined
            ? loadingWallet
            : sharedWallet.loading;

    // ==================================================
    // MOBILE SIDEBAR
    // ==================================================

    const [
        sidebarOpen,
        setSidebarOpen,
    ] = useState(false);


    // ==================================================
    // DESKTOP SIDEBAR COLLAPSE
    // ==================================================

    const [
        sidebarCollapsed,
        setSidebarCollapsed,
    ] = useState(false);


    // ==================================================
    // USER / AUTH
    // ==================================================

    const auth = useAuth();

    const userName =
        auth.user?.fullName ||
        auth.user?.username ||
        "Player";


    // ==================================================
    // AUTH GUARD (only when requireAuth is true)
    // ==================================================
    //
    // Most pages that render inside UserLayout are user-
    // protected (Wallet/Settings/Profile/etc). Without this,
    // the page shell rendered even when logged out - only a
    // failed API call deep inside the page would eventually
    // trigger handleSessionExpiry()'s redirect, so protected
    // UI could flash before that happened, or never redirect
    // at all if the page made no API calls. This makes the
    // guard proactive: no token -> redirect immediately,
    // render nothing protected in the meantime. Reuses
    // handleSessionExpiry() (same helper the API 401
    // interceptor already uses) so the return-URL/redirect-
    // loop logic lives in exactly one place.
    //
    // A few pages (Color Prediction, Legal & Help, FAQ) pass
    // requireAuth={false} because they must be viewable while
    // logged out - only specific actions on top of them (e.g.
    // placing a bet) require auth, checked at that action
    // itself rather than by blocking the whole page.
    //
    // Every hook below runs unconditionally, on every render,
    // regardless of auth state - only the JSX returned differs
    // (never skip a hook behind a conditional early return).
    //
    // IMPORTANT: this reads getStoredToken() directly rather
    // than trusting auth.isAuthenticated for the decision to
    // wipe the session and navigate away. useAuth() is backed
    // by useSyncExternalStore, whose FIRST render after a hard
    // refresh/hydration reflects the server snapshot (always
    // "logged out", since the server can't see localStorage) -
    // React corrects this a moment later, but handleSessionExpiry()
    // calls window.location.replace(), a real navigation that
    // can't be undone once started. If this effect ever fired on
    // that transient pre-correction render, it would wipe a
    // perfectly valid token and navigate to /login before the
    // correction had a chance to happen - which is exactly what
    // was causing "logged in, then refresh logs me out". Reading
    // localStorage directly here always reflects the true current
    // value regardless of any React rendering/hydration timing.

    useEffect(() => {

        if (requireAuth && !getStoredToken()) {

            handleSessionExpiry();

        }

        // auth.isAuthenticated is intentionally in the dependency
        // array (so this still reacts to a real logout/expiry that
        // happens while this component stays mounted - another
        // tab logging out, a 401 elsewhere clearing the session)
        // even though the actual decision above re-checks
        // localStorage directly rather than trusting this value.

    }, [requireAuth, auth.isAuthenticated]);


    // ==================================================
    // RESPONSIVE
    // ==================================================

    useEffect(() => {

        const handleResize =
            () => {

                /*
                 * Close mobile drawer when
                 * switching to desktop.
                 *
                 * IMPORTANT:
                 * Do not reset desktop collapsed
                 * state here.
                 */

                if (
                    window.innerWidth >= 1024
                ) {

                    setSidebarOpen(
                        false
                    );

                }

            };


        window.addEventListener(
            "resize",
            handleResize
        );


        return () => {

            window.removeEventListener(
                "resize",
                handleResize
            );

        };

    }, []);


    if (requireAuth && !auth.isAuthenticated) {

        return (

            <div className="flex min-h-screen items-center justify-center bg-[#070914]">

                <div className="text-sm text-slate-500">
                    Checking session...
                </div>

            </div>

        );

    }


    // ==================================================
    // CLOSE MOBILE SIDEBAR
    // ==================================================

    const handleCloseSidebar =
        () => {

            setSidebarOpen(
                false
            );

        };


    // ==================================================
    // OPEN MOBILE SIDEBAR
    // ==================================================

    const handleOpenSidebar =
        () => {

            setSidebarOpen(
                true
            );

        };


    // ==================================================
    // TOGGLE DESKTOP SIDEBAR
    // ==================================================

    const handleToggleSidebar =
        () => {

            /*
             * Desktop:
             * Expand / collapse.
             *
             * Mobile:
             * Open drawer.
             */

            if (
                typeof window !==
                "undefined" &&
                window.innerWidth >= 1024
            ) {

                setSidebarCollapsed(
                    (current) =>
                        !current
                );

                return;

            }


            setSidebarOpen(
                (current) =>
                    !current
            );

        };


    // ==================================================
    // LAYOUT
    // ==================================================

    return (

        <div
            className="
                min-h-screen
                bg-[#070914]
                text-white
            "
        >

            {/* ==================================================
                SIDEBAR
            ================================================== */}

            <UserSidebar
                open={
                    sidebarOpen
                }
                collapsed={
                    sidebarCollapsed
                }
                onClose={
                    handleCloseSidebar
                }
                onToggle={
                    handleToggleSidebar
                }
            />


            {/* ==================================================
                MAIN AREA
            ================================================== */}

            <div
                className={`
                    min-h-screen
                    transition-[margin]
                    duration-300
                    ease-in-out

                    ${sidebarCollapsed
                        ? "lg:ml-[76px]"
                        : "lg:ml-[250px]"
                    }
                `}
            >

                {/* ==================================================
                    HEADER
                ================================================== */}

                <UserHeader
                    title={
                        title
                    }
                    subtitle={
                        resolvedSubtitle
                    }
                    walletBalance={
                        resolvedWalletBalance
                    }
                    loadingWallet={
                        resolvedLoadingWallet
                    }
                    userName={
                        userName
                    }
                    isAuthenticated={
                        auth.isAuthenticated
                    }
                    sidebarCollapsed={
                        sidebarCollapsed
                    }
                    onMenuClick={
                        handleToggleSidebar
                    }
                />


                {/* ==================================================
                    PAGE CONTENT
                ================================================== */}

                <main
                    className="
                        min-h-[calc(100vh-64px)]
                        w-full
                    "
                >

                    {children}

                </main>


                {/* ==================================================
                    FOOTER
                ================================================== */}

                <UserFooter />

            </div>

        </div>

    );

}