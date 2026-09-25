"use client";

import { useEffect, useState, useCallback, useRef } from "react";

import { Receipt } from "lucide-react";

import UserLayout from "../../components/user/UserLayout";
import UserPageHeader from "../../components/user/UserPageHeader";
import UserFilters from "../../components/user/UserFilters";
import { LoadingState, ErrorState } from "../../components/user/PageState";
import StatusBadge from "../../components/user/StatusBadge";
import Pagination from "../../components/user/Pagination";
import DataTable, { DataTableRow, DataTableCell } from "../../components/user/DataTable";
import { getMyBets } from "../../lib/api";

// ======================================================
// MY BETS PAGE
// ======================================================

const COLOR_DOT = {
    red: "bg-red-500",
    green: "bg-emerald-500",
    blue: "bg-blue-500",
};

const PAGE_LIMIT = 20;

export default function MyBetsPage() {

    const [bets, setBets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const [colorFilter, setColorFilter] = useState("all");
    const [resultFilter, setResultFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const loadBets = useCallback(async (targetPage = page) => {
        try {
            setLoading(true);
            setError("");

            const response = await getMyBets({
                page: targetPage,
                limit: PAGE_LIMIT,
                color: colorFilter,
                result: resultFilter,
                search,
                dateFrom,
                dateTo,
            });

            if (response?.bets) {
                setBets(response.bets);
                setTotal(Number(response.total) || 0);
                setTotalPages(Math.max(Number(response.totalPages) || 1, 1));
            }
        } catch (err) {
            setError(err.message || "Unable to load your bets.");
        } finally {
            setLoading(false);
        }
    }, [page, colorFilter, resultFilter, search, dateFrom, dateTo]);

    // Page navigation (Pagination component) - fetches immediately.
    useEffect(() => {
        loadBets(page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    // Filter changes - debounced, always resets to page 1 in one fetch
    // (mirrors the Admin Rounds page's own filter-debounce pattern).
    // Skipped on mount since the page-navigation effect above already
    // performs the initial fetch.
    const isFirstFilterRun = useRef(true);

    useEffect(() => {

        if (isFirstFilterRun.current) {
            isFirstFilterRun.current = false;
            return;
        }

        const timeout = setTimeout(() => {
            setPage(1);
            loadBets(1);
        }, 400);

        return () => clearTimeout(timeout);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [colorFilter, resultFilter, search, dateFrom, dateTo]);

    return (
        <UserLayout title="My Bets">
            <div className="p-4 sm:p-6 lg:p-8">

                <UserPageHeader
                    icon={Receipt}
                    eyebrow="Gaming"
                    title="My Bets"
                    description="Your Color Prediction bet history."
                />

                <UserFilters
                    search={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="Search round number..."
                    filters={[
                        {
                            key: "color",
                            label: "Color",
                            value: colorFilter,
                            onChange: setColorFilter,
                            placeholder: "All Colors",
                            options: [
                                { value: "all", label: "All Colors" },
                                { value: "red", label: "Red" },
                                { value: "green", label: "Green" },
                                { value: "blue", label: "Blue" },
                            ],
                        },
                        {
                            key: "result",
                            label: "Result",
                            value: resultFilter,
                            onChange: setResultFilter,
                            placeholder: "All Results",
                            options: [
                                { value: "all", label: "All Results" },
                                { value: "pending", label: "Pending" },
                                { value: "won", label: "Won" },
                                { value: "lost", label: "Lost" },
                            ],
                        },
                    ]}
                    dateRange={{
                        from: dateFrom,
                        to: dateTo,
                        onFromChange: setDateFrom,
                        onToChange: setDateTo,
                    }}
                />

                <div className="mt-6">
                    {loading ? (
                        <LoadingState label="Loading bets..." />
                    ) : error ? (
                        <ErrorState message={error} onRetry={loadBets} />
                    ) : (
                        <DataTable
                            title="Bet History"
                            subtitle="All Bets"
                            count={bets.length}
                            minWidth="1000px"
                            empty={bets.length === 0}
                            emptyTitle="No bets yet"
                            emptyMessage="You haven't placed any bets yet."
                            headers={["Round", "Color", "Amount", "Mode", "Result", "Payout", "Payout Status", "Date"]}
                        >
                            {bets.map((bet) => (
                                <DataTableRow key={bet._id}>
                                    <DataTableCell className="text-slate-400">
                                        #{bet.round?.roundNumber ?? "-"}
                                    </DataTableCell>
                                    <DataTableCell>
                                        <span className="inline-flex items-center gap-2">
                                            <span
                                                className={`h-2.5 w-2.5 rounded-full ${
                                                    COLOR_DOT[bet.color] || "bg-slate-500"
                                                }`}
                                            />
                                            <span className="capitalize text-slate-300">{bet.color}</span>
                                        </span>
                                    </DataTableCell>
                                    <DataTableCell className="font-semibold text-white">
                                        ₹{Number(bet.amount).toLocaleString("en-IN")}
                                    </DataTableCell>
                                    <DataTableCell className="capitalize text-slate-400">
                                        {bet.walletMode || "real"}
                                    </DataTableCell>
                                    <DataTableCell>
                                        <StatusBadge status={bet.result} />
                                    </DataTableCell>
                                    <DataTableCell className="text-emerald-400">
                                        {bet.payout > 0
                                            ? `₹${Number(bet.payout).toLocaleString("en-IN")}`
                                            : "-"}
                                    </DataTableCell>
                                    <DataTableCell>
                                        {bet.payoutInfo ? (
                                            <div className="flex flex-col gap-1">
                                                <StatusBadge status={bet.payoutInfo.status} />
                                                {bet.payoutInfo.attempts > 1 && (
                                                    <span className="text-[10px] text-slate-600">
                                                        {bet.payoutInfo.attempts} attempt{bet.payoutInfo.attempts > 1 ? "s" : ""}
                                                    </span>
                                                )}
                                                {bet.payoutInfo.reason && (
                                                    <span className="max-w-[220px] text-[10px] leading-4 text-amber-400/90">
                                                        {bet.payoutInfo.reason}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-slate-600">-</span>
                                        )}
                                    </DataTableCell>
                                    <DataTableCell className="text-slate-500">
                                        {new Date(bet.createdAt).toLocaleString("en-IN")}
                                    </DataTableCell>
                                </DataTableRow>
                            ))}
                        </DataTable>
                    )}

                    {!loading && !error && bets.length > 0 && (
                        <Pagination
                            page={page}
                            totalPages={totalPages}
                            total={total}
                            limit={PAGE_LIMIT}
                            loading={loading}
                            itemLabel="bets"
                            onPageChange={setPage}
                        />
                    )}
                </div>

            </div>
        </UserLayout>
    );
}
