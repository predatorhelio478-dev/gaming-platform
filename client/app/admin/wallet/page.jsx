"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import { Wallet as WalletIcon } from "lucide-react";

import AdminHeader
    from "../../../components/admin/AdminHeader";

import AdminPageHeader
    from "../../../components/admin/ui/AdminPageHeader";

import WalletAdjustModal
    from "@/components/admin/wallet/WalletAdjustModal";

import WalletTransactionModal
    from "@/components/admin/wallet/WalletTransactionModal";

import WalletFilters
    from "@/components/admin/wallet/WalletFilters";

import WalletSecondaryStats
    from "@/components/admin/wallet/WalletSecondaryStats";

import WalletStats
    from "@/components/admin/wallet/WalletStats";

import WalletTable
    from "@/components/admin/wallet/WalletTable";

import WalletTransactionTable
    from "@/components/admin/wallet/WalletTransactionTable";

import WalletUserModal
    from "@/components/admin/wallet/WalletUserModal";

import WalletUsersTable
    from "@/components/admin/wallet/WalletUsersTable";


// ======================================================
// API
// ======================================================

import {
    getAdminWalletOverview,
    getAdminUserWallets,
    getAdminWalletTransactions,
    adjustAdminUserWallet,
} from "../../../lib/adminApi";


// ======================================================
// PAGE
// ======================================================

