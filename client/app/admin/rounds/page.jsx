import RoundsClient from "./RoundsClient";

// Just the page name - see app/layout.tsx for how this composes
// into "Rounds | Site Name - Site Tagline" and where the shared
// meta description comes from.
export const metadata = {
    title: "Rounds",
};

export default function Page() {
    return <RoundsClient />;
}
