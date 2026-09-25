import BetsClient from "./BetsClient";

// Just the page name - see app/layout.tsx for how this composes
// into "My Bets | Site Name - Site Tagline" and where the shared
// meta description comes from.
export const metadata = {
    title: "My Bets",
};

export default function Page() {
    return <BetsClient />;
}
