"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    RefreshCw,
    RotateCcw,
    Timer,
    Radio,
} from "lucide-react";

import AdminHeader from "../../../components/admin/AdminHeader";

import RoundFilters from "../../../components/admin/rounds/RoundFilters";
import RoundStats from "../../../components/admin/rounds/RoundStats";
import RoundTable from "../../../components/admin/rounds/RoundsTable";
import RoundDetail from "../../../components/admin/rounds/RoundDetail";

import {
    getCurrentAdmin,
    getAdminRounds,
    getAdminRoundById,
} from "../../../lib/adminApi";

import useSiteSettings from "../../../lib/useSiteSettings";


export default function RoundsPage() {

    const { siteName } = useSiteSettings();

    /*
    |--------------------------------------------------------------------------
    | ADMIN
    |--------------------------------------------------------------------------
    */

    const [admin, setAdmin] =
        useState(null);


    /*
    |--------------------------------------------------------------------------
    | ROUNDS
    |--------------------------------------------------------------------------
    */

    const [rounds, setRounds] =
        useState([]);

    const [selectedRound, setSelectedRound] =
        useState(null);


    /*
    |--------------------------------------------------------------------------
    | ROUND DETAIL
    |--------------------------------------------------------------------------
    */

    const [roundDetailLoading, setRoundDetailLoading] =
        useState(false);

    const [roundDetailError, setRoundDetailError] =
        useState("");


    /*
    |--------------------------------------------------------------------------
    | LOADING
    |--------------------------------------------------------------------------
    */

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);


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
    | TIMER
    |--------------------------------------------------------------------------
    */

    const [remainingSeconds, setRemainingSeconds] =
        useState(0);


    /*
    |--------------------------------------------------------------------------
    | ERROR
    |--------------------------------------------------------------------------
    */

    const [error, setError] =
        useState("");


    /*
    |--------------------------------------------------------------------------
    | FILTERS
    |--------------------------------------------------------------------------
    */

    const [search, setSearch] =
        useState("");

    const [statusFilter, setStatusFilter] =
        useState("all");

    const [resultFilter, setResultFilter] =
        useState("all");


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
    | SUMMARY
    |--------------------------------------------------------------------------
    */

    const [summary, setSummary] =
        useState({
            totalRounds: 0,
            totalPlayers: 0,
            totalBets: 0,
            totalAmount: 0,
            totalPayout: 0,
        });


    /*
    |--------------------------------------------------------------------------
    | LOAD ADMIN
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        let mounted = true;

        const loadAdmin = async () => {

            try {

                const response =
                    await getCurrentAdmin();

                if (
                    mounted &&
                    response?.success
                ) {
                    setAdmin(
                        response.admin
                    );
                }

            } catch (error) {

                console.error(
                    "Rounds Admin Error:",
                    error
                );

            }

        };

        loadAdmin();

        return () => {
            mounted = false;
        };

    }, []);

    /*
    |--------------------------------------------------------------------------
    | LOAD ROUNDS
    |--------------------------------------------------------------------------
    */

    const loadRounds = useCallback(
        async ({
            page = 1,
            showLoader = false,
            searchValue = search,
            statusValue = statusFilter,
            resultValue = resultFilter,
        } = {}) => {

            try {

                if (showLoader) {
                    setLoading(true);
                } else {
                    setRefreshing(true);
                }

                setError("");


                const response =
                    await getAdminRounds({
                        page,
                        limit: 20,

                        search:
                            String(
                                searchValue || ""
                            ).trim(),

                        status:
                            statusValue || "all",

                        result:
                            resultValue || "all",
                    });


                if (!response?.success) {

                    throw new Error(
                        response?.message ||
                        "Unable to load rounds."
                    );

                }


                /*
                |--------------------------------------------------------------------------
                | DATA
                |--------------------------------------------------------------------------
                */

                const newRounds =
                    Array.isArray(
                        response.data
                    )
                        ? response.data
                        : [];


                setRounds(
                    newRounds
                );


                /*
                |--------------------------------------------------------------------------
                | PAGINATION
                |--------------------------------------------------------------------------
                */

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


                /*
                |--------------------------------------------------------------------------
                | SUMMARY
                |--------------------------------------------------------------------------
                */

                setSummary(
                    response.summary ||
                    {
                        totalRounds: 0,
                        totalPlayers: 0,
                        totalBets: 0,
                        totalAmount: 0,
                        totalPayout: 0,
                    }
                );


                /*
                |--------------------------------------------------------------------------
                | LAST REFRESH
                |--------------------------------------------------------------------------
                */

                setLastRefreshedAt(
                    new Date()
                );


            } catch (error) {

                console.error(
                    "Rounds Load Error:",
                    error
                );


                setError(
                    error?.message ||
                    "Unable to load rounds."
                );


            } finally {

                setLoading(false);
                setRefreshing(false);

            }

        },

        []
    );

    /*
    |--------------------------------------------------------------------------
    | INITIAL LOAD
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        loadRounds({
            page: 1,
            showLoader: true,
        });

    }, [
        loadRounds,
    ]);


    /*
|--------------------------------------------------------------------------
| SEARCH / FILTER CHANGE
|--------------------------------------------------------------------------
*/

    useEffect(() => {

        const timeout =
            setTimeout(() => {

                loadRounds({
                    page: 1,
                    showLoader: false,

                    searchValue:
                        search,

                    statusValue:
                        statusFilter,

                    resultValue:
                        resultFilter,
                });

            }, 400);


        return () => {

            clearTimeout(
                timeout
            );

        };

    }, [
        search,
        statusFilter,
        resultFilter,
        loadRounds,
    ]);


    /*
    |--------------------------------------------------------------------------
    | AUTO REFRESH
    |--------------------------------------------------------------------------
    |
    | Every 10 seconds.
    |
    */

    useEffect(() => {

        if (!autoRefresh) {
            return;
        }


        const interval =
            setInterval(() => {

                loadRounds({
                    page:
                        pagination.page,
                    showLoader: false,
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
        loadRounds,
    ]);


    /*
    |--------------------------------------------------------------------------
    | CURRENT ROUND
    |--------------------------------------------------------------------------
    |
    | First active round from current
    | loaded page.
    |
    */

    const currentRound =
        useMemo(() => {

            if (
                !Array.isArray(
                    rounds
                )
            ) {
                return null;
            }


            /*
             * Prefer currently betting round.
             */

            const bettingRound =
                rounds.find(
                    (round) =>
                        round?.status ===
                        "betting"
                );


            if (bettingRound) {
                return bettingRound;
            }


            /*
             * Otherwise locked round.
             */

            const lockedRound =
                rounds.find(
                    (round) =>
                        round?.status ===
                        "locked"
                );


            if (lockedRound) {
                return lockedRound;
            }


            /*
             * Otherwise waiting round.
             */

            const waitingRound =
                rounds.find(
                    (round) =>
                        round?.status ===
                        "waiting"
                );


            return (
                waitingRound ||
                null
            );

        }, [
            rounds,
        ]);


    /*
    |--------------------------------------------------------------------------
    | ROUND TIMER
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        if (
            !currentRound?.endTime
        ) {

            setRemainingSeconds(
                0
            );

            return;

        }


        const updateTimer =
            () => {

                const end =
                    new Date(
                        currentRound.endTime
                    ).getTime();


                const now =
                    Date.now();


                const remaining =
                    Math.max(
                        0,
                        Math.ceil(
                            (end - now) /
                            1000
                        )
                    );


                setRemainingSeconds(
                    remaining
                );

            };


        updateTimer();


        const interval =
            setInterval(
                updateTimer,
                1000
            );


        return () => {

            clearInterval(
                interval
            );

        };

    }, [
        currentRound?.endTime,
    ]);


    /*
    |--------------------------------------------------------------------------
    | TIMER FORMAT
    |--------------------------------------------------------------------------
    */

    const timerText =
        useMemo(() => {

            const minutes =
                Math.floor(
                    remainingSeconds /
                    60
                );

            const seconds =
                remainingSeconds %
                60;


            return `${String(
                minutes
            ).padStart(
                2,
                "0"
            )}:${String(
                seconds
            ).padStart(
                2,
                "0"
            )}`;

        }, [
            remainingSeconds,
        ]);


    /*
    |--------------------------------------------------------------------------
    | TIMER STATE
    |--------------------------------------------------------------------------
    */

    const timerWarning =
        remainingSeconds <= 10 &&
        remainingSeconds > 0;


    /*
    |--------------------------------------------------------------------------
    | OPEN ROUND DETAIL
    |--------------------------------------------------------------------------
    */

    const handleViewRound =
        async (round) => {

            try {

                setRoundDetailLoading(
                    true
                );

                setRoundDetailError(
                    ""
                );

                setSelectedRound(
                    null
                );


                const roundId =
                    round?._id ||
                    round?.id;


                if (!roundId) {

                    throw new Error(
                        "Round ID is missing."
                    );

                }


                const response =
                    await getAdminRoundById(
                        roundId
                    );


                if (
                    !response?.success
                ) {

                    throw new Error(
                        response?.message ||
                        "Unable to load round details."
                    );

                }


                setSelectedRound(
                    response.data
                );


            } catch (error) {

                console.error(
                    "Round Detail Error:",
                    error
                );


                setRoundDetailError(
                    error?.message ||
                    "Unable to load round details."
                );


            } finally {

                setRoundDetailLoading(
                    false
                );

            }

        };


    /*
    |--------------------------------------------------------------------------
    | REFRESH OPEN ROUND DETAIL
    |--------------------------------------------------------------------------
    */

    const refreshSelectedRound =
        useCallback(
            async () => {

                const roundId =
                    selectedRound?.round?._id ||
                    selectedRound?.round?.id;


                if (!roundId) {
                    return;
                }


                try {

                    const response =
                        await getAdminRoundById(
                            roundId
                        );


                    if (
                        response?.success
                    ) {

                        setSelectedRound(
                            response.data
                        );

                    }

                } catch (error) {

                    console.error(
                        "Round Detail Auto Refresh Error:",
                        error
                    );

                }

            },
            [
                selectedRound,
            ]
        );


    /*
    |--------------------------------------------------------------------------
    | AUTO REFRESH OPEN DETAIL
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        if (
            !autoRefresh ||
            !selectedRound
        ) {
            return;
        }


        const interval =
            setInterval(() => {

                refreshSelectedRound();

            }, 10000);


        return () => {

            clearInterval(
                interval
            );

        };

    }, [
        autoRefresh,
        selectedRound,
        refreshSelectedRound,
    ]);


    /*
    |--------------------------------------------------------------------------
    | MANUAL REFRESH
    |--------------------------------------------------------------------------
    */

    const handleRefresh =
        () => {

            loadRounds({
                page:
                    pagination.page,
                showLoader: false,
            });

        };


    /*
    |--------------------------------------------------------------------------
    | PAGINATION
    |--------------------------------------------------------------------------
    */

    const handlePrevious =
        () => {

            if (
                !pagination
                    .hasPreviousPage ||
                refreshing
            ) {
                return;
            }


            loadRounds({
                page:
                    pagination.page - 1,
                showLoader: false,
            });

        };


    const handleNext =
        () => {

            if (
                !pagination
                    .hasNextPage ||
                refreshing
            ) {
                return;
            }


            loadRounds({
                page:
                    pagination.page + 1,
                showLoader: false,
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


            loadRounds({
                page,
                showLoader: false,
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
    | LAST REFRESH TEXT
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
                    title="Rounds"
                    subtitle="Game Management"
                    showSocketStatus={
                        false
                    }
                />


                <div className="flex min-h-[70vh] items-center justify-center">

                    <div className="text-center">

                        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-purple-500" />

                        <p className="mt-4 text-sm text-slate-500">
                            Loading rounds...
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

            {/* =========================================================
                HEADER
            ========================================================= */}

            <AdminHeader
                title="Rounds"
                subtitle="Game Management"
                showSocketStatus={
                    false
                }
            />


            <div className="p-4 sm:p-6 lg:p-8">

                {/* =====================================================
                    PAGE TITLE + ACTIONS
                ===================================================== */}

                <div className="mb-5 rounded-2xl border border-white/[0.06] bg-[#070914] px-5 py-5 sm:px-6">

                    <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

                        {/* TITLE */}

                        <div>

                            <div className="flex items-center gap-2">

                                <RotateCcw
                                    size={17}
                                    className="text-purple-400"
                                />

                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-400">
                                    Game Management
                                </p>

                            </div>


                            <h2 className="mt-2 text-2xl font-black">
                                Rounds
                            </h2>


                            <p className="mt-2 text-sm text-slate-500">
                                View and manage game
                                round history.
                            </p>

                        </div>


                        {/* ACTIONS */}

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">

                            {/* AUTO REFRESH */}

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
                                    : "border-white/[0.07] bg-white/[0.03] text-slate-500 hover:bg-white/[0.06] hover:text-slate-300"
                                    }`}
                            >

                                <Radio
                                    size={15}
                                />

                                Auto Refresh

                                <span
                                    className={`ml-1 h-1.5 w-1.5 rounded-full ${autoRefresh
                                        ? "bg-green-400"
                                        : "bg-slate-600"
                                        }`}
                                />

                            </button>


                            {/* MANUAL REFRESH */}

                            <button
                                type="button"
                                onClick={
                                    handleRefresh
                                }
                                disabled={
                                    refreshing
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


                    {/* =====================================================
                    REFRESH INFO
                ===================================================== */}

                    <div className="mb-6 flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">

                        <div className="flex items-center gap-2 text-slate-500">

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


                        <p className="text-slate-500">

                            Last refreshed:{" "}

                            <span className="text-slate-500">
                                {lastRefreshText}
                            </span>

                        </p>

                    </div>

                </div>

                {/* =====================================================
                    CURRENT ROUND TIMER
                ===================================================== */}

                {currentRound && (
                    <section
                        className={`mb-6 overflow-hidden rounded-2xl border ${timerWarning
                            ? "border-red-500/30 bg-red-500/[0.04]"
                            : "border-purple-500/15 bg-purple-500/[0.03]"
                            }`}
                    >

                        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">

                            {/* LEFT */}

                            <div className="flex items-center gap-4">

                                <div
                                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${timerWarning
                                        ? "bg-red-500/10 text-red-400"
                                        : "bg-purple-500/10 text-purple-400"
                                        }`}
                                >

                                    <Timer
                                        size={22}
                                    />

                                </div>


                                <div>

                                    <div className="flex items-center gap-2">

                                        <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                            Current Round
                                        </span>

                                        <StatusBadge
                                            status={
                                                currentRound?.status
                                            }
                                        />

                                    </div>


                                    <h3 className="mt-1 text-xl font-black text-white">

                                        #
                                        {currentRound?.roundNumber ??
                                            "—"}

                                    </h3>

                                </div>

                            </div>


                            {/* TIMER */}

                            <div className="sm:text-right">

                                <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                    Time Remaining
                                </p>


                                <p
                                    className={`mt-1 font-mono text-3xl font-black tabular-nums ${timerWarning
                                        ? "text-red-400"
                                        : "text-white"
                                        }`}
                                >
                                    {timerText}
                                </p>


                                {currentRound?.endTime && (
                                    <p className="mt-1 text-[12px] text-slate-400">

                                        Ends{" "}

                                        {formatDate(
                                            currentRound.endTime
                                        )}

                                    </p>
                                )}

                            </div>

                        </div>

                    </section>
                )}


                {/* =====================================================
                    ERROR
                ===================================================== */}

                {error && (
                    <div className="mb-6 flex flex-col gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.04] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">

                        <p className="text-sm text-red-400">
                            {error}
                        </p>


                        <button
                            type="button"
                            onClick={() =>
                                loadRounds({
                                    page:
                                        pagination.page,
                                    showLoader:
                                        false,
                                })
                            }
                            className="w-fit cursor-pointer text-xs font-semibold text-red-300 underline"
                        >
                            Retry
                        </button>

                    </div>
                )}


                {/* =====================================================
                    STATS
                ===================================================== */}

                <RoundStats
                    summary={summary}
                    formatCurrency={
                        formatCurrency
                    }
                />


                {/* =====================================================
                    FILTERS
                ===================================================== */}

                <RoundFilters
                    search={search}
                    setSearch={setSearch}
                    statusFilter={
                        statusFilter
                    }
                    setStatusFilter={
                        setStatusFilter
                    }
                    resultFilter={
                        resultFilter
                    }
                    setResultFilter={
                        setResultFilter
                    }
                />


                {/* =====================================================
                    TABLE
                ===================================================== */}

                <RoundTable
                    rounds={rounds}
                    pagination={pagination}
                    refreshing={
                        refreshing
                    }
                    formatCurrency={
                        formatCurrency
                    }
                    formatDate={
                        formatDate
                    }
                    onView={
                        handleViewRound
                    }
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


                {/* =====================================================
                    ROUND DETAIL
                ===================================================== */}

                {(roundDetailLoading ||
                    roundDetailError ||
                    selectedRound) && (

                        <RoundDetail
                            data={
                                selectedRound
                            }
                            loading={
                                roundDetailLoading
                            }
                            error={
                                roundDetailError
                            }
                            formatCurrency={
                                formatCurrency
                            }
                            formatDate={
                                formatDate
                            }
                            onClose={() => {

                                setSelectedRound(
                                    null
                                );

                                setRoundDetailError(
                                    ""
                                );

                            }}
                        />

                    )}


                {/* =====================================================
                    FOOTER
                ===================================================== */}

                <footer className="py-8 text-center text-xs text-slate-500">
                    {siteName} Admin Control Center
                </footer>

            </div>

        </main >
    );
}


/*
|--------------------------------------------------------------------------
| STATUS BADGE
|--------------------------------------------------------------------------
*/

function StatusBadge({
    status,
}) {
    const normalized =
        String(
            status || "unknown"
        ).toLowerCase();


    let classes =
        "border-slate-500/20 bg-slate-500/10 text-slate-400";


    if (
        normalized ===
        "completed"
    ) {
        classes =
            "border-green-500/20 bg-green-500/10 text-green-400";
    }


    if (
        normalized ===
        "betting"
    ) {
        classes =
            "border-blue-500/20 bg-blue-500/10 text-blue-400";
    }


    if (
        normalized ===
        "locked"
    ) {
        classes =
            "border-yellow-500/20 bg-yellow-500/10 text-yellow-400";
    }


    if (
        normalized ===
        "waiting"
    ) {
        classes =
            "border-purple-500/20 bg-purple-500/10 text-purple-400";
    }


    return (
        <span
            className={`rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase ${classes}`}
        >
            {normalized}
        </span>
    );
}