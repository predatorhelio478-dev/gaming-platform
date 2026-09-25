"use client";

import {
    useCallback,
    useEffect,
    useState,
} from "react";

import AdminHeader from "../../../components/admin/AdminHeader";

import AuditLogsHeader from "../../../components/admin/audit-logs/AuditLogsHeader";

import AuditLogsFilters from "../../../components/admin/audit-logs/AuditLogsFilters";

import AuditLogsTable from "../../../components/admin/audit-logs/AuditLogsTable";

import AuditLogModal from "../../../components/admin/audit-logs/AuditLogModal";

import AuditLogsError from "../../../components/admin/audit-logs/AuditLogsError";

import AdminPagination from "../../../components/admin/ui/AdminPagination";

import { getAdminAuditLogs } from "../../../lib/adminApi";


const DEFAULT_LIMIT = 20;


export default function AuditLogsPage() {

    const [logs, setLogs] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState("");

    const [selectedLog, setSelectedLog] =
        useState(null);


    /*
    |--------------------------------------------------------------------------
    | PAGINATION
    |--------------------------------------------------------------------------
    */

    const [page, setPage] =
        useState(1);

    const [totalPages, setTotalPages] =
        useState(1);

    const [total, setTotal] =
        useState(0);


    /*
    |--------------------------------------------------------------------------
    | FILTERS
    |--------------------------------------------------------------------------
    */

    const [search, setSearch] =
        useState("");

    const [module, setModule] =
        useState("");

    const [action, setAction] =
        useState("");

    const [actorType, setActorType] =
        useState("");

    const [dateFrom, setDateFrom] =
        useState("");

    const [dateTo, setDateTo] =
        useState("");


    /*
    |--------------------------------------------------------------------------
    | FETCH
    |--------------------------------------------------------------------------
    */

    const fetchLogs =
        useCallback(
            async (
                showRefresh = false
            ) => {

                try {

                    if (showRefresh) {
                        setRefreshing(
                            true
                        );
                    } else {
                        setLoading(
                            true
                        );
                    }

                    setError("");


                    const data =
                        await getAdminAuditLogs({
                            page,
                            limit: DEFAULT_LIMIT,
                            search: search.trim(),
                            module,
                            action,
                            actorType,
                            dateFrom,
                            dateTo,
                        });


                    const receivedLogs =
                        Array.isArray(
                            data.logs
                        )
                            ? data.logs
                            : Array.isArray(
                                data.data
                            )
                                ? data.data
                                : [];


                    const pagination =
                        data.pagination ||
                        data.meta ||
                        {};


                    setLogs(
                        receivedLogs
                    );


                    setTotal(
                        Number(
                            pagination.total ??
                            data.total ??
                            receivedLogs.length
                        )
                    );


                    setTotalPages(
                        Number(
                            pagination.totalPages ??
                            data.totalPages ??
                            1
                        ) || 1
                    );

                } catch (err) {

                    console.error(
                        "Audit Logs Error:",
                        err
                    );

                    setError(
                        err.message ||
                        "Unable to load audit logs."
                    );

                    setLogs([]);

                } finally {

                    setLoading(false);
                    setRefreshing(false);

                }

            },
            [
                page,
                search,
                module,
                action,
                actorType,
                dateFrom,
                dateTo,
            ]
        );


    useEffect(() => {

        fetchLogs();

    }, [fetchLogs]);


    /*
    |--------------------------------------------------------------------------
    | SEARCH
    |--------------------------------------------------------------------------
    */

    const handleSearch =
        (event) => {

            event.preventDefault();

            setPage(1);

        };


    /*
    |--------------------------------------------------------------------------
    | FILTER
    |--------------------------------------------------------------------------
    */

    const handleModuleChange =
        (value) => {

            setModule(value);
            setPage(1);

        };


    const handleActionChange =
        (value) => {

            setAction(value);
            setPage(1);

        };


    const handleActorChange =
        (value) => {

            setActorType(value);
            setPage(1);

        };


    const handleDateFromChange =
        (value) => {

            setDateFrom(value);
            setPage(1);

        };


    const handleDateToChange =
        (value) => {

            setDateTo(value);
            setPage(1);

        };


    /*
    |--------------------------------------------------------------------------
    | CLEAR
    |--------------------------------------------------------------------------
    */

    const clearFilters =
        () => {

            setSearch("");
            setModule("");
            setAction("");
            setActorType("");
            setDateFrom("");
            setDateTo("");

            setPage(1);

        };


    const hasFilters =
        Boolean(
            search ||
            module ||
            action ||
            actorType ||
            dateFrom ||
            dateTo
        );


    return (
        <main className="min-h-screen bg-[#070914] text-white">

            <AdminHeader
                title="Audit Logs"
                subtitle="System Activity"
                showSocketStatus={false}
            />

            <div className="p-4 sm:p-6 lg:p-8">

                {/* HEADER */}

                <AuditLogsHeader
                    refreshing={
                        refreshing
                    }
                    onRefresh={() =>
                        fetchLogs(
                            true
                        )
                    }
                />


                {/* ERROR */}

                <AuditLogsError
                    message={error}
                    onClose={() =>
                        setError("")
                    }
                />


                {/* FILTERS */}

                <AuditLogsFilters
                    search={search}
                    module={module}
                    action={action}
                    actorType={
                        actorType
                    }
                    dateFrom={dateFrom}
                    dateTo={dateTo}

                    onSearchChange={
                        setSearch
                    }

                    onModuleChange={
                        handleModuleChange
                    }

                    onActionChange={
                        handleActionChange
                    }

                    onActorChange={
                        handleActorChange
                    }

                    onDateFromChange={
                        handleDateFromChange
                    }

                    onDateToChange={
                        handleDateToChange
                    }

                    onSearch={
                        handleSearch
                    }

                    onClear={
                        clearFilters
                    }

                    hasFilters={
                        hasFilters
                    }
                />


                {/* TABLE */}

                <AuditLogsTable
                    logs={logs}
                    loading={loading}
                    total={total}
                    onView={
                        setSelectedLog
                    }
                />


                {/* PAGINATION */}

                {!loading &&
                    logs.length > 0 && (

                        <AdminPagination
                            page={page}
                            totalPages={
                                totalPages
                            }
                            total={total}
                            limit={
                                DEFAULT_LIMIT
                            }
                            loading={
                                loading
                            }
                            itemLabel="logs"
                            onPageChange={
                                setPage
                            }
                        />

                    )}

            </div>


            {/* MODAL */}

            {selectedLog && (
                <AuditLogModal
                    log={
                        selectedLog
                    }
                    onClose={() =>
                        setSelectedLog(
                            null
                        )
                    }
                />
            )}

        </main>
    );
}