import LeaderboardClient from "./LeaderboardClient";

// Just the page name - see app/layout.tsx for how this composes
// into "Leaderboard | Site Name - Site Tagline" and where the
// shared meta description comes from.
export const metadata = {
    title: "Leaderboard",
};

export default function Page() {
    return <LeaderboardClient />;
}
