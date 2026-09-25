import RegisterClient from "./RegisterClient";

// Just the page name - see app/layout.tsx for how this composes
// into "Register | Site Name - Site Tagline" and where the shared
// meta description comes from.
export const metadata = {
    title: "Register",
};

export default function Page() {
    return <RegisterClient />;
}
