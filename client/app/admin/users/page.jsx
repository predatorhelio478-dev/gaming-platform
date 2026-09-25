"use client";

import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import {
    RefreshCw,
    Users,
    AlertTriangle,
} from "lucide-react";

import AdminHeader
    from "../../../components/admin/AdminHeader";

import UserStats
    from "@/components/admin/users/UserStats";

import UserFilters
    from "@/components/admin/users/UserFilters";

import UserTable
    from "@/components/admin/users/UserTable";

import UserDetailDrawer
    from "@/components/admin/users/UserDetailDrawer";

import UserStatusModal
    from "@/components/admin/users/UserStatusModal";

import DeleteUserModal
    from "@/components/admin/users/DeleteUserModal";

import UserCreateModal
    from "@/components/admin/users/UserCreateModal";

import UserEditModal
    from "@/components/admin/users/UserEditModal";

import UserBalanceModal
    from "@/components/admin/users/UserBalanceModal";

import {
    getAdminUsers,
    getAdminUserStats,
    getAdminUserById,
    updateAdminUserStatus,
    createAdminUser,
    updateAdminUser,
    adjustAdminUserBalance,
    deactivateAdminUser,
    deleteAdminUser,
    changeAdminUserPassword,
    manuallyVerifyUserEmail,
    manuallyVerifyUserMobile,
    getCurrentAdmin,
} from "../../../lib/adminApi";


// ======================================================
// USERS ADMIN PAGE
// ======================================================

