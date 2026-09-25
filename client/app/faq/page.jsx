import FaqContent from "../../components/legal/FaqContent";

// Just the page name - the root layout's title.template composes
// this into "FAQ | Site Name - Site Tagline" automatically, and
// the shared meta description comes from the layout too (see
// app/layout.tsx) rather than being hardcoded per page.
export const metadata = {
    title: "FAQ",
};

export default function FaqPage() {
    return <FaqContent />;
}
