"use client";

import {
    Settings2,
} from "lucide-react";

import AdminTable, {
    AdminTableRow,
    AdminTableCell,
} from "../ui/AdminTable";

import AdminBadge from "../ui/AdminBadge";

import SettingValueInput from "./SettingValueInput";
import SettingStatus from "./SettingStatus";

export default function SettingsTable({
    settings,
    loading,
    onChange,
}) {
    return (
        <AdminTable
            title="Settings"
            subtitle="Manage platform configuration"
            count={settings.length}
            icon={<Settings2 size={19} />}
            minWidth="1100px"
            empty={
                !loading &&
                settings.length === 0
            }
            emptyTitle="No settings found"
            emptyMessage="There are no settings available for this category."
        >
            {loading ? (
                <LoadingRows />
            ) : (
                settings.map((setting) => (
                    <AdminTableRow
                        key={setting.key}
                    >
                        <AdminTableCell>
                            <div>
                                <p className="text-sm font-semibold text-slate-200">
                                    {formatLabel(
                                        setting.key
                                    )}
                                </p>

                                {setting.description && (
                                    <p className="mt-1 max-w-[260px] text-[11px] leading-5 text-slate-600">
                                        {
                                            setting.description
                                        }
                                    </p>
                                )}
                            </div>
                        </AdminTableCell>

                        <AdminTableCell>
                            <code className="rounded-lg bg-white/[0.035] px-2 py-1 text-[11px] text-slate-500">
                                {setting.key}
                            </code>
                        </AdminTableCell>

                        <AdminTableCell>
                            <SettingValueInput
                                setting={
                                    setting
                                }
                                value={
                                    setting.value
                                }
                                onChange={(
                                    value
                                ) =>
                                    onChange(
                                        setting.key,
                                        value
                                    )
                                }
                            />
                        </AdminTableCell>

                        <AdminTableCell>
                            <AdminBadge variant="info">
                                {setting.type}
                            </AdminBadge>
                        </AdminTableCell>

                        <AdminTableCell>
                            <SettingStatus
                                setting={
                                    setting
                                }
                            />
                        </AdminTableCell>
                    </AdminTableRow>
                ))
            )}
        </AdminTable>
    );
}

function LoadingRows() {
    return Array.from(
        { length: 5 },
        (_, index) => (
            <tr
                key={index}
                className="border-b border-white/[0.04]"
            >
                {Array.from(
                    { length: 5 },
                    (_, cellIndex) => (
                        <td
                            key={cellIndex}
                            className="px-5 py-5"
                        >
                            <div className="h-10 animate-pulse rounded-xl bg-white/[0.035]" />
                        </td>
                    )
                )}
            </tr>
        )
    );
}

function formatLabel(key) {
    return key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) =>
            char.toUpperCase()
        );
}