export default function UsersPage() {

    // ==================================================
    // USERS
    // ==================================================

    const [users, setUsers] =
        useState([]);


    // ==================================================
    // STATS
    // ==================================================

    const [stats, setStats] =
        useState({});


    // ==================================================
    // CREATE USER MODAL
    // ==================================================

    const [createUserModalOpen, setCreateUserModalOpen] =
        useState(false);


    const [createUserLoading, setCreateUserLoading] =
        useState(false);

    // ==================================================
    // EDIT USER MODAL
    // ==================================================

    const [editUserModalOpen, setEditUserModalOpen] =
        useState(false);

    const [editUser, setEditUser] =
        useState(null);

    const [editUserLoading, setEditUserLoading] =
        useState(false);


    const [balanceModalOpen, setBalanceModalOpen] =
        useState(false);

    const [balanceTarget, setBalanceTarget] =
        useState(null);

    const [balanceLoading, setBalanceLoading] =
        useState(false);


    const [deleteModalOpen, setDeleteModalOpen] =
        useState(false);

    const [deleteTarget, setDeleteTarget] =
        useState(null);

    const [deleteLoading, setDeleteLoading] =
        useState(false);

    // ==================================================
    // PAGINATION
    // ==================================================

    const [pagination, setPagination] =
        useState({

            page: 1,

            limit: 20,

            total: 0,

            totalPages: 1,

            hasNextPage: false,

            hasPreviousPage: false,

        });


    // ==================================================
    // FILTERS
    // ==================================================

    const [search, setSearch] =
        useState("");


    const [status, setStatus] =
        useState("all");


    const [role, setRole] =
        useState("all");


    // ==================================================
    // LOADING
    // ==================================================

    const [loading, setLoading] =
        useState(true);


    const [refreshing, setRefreshing] =
        useState(false);


    const [actionLoading, setActionLoading] =
        useState(false);


    // ==================================================
    // CURRENT ADMIN ROLE (manual verify is super_admin-only;
    // the buttons are hidden for anyone else, but the real
    // enforcement is server-side regardless)
    // ==================================================

    const [currentAdminRole, setCurrentAdminRole] =
        useState(null);

    useEffect(() => {

        let mounted = true;

        getCurrentAdmin()
            .then((response) => {
                if (mounted) {
                    setCurrentAdminRole(response?.admin?.role || null);
                }
            })
            .catch(() => {});

        return () => {
            mounted = false;
        };

    }, []);


    // ==================================================
    // ERROR
    // ==================================================

    const [error, setError] =
        useState("");


    // ==================================================
    // USER DETAIL DRAWER
    // ==================================================

    const [selectedUser, setSelectedUser] =
        useState(null);


    const [drawerLoading, setDrawerLoading] =
        useState(false);


    const [drawerError, setDrawerError] =
        useState("");


    // ==================================================
    // OPEN EDIT USER FROM DRAWER
    // ==================================================

    const handleEditUser = (user) => {

        if (!user?._id) {
            return;
        }

        if (editUserLoading) {
            return;
        }

        setError("");

        setEditUser(user);

        setEditUserModalOpen(true);

    };


    // ==================================================
    // STATUS MODAL
    // ==================================================

    const [statusModalOpen, setStatusModalOpen] =
        useState(false);


    const [statusTarget, setStatusTarget] =
        useState(null);


    const [statusAction, setStatusAction] =
        useState(null);


    // ==================================================
    // SEARCH TIMER
    // ==================================================

    const searchTimer =
        useRef(null);


    // ==================================================
    // COMPONENT MOUNT REF
    // ==================================================

    const mountedRef =
        useRef(true);


    // ==================================================
    // FORMAT CURRENCY
    // ==================================================

    const formatCurrency =
        useCallback(
            (value) => {

                const amount =
                    Number(
                        value || 0
                    );


                return new Intl.NumberFormat(
                    "en-IN",
                    {
                        style: "currency",
                        currency: "INR",
                        maximumFractionDigits: 2,
                    }
                ).format(
                    amount
                );

            },
            []
        );


    // ==================================================
    // FORMAT DATE
    // ==================================================

    const formatDate =
        useCallback(
            (value) => {

                if (!value) {

                    return "—";

                }


                const date =
                    new Date(
                        value
                    );


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
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                    }
                ).format(
                    date
                );

            },
            []
        );


    // ==================================================
    // NORMALIZE USERS RESPONSE
    // ==================================================

    const normalizeUsersResponse =
        useCallback(
            (response) => {

                const root =
                    response ||
                    {};


                const data =
                    root?.data ??
                    root;


                let userList =
                    [];


                if (
                    Array.isArray(
                        root?.users
                    )
                ) {

                    userList =
                        root.users;

                } else if (
                    Array.isArray(
                        data?.users
                    )
                ) {

                    userList =
                        data.users;

                } else if (
                    Array.isArray(
                        data
                    )
                ) {

                    userList =
                        data;

                } else if (
                    Array.isArray(
                        root?.data
                    )
                ) {

                    userList =
                        root.data;

                }


                const serverPagination =
                    root?.pagination ||
                    data?.pagination ||
                    {};


                return {

                    users:
                        userList,

                    pagination:
                        serverPagination,

                };

            },
            []
        );


    // ==================================================
    // NORMALIZE STATS RESPONSE
    // ==================================================

    const normalizeStatsResponse =
        useCallback(
            (response) => {

                if (!response) {

                    return {};

                }


                if (
                    response?.stats &&
                    typeof response.stats ===
                    "object"
                ) {

                    return response.stats;

                }


                if (
                    response?.data &&
                    typeof response.data ===
                    "object"
                ) {

                    if (
                        response.data?.stats &&
                        typeof response.data.stats ===
                        "object"
                    ) {

                        return response.data.stats;

                    }


                    return response.data;

                }


                return {};

            },
            []
        );


    // ==================================================
    // APPLY PAGINATION
    // ==================================================

    const applyPagination =
        useCallback(
            (
                serverPagination,
                page
            ) => {

                const server =
                    serverPagination ||
                    {};


                const total =
                    Number(
                        server?.total ??
                        0
                    );


                const limit =
                    Number(
                        server?.limit ??
                        pagination?.limit ??
                        20
                    );


                const currentPage =
                    Number(
                        server?.page ??
                        page ??
                        1
                    );


                const calculatedTotalPages =
                    total > 0
                        ? Math.ceil(
                            total /
                            limit
                        )
                        : 1;


                const totalPages =
                    Number(
                        server?.totalPages ??
                        calculatedTotalPages
                    );


                setPagination({

                    page:
                        currentPage,

                    limit,

                    total,

                    totalPages:
                        Math.max(
                            totalPages,
                            1
                        ),

                    hasNextPage:
                        Boolean(
                            server?.hasNextPage ??
                            currentPage <
                            totalPages
                        ),

                    hasPreviousPage:
                        Boolean(
                            server?.hasPreviousPage ??
                            currentPage >
                            1
                        ),

                });

            },
            [
                pagination?.limit,
            ]
        );


    // ==================================================
    // FETCH USERS
    // ==================================================

    const fetchUsers =
        useCallback(
            async ({
                page = 1,
                showLoader = false,
                showRefreshing = false,
            } = {}) => {

                try {

                    if (
                        showLoader
                    ) {

                        setLoading(
                            true
                        );

                    }


                    if (
                        showRefreshing
                    ) {

                        setRefreshing(
                            true
                        );

                    }


                    setError("");


                    const params = {

                        page:
                            Number(
                                page
                            ) || 1,

                        limit:
                            Number(
                                pagination?.limit ||
                                20
                            ),

                        search:
                            String(
                                search ||
                                ""
                            ).trim(),

                        status:
                            status ||
                            "all",

                        role:
                            role ||
                            "all",

                    };


                    const response =
                        await getAdminUsers(
                            params
                        );


                    if (
                        !mountedRef.current
                    ) {

                        return;

                    }


                    const normalized =
                        normalizeUsersResponse(
                            response
                        );


                    setUsers(
                        Array.isArray(
                            normalized.users
                        )
                            ? normalized.users
                            : []
                    );


                    applyPagination(
                        normalized.pagination,
                        params.page
                    );

                } catch (
                requestError
                ) {

                    console.error(
                        "Admin Users Fetch Error:",
                        requestError
                    );


                    if (
                        !mountedRef.current
                    ) {

                        return;

                    }


                    setError(
                        requestError?.message ||
                        "Unable to fetch users."
                    );


                    setUsers([]);

                } finally {

                    if (
                        mountedRef.current
                    ) {

                        setLoading(
                            false
                        );

                        setRefreshing(
                            false
                        );

                    }

                }

            },
            [
                pagination?.limit,
                search,
                status,
                role,
                normalizeUsersResponse,
                applyPagination,
            ]
        );


    // ==================================================
    // FETCH USER STATS
    // ==================================================

    const fetchStats =
        useCallback(
            async () => {

                try {

                    const response =
                        await getAdminUserStats();


                    if (
                        !mountedRef.current
                    ) {

                        return;

                    }


                    const normalizedStats =
                        normalizeStatsResponse(
                            response
                        );


                    setStats(
                        normalizedStats
                    );

                } catch (
                statsError
                ) {

                    console.error(
                        "Admin User Stats Error:",
                        statsError
                    );

                }

            },
            [
                normalizeStatsResponse,
            ]
        );


    // ==================================================
    // INITIAL LOAD
    // ==================================================

    useEffect(
        () => {

            mountedRef.current =
                true;


            const loadInitialData =
                async () => {

                    await Promise.allSettled(
                        [

                            fetchUsers({

                                page: 1,

                                showLoader: true,

                            }),

                            fetchStats(),

                        ]
                    );

                };


            loadInitialData();


            return () => {

                mountedRef.current =
                    false;


                if (
                    searchTimer.current
                ) {

                    clearTimeout(
                        searchTimer.current
                    );

                }

            };

        },
        []
    );


    // ==================================================
    // FILTER CHANGE
    // ==================================================

    useEffect(
        () => {

            if (
                searchTimer.current
            ) {

                clearTimeout(
                    searchTimer.current
                );

            }


            searchTimer.current =
                setTimeout(
                    () => {

                        fetchUsers({

                            page: 1,

                            showRefreshing:
                                true,

                        });

                    },
                    400
                );


            return () => {

                if (
                    searchTimer.current
                ) {

                    clearTimeout(
                        searchTimer.current
                    );

                }

            };

        },
        [
            search,
            status,
            role,
        ]
    );


    // ==================================================
    // REFRESH
    // ==================================================

    const handleRefresh =
        async () => {

            await Promise.allSettled(
                [

                    fetchUsers({

                        page:
                            pagination?.page ||
                            1,

                        showRefreshing:
                            true,

                    }),

                    fetchStats(),

                ]
            );

        };


    // ==================================================
    // RESET FILTERS
    // ==================================================

    const handleResetFilters =
        () => {

            setSearch("");

            setStatus(
                "all"
            );

            setRole(
                "all"
            );

        };


    // ==================================================
    // PAGE CHANGE
    // ==================================================

    const handlePageChange =
        (page) => {

            const nextPage =
                Number(
                    page
                );


            const totalPages =
                Number(
                    pagination?.totalPages ||
                    1
                );


            if (
                !Number.isInteger(
                    nextPage
                )
            ) {

                return;

            }


            if (
                nextPage < 1 ||
                nextPage > totalPages
            ) {

                return;

            }


            if (
                nextPage ===
                pagination?.page
            ) {

                return;

            }


            fetchUsers({

                page:
                    nextPage,

                showRefreshing:
                    true,

            });

        };


    // ==================================================
    // OPEN CREATE USER MODAL
    // ==================================================

    const handleOpenCreateUser =
        () => {

            if (
                createUserLoading
            ) {

                return;

            }


            setError("");


            setCreateUserModalOpen(
                true
            );

        };

    // ==================================================
    // OPEN EDIT USER MODAL
    // ==================================================

    const handleOpenEditUser =
        (user) => {

            if (
                !user?._id
            ) {

                return;

            }


            if (
                editUserLoading
            ) {

                return;

            }


            setError("");


            setEditUser(
                user
            );


            setEditUserModalOpen(
                true
            );

        };

    // ==================================================
    // CLOSE EDIT USER MODAL
    // ==================================================

    const handleCloseEditUser =
        () => {

            if (
                editUserLoading
            ) {

                return;

            }


            setEditUserModalOpen(
                false
            );


            setEditUser(
                null
            );

        };

    // ==================================================
    // UPDATE USER
    // ==================================================

    const handleUpdateUser =
        async (
            userData
        ) => {

            if (
                !editUser?._id
            ) {

                throw new Error(
                    "User ID is required."
                );

            }


            if (
                editUserLoading
            ) {

                return;

            }


            setEditUserLoading(
                true
            );


            setError("");


            try {

                const response =
                    await updateAdminUser(

                        editUser._id,

                        userData

                    );


                if (
                    !mountedRef.current
                ) {

                    return;

                }


                console.log(
                    "Admin User Updated:",
                    response
                );


                /*
                 * Close edit modal.
                 */

                setEditUserModalOpen(
                    false
                );


                setEditUser(
                    null
                );


                /*
                 * Refresh table + statistics.
                 */

                await Promise.allSettled(
                    [

                        fetchUsers({

                            page:
                                pagination?.page ||
                                1,

                            showRefreshing:
                                true,

                        }),

                        fetchStats(),

                    ]
                );


                /*
                 * If same user is currently
                 * open in drawer, refresh
                 * its complete details too.
                 */

                if (
                    selectedUser?._id ===
                    editUser?._id
                ) {

                    await handleViewUser(
                        {
                            ...selectedUser,
                            ...userData,
                        }
                    );

                }

            } catch (
            requestError
            ) {

                console.error(
                    "Admin Update User Error:",
                    requestError
                );


                if (
                    mountedRef.current
                ) {

                    setError(
                        requestError?.message ||
                        "Unable to update user."
                    );

                }


                throw requestError;

            } finally {

                if (
                    mountedRef.current
                ) {

                    setEditUserLoading(
                        false
                    );

                }

            }

        };


    // ==================================================
    // CLOSE CREATE USER MODAL
    // ==================================================

    const handleCloseCreateUser =
        () => {

            if (
                createUserLoading
            ) {

                return;

            }


            setCreateUserModalOpen(
                false
            );

        };


    // ==================================================
    // CREATE USER
    // ==================================================

    const handleCreateUser =
        async (
            userData
        ) => {

            if (
                createUserLoading
            ) {

                return;

            }


            setCreateUserLoading(
                true
            );


            setError("");


            try {

                const response =
                    await createAdminUser(
                        userData
                    );


                if (
                    !mountedRef.current
                ) {

                    return;

                }


                console.log(
                    "Admin User Created:",
                    response
                );


                /*
                 * Close modal after successful
                 * creation.
                 */

                setCreateUserModalOpen(
                    false
                );


                /*
                 * Refresh user list and stats.
                 */

                await Promise.allSettled(
                    [

                        fetchUsers({

                            page: 1,

                            showRefreshing:
                                true,

                        }),

                        fetchStats(),

                    ]
                );

            } catch (
            requestError
            ) {

                console.error(
                    "Admin Create User Error:",
                    requestError
                );


                if (
                    mountedRef.current
                ) {

                    /*
                     * Keep modal open so the user
                     * can correct the data.
                     */

                    setError(
                        requestError?.message ||
                        "Unable to create user."
                    );

                    /*
                     * Re-throw so the modal can
                     * display the error too.
                     */

                    throw requestError;

                }

            } finally {

                if (
                    mountedRef.current
                ) {

                    setCreateUserLoading(
                        false
                    );

                }

            }

        };


    const handleOpenBalanceModal = (user) => {

        if (!user?._id) {
            return;
        }

        if (user?.role === "admin") {
            return;
        }

        setError("");

        setBalanceTarget(user);

        setBalanceModalOpen(true);
    };

    const handleCloseBalanceModal = () => {

        if (balanceLoading) {
            return;
        }

        setBalanceModalOpen(false);

        setBalanceTarget(null);
    };

    const handleAdjustBalance = async ({
        amount,
        action,
        remark,
    }) => {

        if (!balanceTarget?._id) {
            throw new Error("User ID is required.");
        }

        if (balanceLoading) {
            return;
        }

        setBalanceLoading(true);

        setError("");

        try {

            const response =
                await adjustAdminUserBalance(
                    balanceTarget._id,
                    amount,
                    action,
                    remark
                );

            if (!mountedRef.current) {
                return;
            }

            console.log(
                "Admin Balance Adjusted:",
                response
            );

            setBalanceModalOpen(false);

            setBalanceTarget(null);

            /*
             * Refresh users so wallet balance
             * immediately appears in table.
             */

            await Promise.allSettled([
                fetchUsers({
                    page:
                        pagination?.page || 1,
                    showRefreshing: true,
                }),
                fetchStats(),
            ]);

            /*
             * If drawer is open for same user,
             * refresh complete user details.
             */

            if (
                selectedUser?._id ===
                balanceTarget?._id
            ) {

                await handleViewUser(
                    balanceTarget
                );

            }

        } catch (requestError) {

            console.error(
                "Admin Balance Adjustment Error:",
                requestError
            );

            if (mountedRef.current) {

                setError(
                    requestError?.message ||
                    "Unable to adjust user balance."
                );

            }

            throw requestError;

        } finally {

            if (mountedRef.current) {

                setBalanceLoading(false);

            }

        }
    };

    // ==================================================
    // VIEW USER
    // ==================================================

    const handleViewUser =
        async (user) => {

            if (
                !user
            ) {

                return;

            }


            setSelectedUser(
                user
            );


            setDrawerError("");


            if (
                !user?._id
            ) {

                return;

            }


            setDrawerLoading(
                true
            );


            try {

                const response =
                    await getAdminUserById(
                        user._id
                    );


                if (
                    !mountedRef.current
                ) {

                    return;

                }


                const root =
                    response ||
                    {};


                const data =
                    root?.data ??
                    root;


                const detailedUser =
                    root?.user ??
                    data?.user ??
                    data?.data ??
                    data;


                if (
                    detailedUser &&
                    typeof detailedUser ===
                    "object" &&
                    !Array.isArray(
                        detailedUser
                    )
                ) {

                    const normalizedUser = {

                        ...user,

                        ...detailedUser,


                        bettingStats:
                            root?.bettingStats ??
                            data?.bettingStats ??
                            detailedUser?.bettingStats ??
                            detailedUser?.betStats ??
                            {},


                        transactionStats:
                            root?.transactionStats ??
                            data?.transactionStats ??
                            detailedUser?.transactionStats ??
                            {},


                        payoutStats:
                            root?.payoutStats ??
                            data?.payoutStats ??
                            detailedUser?.payoutStats ??
                            {},


                        stats:
                            root?.stats ??
                            data?.stats ??
                            detailedUser?.stats ??
                            {},

                    };


                    console.log(
                        "ADMIN USER DETAILS:",
                        normalizedUser
                    );


                    setSelectedUser(
                        normalizedUser
                    );

                }

            } catch (
            requestError
            ) {

                console.error(
                    "Admin User Details Error:",
                    requestError
                );


                if (
                    mountedRef.current
                ) {

                    setDrawerError(
                        requestError?.message ||
                        "Unable to load user details."
                    );

                }

            } finally {

                if (
                    mountedRef.current
                ) {

                    setDrawerLoading(
                        false
                    );

                }

            }

        };


    // ==================================================
    // CLOSE DRAWER
    // ==================================================

    const handleCloseDrawer =
        () => {

            if (
                actionLoading
            ) {

                return;

            }


            setSelectedUser(
                null
            );


            setDrawerError("");

        };


    // ==================================================
    // OPEN BLOCK MODAL
    // ==================================================

    const handleBlockUser =
        (user) => {

            if (
                !user?._id
            ) {

                return;

            }


            if (
                user?.role ===
                "admin"
            ) {

                return;

            }


            setStatusTarget(
                user
            );


            setStatusAction(
                "blocked"
            );


            setStatusModalOpen(
                true
            );

        };


    // ==================================================
    // OPEN UNBLOCK MODAL
    // ==================================================

    const handleUnblockUser =
        (user) => {

            if (
                !user?._id
            ) {

                return;

            }


            if (
                user?.role ===
                "admin"
            ) {

                return;

            }


            setStatusTarget(
                user
            );


            setStatusAction(
                "active"
            );


            setStatusModalOpen(
                true
            );

        };


    // ==================================================
    // CLOSE STATUS MODAL
    // ==================================================

    const handleCloseStatusModal =
        () => {

            if (
                actionLoading
            ) {

                return;

            }


            setStatusModalOpen(
                false
            );


            setStatusTarget(
                null
            );


            setStatusAction(
                null
            );

        };


    // ==================================================
    // CONFIRM USER STATUS
    // ==================================================

    const handleConfirmStatusChange =
        async () => {

            if (
                !statusTarget?._id ||
                !statusAction
            ) {

                return;

            }


            if (
                statusTarget?.role ===
                "admin"
            ) {

                return;

            }


            if (
                ![
                    "active",
                    "blocked",
                ].includes(
                    statusAction
                )
            ) {

                return;

            }


            setActionLoading(
                true
            );


            try {

                await updateAdminUserStatus(

                    statusTarget._id,

                    statusAction

                );


                if (
                    !mountedRef.current
                ) {

                    return;

                }


                setStatusModalOpen(
                    false
                );


                setStatusTarget(
                    null
                );


                setStatusAction(
                    null
                );


                setSelectedUser(
                    (currentUser) => {

                        if (
                            !currentUser ||
                            currentUser?._id !==
                            statusTarget?._id
                        ) {

                            return currentUser;

                        }


                        return {

                            ...currentUser,

                            status:
                                statusAction,

                        };

                    }
                );


                await Promise.allSettled(
                    [

                        fetchUsers({

                            page:
                                pagination?.page ||
                                1,

                            showRefreshing:
                                true,

                        }),

                        fetchStats(),

                    ]
                );

            } catch (
            requestError
            ) {

                console.error(
                    "Admin User Status Update Error:",
                    requestError
                );


                if (
                    mountedRef.current
                ) {

                    setError(
                        requestError?.message ||
                        "Unable to update user status."
                    );

                }

            } finally {

                if (
                    mountedRef.current
                ) {

                    setActionLoading(
                        false
                    );

                }

            }

        };


    // ==================================================
    // DEACTIVATE USER (SOFT DELETE)
    // ==================================================
    //
    // Restricted server-side to super_admin; a non-super
    // admin will simply get a 403 from the API, surfaced
    // via the normal error banner. Requires confirmation
    // since this is a destructive-adjacent action, matching
    // the window.confirm pattern already used for Settings
    // reset.

    const handleDeactivateUser =
        async (user) => {

            if (!user?._id) {
                return;
            }

            if (user?.role === "admin") {
                return;
            }

            const confirmed =
                window.confirm(
                    `Deactivate ${user.username || user.fullName || "this user"}? They will no longer be able to log in. Their bets, transactions, and referral history are kept.`
                );

            if (!confirmed) {
                return;
            }

            setActionLoading(true);

            setError("");

            try {

                await deactivateAdminUser(user._id);

                if (!mountedRef.current) {
                    return;
                }

                await Promise.allSettled([
                    fetchUsers({
                        page: pagination?.page || 1,
                        showRefreshing: true,
                    }),
                    fetchStats(),
                ]);

            } catch (requestError) {

                console.error(
                    "Admin Deactivate User Error:",
                    requestError
                );

                if (mountedRef.current) {

                    setError(
                        requestError?.message ||
                        "Unable to deactivate user."
                    );

                }

            } finally {

                if (mountedRef.current) {

                    setActionLoading(false);

                }

            }

        };


    // ==================================================
    // MANUAL EMAIL / MOBILE VERIFICATION (Super Admin only)
    // ==================================================
    //
    // Bypasses OTP entirely - restricted server-side to
    // super_admin (a normal admin gets a 403 even if this
    // were called directly). No confirmation dialog since
    // it's non-destructive and reversible via the same flow
    // a user would otherwise complete themselves.

    const handleVerifyEmail =
        async (user) => {

            if (!user?._id) return;

            setActionLoading(true);
            setError("");

            try {

                await manuallyVerifyUserEmail(user._id);

                if (!mountedRef.current) return;

                await fetchUsers({ page: pagination?.page || 1, showRefreshing: true });

            } catch (requestError) {

                if (mountedRef.current) {
                    setError(requestError?.message || "Unable to verify email.");
                }

            } finally {

                if (mountedRef.current) setActionLoading(false);

            }

        };

    const handleVerifyMobile =
        async (user) => {

            if (!user?._id) return;

            setActionLoading(true);
            setError("");

            try {

                await manuallyVerifyUserMobile(user._id);

                if (!mountedRef.current) return;

                await fetchUsers({ page: pagination?.page || 1, showRefreshing: true });

            } catch (requestError) {

                if (mountedRef.current) {
                    setError(requestError?.message || "Unable to verify mobile number.");
                }

            } finally {

                if (mountedRef.current) setActionLoading(false);

            }

        };


    // ==================================================
    // PERMANENTLY DELETE USER
    // ==================================================
    //
    // Restricted server-side to admin/super_admin, never
    // operator; also never allowed against role:"admin"
    // accounts. Uses the dedicated DeleteUserModal (type
    // DELETE to confirm) instead of a generic browser
    // prompt/confirm, since this is irreversible (financial/
    // bet/transaction/audit/support history is preserved,
    // only the account's own PII is anonymized).

    const handleOpenDeleteModal = (user) => {

        if (!user?._id || user?.role === "admin") {
            return;
        }

        setDeleteTarget(user);

        setDeleteModalOpen(true);

    };


    const handleCloseDeleteModal = () => {

        if (deleteLoading) {
            return;
        }

        setDeleteModalOpen(false);

        setDeleteTarget(null);

    };


    const handleConfirmDeleteUser =
        async () => {

            if (!deleteTarget?._id) {
                return;
            }

            setDeleteLoading(true);

            setError("");

            try {

                await deleteAdminUser(deleteTarget._id);

                if (!mountedRef.current) {
                    return;
                }

                setDeleteModalOpen(false);

                setDeleteTarget(null);

                await Promise.allSettled([
                    fetchUsers({
                        page: pagination?.page || 1,
                        showRefreshing: true,
                    }),
                    fetchStats(),
                ]);

            } catch (requestError) {

                console.error(
                    "Admin Delete User Error:",
                    requestError
                );

                if (mountedRef.current) {

                    setError(
                        requestError?.message ||
                        "Unable to delete user."
                    );

                }

            } finally {

                if (mountedRef.current) {

                    setDeleteLoading(false);

                }

            }

        };


    // ==================================================
    // CHANGE USER PASSWORD (from Edit modal)
    // ==================================================
    //
    // Restricted server-side to admin/super_admin, never
    // operator; also never allowed against role:"admin"
    // accounts. Kept as a separate action from the profile
    // update above - it does not touch fullName/username/
    // email/mobile/role/status.

    const handleChangeUserPassword =
        async (newPassword) => {

            if (!editUser?._id) {
                return;
            }

            await changeAdminUserPassword(
                editUser._id,
                newPassword
            );

        };


    // ==================================================
    // RETRY
    // ==================================================

    const handleRetry =
        () => {

            fetchUsers({

                page:
                    pagination?.page ||
                    1,

                showRefreshing:
                    true,

            });

        };


    // ==================================================
    // INITIAL LOADING
    // ==================================================

    if (
        loading
    ) {

        return (

            <main className="min-h-screen bg-[#070914] text-white">

                <AdminHeader
                    title="Users"
                    subtitle="User Management"
                    showSocketStatus={false}
                />


                <div className="p-4 sm:p-6 lg:p-8">

                    <div className="mb-5 rounded-2xl border border-white/[0.06] bg-[#070914] px-5 py-5 sm:px-6">

                        <div className="flex items-center justify-between">

                            <div className="flex items-center gap-3">

                                <div className="h-10 w-10 animate-pulse rounded-xl bg-white/[0.05]" />

                                <div className="space-y-2">

                                    <div className="h-5 w-24 animate-pulse rounded bg-white/[0.05]" />

                                    <div className="h-3 w-64 animate-pulse rounded bg-white/[0.05]" />

                                </div>

                            </div>


                            <div className="h-10 w-24 animate-pulse rounded-xl bg-white/[0.05]" />

                        </div>

                    </div>


                    <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">

                        {Array.from(
                            {
                                length: 5,
                            }
                        ).map(
                            (_, index) => (

                                <SkeletonCard
                                    key={index}
                                />

                            )
                        )}

                    </div>


                    <div className="mt-6 h-[420px] animate-pulse rounded-2xl border border-white/[0.06] bg-[#0d101d]" />

                </div>

            </main>

        );

    }


    // ==================================================
    // MAIN PAGE
    // ==================================================

    return (

        <main className="min-h-screen bg-[#070914] text-white">

            {/* =====================================================
                ADMIN HEADER
            ===================================================== */}

            <AdminHeader
                title="Users"
                subtitle="User Management"
                showSocketStatus={false}
            />


            {/* =====================================================
                MAIN CONTENT CONTAINER
            ===================================================== */}

            <div className="p-4 sm:p-6 lg:p-8">

                {/* =====================================================
                    PAGE TITLE + ACTIONS
                ===================================================== */}

                <div className="mb-5 rounded-2xl border border-white/[0.06] bg-[#070914] px-5 py-5 sm:px-6">

                    <PageHeader
                        onRefresh={
                            handleRefresh
                        }
                        refreshing={
                            refreshing
                        }
                        onCreateUser={
                            handleOpenCreateUser
                        }
                    />

                </div>


                {/* =====================================================
                    ERROR
                ===================================================== */}

                {error && (

                    <ErrorBanner
                        message={
                            error
                        }
                        onRetry={
                            handleRetry
                        }
                    />

                )}


                {/* =====================================================
                    USER STATS
                ===================================================== */}

                <UserStats
                    stats={
                        stats
                    }
                />


                {/* =====================================================
                    FILTERS
                ===================================================== */}

                <UserFilters
                    search={
                        search
                    }
                    setSearch={
                        setSearch
                    }
                    status={
                        status
                    }
                    setStatus={
                        setStatus
                    }
                    role={
                        role
                    }
                    setRole={
                        setRole
                    }
                    onReset={
                        handleResetFilters
                    }
                />


                {/* =====================================================
                    USER TABLE
                ===================================================== */}

                <UserTable
                    users={users}
                    pagination={pagination}
                    refreshing={refreshing}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                    onEdit={handleOpenEditUser}
                    onView={handleViewUser}
                    onBalance={handleOpenBalanceModal}
                    onBlock={handleBlockUser}
                    onUnblock={handleUnblockUser}
                    onDeactivate={handleDeactivateUser}
                    onDelete={handleOpenDeleteModal}
                    actionLoading={actionLoading}
                    onPageChange={handlePageChange}
                    canManuallyVerify={currentAdminRole === "super_admin"}
                    onVerifyEmail={handleVerifyEmail}
                    onVerifyMobile={handleVerifyMobile}
                />

                {/* =====================================================
                    USER DETAIL DRAWER
                ===================================================== */}

                <UserDetailDrawer
                    user={selectedUser}
                    loading={drawerLoading}
                    error={drawerError}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                    actionLoading={actionLoading}
                    onClose={handleCloseDrawer}
                    onEdit={handleOpenEditUser}
                    onBalance={handleOpenBalanceModal}
                    onBlock={handleBlockUser}
                    onUnblock={handleUnblockUser}
                />


                {/* =====================================================
                    STATUS MODAL
                ===================================================== */}

                <UserStatusModal
                    open={
                        statusModalOpen
                    }
                    user={
                        statusTarget
                    }
                    status={
                        statusAction
                    }
                    actionLoading={
                        actionLoading
                    }
                    onClose={
                        handleCloseStatusModal
                    }
                    onSubmit={
                        handleConfirmStatusChange
                    }
                />


                {/* =====================================================
                    CREATE USER MODAL
                ===================================================== */}

                <UserCreateModal
                    open={
                        createUserModalOpen
                    }
                    actionLoading={
                        createUserLoading
                    }
                    onClose={
                        handleCloseCreateUser
                    }
                    onSubmit={
                        handleCreateUser
                    }
                />

                {/* =====================================================
                    EDIT USER MODAL
                ===================================================== */}

                <UserEditModal
                    open={
                        editUserModalOpen
                    }
                    user={
                        editUser
                    }
                    actionLoading={
                        editUserLoading
                    }
                    onClose={
                        handleCloseEditUser
                    }
                    onSubmit={
                        handleUpdateUser
                    }
                    onChangePassword={
                        handleChangeUserPassword
                    }
                />

                <UserBalanceModal
                    open={balanceModalOpen}
                    user={balanceTarget}
                    actionLoading={balanceLoading}
                    onClose={handleCloseBalanceModal}
                    onSubmit={handleAdjustBalance}
                />

                <DeleteUserModal
                    open={deleteModalOpen}
                    user={deleteTarget}
                    actionLoading={deleteLoading}
                    onClose={handleCloseDeleteModal}
                    onConfirm={handleConfirmDeleteUser}
                />


                {/* =====================================================
                    FOOTER
                ===================================================== */}

                <footer className="py-8 text-center text-xs text-slate-700">

                    Gamzzones Admin Control Center

                </footer>

            </div>

        </main>

    );

}


