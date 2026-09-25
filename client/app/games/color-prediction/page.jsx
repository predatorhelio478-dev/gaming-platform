import ColorPredictionClient from "./ColorPredictionClient";

// Just the page name - see app/layout.tsx for how this composes
// into "Color Prediction | Site Name - Site Tagline" and where the
// shared meta description comes from.
export const metadata = {
    title: "Color Prediction",
};

export default function Page() {
    return <ColorPredictionClient />;
}
