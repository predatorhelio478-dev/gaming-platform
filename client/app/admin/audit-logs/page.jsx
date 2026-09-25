import AuditLogsClient from "./AuditLogsClient";

// Just the page name - see app/layout.tsx for how this composes
// into "Audit Logs | Site Name - Site Tagline" and where the
// shared meta description comes from.
export const metadata = {
    title: "Audit Logs",
};

export default function Page() {
    return <AuditLogsClient />;
}
