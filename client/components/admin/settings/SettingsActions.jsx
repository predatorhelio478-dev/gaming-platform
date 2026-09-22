"use client";

export default function SettingsActions({
    saving,
    resetting,
    onSave,
    onReset,
}) {
    return (
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
                type="button"
                disabled={
                    saving || resetting
                }
                onClick={onReset}
                className="h-11 rounded-xl border border-white/[0.07] bg-white/[0.025] px-5 text-sm font-semibold text-slate-400 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
            >
                {resetting
                    ? "Resetting..."
                    : "Reset Defaults"}
            </button>

            <button
                type="button"
                disabled={
                    saving || resetting
                }
                onClick={onSave}
                className="h-11 rounded-xl bg-purple-600 px-6 text-sm font-bold text-white transition hover:bg-purple-500 disabled:opacity-40"
            >
                {saving
                    ? "Saving..."
                    : "Save Changes"}
            </button>
        </div>
    );
}