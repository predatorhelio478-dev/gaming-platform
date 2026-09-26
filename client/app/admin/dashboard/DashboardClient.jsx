"use client";

import { useEffect, useMemo, useState } from "react";
import { Gamepad2 } from "lucide-react";
import AdminHeader from "../../../components/admin/AdminHeader";
import AdminPageHeader from "../../../components/admin/ui/AdminPageHeader";
import DashboardKpiCards from "../../../components/admin/dashboard/DashboardKpiCards";
import CurrentRoundPanel from "../../../components/admin/dashboard/CurrentRoundPanel";
import BetDistribution from "../../../components/admin/dashboard/BetDistribution";
import SecurityStatus from "../../../components/admin/dashboard/SecurityStatus";
import QuickAccess from "../../../components/admin/dashboard/QuickAccess";
import {
    getAdminSocket,
    subscribeToAdminGame,
    disconnectAdminSocket,
} from "../../../lib/adminSocket";
import useSiteSettings from "../../../lib/useSiteSettings";

const INITIAL_STATS = {
    totalPlayers: 0,
    totalBets: 0,
    totalBetAmount: 0,
    totalPayout: 0,
    redAmount: 0,
    greenAmount: 0,
    blueAmount: 0,
};

export default function AdminDashboardPage() {
    const { siteName } = useSiteSettings();
    const [admin, setAdmin] = useState(null);
    const [connected, setConnected] = useState(false);
    const [round, setRound] = useState(null);
    const [timer, setTimer] = useState(0);
    const [gameStatus, setGameStatus] = useState("stopped");
    const [lastResult, setLastResult] = useState(null);
    const [roundStats, setRoundStats] = useState(INITIAL_STATS);

    useEffect(() => {
        try {
            const savedAdmin = localStorage.getItem("admin");
            if (savedAdmin) {
                setAdmin(JSON.parse(savedAdmin));
            }
        } catch (error) {
            console.error("Unable to read admin session:", error);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = subscribeToAdminGame({
            onConnect: () => {
                setConnected(true);
                getAdminSocket().emit("join_admin_game_monitor");
            },

            onDisconnect: () => {
                setConnected(false);
            },

            onGameState: (data) => {
                if (!data) return;

                setGameStatus(data.status || "stopped");
                if (data.round) setRound(data.round);
                if (data.remainingSeconds !== undefined) {
                    setTimer(Number(data.remainingSeconds));
                }
            },

            onGameStatus: (data) => {
                if (!data) return;

                if (data.status) setGameStatus(data.status);
                if (data.round) setRound(data.round);
                if (data.remainingSeconds !== undefined) {
                    setTimer(Number(data.remainingSeconds));
                }
            },

            onNewRound: (data) => {
                if (data?.round) setRound(data.round);
                if (data?.remainingSeconds !== undefined) {
                    setTimer(Number(data.remainingSeconds));
                }

                setGameStatus("running");
                setRoundStats({ ...INITIAL_STATS });
            },

            onTimer: (data) => {
                const seconds =
                    typeof data === "number"
                        ? data
                        : data?.remainingSeconds ?? data?.seconds ?? 0;

                setTimer(Number(seconds));
            },

            onBettingClosed: () => {
                setGameStatus("closed");
            },

            onRoundStats: (data) => {
                if (!data) return;

                setRoundStats({
                    totalPlayers: Number(data.totalPlayers || 0),
                    totalBets: Number(data.totalBets || 0),
                    totalBetAmount: Number(data.totalBetAmount || 0),
                    totalPayout: Number(data.totalPayout || 0),
                    redAmount: Number(data.colors?.red || 0),
                    greenAmount: Number(data.colors?.green || 0),
                    blueAmount: Number(data.colors?.blue || 0),
                });
            },

            onRoundResult: (data) => {
                if (data?.result) setLastResult(data.result);

                setRoundStats((previous) => ({
                    ...previous,
                    totalBets: Number(data?.totalBets ?? previous.totalBets),
                    totalPayout: Number(data?.totalPayout ?? previous.totalPayout),
                }));

                setGameStatus("result");
            },
        });

        return () => {
            unsubscribe();
            disconnectAdminSocket();
        };
    }, []);

    const formatCurrency = (value) =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(Number(value || 0));

    const statusLabel =
        gameStatus === "betting"
            ? "BETTING OPEN"
            : gameStatus === "closed"
                ? "BETTING CLOSED"
                : gameStatus === "result"
                    ? "RESULT DECLARED"
                    : gameStatus === "paused"
                        ? "GAME PAUSED"
                        : gameStatus === "stopping"
                            ? "STOPPING"
                            : gameStatus === "stopped"
                                ? "GAME STOPPED"
                                : gameStatus === "starting"
                                    ? "STARTING"
                                    : gameStatus === "processing"
                                        ? "PROCESSING"
                                        : gameStatus === "error"
                                            ? "ERROR"
                                            : "LIVE";

    const statusColor =
        gameStatus === "paused"
            ? "text-yellow-400"
            : gameStatus === "stopped" || gameStatus === "error"
                ? "text-red-400"
                : gameStatus === "result"
                    ? "text-blue-400"
                    : "text-green-400";

    const resultClass = useMemo(() => {
        if (lastResult === "red") return "bg-red-500";
        if (lastResult === "green") return "bg-green-500";
        if (lastResult === "blue") return "bg-blue-500";
        return "bg-slate-700";
    }, [lastResult]);

    return (
        <main className="min-h-screen bg-[#070914] text-white">
            <AdminHeader
                title="Dashboard"
                subtitle="Game Management"
                connected={connected}
                showSocketStatus={true}
            />

            <div className="p-4 sm:p-6 lg:p-8">

                <AdminPageHeader
                    icon={Gamepad2}
                    eyebrow="Game Management"
                    title="Color Prediction Control"
                    description="Real-time game monitoring"
                    actions={
                        <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-xs font-semibold">
                            <span className={connected ? "text-green-400" : "text-red-400"}>●</span>
                            <span className="ml-2 text-slate-400">{statusLabel}</span>
                        </span>
                    }
                />

                <DashboardKpiCards
                    stats={roundStats}
                    formatCurrency={formatCurrency}
                />

                <CurrentRoundPanel
                    round={round}
                    timer={timer}
                    gameStatus={gameStatus}
                    statusLabel={statusLabel}
                    statusColor={statusColor}
                    lastResult={lastResult}
                    resultClass={resultClass}
                />

                <div className="mt-6 grid gap-6 xl:grid-cols-3">
                    <BetDistribution
                        stats={roundStats}
                        formatCurrency={formatCurrency}
                    />
                    <SecurityStatus
                        connected={connected}
                        admin={admin}
                    />
                </div>

                <QuickAccess />

            </div>
        </main>
    );
}
