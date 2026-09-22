"use client";

import {
    RotateCcw,
    Save,
    Settings as SettingsIcon,
} from "lucide-react";

// ======================================================
// SETTINGS HEADER
// ======================================================
//
// Mirrors the Admin Rounds page's "PAGE TITLE + ACTIONS" card
// exactly (icon + eyebrow row, large bold title, description,
// right-aligned actions, sub-info row below) instead of this
// page's own one-off dot-marker layout.

export default function SettingsHeader({
    category,
    saving,
    resetting,
    onSave,
    onReset,
}) {
    return (
        <div className="mb-5 rounded-2xl border border-white/[0.06] bg-[#070914] px-5 py-5 sm:px-6">

            <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

                <div>
                    <div className="flex items-center gap-2">
                        <SettingsIcon size={17} className="text-purple-400" />

                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-400">
                            Admin Configuration
                        </p>
                    </div>

                    <h2 className="mt-2 text-2xl font-black text-white">
                        Platform Settings
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                        Manage your platform configuration, limits, game controls and system preferences.
                    </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <button
                        type="button"
                        disabled={saving || resetting}
                        onClick={onReset}
                        className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <RotateCcw size={16} />

                        {resetting ? "Resetting..." : "Reset"}
                    </button>

                    <button
                        type="button"
                        disabled={saving || resetting}
                        onClick={onSave}
                        className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-purple-900/20 transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Save size={16} />

                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>

            </div>

            <div className="flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">
                <p className="text-slate-700">
                    Current category:{" "}
                    <span className="font-semibold capitalize text-slate-500">
                        {category}
                    </span>
                </p>
            </div>

        </div>
    );
}
