"use client";

import { useEffect, useState, useCallback, useRef } from "react";

import { ArrowLeftRight } from "lucide-react";

import UserLayout from "../../components/user/UserLayout";
import UserPageHeader from "../../components/user/UserPageHeader";
import UserFilters from "../../components/user/UserFilters";
import { LoadingState, ErrorState } from "../../components/user/PageState";
import Pagination from "../../components/user/Pagination";
import DataTable, { DataTableRow, DataTableCell } from "../../components/user/DataTable";
import { getTransactions } from "../../lib/api";

// ======================================================
// TRANSACTIONS PAGE
// ======================================================

const CREDIT_TYPES = new Set(["deposit", "win", "refund", "payout_restore", "bonus", "admin_credit", "test_credit"]);

const PAGE_LIMIT = 20;

const TYPE_OPTIONS = [
    { value: "all", label: "All Types" },
    { value: "deposit", label: "Deposit" },
    { value: "withdraw", label: "Withdraw" },
    { value: "bet", label: "Bet" },
    { value: "win", label: "Win" },
    { value: "refund", label: "Refund" },
    { value: "bonus", label: "Bonus" },
    { value: "payout_reverse", label: "Payout Reverse" },
    { value: "payout_restore", label: "Payout Restore" },
    { value: "admin_credit", label: "Admin Credit" },
    { value: "admin_debit", label: "Admin Debit" },
    { value: "test_credit", label: "Test Credit" },
];

const WALLET_MODE_OPTIONS = [
    { value: "all", label: "All Wallets" },
    { value: "real", label: "Real" },
    { value: "test", label: "Test" },
    { value: "bonus", label: "Bonus" },
];

export default function TransactionsPage() {

    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const [typeFilter, setTypeFilter] = useState("all");
    const [walletModeFilter, setWalletModeFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const loadTransactions = useCallback(async (targetPage = page) => {
        try {
            setLoading(true);
            setError("");

            const response = await getTransactions({
                page: targetPage,
                limit: PAGE_LIMIT,
                type: typeFilter,
                walletMode: walletModeFilter,
                search,
                dateFrom,
                dateTo,
            });

            if (response?.transactions) {
                setTransactions(response.transactions);
                setTotal(Number(response.total) || 0);
                setTotalPages(Math.max(Number(response.totalPages) || 1, 1));
            }
        } catch (err) {
            setError(err.message || "Unable to load transactions.");
        } finally {
            setLoading(false);
        }
    }, [page, typeFilter, walletModeFilter, search, dateFrom, dateTo]);

    useEffect(() => {
        loadTransactions(page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    const isFirstFilterRun = useRef(true);

    useEffect(() => {

        if (isFirstFilterRun.current) {
            isFirstFilterRun.current = false;
            return;
        }

        const timeout = setTimeout(() => {
            setPage(1);
            loadTransactions(1);
        }, 400);

        return () => clearTimeout(timeout);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [typeFilter, walletModeFilter, search, dateFrom, dateTo]);

    return (
        <UserLayout title="Transactions">
            <div className="p-4 sm:p-6 lg:p-8">

                <UserPageHeader
                    icon={ArrowLeftRight}
                    eyebrow="Account"
                    title="Transactions"
                    description="Your wallet transaction history."
                />

                <UserFilters
                    search={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="Search remark or transaction ID..."
                    filters={[
                        {
                            key: "type",
                            label: "Type",
                            value: typeFilter,
                            onChange: setTypeFilter,
                            placeholder: "All Types",
                            options: TYPE_OPTIONS,
                        },
                        {
                            key: "walletMode",
                            label: "Wallet",
                            value: walletModeFilter,
                            onChange: setWalletModeFilter,
                            placeholder: "All Wallets",
                            options: WALLET_MODE_OPTIONS,
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
                        <LoadingState label="Loading transactions..." />
                    ) : error ? (
                        <ErrorState message={error} onRetry={loadTransactions} />
                    ) : (
                        <DataTable
                            title="Transaction History"
                            subtitle="All Transactions"
                            count={transactions.length}
                            minWidth="900px"
                            empty={transactions.length === 0}
                            emptyTitle="No transactions yet"
                            emptyMessage="You don't have any wallet transactions yet."
                            headers={["Type", "Wallet", "Amount", "Balance After", "Remark", "Date"]}
                        >
                            {transactions.map((transaction) => {
                                const isCredit = CREDIT_TYPES.has(transaction.type);

                                return (
                                    <DataTableRow key={transaction._id}>
                                        <DataTableCell className="capitalize text-slate-300">
                                            {transaction.type.replace(/_/g, " ")}
                                        </DataTableCell>
                                        <DataTableCell className="capitalize text-slate-500">
                                            {transaction.walletMode || "real"}
                                        </DataTableCell>
                                        <DataTableCell
                                            className={`font-semibold ${
                                                isCredit ? "text-emerald-400" : "text-red-400"
                                            }`}
                                        >
                                            {isCredit ? "+" : "-"}₹
                                            {Number(transaction.amount).toLocaleString("en-IN")}
                                        </DataTableCell>
                                        <DataTableCell className="text-slate-400">
                                            ₹{Number(transaction.currentBalance).toLocaleString("en-IN")}
                                        </DataTableCell>
                                        <DataTableCell className="text-slate-500">
                                            {transaction.remark || "-"}
                                        </DataTableCell>
                                        <DataTableCell className="text-slate-500">
                                            {new Date(transaction.createdAt).toLocaleString("en-IN")}
                                        </DataTableCell>
                                    </DataTableRow>
                                );
                            })}
                        </DataTable>
                    )}

                    {!loading && !error && transactions.length > 0 && (
                        <Pagination
                            page={page}
                            totalPages={totalPages}
                            total={total}
                            limit={PAGE_LIMIT}
                            loading={loading}
                            itemLabel="transactions"
                            onPageChange={setPage}
                        />
                    )}
                </div>

            </div>
        </UserLayout>
    );
}
