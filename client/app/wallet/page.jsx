import WalletClient from "./WalletClient";

// Just the page name - see app/layout.tsx for how this composes
// into "Wallet | Site Name - Site Tagline" and where the shared
// meta description comes from.
export const metadata = {
    title: "Wallet",
};

export default function Page() {
    return <WalletClient />;
}
