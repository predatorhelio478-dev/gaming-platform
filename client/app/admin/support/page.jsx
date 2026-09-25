import SupportClient from "./SupportClient";

// Just the page name - see app/layout.tsx for how this composes
// into "Support | Site Name - Site Tagline" and where the shared
// meta description comes from.
export const metadata = {
    title: "Support",
};

export default function Page() {
    return <SupportClient />;
}
