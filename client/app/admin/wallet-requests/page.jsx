import WalletRequestsClient from "./WalletRequestsClient";

// Just the page name - see app/layout.tsx for how this composes
// into "Deposits & Withdrawals | Site Name - Site Tagline" and
// where the shared meta description comes from.
export const metadata = {
    title: "Deposits & Withdrawals",
};

export default function Page() {
    return <WalletRequestsClient />;
}
