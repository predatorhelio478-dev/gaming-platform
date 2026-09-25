import PayoutsClient from "./PayoutsClient";

// Just the page name - see app/layout.tsx for how this composes
// into "Payouts | Site Name - Site Tagline" and where the shared
// meta description comes from.
export const metadata = {
    title: "Payouts",
};

export default function Page() {
    return <PayoutsClient />;
}
