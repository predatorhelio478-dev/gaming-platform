"use client";

import { useCallback, useEffect, useState } from "react";

// ======================================================
// RATE-LIMIT COUNTDOWN
// ======================================================
//
// Turns a server-given `retryAfterSeconds` into a live,
// refresh-surviving countdown. The unlock TIMESTAMP (not just
// the countdown) is what's persisted, so a page refresh
// recomputes the remaining time correctly instead of resetting
// the clock. storageKey should be unique per form (e.g.
// "login_rate_limit") so unrelated forms don't share a lockout.

export default function useRateLimitCountdown(storageKey) {

    const [unlockAt, setUnlockAt] = useState(null);
    const [remaining, setRemaining] = useState(0);

    // Restore any still-active lockout on mount (survives refresh).
    useEffect(() => {
        if (!storageKey) return;

        try {
            const stored = sessionStorage.getItem(storageKey);
            if (stored) {
                const target = Number(stored);
                if (Number.isFinite(target) && target > Date.now()) {
                    setUnlockAt(target);
                } else {
                    sessionStorage.removeItem(storageKey);
                }
            }
        } catch {
            // sessionStorage unavailable (private mode etc) - just skip persistence.
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!unlockAt) {
            setRemaining(0);
            return;
        }

        const tick = () => {
            const secs = Math.max(0, Math.ceil((unlockAt - Date.now()) / 1000));
            setRemaining(secs);

            if (secs <= 0) {
                if (storageKey) {
                    try { sessionStorage.removeItem(storageKey); } catch {}
                }
                setUnlockAt(null);
            }
        };

        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [unlockAt, storageKey]);

    const start = useCallback((seconds) => {
        if (!seconds || seconds <= 0) return;

        const target = Date.now() + seconds * 1000;
        setUnlockAt(target);

        if (storageKey) {
            try { sessionStorage.setItem(storageKey, String(target)); } catch {}
        }
    }, [storageKey]);

    const minutes = Math.floor(remaining / 60).toString().padStart(2, "0");
    const seconds = Math.floor(remaining % 60).toString().padStart(2, "0");

    return {
        remaining,
        active: remaining > 0,
        formatted: `${minutes}:${seconds}`,
        start,
    };
}
