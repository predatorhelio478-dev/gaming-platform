import ReferralsClient from "./ReferralsClient";

// Just the page name - see app/layout.tsx for how this composes
// into "Referrals | Site Name - Site Tagline" and where the shared
// meta description comes from.
export const metadata = {
    title: "Referrals",
};

export default function Page() {
    return <ReferralsClient />;
}