export default function WalletPage() {

    // ==================================================
    // USERS
    // ==================================================

    const [
        users,
        setUsers,
    ] = useState([]);


    const [
        usersTotal,
        setUsersTotal,
    ] = useState(0);


    const [
        usersTotalPages,
        setUsersTotalPages,
    ] = useState(1);


    // ==================================================
    // TRANSACTIONS
    // ==================================================

    const [
        transactions,
        setTransactions,
    ] = useState([]);


    const [
        transactionsTotal,
        setTransactionsTotal,
    ] = useState(0);


    const [
        transactionsTotalPages,
        setTransactionsTotalPages,
    ] = useState(1);


    // ==================================================
    // OVERVIEW
    // ==================================================

    const [
        overview,
        setOverview,
    ] = useState(null);


    const [
        loadingOverview,
        setLoadingOverview,
    ] = useState(true);


    // ==================================================
    // LOADING
    // ==================================================

    const [
        loadingUsers,
        setLoadingUsers,
    ] = useState(true);


    const [
        loadingTransactions,
        setLoadingTransactions,
    ] = useState(true);


    // ==================================================
    // ERROR
    // ==================================================

    const [
        error,
        setError,
    ] = useState("");


    // ==================================================
    // FILTERS
    // ==================================================

    const [
        search,
        setSearch,
    ] = useState("");


    const [
        walletStatus,
        setWalletStatus,
    ] = useState("all");


    const [
        transactionType,
        setTransactionType,
    ] = useState("all");


    const [
        status,
        setStatus,
    ] = useState("all");


    const [
        dateFrom,
        setDateFrom,
    ] = useState("");


    const [
        dateTo,
        setDateTo,
    ] = useState("");


    const [
        minBalance,
        setMinBalance,
    ] = useState("");


    const [
        maxBalance,
        setMaxBalance,
    ] = useState("");

    const [
        selectedTransaction,
        setSelectedTransaction
    ] = useState(null);

    const [
        showTransactionModal,
        setShowTransactionModal
    ] = useState(false);


    // ==================================================
    // PAGINATION
    // ==================================================

    const [
        userPage,
        setUserPage,
    ] = useState(1);


    const [
        transactionPage,
        setTransactionPage,
    ] = useState(1);


    const usersPerPage = 10;

    const transactionsPerPage = 10;


    // ==================================================
    // MODALS
    // ==================================================

    const [
        selectedUser,
        setSelectedUser,
    ] = useState(null);


    const [
        showUserModal,
        setShowUserModal,
    ] = useState(false);


    const [
        showAdjustModal,
        setShowAdjustModal,
    ] = useState(false);


    const [
        adjustUser,
        setAdjustUser,
    ] = useState(null);


    const [
        adjustType,
        setAdjustType,
    ] = useState("credit");


    const [
        adjustingWallet,
        setAdjustingWallet,
    ] = useState(false);


    // ==================================================
    // SUCCESS MESSAGE
    // ==================================================

    const [
        successMessage,
        setSuccessMessage,
    ] = useState("");


    // ==================================================
    // LOAD OVERVIEW
    // ==================================================

    const loadOverview =
        useCallback(
            async () => {

                try {

                    setLoadingOverview(true);


                    const response =
                        await getAdminWalletOverview();


                    if (
                        response?.success
                    ) {

                        setOverview(
                            response?.data ||
                            null
                        );

                    } else {

                        setOverview(null);

                    }

                } catch (
                err
                ) {

                    console.error(
                        "Admin Wallet Overview Error:",
                        err
                    );

                    setOverview(null);

                } finally {

                    setLoadingOverview(false);

                }

            },
            []
        );


    // ==================================================
    // LOAD USERS
    // ==================================================

    const loadUsers =
        useCallback(
            async () => {

                try {

                    setLoadingUsers(true);

                    setError("");


                    const response =
                        await getAdminUserWallets({

                            page:
                                userPage,

                            limit:
                                usersPerPage,

                            search:
                                search.trim(),

                            walletStatus:
                                walletStatus,

                            transactionType:
                                transactionType,

                            dateFrom:
                                dateFrom,

                            dateTo:
                                dateTo,

                            minBalance:
                                minBalance,

                            maxBalance:
                                maxBalance,

                        });


                    if (
                        response?.success
                    ) {

                        const walletUsers =
                            Array.isArray(
                                response?.data
                            )
                                ? response.data
                                : [];


                        setUsers(
                            walletUsers
                        );


                        const pagination =
                            response?.pagination ||
                            {};


                        setUsersTotal(
                            Number(
                                pagination?.total
                            ) || 0
                        );


                        setUsersTotalPages(
                            Math.max(
                                Number(
                                    pagination?.totalPages
                                ) || 1,
                                1
                            )
                        );

                    } else {

                        setUsers([]);

                        setUsersTotal(0);

                        setUsersTotalPages(1);

                    }

                } catch (
                err
                ) {

                    console.error(
                        "Admin Wallet Users Error:",
                        err
                    );


                    setError(
                        err?.message ||
                        "Unable to load wallet users."
                    );


                    setUsers([]);

                    setUsersTotal(0);

                    setUsersTotalPages(1);

                } finally {

                    setLoadingUsers(false);

                }

            },
            [
                userPage,
                search,
                walletStatus,
                transactionType,
                dateFrom,
                dateTo,
                minBalance,
                maxBalance,
            ]
        );


    // ==================================================
    // LOAD TRANSACTIONS
    // ==================================================

    const loadTransactions =
        useCallback(
            async () => {

                try {

                    setLoadingTransactions(true);


                    setError("");


                    const response =
                        await getAdminWalletTransactions({

                            page:
                                transactionPage,

                            limit:
                                transactionsPerPage,

                            search:
                                search.trim(),

                            type:
                                transactionType,

                            status:
                                status,

                            walletStatus:
                                walletStatus,

                            dateFrom:
                                dateFrom,

                            dateTo:
                                dateTo,

                            minBalance:
                                minBalance,

                            maxBalance:
                                maxBalance,

                        });


                    if (
                        response?.success
                    ) {

                        const transactionData =
                            Array.isArray(
                                response?.data
                            )
                                ? response.data
                                : [];


                        setTransactions(
                            transactionData
                        );


                        const pagination =
                            response?.pagination ||
                            {};


                        setTransactionsTotal(
                            Number(
                                pagination?.total
                            ) || 0
                        );


                        setTransactionsTotalPages(
                            Math.max(
                                Number(
                                    pagination?.totalPages
                                ) || 1,
                                1
                            )
                        );

                    } else {

                        setTransactions([]);

                        setTransactionsTotal(0);

                        setTransactionsTotalPages(1);

                    }

                } catch (
                err
                ) {

                    console.error(
                        "Admin Wallet Transactions Error:",
                        err
                    );


                    setError(
                        err?.message ||
                        "Unable to load wallet transactions."
                    );


                    setTransactions([]);

                    setTransactionsTotal(0);

                    setTransactionsTotalPages(1);

                } finally {

                    setLoadingTransactions(false);

                }

            },
            [
                transactionPage,
                search,
                walletStatus,
                transactionType,
                status,
                dateFrom,
                dateTo,
                minBalance,
                maxBalance,
            ]
        );


    // ==================================================
    // INITIAL OVERVIEW
    // ==================================================

    useEffect(
        () => {

            loadOverview();

        },
        [
            loadOverview,
        ]
    );


    // ==================================================
    // LOAD USERS
    // ==================================================

    useEffect(
        () => {

            loadUsers();

        },
        [
            loadUsers,
        ]
    );


    // ==================================================
    // LOAD TRANSACTIONS
    // ==================================================

    useEffect(
        () => {

            loadTransactions();

        },
        [
            loadTransactions,
        ]
    );


    // ==================================================
    // RESET PAGINATION WHEN FILTERS CHANGE
    // ==================================================

    useEffect(
        () => {

            setUserPage(1);

            setTransactionPage(1);

        },
        [
            search,
            walletStatus,
            transactionType,
            status,
            dateFrom,
            dateTo,
            minBalance,
            maxBalance,
        ]
    );


    // ==================================================
    // CLEAR SUCCESS MESSAGE
    // ==================================================

    useEffect(
        () => {

            if (
                !successMessage
            ) {

                return;

            }


            const timer =
                setTimeout(
                    () => {

                        setSuccessMessage("");

                    },
                    4000
                );


            return () => {

                clearTimeout(
                    timer
                );

            };

        },
        [
            successMessage,
        ]
    );


    // ==================================================
    // REFRESH ALL
    // ==================================================

    const handleRefresh =
        async () => {

            setError("");

            setSuccessMessage("");


            await Promise.all([

                loadOverview(),

                loadUsers(),

                loadTransactions(),

            ]);

        };


    // ==================================================
    // WALLET STATS
    // ==================================================

    const walletStats =
        useMemo(
            () => {

                if (
                    !overview
                ) {

                    return {

                        totalUsers:
                            0,

                        usersWithBalance:
                            0,

                        totalBalance:
                            0,

                        winningBalance:
                            0,

                        bonusBalance:
                            0,

                        lockedBalance:
                            0,

                        totalDeposit:
                            0,

                        totalWithdraw:
                            0,

                        totalBet:
                            0,

                        totalWin:
                            0,

                    };

                }


                return {

                    // ======================================
                    // USER COUNTS
                    // ======================================

                    totalUsers:
                        Number(
                            overview?.totalUsers
                        ) || 0,


                    usersWithBalance:
                        Number(
                            overview?.usersWithBalance
                        ) || 0,


                    // ======================================
                    // BALANCES
                    // ======================================

                    totalBalance:
                        Number(
                            overview?.totalBalance
                        ) || 0,


                    winningBalance:
                        Number(
                            overview?.totalWinningBalance ??
                            overview?.winningBalance ??
                            0
                        ) || 0,


                    bonusBalance:
                        Number(
                            overview?.totalBonusBalance ??
                            overview?.bonusBalance ??
                            0
                        ) || 0,


                    lockedBalance:
                        Number(
                            overview?.totalLockedBalance ??
                            overview?.lockedBalance ??
                            0
                        ) || 0,


                    // ======================================
                    // FINANCIAL ACTIVITY
                    // ======================================

                    totalDeposit:
                        Number(
                            overview?.totalDeposit ??
                            overview?.totalDeposits ??
                            0
                        ) || 0,


                    totalWithdraw:
                        Number(
                            overview?.totalWithdraw ??
                            overview?.totalWithdrawals ??
                            0
                        ) || 0,


                    totalBet:
                        Number(
                            overview?.totalBet ??
                            overview?.totalBets ??
                            0
                        ) || 0,


                    totalWin:
                        Number(
                            overview?.totalWin ??
                            overview?.totalWins ??
                            0
                        ) || 0,

                };

            },
            [
                overview,
            ]
        );


    // ==================================================
    // OPEN USER
    // ==================================================

    const handleViewUser =
        (
            user
        ) => {

            setSelectedUser(user);

            setShowUserModal(true);

        };


    const normalizeWalletUser = (
        item
    ) => {

        if (!item) {
            return null;
        }

        const user =
            item?.user ||
            item;

        const wallet =
            item?.wallet ||
            user?.wallet ||
            item ||
            user ||
            {};

        const userId =
            user?._id ||
            user?.id ||
            item?.userId ||
            item?._id;

        return {

            ...user,

            _id:
                userId,

            id:
                userId,

            fullName:
                user?.fullName ||
                user?.name ||
                user?.username ||
                "Unknown User",

            username:
                user?.username ||
                "",

            email:
                user?.email ||
                "",

            wallet: {

                ...wallet,

                balance:
                    Number(
                        wallet?.balance ??
                        item?.balance ??
                        user?.balance ??
                        0
                    ),

                winningBalance:
                    Number(
                        wallet?.winningBalance ??
                        item?.winningBalance ??
                        0
                    ),

                bonusBalance:
                    Number(
                        wallet?.bonusBalance ??
                        item?.bonusBalance ??
                        0
                    ),

                lockedBalance:
                    Number(
                        wallet?.lockedBalance ??
                        item?.lockedBalance ??
                        0
                    ),

                totalDeposit:
                    Number(
                        wallet?.totalDeposit ??
                        item?.totalDeposit ??
                        0
                    ),

                totalWithdraw:
                    Number(
                        wallet?.totalWithdraw ??
                        item?.totalWithdraw ??
                        0
                    ),

                totalBet:
                    Number(
                        wallet?.totalBet ??
                        item?.totalBet ??
                        0
                    ),

                totalWin:
                    Number(
                        wallet?.totalWin ??
                        item?.totalWin ??
                        0
                    ),

                updatedAt:
                    wallet?.updatedAt ??
                    item?.updatedAt ??
                    null,

            },

        };

    };


    const handleViewTransaction = (
        transaction
    ) => {

        setSelectedTransaction(
            transaction
        );

        setShowTransactionModal(
            true
        );

    };

    // ==================================================
    // OPEN ADJUST
    // ==================================================
    const handleAdjustWallet =
        (
            item,
            mode = "credit"
        ) => {

            const normalizedUser =
                normalizeWalletUser(
                    item
                );

            if (
                !normalizedUser
            ) {
                return;
            }

            setShowUserModal(
                false
            );

            setSelectedUser(
                null
            );

            setAdjustUser(
                normalizedUser
            );

            setAdjustType(
                mode === "debit"
                    ? "debit"
                    : "credit"
            );

            setShowAdjustModal(
                true
            );

        };


    // ==================================================
    // CLOSE USER MODAL
    // ==================================================

    const handleCloseUserModal =
        () => {

            setShowUserModal(false);

            setSelectedUser(null);

        };


    // ==================================================
    // CLOSE ADJUST MODAL
    // ==================================================

    const handleCloseAdjustModal =
        () => {

            if (
                adjustingWallet
            ) {

                return;

            }


            setShowAdjustModal(false);

            setAdjustUser(null);

        };


    // ==================================================
    // SUBMIT WALLET ADJUSTMENT
    // ==================================================
    const handleWalletAdjustment =
        async (
            payload
        ) => {

            try {

                setAdjustingWallet(
                    true
                );

                setError("");

                setSuccessMessage("");


                const apiPayload = {

                    ...payload,

                    type:
                        payload?.type === "debit"
                            ? "admin_debit"
                            : "admin_credit",

                };


                await adjustAdminUserWallet(
                    apiPayload
                );


                setShowAdjustModal(
                    false
                );

                setAdjustUser(
                    null
                );

                setAdjustType(
                    "credit"
                );


                setSuccessMessage(
                    payload?.type === "debit"
                        ? "Wallet debited successfully."
                        : "Wallet credited successfully."
                );


                await Promise.all([

                    loadOverview(),

                    loadUsers(),

                    loadTransactions(),

                ]);

            } catch (
            err
            ) {

                console.error(
                    "Wallet Adjustment Error:",
                    err
                );


                setError(
                    err?.message ||
                    "Unable to adjust wallet."
                );

                /*
                 * Do not throw again here.
                 *
                 * WalletAdjustModal already catches
                 * onSubmit errors.
                 */

            } finally {

                setAdjustingWallet(
                    false
                );

            }

        };


    // ==================================================
    // RESET FILTERS
    // ==================================================

    const handleResetFilters =
        () => {

            setSearch("");

            setWalletStatus("all");

            setTransactionType("all");

            setStatus("all");

            setDateFrom("");

            setDateTo("");

            setMinBalance("");

            setMaxBalance("");

            setUserPage(1);

            setTransactionPage(1);

        };


    // ==================================================
    // FORMAT CURRENCY
    // ==================================================

    const formatCurrency =
        (
            value
        ) => {

            return new Intl.NumberFormat(
                "en-IN",
                {
                    style:
                        "currency",

                    currency:
                        "INR",

                    maximumFractionDigits:
                        2,

                }
            ).format(
                Number(value) || 0
            );

        };


    // ==================================================
    // FORMAT DATE
    // ==================================================

    const formatDate =
        (
            value
        ) => {

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


            return new Intl.DateTimeFormat(
                "en-IN",
                {
                    day:
                        "2-digit",

                    month:
                        "short",

                    year:
                        "numeric",

                    hour:
                        "2-digit",

                    minute:
                        "2-digit",

                }
            ).format(
                date
            );

        };


    // ==================================================
    // RENDER
    // ==================================================

    return (
        <main className="min-h-screen bg-[#070914] text-white">
            <AdminHeader
                title="Wallet"
                subtitle="Wallet Management"
                showSocketStatus={false}
            />

            <div className="p-4 sm:p-6 lg:p-8">

                <AdminPageHeader
                    icon={WalletIcon}
                    eyebrow="Wallet Management"
                    title="Wallet"
                    description="Manage player balances, transactions and wallet activity."
                    actions={
                        <button
                            type="button"
                            onClick={handleRefresh}
                            disabled={
                                loadingOverview ||
                                loadingUsers ||
                                loadingTransactions ||
                                adjustingWallet
                            }
                            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {(
                                loadingOverview ||
                                loadingUsers ||
                                loadingTransactions
                            )
                                ? "Refreshing..."
                                : "Refresh"
                            }
                        </button>
                    }
                />


                {/* ==================================================
                SUCCESS
            ================================================== */}

                {successMessage && (

                    <div
                        className="
                        mb-5
                        rounded-2xl
                        border
                        border-emerald-500/20
                        bg-emerald-500/10
                        px-4
                        py-3
                        text-xs
                        font-semibold
                        text-emerald-400
                    "
                    >
                        {successMessage}
                    </div>

                )}


                {/* ==================================================
                ERROR
            ================================================== */}

                {error && (

                    <div
                        className="
                        mb-5
                        rounded-2xl
                        border
                        border-red-500/20
                        bg-red-500/10
                        px-4
                        py-3
                        text-xs
                        font-semibold
                        text-red-400
                    "
                    >
                        {error}
                    </div>

                )}


                {/* ==================================================
                PRIMARY STATS
            ================================================== */}

                <WalletStats
                    stats={
                        walletStats
                    }

                    loading={
                        loadingOverview
                    }

                />


                {/* ==================================================
                SECONDARY STATS
            ================================================== */}

                <WalletSecondaryStats
                    stats={
                        walletStats
                    }

                    loading={
                        loadingOverview
                    }

                />


                {/* ==================================================
                SHARED FILTERS
            ================================================== */}

                <WalletFilters

                    search={
                        search
                    }

                    setSearch={
                        setSearch
                    }


                    walletStatus={
                        walletStatus
                    }

                    setWalletStatus={
                        setWalletStatus
                    }


                    transactionType={
                        transactionType
                    }

                    setTransactionType={
                        setTransactionType
                    }


                    dateFrom={
                        dateFrom
                    }

                    setDateFrom={
                        setDateFrom
                    }


                    dateTo={
                        dateTo
                    }

                    setDateTo={
                        setDateTo
                    }


                    minBalance={
                        minBalance
                    }

                    setMinBalance={
                        setMinBalance
                    }


                    maxBalance={
                        maxBalance
                    }

                    setMaxBalance={
                        setMaxBalance
                    }


                    onReset={
                        handleResetFilters
                    }

                />


                {/* ==================================================
                USER WALLETS
            ================================================== */}

                <div
                    className="
                    mt-5
                "
                >

                    <WalletUsersTable

                        users={
                            users
                        }

                        loading={
                            loadingUsers
                        }

                        onView={
                            handleViewUser
                        }

                        onCredit={(user) => {

                            handleAdjustWallet(
                                user,
                                "credit"
                            );

                        }}

                        onDebit={(user) => {

                            handleAdjustWallet(
                                user,
                                "debit"
                            );

                        }}

                        pagination={{

                            currentPage:
                                userPage,

                            totalPages:
                                usersTotalPages,

                            total:
                                usersTotal,

                        }}

                        onPageChange={
                            setUserPage
                        }

                        formatCurrency={
                            formatCurrency
                        }

                        formatDate={
                            formatDate
                        }

                    />

                </div>


                {/* ==================================================
                WALLET TABLE
            ================================================== */}

                <div
                    className="
                    mt-5
                "
                >

                    <WalletTable

                        users={
                            users
                        }

                        loading={
                            loadingUsers
                        }

                        onViewUser={
                            handleViewUser
                        }

                        onAdjustWallet={
                            handleAdjustWallet
                        }

                        pagination={{

                            currentPage:
                                userPage,

                            totalPages:
                                usersTotalPages,

                            total:
                                usersTotal,

                        }}

                        onPageChange={
                            setUserPage
                        }

                        formatCurrency={
                            formatCurrency
                        }

                        formatDate={
                            formatDate
                        }

                    />

                </div>


                {/* ==================================================
                TRANSACTIONS
            ================================================== */}

                <div
                    className="
                    mt-5
                "
                >

                    <WalletTransactionTable
                        transactions={transactions}
                        loading={loadingTransactions}

                        search={search}
                        type={transactionType}
                        status={status}

                        onSearchChange={setSearch}
                        onTypeChange={setTransactionType}
                        onStatusChange={setStatus}
                        onReset={handleResetFilters}

                        pagination={{
                            currentPage: transactionPage,
                            totalPages: transactionsTotalPages,
                            total: transactionsTotal,
                        }}

                        onPageChange={setTransactionPage}

                        formatCurrency={formatCurrency}
                        formatDate={formatDate}

                        onViewTransaction={
                            handleViewTransaction
                        }
                    />

                </div>


                {/* ==================================================
                USER MODAL
            ================================================== */}

                {showUserModal && (

                    <WalletUserModal

                        user={
                            selectedUser
                        }

                        open={
                            showUserModal
                        }

                        onClose={
                            handleCloseUserModal
                        }

                        onAdjustWallet={
                            handleAdjustWallet
                        }

                        formatCurrency={
                            formatCurrency
                        }

                        formatDate={
                            formatDate
                        }

                    />

                )}


                {/* ==================================================
                ADJUST WALLET MODAL
            ================================================== */}

                {showAdjustModal && (

                    <WalletAdjustModal
                        user={adjustUser}
                        open={showAdjustModal}
                        mode={adjustType}
                        onClose={handleCloseAdjustModal}
                        onSubmit={handleWalletAdjustment}
                        loading={adjustingWallet}
                        formatCurrency={formatCurrency}
                    />

                )}


                {showTransactionModal && (

                    <WalletTransactionModal

                        transaction={
                            selectedTransaction
                        }

                        onClose={() => {

                            setShowTransactionModal(
                                false
                            );

                            setSelectedTransaction(
                                null
                            );

                        }}

                        formatCurrency={
                            formatCurrency
                        }

                        formatDate={
                            formatDate
                        }

                    />

                )}

            </div>
        </main>
    );

}