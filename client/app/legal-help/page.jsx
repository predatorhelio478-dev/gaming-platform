import LegalHelpContent from "../../components/legal/LegalHelpContent";

// Just the page name - the root layout's title.template composes
// this into "Legal & Help | Site Name - Site Tagline" automatically,
// and the shared meta description comes from the layout too (see
// app/layout.tsx) rather than being hardcoded per page.
export const metadata = {
    title: "Legal & Help",
};

export default function LegalHelpPage() {
    return <LegalHelpContent />;
}
