import GameControlClient from "./GameControlClient";

// Just the page name - see app/layout.tsx for how this composes
// into "Game Control | Site Name - Site Tagline" and where the
// shared meta description comes from.
export const metadata = {
    title: "Game Control",
};

export default function Page() {
    return <GameControlClient />;
}
