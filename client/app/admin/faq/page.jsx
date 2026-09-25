import FaqClient from "./FaqClient";

// Just the page name - see app/layout.tsx for how this composes
// into "FAQ | Site Name - Site Tagline" and where the shared meta
// description comes from.
export const metadata = {
    title: "FAQ",
};

export default function Page() {
    return <FaqClient />;
}
