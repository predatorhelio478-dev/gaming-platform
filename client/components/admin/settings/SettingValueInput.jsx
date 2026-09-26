"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import AdminDropdown from "../ui/AdminDropdown";

// ==========================================================
// FIXED-CHOICE SETTINGS
// ==========================================================
//
// A handful of settings are enum-like (a small fixed set of
// valid backend values) rather than free text - rendering
// them as a dropdown instead of a text input stops an admin
// from ever saving a value the backend doesn't recognize.
// Keyed by "category.key" so a same-named key in a different
// category is never accidentally affected.
// ==========================================================

const FIXED_CHOICE_SETTINGS = {
    "payment.payment_mode": {
        label: "Payment Mode",
        options: [
            { value: "automatic", label: "Automatic" },
            { value: "manual", label: "Manual" },
        ],
    },
    "payment.withdrawal_mode": {
        label: "Withdrawal Mode",
        options: [
            { value: "automatic", label: "Automatic" },
            { value: "manual", label: "Manual" },
        ],
    },
    "payment.razorpay_mode": {
        label: "Razorpay Mode",
        options: [
            { value: "test", label: "Test" },
            { value: "live", label: "Live" },
        ],
    },
};

export default function SettingValueInput({
    setting,
    value,
    onChange,
}) {
    const [showSensitive, setShowSensitive] =
        useState(false);

    const disabled =
        setting.isSensitive === true;

    const type =
        setting.type ||
        detectType(value);

    const fixedChoice =
        FIXED_CHOICE_SETTINGS[
            `${setting.category}.${setting.key}`
        ];

    if (fixedChoice) {
        return (
            <AdminDropdown
                value={value}
                onChange={onChange}
                options={fixedChoice.options}
                placeholder={fixedChoice.label}
                className="w-full min-w-[200px]"
            />
        );
    }

    if (type === "boolean") {
        return (
            <button
                type="button"
                disabled={disabled}
                onClick={() =>
                    !disabled &&
                    onChange(!Boolean(value))
                }
                className={`relative h-6 w-11 rounded-full transition ${Boolean(value)
                        ? "bg-purple-600"
                        : "bg-slate-700"
                    } ${disabled
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer"
                    }`}
            >
                <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${Boolean(value)
                            ? "left-6"
                            : "left-1"
                        }`}
                />
            </button>
        );
    }

    if (
        type === "object" ||
        type === "array"
    ) {
        let formattedValue = "";

        try {
            formattedValue =
                typeof value === "string"
                    ? value
                    : JSON.stringify(
                        value,
                        null,
                        2
                    );
        } catch {
            formattedValue = "";
        }

        return (
            <textarea
                value={formattedValue}
                disabled={disabled}
                onChange={(event) =>
                    onChange(
                        parseJsonValue(
                            event.target.value
                        )
                    )
                }
                rows={4}
                className="w-full min-w-[280px] rounded-xl border border-white/[0.07] bg-[#070914] px-3 py-2.5 font-mono text-xs text-slate-300 outline-none transition placeholder:text-slate-500 focus:border-purple-500/40 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter valid JSON"
            />
        );
    }

    if (type === "number") {
        return (
            <input
                type="number"
                value={
                    value === null ||
                        value === undefined
                        ? ""
                        : value
                }
                disabled={disabled}
                onChange={(event) =>
                    onChange(
                        event.target.value === ""
                            ? ""
                            : Number(
                                event.target.value
                            )
                    )
                }
                className="h-11 w-full min-w-[180px] rounded-xl border border-white/[0.07] bg-[#070914] px-3 text-sm text-slate-300 outline-none transition focus:border-purple-500/40 disabled:cursor-not-allowed disabled:opacity-50"
            />
        );
    }

    return (
        <div className="relative">
            <input
                type={
                    setting.isSensitive &&
                        !showSensitive
                        ? "password"
                        : "text"
                }
                value={
                    value === null ||
                        value === undefined
                        ? ""
                        : String(value)
                }
                disabled={disabled}
                onChange={(event) =>
                    onChange(event.target.value)
                }
                className="h-11 w-full min-w-[240px] rounded-xl border border-white/[0.07] bg-[#070914] px-3 pr-10 text-sm text-slate-300 outline-none transition focus:border-purple-500/40 disabled:cursor-not-allowed disabled:opacity-50"
            />

            {setting.isSensitive && (
                <button
                    type="button"
                    onClick={() =>
                        setShowSensitive(
                            (current) =>
                                !current
                        )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 transition hover:text-slate-300"
                >
                    {showSensitive ? (
                        <EyeOff size={15} />
                    ) : (
                        <Eye size={15} />
                    )}
                </button>
            )}
        </div>
    );
}

function detectType(value) {
    if (Array.isArray(value)) {
        return "array";
    }

    if (value === null) {
        return "object";
    }

    return typeof value;
}

function parseJsonValue(value) {
    if (!value.trim()) {
        return "";
    }

    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
}