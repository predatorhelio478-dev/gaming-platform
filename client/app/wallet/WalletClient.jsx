"use client";

import { Wallet as WalletIcon, ArrowDownToLine, ArrowUpFromLine, FlaskConical, Gift } from "lucide-react";

import UserLayout from "../../components/user/UserLayout";
import UserPageHeader from "../../components/user/UserPageHeader";
import UserStatCard from "../../components/user/UserStatCard";
import { LoadingState, ErrorState } from "../../components/user/PageState";
import useWallet from "../../lib/useWallet";

// ======================================================
// WALLET PAGE
// ======================================================
//
// Sourced from the shared useWallet() store (see lib/useWallet.js)
// instead of its own getWallet() call - avoids a duplicate
// fetch alongside the header's own subscription, and avoids
// the "0 until you visit this page" bug this page previously
// only fixed for ITSELF.

export default function WalletPage() {

    const wallet = useWallet();

    const hasError = !wallet.loading && !wallet.loaded;

    const formatAmount = (value) =>
        `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

    return (
        <UserLayout title="Wallet">
            <div className="p-4 sm:p-6 lg:p-8">

                <UserPageHeader
                    icon={WalletIcon}
                    eyebrow="Account"
                    title="Wallet"
                    description="Your real, test, and bonus balances - each is a separate ledger."
                />

                <div>
                    {wallet.loading ? (
                        <LoadingState label="Loading wallet..." />
                    ) : hasError ? (
                        <ErrorState message="Unable to load wallet." onRetry={wallet.refresh} />
                    ) : (
                        <>
                            <div className="grid gap-4 sm:grid-cols-3">

                                <UserStatCard
                                    icon={WalletIcon}
                                    label="Real Balance"
                                    value={formatAmount(wallet.balance)}
                                    hint="Withdrawable"
                                    color="emerald"
                                />

                                <UserStatCard
                                    icon={FlaskConical}
                                    label="Test Balance"
                                    value={formatAmount(wallet.testBalance)}
                                    hint="Practice money - not withdrawable"
                                    color="cyan"
                                />

                                <UserStatCard
                                    icon={Gift}
                                    label="Bonus Balance"
                                    value={formatAmount(wallet.bonusBalance)}
                                    hint="Bet-only - not directly withdrawable"
                                    color="violet"
                                />

                            </div>

                            <div className="mt-6 flex flex-col gap-3 sm:flex-row">

                                <a
                                    href="/deposit"
                                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-900/20 transition hover:brightness-110"
                                >
                                    <ArrowDownToLine size={16} />
                                    Deposit
                                </a>

                                <a
                                    href="/withdrawal"
                                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-white/[0.06]"
                                >
                                    <ArrowUpFromLine size={16} />
                                    Withdraw
                                </a>

                            </div>

                            <div className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-xs leading-6 text-slate-500">
                                <p>
                                    Deposits/withdrawals affect your <span className="text-white">Real</span> balance
                                    only. Test balance is a one-time welcome credit for practice betting and
                                    never converts to real money. Bonus balance comes from referrals - up to 30% of
                                    every real-money bet is automatically covered from Bonus balance, and if that
                                    bet wins, the bonus portion returns to Bonus balance as-is (it never converts
                                    to real money).
                                </p>
                            </div>
                        </>
                    )}
                </div>

            </div>
        </UserLayout>
    );
}

