import TransactionsClient from "./TransactionsClient";

// Just the page name - see app/layout.tsx for how this composes
// into "Transactions | Site Name - Site Tagline" and where the
// shared meta description comes from.
export const metadata = {
    title: "Transactions",
};

export default function Page() {
    return <TransactionsClient />;
}
