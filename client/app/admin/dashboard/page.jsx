import DashboardClient from "./DashboardClient";

// Just the page name - see app/layout.tsx for how this composes
// into "Dashboard | Site Name - Site Tagline" and where the shared
// meta description comes from.
export const metadata = {
    title: "Dashboard",
};

export default function Page() {
    return <DashboardClient />;
}
