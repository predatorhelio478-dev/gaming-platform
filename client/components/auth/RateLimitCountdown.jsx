"use client";

// Presentational only - pairs with useRateLimitCountdown().
// Renders nothing once the countdown reaches zero so callers
// can safely render it unconditionally alongside a fallback error.

export default function RateLimitCountdown({ formatted, message = "Too many attempts." }) {
    return (
        <span>
            {message} Try again in <span className="font-mono font-bold">{formatted}</span>
        </span>
    );
}