// ======================================================
// PAGE HEADER
// ======================================================

function PageHeader({
    onRefresh,
    refreshing,
    onCreateUser,
}) {

    return (

        <div className="mb-0 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

            {/* =================================================
                TITLE
            ================================================== */}

            <div>

                <div className="flex items-center gap-2">

                    <Users
                        size={17}
                        className="text-purple-400"
                    />

                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-400">

                        User Management

                    </p>

                </div>


                <h2 className="mt-2 text-2xl font-black">

                    Users

                </h2>


                <p className="mt-2 text-sm text-slate-500">

                    Manage player accounts, status and account activity.

                </p>

            </div>


            {/* =================================================
                ACTIONS
            ================================================== */}

            <div className="flex flex-wrap items-center gap-2">

                {/* CREATE USER */}

                <button
                    type="button"
                    onClick={
                        onCreateUser
                    }
                    className="
                        flex
                        w-fit
                        cursor-pointer
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        bg-purple-600
                        px-4
                        py-2.5
                        text-sm
                        font-semibold
                        text-white
                        transition
                        hover:bg-purple-500
                    "
                >

                    <Users
                        size={16}
                    />

                    Add User

                </button>


                {/* REFRESH */}

                <button
                    type="button"
                    onClick={
                        onRefresh
                    }
                    disabled={
                        refreshing
                    }
                    className="
                        flex
                        w-fit
                        cursor-pointer
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        border
                        border-white/[0.07]
                        bg-white/[0.03]
                        px-4
                        py-2.5
                        text-sm
                        font-semibold
                        text-slate-300
                        transition
                        hover:bg-white/[0.06]
                        hover:text-white
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                    "
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
                        : "Refresh"
                    }

                </button>

            </div>

        </div>

    );

}


