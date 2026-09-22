"use client";

import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    Check,
    ChevronDown,
} from "lucide-react";

// ======================================================
// USER DROPDOWN
// ======================================================
//
// Mirrors components/admin/ui/AdminDropdown.jsx exactly so
// User-facing filter bars (My Bets, Transactions, Deposit,
// Withdrawal) use the same dropdown look/behavior as the
// Admin Rounds page's filters.

export default function UserDropdown({
    value,
    onChange,
    options = [],
    placeholder = "Select",
    className = "",
}) {
    const [open, setOpen] = useState(false);

    const dropdownRef = useRef(null);

    useEffect(() => {

        const handleOutsideClick = (event) => {

            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setOpen(false);
            }

        };

        document.addEventListener("mousedown", handleOutsideClick);

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };

    }, []);

    const selectedOption = options.find((option) => option.value === value);

    return (
        <div ref={dropdownRef} className={`relative ${className}`}>

            <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                className="flex h-11 w-full cursor-pointer items-center justify-between rounded-xl border border-white/[0.07] bg-[#070914] px-3 text-sm text-slate-400 outline-none transition hover:border-white/[0.12] hover:text-slate-300"
            >

                <span className={selectedOption ? "text-slate-300" : "text-slate-600"}>
                    {selectedOption?.label || placeholder}
                </span>

                <ChevronDown
                    size={16}
                    className={`shrink-0 text-slate-600 transition-transform ${open ? "rotate-180" : ""}`}
                />

            </button>

            {open && (

                <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[70] overflow-hidden rounded-xl border border-white/[0.08] bg-[#0d101d] p-1.5 shadow-2xl shadow-black/40">

                    {options.map((option) => {

                        const active = option.value === value;

                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    onChange?.(option.value);
                                    setOpen(false);
                                }}
                                className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition ${
                                    active
                                        ? "bg-purple-500/10 text-purple-300"
                                        : "text-slate-500 hover:bg-white/[0.04] hover:text-white"
                                }`}
                            >

                                <span>{option.label}</span>

                                {active && <Check size={15} className="text-purple-400" />}

                            </button>
                        );

                    })}

                </div>

            )}

        </div>
    );
}
