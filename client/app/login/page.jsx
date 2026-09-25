import LoginClient from "./LoginClient";

// Just the page name - see app/layout.tsx for how this composes
// into "Login | Site Name - Site Tagline" and where the shared
// meta description comes from.
export const metadata = {
    title: "Login",
};

export default function Page() {
    return <LoginClient />;
}
