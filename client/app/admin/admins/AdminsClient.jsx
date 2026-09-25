"use client";

import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import {
    RefreshCw,
    AlertTriangle,
    ShieldCheck,
} from "lucide-react";

import AdminHeader
    from "../../../components/admin/AdminHeader";

import AdminManagementStats
    from "../../../components/admin/admins/AdminManagementStats";

import AdminManagementFilters
    from "../../../components/admin/admins/AdminManagementFilters";

import AdminManagementTable
    from "../../../components/admin/admins/AdminManagementTable";

import AdminCreateModal
    from "../../../components/admin/admins/AdminCreateModal";

import AdminEditModal
    from "../../../components/admin/admins/AdminEditModal";

import DeactivateAdminModal
    from "../../../components/admin/admins/DeactivateAdminModal";

import ChangeAdminPasswordModal
    from "../../../components/admin/admins/ChangeAdminPasswordModal";

import {
    getAdminAdmins,
    createAdminAccount,
    updateAdminAccount,
    deactivateAdminAccount,
    changeAdminPassword,
    getCurrentAdmin,
} from "../../../lib/adminApi";


// ======================================================
// ADMINS PAGE
// ======================================================
//
// Deliberately mirrors app/admin/users/page.jsx's structure
// (state shape, debounced search, pagination, loading/
// refreshing/error handling) so the two management screens
// behave identically - only the domain (Admin accounts
// instead of User/player accounts) differs.

