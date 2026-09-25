import UsersClient from "./UsersClient";

// Just the page name - see app/layout.tsx for how this composes
// into "Users | Site Name - Site Tagline" and where the shared
// meta description comes from.
export const metadata = {
    title: "Users",
};

export default function Page() {
    return <UsersClient />;
}
