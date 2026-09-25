import AdminsClient from "./AdminsClient";

// Just the page name - see app/layout.tsx for how this composes
// into "Admins | Site Name - Site Tagline" and where the shared
// meta description comes from.
export const metadata = {
    title: "Admins",
};

export default function Page() {
    return <AdminsClient />;
}
