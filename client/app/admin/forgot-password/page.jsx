import AdminForgotPasswordClient from "./AdminForgotPasswordClient";

// Just the page name - see app/layout.tsx for how this composes
// into "Admin Forgot Password | Site Name - Site Tagline" and
// where the shared meta description comes from.
export const metadata = {
    title: "Admin Forgot Password",
};

export default function Page() {
    return <AdminForgotPasswordClient />;
}
