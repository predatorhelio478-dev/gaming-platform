"use client";

import {
    useEffect,
    useRef,
} from "react";

import {
    Check,
    Minus,
} from "lucide-react";


// ======================================================
// ADMIN CHECKBOX
// ======================================================
//
// The admin panel's checkbox, matching the custom one on the
// admin login page ("Remember me"): rounded box on the panel's
// input fill, purple when checked, a dash when only some rows
// are selected (`indeterminate`), and the panel's purple focus
// ring. Keeps a real <input type="checkbox"> underneath, so
// keyboard, screen readers and forms behave natively.
// ======================================================

export default function AdminCheckbox({
    checked = false,
    indeterminate = false,
    disabled = false,
    onChange,
    ariaLabel,
    title,
}) {

    const inputRef =
        useRef(null);

    const mixed =
        indeterminate && !checked;

    // `indeterminate` only exists as a DOM property.
    useEffect(() => {

        if (inputRef.current) {

            inputRef.current.indeterminate = mixed;

        }

    }, [mixed]);

    return (

        <span
            title={title}
            className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center align-middle"
        >

            <input
                ref={inputRef}
                type="checkbox"
                aria-label={ariaLabel}
                aria-checked={mixed ? "mixed" : checked}
                checked={checked}
                disabled={disabled}
                onChange={(event) => onChange?.(event.target.checked)}
                className={`peer absolute inset-0 h-4 w-4 cursor-pointer appearance-none rounded-md border transition-all duration-150 hover:border-white/30 checked:border-purple-500 checked:bg-purple-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/40 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0d101d] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/15 ${mixed
                    ? "border-purple-500 bg-purple-600"
                    : "border-white/15 bg-[#070914]"
                    }`}
            />

            {mixed ? (

                <Minus
                    size={11}
                    strokeWidth={3}
                    className="pointer-events-none relative z-10 text-white"
                />

            ) : (

                <Check
                    size={11}
                    strokeWidth={3}
                    className="pointer-events-none relative z-10 scale-75 text-white opacity-0 transition-all duration-150 peer-checked:scale-100 peer-checked:opacity-100"
                />

            )}

        </span>

    );

}