export default function AdminsPage() {

    // ==================================================
    // ADMINS
    // ==================================================

    const [admins, setAdmins] =
        useState([]);


    // ==================================================
    // ROLE COUNTS
    // ==================================================

    const [counts, setCounts] =
        useState({});


    // ==================================================
    // CURRENT ADMIN (for self-delete / role-permission UI)
    // ==================================================

    const [me, setMe] =
        useState(null);


    // ==================================================
    // CREATE MODAL
    // ==================================================

    const [createModalOpen, setCreateModalOpen] =
        useState(false);


    // ==================================================
    // EDIT MODAL
    // ==================================================

    const [editModalOpen, setEditModalOpen] =
        useState(false);

    const [editTarget, setEditTarget] =
        useState(null);


    // ==================================================
    // DEACTIVATE MODAL
    // ==================================================

    const [deactivateModalOpen, setDeactivateModalOpen] =
        useState(false);

    const [deactivateTarget, setDeactivateTarget] =
        useState(null);


    // ==================================================
    // CHANGE PASSWORD MODAL
    // ==================================================

    const [passwordModalOpen, setPasswordModalOpen] =
        useState(false);

    const [passwordTarget, setPasswordTarget] =
        useState(null);


    // ==================================================
    // PAGINATION
    // ==================================================

    const [pagination, setPagination] =
        useState({

            page: 1,

            limit: 20,

            total: 0,

            pages: 1,

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
    // ERROR
    // ==================================================

    const [error, setError] =
        useState("");


    const searchTimer =
        useRef(null);

    const mountedRef =
        useRef(true);


    // ==================================================
    // FORMAT DATE (matches Users module's formatter)
    // ==================================================

    const formatDate =
        useCallback(
            (value) => {

                if (!value) {
                    return "—";
                }

                const date =
                    new Date(value);

                if (Number.isNaN(date.getTime())) {
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
                ).format(date);

            },
            []
        );


    // ==================================================
    // FETCH ADMINS
    // ==================================================

    const fetchAdmins =
        useCallback(
            async ({ page = 1, showLoader = false, showRefreshing = false } = {}) => {

                if (showLoader) setLoading(true);
                if (showRefreshing) setRefreshing(true);

                setError("");

                try {

                    const response =
                        await getAdminAdmins({
                            page,
                            limit: pagination.limit || 20,
                            search,
                            status,
                            role,
                        });

                    if (!mountedRef.current) return;

                    setAdmins(response?.admins || []);

                    setCounts(response?.counts || {});

                    setPagination((current) => ({
                        ...current,
                        page: response?.pagination?.page || page,
                        limit: response?.pagination?.limit || current.limit,
                        total: response?.pagination?.total || 0,
                        pages: response?.pagination?.pages || 1,
                    }));

                } catch (fetchError) {

                    if (mountedRef.current) {
                        setError(fetchError?.message || "Unable to load admins.");
                    }

                } finally {

                    if (mountedRef.current) {
                        setLoading(false);
                        setRefreshing(false);
                    }

                }

            },
            [search, status, role, pagination.limit]
        );


    // ==================================================
    // FETCH CURRENT ADMIN
    // ==================================================

    const fetchMe =
        useCallback(
            async () => {

                try {

                    const response = await getCurrentAdmin();

                    if (mountedRef.current) {
                        setMe(response?.admin || null);
                    }

                } catch {
                    // non-fatal - UI just falls back to the more
                    // restrictive (non-super-admin) permission set
                }

            },
            []
        );


    // ==================================================
    // INITIAL LOAD
    // ==================================================

    useEffect(() => {

        mountedRef.current = true;

        Promise.allSettled([
            fetchAdmins({ page: 1, showLoader: true }),
            fetchMe(),
        ]);

        return () => {

            mountedRef.current = false;

            if (searchTimer.current) {
                clearTimeout(searchTimer.current);
            }

        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    // ==================================================
    // FILTER CHANGE (debounced)
    // ==================================================

    useEffect(() => {

        if (searchTimer.current) {
            clearTimeout(searchTimer.current);
        }

        searchTimer.current = setTimeout(() => {
            fetchAdmins({ page: 1, showRefreshing: true });
        }, 400);

        return () => {
            if (searchTimer.current) {
                clearTimeout(searchTimer.current);
            }
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, status, role]);


    // ==================================================
    // PAGE CHANGE
    // ==================================================

    const handlePageChange =
        (nextPage) => {
            fetchAdmins({ page: nextPage, showRefreshing: true });
        };


    // ==================================================
    // REFRESH
    // ==================================================

    const handleRefresh =
        async () => {

            await Promise.allSettled([
                fetchAdmins({ page: pagination.page || 1, showRefreshing: true }),
                fetchMe(),
            ]);

        };


    const handleRetry =
        () => {
            fetchAdmins({ page: pagination.page || 1, showRefreshing: true });
        };


    // ==================================================
    // RESET FILTERS
    // ==================================================

    const handleResetFilters =
        () => {
            setSearch("");
            setStatus("all");
            setRole("all");
        };


    // ==================================================
    // CREATE ADMIN
    // ==================================================

    const handleOpenCreate =
        () => setCreateModalOpen(true);

    const handleCreateAdmin =
        async (formData) => {

            setActionLoading(true);

            try {

                await createAdminAccount(formData);

                setCreateModalOpen(false);

                await Promise.allSettled([
                    fetchAdmins({ page: 1, showRefreshing: true }),
                ]);

            } finally {

                setActionLoading(false);

            }

        };


    // ==================================================
    // EDIT ADMIN
    // ==================================================

    const handleOpenEdit =
        (admin) => {
            setEditTarget(admin);
            setEditModalOpen(true);
        };

    const handleEditAdmin =
        async (updates) => {

            if (!editTarget?._id) return;

            setActionLoading(true);

            try {

                await updateAdminAccount(editTarget._id, updates);

                setEditModalOpen(false);

                setEditTarget(null);

                await fetchAdmins({ page: pagination.page || 1, showRefreshing: true });

            } finally {

                setActionLoading(false);

            }

        };


    // ==================================================
    // DEACTIVATE / REACTIVATE ADMIN
    // ==================================================

    const handleOpenDeactivate =
        (admin) => {
            setDeactivateTarget(admin);
            setDeactivateModalOpen(true);
        };

    const handleConfirmDeactivate =
        async (admin) => {

            if (!admin?._id) return;

            setActionLoading(true);
            setError("");

            try {

                await deactivateAdminAccount(admin._id);

                setDeactivateModalOpen(false);

                setDeactivateTarget(null);

                await fetchAdmins({ page: pagination.page || 1, showRefreshing: true });

            } catch (requestError) {

                setError(requestError?.message || "Unable to deactivate admin.");

            } finally {

                setActionLoading(false);

            }

        };

    const handleReactivate =
        async (admin) => {

            if (!admin?._id) return;

            setActionLoading(true);
            setError("");

            try {

                await updateAdminAccount(admin._id, { isActive: true });

                await fetchAdmins({ page: pagination.page || 1, showRefreshing: true });

            } catch (requestError) {

                setError(requestError?.message || "Unable to reactivate admin.");

            } finally {

                setActionLoading(false);

            }

        };


    // ==================================================
    // CHANGE PASSWORD
    // ==================================================

    const handleOpenChangePassword =
        (admin) => {
            setPasswordTarget(admin);
            setPasswordModalOpen(true);
        };

    const handleChangePassword =
        async (newPassword) => {

            if (!passwordTarget?._id) return;

            setActionLoading(true);

            try {

                await changeAdminPassword(passwordTarget._id, newPassword);

                setPasswordModalOpen(false);

                setPasswordTarget(null);

            } finally {

                setActionLoading(false);

            }

        };


    const isSuperAdmin =
        me?.role === "super_admin";


    // ==================================================
    // LOADING SKELETON
    // ==================================================

    if (loading) {

        return (

            <main className="min-h-screen bg-[#070914] text-white">

                <AdminHeader
                    title="Admins"
                    subtitle="Admin Management"
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

                    <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

                        {Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className="h-[88px] animate-pulse rounded-2xl border border-white/[0.06] bg-[#0d101d]" />
                        ))}

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
                title="Admins"
                subtitle="Admin Management"
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

                    <div className="mb-0 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

                        <div>

                            <div className="flex items-center gap-2">

                                <ShieldCheck
                                    size={17}
                                    className="text-purple-400"
                                />

                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-400">
                                    Admin Management
                                </p>

                            </div>

                            <h2 className="mt-2 text-2xl font-black">
                                Admins
                            </h2>

                            <p className="mt-2 text-sm text-slate-500">
                                Manage administrator, super admin and operator accounts.
                            </p>

                        </div>

                        <div className="flex flex-wrap items-center gap-2">

                            <button
                                type="button"
                                onClick={handleOpenCreate}
                                className="flex w-fit cursor-pointer items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-500"
                            >
                                <ShieldCheck size={16} />
                                Add Admin
                            </button>

                            <button
                                type="button"
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="flex w-fit cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                                {refreshing ? "Refreshing..." : "Refresh"}
                            </button>

                        </div>

                    </div>

                </div>


                {/* =====================================================
                    ERROR
                ===================================================== */}

                {error && (

                    <div className="mb-6 flex flex-col gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.04] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">

                        <div className="flex min-w-0 items-start gap-3">

                            <AlertTriangle size={17} className="mt-0.5 shrink-0 text-red-400" />

                            <div className="min-w-0">

                                <p className="text-sm font-semibold text-red-300">
                                    Unable to load admins
                                </p>

                                <p className="mt-1 break-words text-xs leading-5 text-slate-600">
                                    {error}
                                </p>

                            </div>

                        </div>

                        <button
                            type="button"
                            onClick={handleRetry}
                            className="w-fit shrink-0 cursor-pointer rounded-lg border border-red-500/15 bg-red-500/[0.04] px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/[0.08]"
                        >
                            Retry
                        </button>

                    </div>

                )}


                {/* =====================================================
                    STATS
                ===================================================== */}

                <AdminManagementStats
                    counts={counts}
                />


                {/* =====================================================
                    FILTERS
                ===================================================== */}

                <AdminManagementFilters
                    search={search}
                    setSearch={setSearch}
                    status={status}
                    setStatus={setStatus}
                    role={role}
                    setRole={setRole}
                    onReset={handleResetFilters}
                />


                {/* =====================================================
                    TABLE
                ===================================================== */}

                <AdminManagementTable
                    admins={admins}
                    pagination={pagination}
                    refreshing={refreshing}
                    formatDate={formatDate}
                    currentAdminId={me?._id}
                    currentAdminRole={me?.role}
                    onEdit={handleOpenEdit}
                    onReactivate={handleReactivate}
                    onDeactivate={handleOpenDeactivate}
                    onChangePassword={handleOpenChangePassword}
                    actionLoading={actionLoading}
                    onPageChange={handlePageChange}
                />

            </div>


            {/* =====================================================
                CREATE MODAL
            ===================================================== */}

            <AdminCreateModal
                open={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onSubmit={handleCreateAdmin}
                actionLoading={actionLoading}
                canAssignSuperAdmin={isSuperAdmin}
            />


            {/* =====================================================
                EDIT MODAL
            ===================================================== */}

            <AdminEditModal
                open={editModalOpen}
                admin={editTarget}
                onClose={() => { setEditModalOpen(false); setEditTarget(null); }}
                onSubmit={handleEditAdmin}
                actionLoading={actionLoading}
                canAssignSuperAdmin={isSuperAdmin}
            />


            {/* =====================================================
                DEACTIVATE MODAL
            ===================================================== */}

            <DeactivateAdminModal
                open={deactivateModalOpen}
                admin={deactivateTarget}
                onClose={() => { setDeactivateModalOpen(false); setDeactivateTarget(null); }}
                onConfirm={handleConfirmDeactivate}
                actionLoading={actionLoading}
            />

            <ChangeAdminPasswordModal
                open={passwordModalOpen}
                admin={passwordTarget}
                onClose={() => { setPasswordModalOpen(false); setPasswordTarget(null); }}
                onSubmit={handleChangePassword}
                actionLoading={actionLoading}
            />

        </main>

    );

}
