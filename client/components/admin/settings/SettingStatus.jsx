"use client";

import AdminBadge from "../ui/AdminBadge";

export default function SettingStatus({
    setting,
}) {
    return (
        <div className="flex flex-wrap items-center gap-1.5">
            {setting.isPublic && (
                <AdminBadge variant="success">
                    Public
                </AdminBadge>
            )}

            {setting.isSensitive && (
                <AdminBadge variant="danger">
                    Sensitive
                </AdminBadge>
            )}

            {!setting.isPublic &&
                !setting.isSensitive && (
                    <AdminBadge variant="default">
                        Private
                    </AdminBadge>
                )}

            <AdminBadge
                variant={
                    setting.isActive
                        ? "success"
                        : "warning"
                }
            >
                {setting.isActive
                    ? "Active"
                    : "Inactive"}
            </AdminBadge>
        </div>
    );
}