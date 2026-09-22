"use client";

import { useSyncExternalStore, useMemo } from "react";

/*
 * ==========================================
 * AUTH SESSION HELPERS
 * ==========================================
 *
 * Centralizes the localStorage("token"/"user") read/write
 * that was previously duplicated across UserSidebar,
 * UserLayout, GuestOnly, and the color-prediction page.
 * A same-tab "authchange" event keeps every mounted
 * useAuth() consumer in sync without a Context provider
 * (the browser's native "storage" event only fires for
 * OTHER tabs, not the tab that made the change).
 *
 * Uses useSyncExternalStore (the React-recommended way to
 * subscribe to state that lives outside React, like
 * localStorage) rather than useEffect+setState, so reads
 * stay synchronous and consistent with concurrent rendering.
 */

const AUTH_EVENT = "authchange";

const subscribe = (callback) => {
    window.addEventListener("storage", callback);
    window.addEventListener(AUTH_EVENT, callback);

    return () => {
        window.removeEventListener("storage", callback);
        window.removeEventListener(AUTH_EVENT, callback);
    };
};

const getTokenSnapshot = () => {
    if (typeof window === "undefined") {
        return null;
    }

    return localStorage.getItem("token");
};

const getUserRawSnapshot = () => {
    if (typeof window === "undefined") {
        return null;
    }

    return localStorage.getItem("user");
};

const getServerSnapshot = () => null;

export const getStoredToken = getTokenSnapshot;

export const getStoredUser = () => {
    const raw = getUserRawSnapshot();

    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

export const setAuthSession = (token, user) => {
    if (typeof window === "undefined") {
        return;
    }

    localStorage.setItem("token", token);

    if (user) {
        localStorage.setItem("user", JSON.stringify(user));
    }

    window.dispatchEvent(new Event(AUTH_EVENT));
};

export const clearAuthSession = () => {
    if (typeof window === "undefined") {
        return;
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.dispatchEvent(new Event(AUTH_EVENT));
};

export default function useAuth() {

    const token = useSyncExternalStore(
        subscribe,
        getTokenSnapshot,
        getServerSnapshot
    );

    const userRaw = useSyncExternalStore(
        subscribe,
        getUserRawSnapshot,
        getServerSnapshot
    );

    const user = useMemo(() => {

        if (!userRaw) {
            return null;
        }

        try {
            return JSON.parse(userRaw);
        } catch (error) {
            return null;
        }

    }, [userRaw]);

    return {
        isAuthenticated: Boolean(token),
        ready: true,
        token,
        user,
        logout: clearAuthSession,
    };

}
