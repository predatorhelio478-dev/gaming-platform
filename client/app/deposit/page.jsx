import DepositClient from "./DepositClient";

// Just the page name - see app/layout.tsx for how this composes
// into "Deposit | Site Name - Site Tagline" and where the shared
// meta description comes from.
export const metadata = {
    title: "Deposit",
};

export default function Page() {
    return <DepositClient />;
}
