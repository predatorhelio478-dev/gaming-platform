import ForgotPasswordClient from "./ForgotPasswordClient";

// Just the page name - see app/layout.tsx for how this composes
// into "Forgot Password | Site Name - Site Tagline" and where the
// shared meta description comes from.
export const metadata = {
    title: "Forgot Password",
};

export default function Page() {
    return <ForgotPasswordClient />;
}