// ======================================================
// ERROR BANNER
// ======================================================

function ErrorBanner({
    message,
    onRetry,
}) {

    return (

        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.04] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex min-w-0 items-start gap-3">

                <AlertTriangle
                    size={17}
                    className="mt-0.5 shrink-0 text-red-400"
                />


                <div className="min-w-0">

                    <p className="text-sm font-semibold text-red-300">

                        Unable to load users

                    </p>


                    <p className="mt-1 break-words text-xs leading-5 text-slate-600">

                        {message}

                    </p>

                </div>

            </div>


            <button
                type="button"
                onClick={
                    onRetry
                }
                className="
                    w-fit
                    shrink-0
                    cursor-pointer
                    rounded-lg
                    border
                    border-red-500/15
                    bg-red-500/[0.04]
                    px-3
                    py-2
                    text-xs
                    font-semibold
                    text-red-400
                    transition
                    hover:bg-red-500/[0.08]
                "
            >

                Retry

            </button>

        </div>

    );

}


// ======================================================
// SKELETON CARD
// ======================================================

function SkeletonCard() {

    return (

        <div className="h-[88px] animate-pulse rounded-2xl border border-white/[0.06] bg-[#0d101d] p-4">

            <div className="flex items-center justify-between">

                <div className="space-y-2">

                    <div className="h-2.5 w-20 rounded bg-white/[0.05]" />

                    <div className="h-5 w-14 rounded bg-white/[0.05]" />

                </div>


                <div className="h-10 w-10 rounded-xl bg-white/[0.04]" />

            </div>

        </div>

    );

}