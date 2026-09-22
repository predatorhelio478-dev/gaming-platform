"use client";

import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    AlertCircle,
    CheckCircle2,
    Loader2,
} from "lucide-react";

import AdminHeader from "../../../components/admin/AdminHeader";
import SettingsSidebar from "../../../components/admin/settings/SettingsSidebar";
import SettingsHeader from "../../../components/admin/settings/SettingsHeader";
import SettingsTable from "../../../components/admin/settings/SettingsTable";
import SettingsActions from "../../../components/admin/settings/SettingsActions";
import SettingsAlert from "../../../components/admin/settings/SettingsAlert";

import {
    getAdminSettingsByCategory,
    updateAdminSettings,
    resetAdminSettings,
} from "../../../lib/adminApi";

const DEFAULT_CATEGORY =
    "general";

export default function SettingsPage() {
    const [
        activeCategory,
        setActiveCategory,
    ] = useState(
        DEFAULT_CATEGORY
    );

    const [
        settings,
        setSettings,
    ] = useState([]);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        saving,
        setSaving,
    ] = useState(false);

    const [
        resetting,
        setResetting,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");

    const [
        success,
        setSuccess,
    ] = useState("");

    const fetchSettings =
        useCallback(async () => {
            try {
                setLoading(true);
                setError("");
                setSuccess("");

                const data =
                    await getAdminSettingsByCategory(
                        activeCategory
                    );

                const receivedSettings =
                    Array.isArray(
                        data.settings
                    )
                        ? data.settings
                        : Array.isArray(
                            data.data
                        )
                            ? data.data
                            : [];

                setSettings(
                    receivedSettings
                );
            } catch (err) {
                console.error(
                    "Fetch Settings Error:",
                    err
                );

                setError(
                    err.message ||
                    "Unable to load settings."
                );

                setSettings([]);
            } finally {
                setLoading(false);
            }
        }, [activeCategory]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleCategoryChange =
        (category) => {
            if (
                category ===
                activeCategory
            ) {
                return;
            }

            setActiveCategory(
                category
            );
        };

    const handleSettingChange =
        (key, value) => {
            setSettings(
                (currentSettings) =>
                    currentSettings.map(
                        (setting) =>
                            setting.key ===
                                key
                                ? {
                                    ...setting,
                                    value,
                                }
                                : setting
                    )
            );

            setSuccess("");
            setError("");
        };
    const handleSave = async () => {
        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const settingsPayload =
                settings.map(
                    ({ key, value }) => ({
                        key,
                        value,
                    })
                );

            const data =
                await updateAdminSettings(
                    activeCategory,
                    settingsPayload
                );

            // Refresh saved values
            await fetchSettings();

            // Show success AFTER refresh
            setSuccess(
                data.message ||
                "Settings updated successfully."
            );
        } catch (err) {
            console.error(
                "Save Settings Error:",
                err
            );

            setError(
                err.message ||
                "Unable to save settings."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleReset =
        async () => {
            const confirmed =
                window.confirm(
                    `Reset all ${activeCategory} settings to their default values?`
                );

            if (!confirmed) {
                return;
            }

            try {
                setResetting(true);
                setError("");
                setSuccess("");

                const data =
                    await resetAdminSettings(
                        activeCategory
                    );

                setSuccess(
                    data.message ||
                    "Settings reset successfully."
                );

                await fetchSettings();
            } catch (err) {
                console.error(
                    "Reset Settings Error:",
                    err
                );

                setError(
                    err.message ||
                    "Unable to reset settings."
                );
            } finally {
                setResetting(false);
            }
        };

    return (
        <main className="min-h-screen bg-[#070914] text-white">

            <AdminHeader title="Settings" subtitle="Admin Configuration" showSocketStatus={false} />

            <div className="p-4 sm:p-6 lg:p-8">
                <SettingsHeader
                    category={
                        activeCategory
                    }
                    saving={saving}
                    resetting={
                        resetting
                    }
                    onSave={
                        handleSave
                    }
                    onReset={
                        handleReset
                    }
                />

                <div className="flex flex-col gap-6 lg:flex-row">
                    <SettingsSidebar
                        activeCategory={
                            activeCategory
                        }
                        onCategoryChange={
                            handleCategoryChange
                        }
                    />


                    <div className="min-w-0 flex-1">
                        {/* SETTINGS ALERT */}
                        {(error || success) && (
                            <SettingsAlert
                                type={
                                    error
                                        ? "error"
                                        : "success"
                                }
                                message={
                                    error || success
                                }
                                onClose={() => {
                                    setError("");
                                    setSuccess("");
                                }}
                            />
                        )}
                        <SettingsTable
                            settings={
                                settings
                            }
                            loading={
                                loading
                            }
                            onChange={
                                handleSettingChange
                            }
                        />

                        {!loading &&
                            settings.length >
                            0 && (
                                <SettingsActions
                                    saving={
                                        saving
                                    }
                                    resetting={
                                        resetting
                                    }
                                    onSave={
                                        handleSave
                                    }
                                    onReset={
                                        handleReset
                                    }
                                />
                            )}
                    </div>
                </div>
            </div>
        </main>
    );
}

function AlertMessage({
    type,
    message,
}) {
    const success =
        type === "success";

    return (
        <div
            className={`mb-5 flex items-start gap-3 rounded-xl border px-4 py-3 ${success
                ? "border-green-500/15 bg-green-500/5 text-green-400"
                : "border-red-500/15 bg-red-500/5 text-red-400"
                }`}
        >
            {success ? (
                <CheckCircle2
                    size={17}
                    className="mt-0.5 shrink-0"
                />
            ) : (
                <AlertCircle
                    size={17}
                    className="mt-0.5 shrink-0"
                />
            )}

            <p className="text-sm">
                {message}
            </p>
        </div>
    );
}