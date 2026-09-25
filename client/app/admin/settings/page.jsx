import SettingsClient from "./SettingsClient";

// Just the page name - see app/layout.tsx for how this composes
// into "Settings | Site Name - Site Tagline" and where the shared
// meta description comes from.
export const metadata = {
    title: "Settings",
};

export default function Page() {
    return <SettingsClient />;
}
