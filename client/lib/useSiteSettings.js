"use client";

import { useEffect, useState } from "react";
import { getPublicSettings } from "./api";

// Simple module-level cache so every component using this hook
// shares one fetch of /settings/public instead of each firing
// its own request on mount.
let cachedPromise = null;

const DEFAULTS = {
    siteName: "Gamzzones",
    siteDescription: "Gaming Platform",
    payoutMultiplier: 2,
};

const fetchSiteSettings = () => {

    if (!cachedPromise) {

        cachedPromise = getPublicSettings()
            .then((response) => {

                const general = response?.data?.general || {};

                const game = response?.data?.game || {};

                return {
                    siteName: general.site_name || DEFAULTS.siteName,
                    siteDescription: general.site_description || DEFAULTS.siteDescription,
                    payoutMultiplier: Number(game.payout_multiplier) || DEFAULTS.payoutMultiplier,
                };

            })
            .catch(() => DEFAULTS);

    }

    return cachedPromise;

};

export default function useSiteSettings() {

    const [settings, setSettings] = useState(DEFAULTS);

    useEffect(() => {

        let mounted = true;

        fetchSiteSettings().then((result) => {
            if (mounted) setSettings(result);
        });

        return () => { mounted = false; };

    }, []);

    return settings;

}
