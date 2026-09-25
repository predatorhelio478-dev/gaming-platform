"use client";

import { ShieldCheck } from "lucide-react";

import useSiteSettings from "../../lib/useSiteSettings";

// ======================================================
// AUTH SHELL
// ======================================================
//
// Shared visual system for login/register/admin-login -
// gradient background, logo badge, card, footer. Extracted
// from the original login page so all three auth surfaces
// look like one product instead of three separate UIs.

export default function AuthShell({
    heading,
    subheading,
    cardIcon,
    cardTitle,
    cardDescription,
    error,
    success,
    children,
    footer,
    bottomText,
    bottomTextSuffix = "• Secure Access",
    maxWidth = "max-w-2xl",
}) {

    const { siteName, siteDescription } = useSiteSettings();

    const resolvedBottomText =
        bottomText || `${siteDescription} ${bottomTextSuffix}`;

    return (
        <main className="relative min-h-screen overflow-hidden bg-[#070914] text-white">

            {/* =================================================
                BACKGROUND
            ================================================= */}

            <div className="pointer-events-none absolute inset-0">

                <div className="absolute left-1/2 top-[-180px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-purple-600/10 blur-3xl" />

                <div className="absolute bottom-[-200px] right-[-100px] h-[420px] w-[420px] rounded-full bg-blue-600/10 blur-3xl" />

                <div className="absolute left-[-180px] top-1/2 h-[320px] w-[320px] -translate-y-1/2 rounded-full bg-indigo-600/[0.05] blur-3xl" />

            </div>


            {/* =================================================
                CONTENT
            ================================================= */}

            <div className="relative flex min-h-screen items-center justify-center px-4 py-10">

                <div className={`w-full ${maxWidth}`}>

                    {/* BRAND */}

                    <div className="mb-8 text-center">

                        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-500/10 shadow-lg shadow-purple-900/10">

                            <span className="text-2xl font-black text-purple-400">
                                G
                            </span>

                        </div>

                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-purple-400">
                            {siteName}
                        </p>

                        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                            {heading}
                        </h1>

                        {subheading && (
                            <p className="mt-2 text-sm text-slate-500">
                                {subheading}
                            </p>
                        )}

                    </div>


                    {/* CARD */}

                    <div className="rounded-3xl border border-white/[0.08] bg-[#0d1020] p-6 shadow-2xl sm:p-8">

                        <div className="mb-7">

                            <div className="flex items-center gap-2">
                                {cardIcon}
                                <h2 className="text-xl font-bold">{cardTitle}</h2>
                            </div>

                            {cardDescription && (
                                <p className="mt-1 text-sm text-slate-500">
                                    {cardDescription}
                                </p>
                            )}

                        </div>

                        {error && (
                            <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                                {success}
                            </div>
                        )}

                        {children}

                        {footer && (
                            <div className="mt-7 border-t border-white/[0.06] pt-5 text-center">
                                {footer}
                            </div>
                        )}

                    </div>

                    <p className="mt-6 text-center text-xs text-slate-600">
                        {resolvedBottomText}
                    </p>

                </div>

            </div>

        </main>
    );
}


// ======================================================
// SECURITY NOTE (shared green banner)
// ======================================================

export function SecurityNote({ text = "Secure gaming account connection" }) {
    return (
        <div className="flex items-center gap-2 rounded-xl border border-green-500/10 bg-green-500/[0.04] px-3 py-2.5">
            <ShieldCheck size={15} className="shrink-0 text-green-400" />
            <span className="text-xs text-slate-400">{text}</span>
        </div>
    );
}
