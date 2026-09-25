"use client";

import { useEffect, useState, useCallback } from "react";
import { Copy, Check, Users, Gift } from "lucide-react";

import UserLayout from "../../components/user/UserLayout";
import UserPageHeader from "../../components/user/UserPageHeader";
import UserStatCard from "../../components/user/UserStatCard";
import { LoadingState, ErrorState } from "../../components/user/PageState";
import Pagination from "../../components/user/Pagination";
import DataTable, { DataTableRow, DataTableCell } from "../../components/user/DataTable";
import { getReferralInfo, getReferredUsers } from "../../lib/api";

// ======================================================
// REFERRALS PAGE
// ======================================================

const PAGE_LIMIT = 20;

export default function ReferralsPage() {

    const [info, setInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);

    const [referredUsers, setReferredUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(true);
    const [usersError, setUsersError] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const loadInfo = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await getReferralInfo();

            if (response?.success) {
                setInfo(response);
            }
        } catch (err) {
            setError(err.message || "Unable to load referral info.");
        } finally {
            setLoading(false);
        }
    }, []);

    const loadReferredUsers = useCallback(async () => {
        try {
            setUsersLoading(true);
            setUsersError("");

            const response = await getReferredUsers({ page, limit: PAGE_LIMIT });

            if (response?.users) {
                setReferredUsers(response.users);
                setTotal(Number(response.total) || 0);
                setTotalPages(Math.max(Number(response.totalPages) || 1, 1));
            }
        } catch (err) {
            setUsersError(err.message || "Unable to load referred users.");
        } finally {
            setUsersLoading(false);
        }
    }, [page]);

    useEffect(() => {
        loadInfo();
    }, [loadInfo]);

    useEffect(() => {
        loadReferredUsers();
    }, [loadReferredUsers]);

    const inviteLink =
        info?.referralCode && typeof window !== "undefined"
            ? `${window.location.origin}/register?ref=${info.referralCode}`
            : "";

    const handleCopy = async () => {
        if (!inviteLink) {
            return;
        }

        try {
            await navigator.clipboard.writeText(inviteLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard API unavailable - user can still select/copy manually.
        }
    };

    return (
        <UserLayout title="Referrals">
            <div className="p-4 sm:p-6 lg:p-8">

                <UserPageHeader
                    icon={Gift}
                    eyebrow="Rewards"
                    title="Invite & Earn"
                    description="Share your referral link. When a friend you refer places their first real-money bet, you earn a bonus."
                />

              <div className="mx-auto max-w-3xl">

                <div>
                    {loading ? (
                        <LoadingState label="Loading referral info..." />
                    ) : error ? (
                        <ErrorState message={error} onRetry={loadInfo} />
                    ) : (
                        <>
                            <div className="rounded-2xl border border-violet-500/15 bg-violet-500/[0.06] p-5">

                                <p className="text-xs uppercase tracking-wide text-slate-400">Your Referral Code</p>
                                <p className="mt-1 text-2xl font-black text-violet-300">{info?.referralCode}</p>

                                <div className="mt-4 flex overflow-hidden rounded-xl border border-white/10 bg-[#050a19]">
                                    <input
                                        type="text"
                                        readOnly
                                        value={inviteLink}
                                        className="min-w-0 flex-1 bg-transparent px-4 py-3 text-xs text-slate-300 outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleCopy}
                                        className="flex items-center gap-1.5 bg-violet-600 px-4 text-xs font-bold text-white transition hover:bg-violet-500"
                                    >
                                        {copied ? <Check size={14} /> : <Copy size={14} />}
                                        {copied ? "Copied" : "Copy"}
                                    </button>
                                </div>

                            </div>

                            <div className="mt-4 grid gap-4 sm:grid-cols-2">

                                <UserStatCard
                                    icon={Users}
                                    label="Referred Users"
                                    value={info?.referredCount ?? 0}
                                    hint={`${info?.qualifiedCount ?? 0} qualified (placed a real bet)`}
                                    color="cyan"
                                />

                                <UserStatCard
                                    icon={Gift}
                                    label="Bonus Earned"
                                    value={`₹${Number(info?.bonusEarned || 0).toLocaleString("en-IN")}`}
                                    hint="Credited to your bonus balance - see the Wallet page"
                                    color="emerald"
                                />

                            </div>
                        </>
                    )}
                </div>

              </div>

                <div className="mt-8">
                {usersLoading ? (
                    <LoadingState label="Loading referred users..." />
                ) : usersError ? (
                    <ErrorState message={usersError} onRetry={loadReferredUsers} />
                ) : (
                    <DataTable
                        title="Referred Users"
                        subtitle="Your Referrals"
                        count={referredUsers.length}
                        minWidth="700px"
                        empty={referredUsers.length === 0}
                        emptyTitle="No referrals yet"
                        emptyMessage="You haven't referred anyone yet."
                        headers={["Name", "Username", "Status", "Joined"]}
                    >
                        {referredUsers.map((referredUser) => (
                            <DataTableRow key={referredUser._id}>
                                <DataTableCell className="text-slate-300">{referredUser.fullName}</DataTableCell>
                                <DataTableCell className="text-slate-500">@{referredUser.username}</DataTableCell>
                                <DataTableCell>
                                    {referredUser.referralQualified ? (
                                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
                                            Qualified
                                        </span>
                                    ) : (
                                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-400">
                                            Pending
                                        </span>
                                    )}
                                </DataTableCell>
                                <DataTableCell className="text-slate-500">
                                    {new Date(referredUser.createdAt).toLocaleDateString("en-IN")}
                                </DataTableCell>
                            </DataTableRow>
                        ))}
                    </DataTable>
                )}

                {!usersLoading && !usersError && referredUsers.length > 0 && (
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        total={total}
                        limit={PAGE_LIMIT}
                        loading={usersLoading}
                        itemLabel="referred users"
                        onPageChange={setPage}
                    />
                )}
                </div>

            </div>
        </UserLayout>
    );
}
