import WithdrawalClient from "./WithdrawalClient";

// Just the page name - see app/layout.tsx for how this composes
// into "Withdrawal | Site Name - Site Tagline" and where the
// shared meta description comes from.
export const metadata = {
    title: "Withdrawal",
};

export default function Page() {
    return <WithdrawalClient />;
}
