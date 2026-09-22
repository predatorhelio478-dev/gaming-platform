"use client";

import { useEffect, useSyncExternalStore } from "react";

import { getWallet } from "./api";
import { getStoredToken } from "./useAuth";

/*
 * ==========================================
 * SHARED WALLET STORE
 * ==========================================
 *
 * Root-cause fix for the "0 balance until you visit /wallet"
 * bug: every page used to run its own
 * `useEffect(() => { loadWallet(); }, [])` with an internal
 * `if (!auth.isAuthenticated) return;` guard. useAuth() reads
 * localStorage via useSyncExternalStore, whose FIRST client
 * render must match the server snapshot (always "logged out")
 * to avoid a hydration mismatch - so on a hard refresh, that
 * first effect run always saw isAuthenticated === false,
 * bailed out, and (because the effect's dependency array was
 * empty) never ran again once auth corrected itself a moment
 * later.
 *
 * This module is a single shared store (same pattern as
 * useAuth.js's own external store) that every page/header
 * subscribes to instead of fetching independently: one fetch,
 * shared everywhere, re-fetched reactively whenever auth
 * actually changes - never gated behind a one-shot mount
 * effect.
 */

const WALLET_EVENT = "walletchange";

const emptyWallet = () => ({
    balance: 0,
    testBalance: 0,
    bonusBalance: 0,
    winningBalance: 0,
    loading: true,
    loaded: false,
});

let walletState = emptyWallet();

let listeners = new Set();

let inFlight = null;

const notify = () => {
    listeners.forEach((listener) => listener());
};

const setState = (patch) => {
    walletState = { ...walletState, ...patch };
    notify();
};

const subscribe = (callback) => {
    listeners.add(callback);
    return () => listeners.delete(callback);
};

const getSnapshot = () => walletState;

// Same object shape for server/first-client-render - a plain
// module-level object, no window access, so no hydration
// mismatch risk here (unlike token/user, wallet has no
// meaningful "server" value anyway - it's always fetched
// client-side after auth is known).
const getServerSnapshot = () => walletState;


// ==========================================
// FETCH (shared in-flight promise - concurrent
// callers from multiple components never trigger
// more than one real HTTP request)
// ==========================================

const fetchWallet = (force = false) => {

    if (typeof window === "undefined") {
        return Promise.resolve();
    }

    if (!getStoredToken()) {
        return Promise.resolve();
    }

    if (inFlight && !force) {
        return inFlight;
    }

    setState({ loading: true });

    inFlight = getWallet()
        .then((response) => {

            if (response?.wallet) {

                setState({

                    balance: Number(response.wallet.balance || 0),

                    testBalance: Number(response.wallet.testBalance || 0),

                    bonusBalance: Number(response.wallet.bonusBalance || 0),

                    winningBalance: Number(response.wallet.winningBalance || 0),

                    loading: false,

                    loaded: true,

                });

            } else {

                setState({ loading: false });

            }

        })
        .catch((error) => {

            console.error("Wallet Fetch Error:", error?.message);

            setState({ loading: false });

        })
        .finally(() => {

            inFlight = null;

        });

    return inFlight;

};

const resetWallet = () => {

    inFlight = null;

    walletState = { ...emptyWallet(), loading: false };

    notify();

};


// ==========================================
// REACT TO AUTH CHANGES GLOBALLY (registered
// once per page load, not per component)
// ==========================================

if (typeof window !== "undefined") {

    window.addEventListener("authchange", () => {

        if (getStoredToken()) {

            fetchWallet(true);

        } else {

            resetWallet();

        }

    });

    window.addEventListener("storage", (event) => {

        if (event.key === "token") {

            if (getStoredToken()) {

                fetchWallet(true);

            } else {

                resetWallet();

            }

        }

    });

}


// ==========================================
// PUBLIC: force a fresh fetch (call after a
// deposit/bet/payout/withdrawal so every
// subscriber - header included - updates)
// ==========================================

export const refreshWallet = () => fetchWallet(true);


// ==========================================
// HOOK
// ==========================================

export default function useWallet() {

    const state =
        useSyncExternalStore(
            subscribe,
            getSnapshot,
            getServerSnapshot
        );


    useEffect(() => {

        const token = getStoredToken();

        // NOTE: intentionally does NOT also require
        // `!walletState.loading` here. The module's default
        // state (emptyWallet()) starts with `loading: true` as
        // a pessimistic default so the header never flashes a
        // fake ₹0 before the first fetch resolves - but that
        // meant this exact condition, if it also checked
        // `!walletState.loading`, was always false on a fresh
        // page load/refresh/direct navigation (nothing had
        // actually started loading yet, the flag just claimed
        // it had), so fetchWallet() was NEVER called unless an
        // "authchange"/"storage" event happened to fire first
        // (e.g. right after a login redirect) - on a plain
        // reload or direct URL open with an already-valid
        // token, no such event fires, and the wallet was stuck
        // showing "Loading..." forever. fetchWallet() itself
        // already dedupes concurrent calls via the module-level
        // `inFlight` promise, so guarding only on `!loaded` here
        // is both correct and safe against duplicate requests
        // from multiple components mounting useWallet() at once.

        if (token && !walletState.loaded) {

            fetchWallet();

        }

        if (!token && (walletState.loaded || walletState.loading)) {

            resetWallet();

        }

    }, []);


    return {
        ...state,
        refresh: refreshWallet,
    };

}
