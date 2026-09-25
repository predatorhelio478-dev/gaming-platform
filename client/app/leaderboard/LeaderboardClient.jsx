"use client";

import { useEffect, useState, useCallback } from "react";
import { Trophy, Medal } from "lucide-react";

import UserLayout from "../../components/user/UserLayout";
import UserPageHeader from "../../components/user/UserPageHeader";
import { LoadingState, ErrorState, EmptyState } from "../../components/user/PageState";
import Pagination from "../../components/user/Pagination";
import { getLeaderboard } from "../../lib/api";
import { getStoredUser } from "../../lib/useAuth";

// ======================================================
// LEADERBOARD PAGE
// ======================================================
//
// Ranking is computed entirely server-side (see
// leaderboardService.js) from actual betting profit - the API
// response itself never contains any amount/balance, only
// rank + username, so there is nothing financial to
// accidentally leak here even in the UI.

const PAGE_LIMIT = 20;

const RANK_STYLES = {
    1: "border-amber-400/40 bg-amber-400/10 text-amber-300",
    2: "border-slate-300/30 bg-slate-300/10 text-slate-200",
    3: "border-orange-500/30 bg-orange-500/10 text-orange-300",
};

export default function LeaderboardPage() {

    const currentUser = getStoredUser();

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const loadLeaderboard = useCallback(async () => {

        try {

            setLoading(true);
            setError("");

            const response = await getLeaderboard({ page, limit: PAGE_LIMIT });

            if (response?.success) {

                setRows(response.data || []);
                setTotal(Number(response.total) || 0);
                setTotalPages(Math.max(Number(response.totalPages) || 1, 1));

            } else {

                setError(response?.message || "Unable to load leaderboard.");

            }

        } catch (err) {

            setError(err.message || "Unable to load leaderboard.");

        } finally {

            setLoading(false);

        }

    }, [page]);

    useEffect(() => {

        loadLeaderboard();

    }, [loadLeaderboard]);

    const getInitials = (name) => {

        if (!name) {
            return "?";
        }

        return String(name).trim().slice(0, 2).toUpperCase();

    };

    return (
        <UserLayout title="Leaderboard">
            <div className="p-4 sm:p-6 lg:p-8">

                <UserPageHeader
                    icon={Trophy}
                    eyebrow="Rankings"
                    title="Leaderboard"
                    description="Top players ranked by betting performance. Financial amounts are kept private and are never shown here."
                />

              <div className="mx-auto max-w-3xl">

                <div>
                    {loading ? (
                        <LoadingState label="Loading leaderboard..." />
                    ) : error ? (
                        <ErrorState message={error} onRetry={loadLeaderboard} />
                    ) : rows.length === 0 ? (
                        <EmptyState message="No ranked players yet - place a bet to appear on the leaderboard." />
                    ) : (
                        <div className="space-y-2">
                            {rows.map((row) => {

                                const isMe =
                                    currentUser?.username &&
                                    row.username &&
                                    currentUser.username.toLowerCase() === row.username.toLowerCase();

                                return (
                                    <div
                                        key={`${row.rank}-${row.username}`}
                                        className={`flex items-center gap-4 rounded-2xl border px-4 py-3.5 transition ${
                                            isMe
                                                ? "border-violet-500/40 bg-violet-500/[0.08]"
                                                : "border-white/[0.06] bg-white/[0.02]"
                                        }`}
                                    >

                                        <div
                                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-xs font-black ${
                                                RANK_STYLES[row.rank] || "border-white/10 bg-white/[0.03] text-slate-400"
                                            }`}
                                        >
                                            {row.rank <= 3 ? <Medal size={16} /> : `#${row.rank}`}
                                        </div>

                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 text-xs font-black text-violet-300">
                                            {getInitials(row.username)}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-white">
                                                @{row.username}
                                                {isMe && <span className="ml-2 text-[10px] font-bold text-violet-400">(You)</span>}
                                            </p>
                                        </div>

                                        {row.rank <= 3 && (
                                            <span className="shrink-0 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                                                Rank {row.rank}
                                            </span>
                                        )}

                                    </div>
                                );

                            })}
                        </div>
                    )}

                    {!loading && !error && rows.length > 0 && (
                        <Pagination
                            page={page}
                            totalPages={totalPages}
                            total={total}
                            limit={PAGE_LIMIT}
                            loading={loading}
                            itemLabel="players"
                            onPageChange={setPage}
                        />
                    )}
                </div>

              </div>

            </div>
        </UserLayout>
    );
}
