"use client";

import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    RefreshCw,
    Receipt,
    Radio,
} from "lucide-react";

import AdminHeader from "../../../components/admin/AdminHeader";

import BetStats from "../../../components/admin/bets/BetStats";
import BetFilters from "../../../components/admin/bets/BetFilters";
import BetTable from "../../../components/admin/bets/BetTable";
import BetDetail from "../../../components/admin/bets/BetDetail";

import {
    getAdminBets,
} from "../../../lib/adminApi";

import useSiteSettings from "../../../lib/useSiteSettings";


export default function BetsPage() {

    const { siteName } = useSiteSettings();

    /*
    |--------------------------------------------------------------------------
    | DATA
    |--------------------------------------------------------------------------
    */

    const [bets, setBets] =
        useState([]);

    const [selectedBet, setSelectedBet] =
        useState(null);

    const [summary, setSummary] =
        useState({
            totalBets: 0,
            totalAmount: 0,
            totalPayout: 0,
            wonBets: 0,
            lostBets: 0,
            pendingBets: 0,
        });


    /*
    |--------------------------------------------------------------------------
    | PAGINATION
    |--------------------------------------------------------------------------
    */

    const [pagination, setPagination] =
        useState({
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
        });


    /*
    |--------------------------------------------------------------------------
    | FILTERS
    |--------------------------------------------------------------------------
    */

    const [search, setSearch] =
        useState("");

    const [color, setColor] =
        useState("all");

    const [result, setResult] =
        useState("pending");


    /*
    |--------------------------------------------------------------------------
    | LOADING
    |--------------------------------------------------------------------------
    */

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState("");


    /*
    |--------------------------------------------------------------------------
    | AUTO REFRESH
    |--------------------------------------------------------------------------
    */

    const [autoRefresh, setAutoRefresh] =
        useState(true);

    const [lastRefreshedAt, setLastRefreshedAt] =
        useState(null);


    /*
    |--------------------------------------------------------------------------
    | LOAD BETS
    |--------------------------------------------------------------------------
    */

    const loadBets =
        useCallback(
            async ({
                page = 1,
                showLoader = false,
            } = {}) => {

                try {

                    if (
                        showLoader
                    ) {
                        setLoading(
                            true
                        );
                    } else {
                        setRefreshing(
                            true
                        );
                    }


                    setError("");


                    const response =
                        await getAdminBets({
                            page,
                            limit: 20,
                            search:
                                search.trim(),
                            color,
                            result,
                        });


                    if (
                        !response?.success
                    ) {
                        throw new Error(
                            response?.message ||
                            "Unable to load bets."
                        );
                    }


                    setBets(
                        Array.isArray(
                            response.data
                        )
                            ? response.data
                            : []
                    );


                    setSummary(
                        response.summary ||
                        {
                            totalBets: 0,
                            totalAmount: 0,
                            totalPayout: 0,
                            wonBets: 0,
                            lostBets: 0,
                            pendingBets: 0,
                        }
                    );


                    setPagination(
                        response.pagination ||
                        {
                            page,
                            limit: 20,
                            total: 0,
                            totalPages: 0,
                            hasNextPage:
                                false,
                            hasPreviousPage:
                                false,
                        }
                    );


                    setLastRefreshedAt(
                        new Date()
                    );


                } catch (error) {

                    console.error(
                        "Bets Load Error:",
                        error
                    );


                    setError(
                        error?.message ||
                        "Unable to load bets."
                    );


                } finally {

                    setLoading(false);
                    setRefreshing(false);

                }

            },
            [
                search,
                color,
                result,
            ]
        );

    /*
|--------------------------------------------------------------------------
| INITIAL LOAD
|--------------------------------------------------------------------------
*/

    useEffect(() => {

        loadBets({
            page: 1,
            showLoader: true,
        });

        // Initial load only
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /*
    |--------------------------------------------------------------------------
    | INITIAL / FILTER LOAD
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        const timeout =
            setTimeout(() => {

                loadBets({
                    page: 1,
                    showLoader: false,
                });

            }, 300);


        return () => {
            clearTimeout(timeout);
        };

    }, [
        search,
        color,
        result,
        loadBets,
    ]);


    /*
    |--------------------------------------------------------------------------
    | AUTO REFRESH
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        if (!autoRefresh) {
            return;
        }


        const interval =
            setInterval(() => {

                loadBets({
                    page:
                        pagination.page,
                    showLoader:
                        false,
                });

            }, 10000);


        return () => {
            clearInterval(
                interval
            );
        };

    }, [
        autoRefresh,
        pagination.page,
        loadBets,
    ]);


    /*
    |--------------------------------------------------------------------------
    | MANUAL REFRESH
    |--------------------------------------------------------------------------
    */

    const handleRefresh =
        () => {

            loadBets({
                page:
                    pagination.page,
                showLoader:
                    false,
            });

        };


    /*
    |--------------------------------------------------------------------------
    | RESET
    |--------------------------------------------------------------------------
    */

    const handleReset =
        () => {

            setSearch("");
            setColor("all");
            setResult("all");

        };

    const handleViewBet = (bet) => {
        setSelectedBet(bet);
    };


    /*
    |--------------------------------------------------------------------------
    | PAGINATION
    |--------------------------------------------------------------------------
    */

    const handlePrevious =
        () => {

            if (
                !pagination.hasPreviousPage ||
                refreshing
            ) {
                return;
            }


            loadBets({
                page:
                    pagination.page - 1,
                showLoader:
                    false,
            });

        };


    const handleNext =
        () => {

            if (
                !pagination.hasNextPage ||
                refreshing
            ) {
                return;
            }


            loadBets({
                page:
                    pagination.page + 1,
                showLoader:
                    false,
            });

        };


    const handlePageChange =
        (page) => {

            if (
                refreshing ||
                page < 1 ||
                page >
                pagination.totalPages ||
                page ===
                pagination.page
            ) {
                return;
            }


            loadBets({
                page,
                showLoader:
                    false,
            });

        };


    /*
    |--------------------------------------------------------------------------
    | FORMAT CURRENCY
    |--------------------------------------------------------------------------
    */

    const formatCurrency =
        (value) => {

            return new Intl.NumberFormat(
                "en-IN",
                {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 0,
                }
            ).format(
                Number(
                    value || 0
                )
            );

        };


    /*
    |--------------------------------------------------------------------------
    | FORMAT DATE
    |--------------------------------------------------------------------------
    */

    const formatDate =
        (value) => {

            if (!value) {
                return "—";
            }


            const date =
                new Date(value);


            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {
                return "—";
            }


            return date.toLocaleString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                }
            );

        };


    /*
    |--------------------------------------------------------------------------
    | LAST REFRESH
    |--------------------------------------------------------------------------
    */

    const lastRefreshText =
        lastRefreshedAt
            ? lastRefreshedAt.toLocaleTimeString(
                "en-IN",
                {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                }
            )
            : "—";


    /*
    |--------------------------------------------------------------------------
    | INITIAL LOADING
    |--------------------------------------------------------------------------
    */

    if (loading) {

        return (
            <main className="min-h-screen bg-[#070914] text-white">

                <AdminHeader
                    title="Bets"
                    subtitle="Bet Management"
                    showSocketStatus={
                        false
                    }
                />


                <div className="flex min-h-[70vh] items-center justify-center">

                    <div className="text-center">

                        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-purple-500" />

                        <p className="mt-4 text-sm text-slate-500">
                            Loading bets...
                        </p>

                    </div>

                </div>

            </main>
        );

    }


    /*
    |--------------------------------------------------------------------------
    | PAGE
    |--------------------------------------------------------------------------
    */

    return (
        <main className="min-h-screen bg-[#070914] text-white">

            <AdminHeader
                title="Bets"
                subtitle="Bet Management"
                showSocketStatus={
                    false
                }
            />


            <div className="p-4 sm:p-6 lg:p-8">

                {/* TITLE */}

                <div className="mb-5 rounded-2xl border border-white/[0.06] bg-[#070914] px-5 py-5 sm:px-6">
                    <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

                        <div>

                            <div className="flex items-center gap-2">

                                <Receipt
                                    size={17}
                                    className="text-purple-400"
                                />

                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-400">
                                    Betting Management
                                </p>

                            </div>


                            <h2 className="mt-2 text-2xl font-black">
                                Bets
                            </h2>


                            <p className="mt-2 text-sm text-slate-500">
                                Monitor all player
                                bets and results.
                            </p>

                        </div>


                        {/* ACTIONS */}

                        <div className="flex flex-col gap-2 sm:flex-row">

                            <button
                                type="button"
                                onClick={() =>
                                    setAutoRefresh(
                                        (value) =>
                                            !value
                                    )
                                }
                                className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${autoRefresh
                                    ? "border-green-500/20 bg-green-500/5 text-green-400 hover:bg-green-500/10"
                                    : "border-white/[0.07] bg-white/[0.03] text-slate-500 hover:bg-white/[0.06] hover:text-white"
                                    }`}
                            >

                                <Radio
                                    size={15}
                                />

                                Auto Refresh

                                <span
                                    className={`h-1.5 w-1.5 rounded-full ${autoRefresh
                                        ? "bg-green-400"
                                        : "bg-slate-600"
                                        }`}
                                />

                            </button>


                            <button
                                type="button"
                                disabled={
                                    refreshing
                                }
                                onClick={
                                    handleRefresh
                                }
                                className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >

                                <RefreshCw
                                    size={16}
                                    className={
                                        refreshing
                                            ? "animate-spin"
                                            : ""
                                    }
                                />

                                {refreshing
                                    ? "Refreshing..."
                                    : "Refresh"}

                            </button>

                        </div>

                    </div>


                    {/* REFRESH INFO */}

                    <div className="mb-6 flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">

                        <div className="flex items-center gap-2 text-slate-700">

                            <span
                                className={`h-1.5 w-1.5 rounded-full ${autoRefresh
                                    ? "bg-green-400"
                                    : "bg-slate-600"
                                    }`}
                            />

                            {autoRefresh
                                ? "Automatic refresh every 10 seconds"
                                : "Automatic refresh paused"}

                        </div>


                        <p className="text-slate-700">

                            Last refreshed:{" "}

                            <span className="text-slate-500">
                                {lastRefreshText}
                            </span>

                        </p>

                    </div>
                </div>

                {/* ERROR */}

                {error && (
                    <div className="mb-6 flex flex-col gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.04] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">

                        <p className="text-sm text-red-400">
                            {error}
                        </p>


                        <button
                            type="button"
                            onClick={
                                handleRefresh
                            }
                            className="w-fit cursor-pointer text-xs font-semibold text-red-300 underline"
                        >
                            Retry
                        </button>

                    </div>
                )}


                {/* STATS */}

                <BetStats
                    summary={summary}
                    formatCurrency={
                        formatCurrency
                    }
                />


                {/* FILTERS */}

                <BetFilters
                    search={search}
                    setSearch={
                        setSearch
                    }
                    color={color}
                    setColor={
                        setColor
                    }
                    result={result}
                    setResult={
                        setResult
                    }
                    onReset={
                        handleReset
                    }
                />


                {/* TABLE */}

                <BetTable
                    bets={bets}
                    pagination={
                        pagination
                    }
                    refreshing={
                        refreshing
                    }
                    formatCurrency={
                        formatCurrency
                    }
                    formatDate={
                        formatDate
                    }
                    onView={handleViewBet}
                    onPrevious={
                        handlePrevious
                    }
                    onNext={
                        handleNext
                    }
                    onPageChange={
                        handlePageChange
                    }
                />

                {selectedBet && (
                    <BetDetail
                        bet={selectedBet}
                        onClose={() =>
                            setSelectedBet(null)
                        }
                    />
                )}


                <footer className="py-8 text-center text-xs text-slate-700">
                    {siteName} Admin Control Center
                </footer>

            </div>

        </main>
    );
}