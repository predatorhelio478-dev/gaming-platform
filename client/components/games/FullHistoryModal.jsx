"use client";

import {
    useEffect,
    useState,
} from "react";

import { X } from "lucide-react";

import Pagination from "../user/Pagination";
import { LoadingState, ErrorState, EmptyState } from "../user/PageState";
import { getGameHistoryPaginated } from "../../lib/api";


const COLOR_META = {
    red: { label: "RED", dot: "bg-red-500", text: "text-red-400" },
    green: { label: "GREEN", dot: "bg-emerald-500", text: "text-emerald-400" },
    blue: { label: "BLUE", dot: "bg-blue-500", text: "text-blue-400" },
};

const formatDate = (value) => {

    if (!value) {
        return "-";
    }

    return new Date(value).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

};


// ======================================================
// FULL ROUND HISTORY MODAL
// ======================================================

export default function FullHistoryModal({
    open = false,
    onClose,
}) {

    const [rounds, setRounds] = useState([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1,
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    const loadPage = async (page = 1) => {

        try {

            setLoading(true);
            setError("");

            const response = await getGameHistoryPaginated({ page, limit: 20 });

            if (response?.success) {

                setRounds(response.rounds || []);

                setPagination({
                    page: response.page || 1,
                    limit: response.limit || 20,
                    total: response.total || 0,
                    totalPages: response.totalPages || 1,
                });

            } else {

                setError(response?.message || "Unable to load round history.");

            }

        } catch (fetchError) {

            console.error("Full History Error:", fetchError);
            setError(fetchError?.message || "Unable to load round history.");

        } finally {

            setLoading(false);

        }

    };

    useEffect(() => {

        if (open) {

            loadPage(1);

        }

    }, [open]);


    if (!open) {
        return null;
    }

    return (

        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">

            <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="absolute inset-0 h-full w-full cursor-default bg-black/75 backdrop-blur-[2px]"
            />

            <div
                role="dialog"
                aria-modal="true"
                className="relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d101d] shadow-2xl"
            >

                <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                    <h2 className="text-base font-bold text-white">Full Round History</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.025] text-slate-500 transition hover:bg-white/[0.06] hover:text-white"
                    >
                        <X size={15} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5">

                    {loading ? (

                        <LoadingState label="Loading round history..." />

                    ) : error ? (

                        <ErrorState message={error} onRetry={() => loadPage(pagination.page)} />

                    ) : rounds.length === 0 ? (

                        <EmptyState message="No completed rounds yet." />

                    ) : (

                        <div className="space-y-2">

                            {rounds.map((round) => {

                                const value = round.result?.toLowerCase();
                                const meta = COLOR_META[value] || COLOR_META.blue;

                                return (

                                    <div
                                        key={round._id}
                                        className="flex items-center justify-between rounded-xl border border-white/5 bg-[#0d1429] px-4 py-3"
                                    >

                                        <div className="flex items-center gap-3">
                                            <span className={`h-2.5 w-2.5 rounded-full ${meta.dot} shadow-[0_0_10px_currentColor]`} />
                                            <span className="text-xs font-medium text-slate-300">
                                                Round #{round.roundNumber}
                                            </span>
                                        </div>

                                        <span className={`text-xs font-bold ${meta.text}`}>
                                            {meta.label}
                                        </span>

                                        <span className="text-[11px] text-slate-500">
                                            {formatDate(round.endTime || round.createdAt)}
                                        </span>

                                    </div>

                                );

                            })}

                        </div>

                    )}

                </div>

                {!loading && !error && rounds.length > 0 && (

                    <div className="border-t border-white/[0.06] px-5 py-4">
                        <Pagination
                            page={pagination.page}
                            totalPages={pagination.totalPages}
                            total={pagination.total}
                            limit={pagination.limit}
                            loading={loading}
                            itemLabel="rounds"
                            onPageChange={(nextPage) => loadPage(nextPage)}
                        />
                    </div>

                )}

            </div>

        </div>

    );

}
