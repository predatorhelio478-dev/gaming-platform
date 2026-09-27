"use client";

import { Gamepad2, RefreshCw, Wrench } from "lucide-react";

import useSiteSettings from "../../lib/useSiteSettings";


// ======================================================
// MAINTENANCE PAGE
// ======================================================
//
// Rendered by MaintenanceGate in place of every public/user
// page while system.maintenance_mode is ON. Styled to match
// not-found.jsx so it reads as part of the site, not an
// error. The admin panel is never gated.
// ======================================================

export default function MaintenancePage({ onRetry, checking = false }) {

    const { siteName } = useSiteSettings();

    return (

        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050712] px-4 py-12 text-white">

            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/[0.08] blur-[120px]" />

            <div className="pointer-events-none absolute left-[10%] top-[15%] h-40 w-40 rounded-full bg-fuchsia-500/[0.06] blur-[90px]" />

            <div className="pointer-events-none absolute bottom-[10%] right-[10%] h-48 w-48 rounded-full bg-indigo-500/[0.06] blur-[100px]" />

            <div className="pointer-events-none absolute inset-0 opacity-[0.025] [background-image:linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] [background-size:50px_50px]" />

            <section className="relative z-10 w-full max-w-xl text-center">

                <div className="mb-10 flex items-center justify-center gap-4">

                    <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500">
                        <Gamepad2 size={35} />
                    </div>

                    <p className="text-[18px] font-black tracking-tight text-white">
                        {siteName}
                    </p>

                </div>

                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-300">
                    <Wrench size={28} />
                </div>

                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                    We&apos;ll be right back
                </h1>

                <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-400 sm:text-base">
                    {siteName} is undergoing scheduled maintenance. Your account and
                    wallet balance are safe - please check back shortly.
                </p>

                <button
                    type="button"
                    onClick={onRetry}
                    disabled={checking}
                    className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-900/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <RefreshCw size={16} className={checking ? "animate-spin" : ""} />
                    {checking ? "Checking..." : "Try again"}
                </button>

                <p className="mt-6 text-sm text-slate-400">
                    This page refreshes automatically when we&apos;re back online.
                </p>

            </section>

        </main>

    );

}
