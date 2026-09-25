import EmailTemplatesClient from "./EmailTemplatesClient";

// Just the page name - see app/layout.tsx for how this composes
// into "Email Templates | Site Name - Site Tagline" and where the
// shared meta description comes from.
export const metadata = {
    title: "Email Templates",
};

export default function Page() {
    return <EmailTemplatesClient />;
}
