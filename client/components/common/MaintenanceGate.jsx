"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import MaintenancePage from "./MaintenancePage";
import { MAINTENANCE_EVENT } from "../../lib/api";


const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// How often the maintenance page re-checks whether the site is
// back, so visitors don't have to refresh by hand.
const RECHECK_INTERVAL_MS = 30 * 1000;


// ======================================================
// MAINTENANCE GATE
// ======================================================
//
// Wraps the whole app in the root layout. Shows
// MaintenancePage instead of the normal page on every
// non-/admin route while system.maintenance_mode is ON.
//
// - `initialMaintenance` comes from the root layout's
//   server-side settings fetch, so the first paint is
//   already correct (no flash of the real site).
// - Any API call that gets a 503 MAINTENANCE_MODE (e.g.
//   maintenance switched on while a user is mid-session)
//   flips the gate on immediately via MAINTENANCE_EVENT.
// - While gated, it polls /settings/public and reloads the
//   page once maintenance is switched off.
//
// The backend (maintenanceMiddleware) is the real
// enforcement - this is only the user-facing presentation.
// ======================================================

const fetchMaintenanceMode = async () => {

    const response = await fetch(`${API_URL}/settings/public`, {
        cache: "no-store",
    });

    const data = await response.json();

    return data?.data?.system?.maintenance_mode === true;

};

export default function MaintenanceGate({ initialMaintenance = false, children }) {

    const pathname = usePathname();

    const [maintenance, setMaintenance] = useState(initialMaintenance);

    const [checking, setChecking] = useState(false);

    const isAdminRoute = pathname?.startsWith("/admin");

    const recheck = useCallback(async () => {

        setChecking(true);

        try {

            const stillOn = await fetchMaintenanceMode();

            if (!stillOn) {

                // Full reload so every page re-fetches the data
                // its failed maintenance-time requests missed.
                window.location.reload();

                return;

            }

        } catch {

            // Backend unreachable - stay on the maintenance page.

        } finally {

            setChecking(false);

        }

    }, []);

    useEffect(() => {

        const handleMaintenance = () => setMaintenance(true);

        window.addEventListener(MAINTENANCE_EVENT, handleMaintenance);

        return () => window.removeEventListener(MAINTENANCE_EVENT, handleMaintenance);

    }, []);

    useEffect(() => {

        if (!maintenance || isAdminRoute) {

            return undefined;

        }

        const interval = setInterval(recheck, RECHECK_INTERVAL_MS);

        return () => clearInterval(interval);

    }, [maintenance, isAdminRoute, recheck]);

    if (maintenance && !isAdminRoute) {

        return <MaintenancePage onRetry={recheck} checking={checking} />;

    }

    return children;

}
