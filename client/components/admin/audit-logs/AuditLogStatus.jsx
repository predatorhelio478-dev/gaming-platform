"use client";

import AdminBadge from "../ui/AdminBadge";

export function AuditActionBadge({
    action,
}) {
    const normalized =
        String(action || "")
            .toLowerCase();

    let variant = "default";

    if (
        normalized.includes("delete")
    ) {
        variant = "danger";
    } else if (
        normalized.includes("reset")
    ) {
        variant = "warning";
    } else if (
        normalized.includes("create") ||
        normalized.includes("login")
    ) {
        variant = "success";
    } else if (
        normalized.includes("update")
    ) {
        variant = "info";
    }

    return (
        <AdminBadge variant={variant}>
            {formatValue(action)}
        </AdminBadge>
    );
}

export function AuditActorBadge({
    actorType,
}) {
    const normalized =
        String(actorType || "")
            .toLowerCase();

    let variant = "default";

    if (normalized === "admin") {
        variant = "purple";
    } else if (
        normalized === "user"
    ) {
        variant = "info";
    } else if (
        normalized === "system"
    ) {
        variant = "warning";
    }

    return (
        <AdminBadge variant={variant}>
            {actorType || "system"}
        </AdminBadge>
    );
}

export function formatValue(value) {
    if (!value) {
        return "—";
    }

    return String(value)
        .replace(/_/g, " ")
        .replace(
            /\b\w/g,
            (char) =>
                char.toUpperCase()
        );
}