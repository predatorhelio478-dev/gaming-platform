"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "cookie_consent";
const REOPEN_EVENT = "cookie-consent-reopen";

// ======================================================
// PUBLIC HELPER - lets any component (e.g. a footer link)
// reopen the banner so the user can change their choice
// later, without needing a shared store/context.
// ======================================================

export const openCookieSettings = () => {

    if (typeof window !== "undefined") {

        window.dispatchEvent(new Event(REOPEN_EVENT));

    }

};

export const getCookieConsent = () => {

    if (typeof window === "undefined") {
        return null;
    }

    try {
        return localStorage.getItem(STORAGE_KEY);
    } catch {
        return null;
    }

};


// ======================================================
// COOKIE CONSENT BANNER
// ======================================================

export default function CookieConsent() {

    const pathname = usePathname();

    const [visible, setVisible] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {

        setMounted(true);

        const existing = getCookieConsent();

        if (!existing) {

            setVisible(true);

        }

        const handleReopen = () => setVisible(true);

        window.addEventListener(REOPEN_EVENT, handleReopen);

        return () => window.removeEventListener(REOPEN_EVENT, handleReopen);

    }, []);

    // Never on the admin panel - this is a public-site concern.
    if (!mounted || pathname?.startsWith("/admin")) {
        return null;
    }

    if (!visible) {
        return null;
    }

    const choose = (value) => {

        try {

            localStorage.setItem(STORAGE_KEY, value);

        } catch {
            // Storage unavailable (private mode etc.) - just hide
            // for this page view rather than breaking the site.
        }

        setVisible(false);

    };

    return (
        <div
            role="dialog"
            aria-label="Cookie consent"
            className="fixed inset-x-0 bottom-0 z-[300] flex justify-center px-4 pb-4 sm:px-6"
        >
            <div className="flex w-full max-w-3xl flex-col gap-3 rounded-2xl border border-white/[0.08] bg-[#0d101d] p-4 shadow-2xl shadow-black/40 sm:flex-row sm:items-center sm:gap-4 sm:p-5">

                <div className="flex items-start gap-3 sm:flex-1">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/[0.08] text-violet-300">
                        <Cookie size={17} />
                    </div>
                    <p className="text-xs leading-5 text-slate-400">
                        We use essential cookies to keep you signed in and remember your preferences. We don&apos;t use
                        tracking/analytics cookies unless you accept. See our{" "}
                        <a href="/legal-help#privacy" className="font-semibold text-violet-400 hover:text-violet-300">
                            Privacy Policy
                        </a>{" "}
                        for details.
                    </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    <button
                        type="button"
                        onClick={() => choose("rejected")}
                        className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                    >
                        Reject
                    </button>
                    <button
                        type="button"
                        onClick={() => choose("accepted")}
                        className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-900/20 transition hover:brightness-110"
                    >
                        Accept
                    </button>
                </div>

                <button
                    type="button"
                    onClick={() => choose("rejected")}
                    aria-label="Dismiss"
                    className="absolute right-3 top-3 text-slate-600 hover:text-white sm:hidden"
                >
                    <X size={16} />
                </button>

            </div>
        </div>
    );

}
