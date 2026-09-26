"use client";

import {
    useEffect,
    useRef,
    useState,
} from "react";

import { MoreVertical } from "lucide-react";


// ======================================================
// ADMIN ACTIONS MENU (kebab / three-dot dropdown)
// ======================================================
//
// A reusable overflow menu for table row actions - keeps the
// row itself to a handful of high-frequency buttons (View,
// Edit, etc.) while everything else lives behind this menu,
// each with a clear icon + label instead of an unlabeled icon
// button. `items` is an array of:
//   { key, label, icon: LucideIcon, onClick, danger?, disabled? }
// A falsy entry in `items` (e.g. `condition && {...}`) is
// skipped, so callers can conditionally include an action
// inline without pre-filtering the array themselves.

export default function AdminActionsMenu({
    items = [],
    disabled = false,
    align = "right",
}) {

    const [open, setOpen] =
        useState(false);

    const menuRef =
        useRef(null);


    useEffect(() => {

        if (!open) {
            return;
        }

        const handleOutsideClick =
            (event) => {

                if (
                    menuRef.current &&
                    !menuRef.current.contains(event.target)
                ) {
                    setOpen(false);
                }

            };

        const handleEscape =
            (event) => {

                if (event.key === "Escape") {
                    setOpen(false);
                }

            };

        document.addEventListener("mousedown", handleOutsideClick);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
            document.removeEventListener("keydown", handleEscape);
        };

    }, [open]);


    const visibleItems =
        items.filter(Boolean);


    if (visibleItems.length === 0) {
        return null;
    }


    return (

        <div ref={menuRef} className="relative inline-block">

            <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                disabled={disabled}
                title="More actions"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.07] text-slate-500 transition hover:border-white/[0.14] hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
                <MoreVertical size={15} />
            </button>

            {open && (

                <div
                    className={`absolute top-[calc(100%+6px)] z-[80] min-w-[200px] overflow-hidden rounded-xl border border-white/[0.08] bg-[#0d101d] p-1.5 shadow-2xl shadow-black/40 ${
                        align === "right" ? "right-0" : "left-0"
                    }`}
                >

                    {visibleItems.map((item) => (

                        <button
                            key={item.key}
                            type="button"
                            onClick={() => {

                                setOpen(false);

                                item.onClick?.();

                            }}
                            disabled={item.disabled}
                            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
                                item.danger
                                    ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                    : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
                            }`}
                        >

                            {item.icon && (
                                <item.icon size={14} className="shrink-0" />
                            )}

                            <span>{item.label}</span>

                        </button>

                    ))}

                </div>

            )}

        </div>

    );

}
