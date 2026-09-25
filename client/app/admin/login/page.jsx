import AdminLoginClient from "./AdminLoginClient";

// Just the page name - see app/layout.tsx for how this composes
// into "Admin Login | Site Name - Site Tagline" and where the
// shared meta description comes from.
export const metadata = {
    title: "Admin Login",
};

export default function Page() {
    return <AdminLoginClient />;
}
