"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ShieldAlert, X } from "lucide-react";

import { getPublicSettings } from "../../lib/api";

const STORAGE_KEY = "responsible_gaming_seen_at";
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

// ======================================================
// DAILY RESPONSIBLE GAMING / RISK WARNING POPUP
// ======================================================
//
// Content is admin-manageable (Settings -> Legal category,
// responsible_gaming_popup_* keys) - reusing the existing
// Settings/public-settings architecture rather than a new
// configuration system. Shown once per 24h per browser via a
// plain localStorage timestamp; mounted once at the root
// layout so client-side navigation between pages never
// re-triggers it.

export default function ResponsibleGamingPopup() {

    const pathname = usePathname();

    const [config, setConfig] = useState(null);
    const [visible, setVisible] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {

        setMounted(true);

        const checkAndLoad = async () => {

            try {

                const lastSeenRaw = localStorage.getItem(STORAGE_KEY);
                const lastSeen = lastSeenRaw ? Number(lastSeenRaw) : 0;
                const dueForDisplay = !lastSeen || Date.now() - lastSeen >= TWENTY_FOUR_HOURS_MS;

                if (!dueForDisplay) {
                    return;
                }

                const response = await getPublicSettings();

                const legal = response?.data?.legal || {};

                if (legal.responsible_gaming_popup_enabled === false) {
                    return;
                }

                setConfig({
                    title: legal.responsible_gaming_popup_title || "Play Responsibly",
                    message:
                        legal.responsible_gaming_popup_message ||
                        "This platform involves real financial risk. You can lose the money you play with, so only play with money you can afford to lose. Participation is at your own risk and our full Terms & Conditions apply.",
                    buttonText: legal.responsible_gaming_popup_button_text || "I Understand, Continue",
                    termsUrl: legal.responsible_gaming_popup_terms_url || "/legal-help#terms",
                    siteName: response?.data?.general?.site_name || "Gaming Platform",
                });

                setVisible(true);

            } catch (error) {

                console.error("Responsible Gaming Popup Error:", error);

            }

        };

        checkAndLoad();

    }, []);

    // Never on the admin panel.
    if (!mounted || pathname?.startsWith("/admin")) {
        return null;
    }

    if (!visible || !config) {
        return null;
    }

    const handleClose = () => {

        try {

            localStorage.setItem(STORAGE_KEY, String(Date.now()));

        } catch {
            // Ignore storage failures - just hide for this view.
        }

        setVisible(false);

    };

    return (
        <div className="fixed inset-0 z-[290] flex items-center justify-center p-4">

            <button
                type="button"
                aria-label="Close"
                onClick={handleClose}
                className="absolute inset-0 h-full w-full cursor-default bg-black/75 backdrop-blur-[2px]"
            />

            <div
                role="dialog"
                aria-modal="true"
                className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-amber-500/20 bg-[#12141f] shadow-2xl"
            >

                <div className="flex items-center justify-between border-b border-white/[0.06] bg-gradient-to-r from-violet-600/20 to-fuchsia-500/10 px-5 py-4">
                    <span className="text-sm font-black text-white">{config.siteName}</span>
                    <button
                        type="button"
                        onClick={handleClose}
                        aria-label="Close"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.025] text-slate-500 transition hover:bg-white/[0.06] hover:text-white"
                    >
                        <X size={15} />
                    </button>
                </div>

                <div className="p-5">

                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/[0.08] text-amber-300">
                            <ShieldAlert size={19} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-white">{config.title}</h2>
                            <p className="mt-2 text-sm leading-6 text-slate-400">{config.message}</p>
                        </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3">
                        <a
                            href={config.termsUrl}
                            className="text-xs font-semibold text-violet-400 hover:text-violet-300 hover:underline"
                        >
                            View Terms & Conditions
                        </a>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        className="mt-4 flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-900/20 transition hover:brightness-110"
                    >
                        {config.buttonText}
                    </button>

                </div>

            </div>

        </div>
    );

}
