"use client";

import { useEffect, useState } from "react";

import {
    Play,
    Pause,
    PlayCircle,
    ShieldAlert,
    Gamepad2,
    Activity,
    Clock3,
    RotateCcw,
    Wifi,
    WifiOff,
} from "lucide-react";

import AdminHeader from "../../../components/admin/AdminHeader";
import AdminPageHeader from "../../../components/admin/ui/AdminPageHeader";

import {
    getCurrentAdmin,
    startGame,
    pauseGame,
    resumeGame,
    emergencyStop,
} from "../../../lib/adminApi";

import {
    getAdminSocket,
    disconnectAdminSocket,
} from "../../../lib/adminSocket";

import useSiteSettings from "../../../lib/useSiteSettings";

export default function GameControlPage() {

    const { siteName } = useSiteSettings();
    const [admin, setAdmin] = useState(null);

    const [connected, setConnected] =
        useState(false);

    const [gameStatus, setGameStatus] =
        useState("stopped");

    const [round, setRound] =
        useState(null);

    const [timer, setTimer] =
        useState(0);

    const [loading, setLoading] =
        useState(false);

    /*
    |--------------------------------------------------------------------------
    | LOAD ADMIN
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        const loadAdmin = async () => {
            try {
                const response =
                    await getCurrentAdmin();

                if (response?.success) {
                    setAdmin(response.admin);
                }
            } catch (error) {
                console.error(
                    "Admin Load Error:",
                    error
                );
            }
        };

        loadAdmin();
    }, []);

    /*
    |--------------------------------------------------------------------------
    | SOCKET CONNECTION
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    | Existing socket architecture is intentionally preserved.
    |
    */

    useEffect(() => {
        const socket =
            getAdminSocket();

        /*
        |--------------------------------------------------------------------------
        | CONNECT
        |--------------------------------------------------------------------------
        */

        const handleConnect = () => {
            console.log(
                "Admin Game Socket Connected"
            );

            setConnected(true);

            socket.emit(
                "join_admin_game_monitor"
            );
        };

        /*
        |--------------------------------------------------------------------------
        | DISCONNECT
        |--------------------------------------------------------------------------
        */

        const handleDisconnect = () => {
            console.log(
                "Admin Game Socket Disconnected"
            );

            setConnected(false);
        };

        /*
        |--------------------------------------------------------------------------
        | GAME STATE
        |--------------------------------------------------------------------------
        */

        const updateState = (data) => {
            if (!data) {
                return;
            }

            console.log(
                "ADMIN GAME STATE:",
                data
            );

            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */

            if (
                data.status !== undefined &&
                data.status !== null
            ) {
                setGameStatus(
                    normalizeStatus(
                        data.status
                    )
                );
            }

            /*
            |--------------------------------------------------------------------------
            | ROUND
            |--------------------------------------------------------------------------
            */

            if (data.round) {
                setRound(data.round);
            }

            /*
            |--------------------------------------------------------------------------
            | TIMER
            |--------------------------------------------------------------------------
            */

            if (
                data.remainingSeconds !==
                undefined &&
                data.remainingSeconds !==
                null
            ) {
                setTimer(
                    Number(
                        data.remainingSeconds
                    )
                );
            }
        };

        /*
        |--------------------------------------------------------------------------
        | TIMER
        |--------------------------------------------------------------------------
        */

        const handleTimer = (data) => {
            const seconds =
                typeof data === "number"
                    ? data
                    : data?.remainingSeconds ??
                    data?.seconds ??
                    0;

            setTimer(
                Math.max(
                    0,
                    Number(seconds)
                )
            );
        };

        /*
        |--------------------------------------------------------------------------
        | SOCKET EVENTS
        |--------------------------------------------------------------------------
        */

        socket.on(
            "connect",
            handleConnect
        );

        socket.on(
            "disconnect",
            handleDisconnect
        );

        socket.on(
            "admin_game_state",
            updateState
        );

        socket.on(
            "game_status",
            updateState
        );

        socket.on(
            "new_round",
            updateState
        );

        socket.on(
            "timer",
            handleTimer
        );

        /*
        |--------------------------------------------------------------------------
        | SOCKET ALREADY CONNECTED
        |--------------------------------------------------------------------------
        */

        if (socket.connected) {
            handleConnect();
        }

        /*
        |--------------------------------------------------------------------------
        | CLEANUP
        |--------------------------------------------------------------------------
        */

        return () => {
            socket.off(
                "connect",
                handleConnect
            );

            socket.off(
                "disconnect",
                handleDisconnect
            );

            socket.off(
                "admin_game_state",
                updateState
            );

            socket.off(
                "game_status",
                updateState
            );

            socket.off(
                "new_round",
                updateState
            );

            socket.off(
                "timer",
                handleTimer
            );

            disconnectAdminSocket();
        };
    }, []);

    /*
    |--------------------------------------------------------------------------
    | ACTION HANDLER
    |--------------------------------------------------------------------------
    */

    const executeAction = async (
        action
    ) => {
        if (loading) {
            return;
        }

        /*
        |--------------------------------------------------------------------------
        | EMERGENCY CONFIRMATION
        |--------------------------------------------------------------------------
        */

        if (action === "emergency") {
            const confirmed =
                window.confirm(
                    "Are you sure you want to activate Emergency Stop?"
                );

            if (!confirmed) {
                return;
            }
        }

        try {
            setLoading(true);

            /*
            |--------------------------------------------------------------------------
            | START
            |--------------------------------------------------------------------------
            */

            if (action === "start") {
                await startGame();

                /*
                |--------------------------------------------------------------------------
                | Optimistic UI update
                |--------------------------------------------------------------------------
                |
                | Socket will also update this when backend
                | broadcasts the actual state.
                |
                */

                setGameStatus("running");
            }

            /*
            |--------------------------------------------------------------------------
            | PAUSE
            |--------------------------------------------------------------------------
            */

            if (action === "pause") {
                await pauseGame();

                /*
                |--------------------------------------------------------------------------
                | IMPORTANT:
                | Immediately mark UI as paused.
                | This guarantees Resume becomes available
                | even before socket event arrives.
                |--------------------------------------------------------------------------
                */

                setGameStatus("paused");
            }

            /*
            |--------------------------------------------------------------------------
            | RESUME
            |--------------------------------------------------------------------------
            */

            if (action === "resume") {
                await resumeGame();

                /*
                |--------------------------------------------------------------------------
                | IMPORTANT:
                | Immediately mark UI as running.
                | Socket will synchronize actual state afterward.
                |--------------------------------------------------------------------------
                */

                setGameStatus("running");
            }

            /*
            |--------------------------------------------------------------------------
            | EMERGENCY STOP
            |--------------------------------------------------------------------------
            */

            if (action === "emergency") {
                await emergencyStop();

                setGameStatus("stopped");

                setTimer(0);
            }
        } catch (error) {
            console.error(
                "Game Control Error:",
                error
            );

            /*
            |--------------------------------------------------------------------------
            | IMPORTANT:
            | Don't change UI state if API request failed.
            |--------------------------------------------------------------------------
            */

            alert(
                error?.message ||
                "Unable to control game."
            );
        } finally {
            setLoading(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | NORMALIZED STATUS
    |--------------------------------------------------------------------------
    */

    const normalizedStatus =
        normalizeStatus(gameStatus);

    /*
    |--------------------------------------------------------------------------
    | STATE HELPERS
    |--------------------------------------------------------------------------
    */

    const isRunning =
        normalizedStatus === "running" ||
        normalizedStatus === "betting";

    const isPaused =
        normalizedStatus === "paused" ||
        normalizedStatus ===
        "game_paused";

    const isStopped =
        normalizedStatus ===
        "stopped";

    /*
    |--------------------------------------------------------------------------
    | ROUND NUMBER
    |--------------------------------------------------------------------------
    */

    const roundNumber =
        round?.roundNumber ??
        round?.number ??
        round?.roundNo ??
        round?.id ??
        "—";

    /*
    |--------------------------------------------------------------------------
    | TIMER
    |--------------------------------------------------------------------------
    */

    const safeTimer =
        Math.max(
            0,
            Number(timer || 0)
        );

    const minutes =
        Math.floor(
            safeTimer / 60
        );

    const seconds =
        safeTimer % 60;

    const formattedTimer =
        `${String(minutes).padStart(
            2,
            "0"
        )}:${String(seconds).padStart(
            2,
            "0"
        )}`;

    /*
    |--------------------------------------------------------------------------
    | STATUS LABEL
    |--------------------------------------------------------------------------
    */

    const statusLabel =
        getStatusLabel(
            normalizedStatus
        );

    return (
        <main className="min-h-screen bg-[#070914] text-white">
            {/* HEADER */}

            <AdminHeader
                title="Game Control"
                subtitle="Game Management"
                connected={connected}
                showSocketStatus={true}
            />

            <div className="p-4 sm:p-6 lg:p-8">

                <AdminPageHeader
                    icon={Gamepad2}
                    eyebrow="Control Center"
                    title="Game Control"
                    description="Control and monitor the live game engine."
                />

                {/* GAME OVERVIEW */}

                <section className="rounded-2xl border border-white/[0.06] bg-[#0d101d] p-5 sm:p-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        {/* ROUND */}

                        <div>
                            <p className="text-xs uppercase tracking-[0.15em] text-slate-400">
                                Current Round
                            </p>

                            <div className="mt-2 flex flex-wrap items-center gap-3">
                                <h3 className="text-3xl font-black">
                                    #{roundNumber}
                                </h3>

                                <StatusBadge
                                    status={
                                        normalizedStatus
                                    }
                                />
                            </div>
                        </div>

                        {/* SOCKET */}

                        <div
                            className={`
                                flex
                                items-center
                                gap-3
                                rounded-xl
                                border
                                px-4
                                py-3

                                ${connected
                                    ? "border-green-500/10 bg-green-500/[0.03]"
                                    : "border-red-500/10 bg-red-500/[0.03]"
                                }
                            `}
                        >
                            {connected ? (
                                <Wifi
                                    size={17}
                                    className="text-green-400"
                                />
                            ) : (
                                <WifiOff
                                    size={17}
                                    className="text-red-400"
                                />
                            )}

                            <div>
                                <p className="text-xs font-semibold">
                                    {connected
                                        ? "Socket Connected"
                                        : "Socket Disconnected"}
                                </p>

                                <p className="mt-0.5 text-[10px] text-slate-600">
                                    Live game connection
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* STATUS CARDS */}

                    <div className="mt-6 grid gap-4 sm:grid-cols-3">

                        {/* STATUS */}

                        <div
                            className="
            rounded-xl
            border
            border-white/[0.04]
            bg-white/[0.025]
            p-5
            transition
            duration-200
            hover:border-white/[0.08]
        "
                        >

                            <div className="flex items-center justify-between gap-4">

                                {/* TEXT */}

                                <div className="min-w-0">

                                    <p
                                        className="
                        text-xs
                        font-semibold
                        uppercase
                        tracking-wider
                        text-slate-400
                    "
                                    >
                                        Status
                                    </p>


                                    <p className="mt-3 text-xl font-black text-white">
                                        {statusLabel}
                                    </p>

                                </div>


                                {/* ICON */}

                                <span
                                    className="
                    flex
                    h-11
                    w-11
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-cyan-500/10
                    text-cyan-400
                "
                                >

                                    <Activity
                                        size={20}
                                        strokeWidth={1.8}
                                    />

                                </span>

                            </div>

                        </div>


                        {/* ROUND */}

                        <div
                            className="
            rounded-xl
            border
            border-white/[0.04]
            bg-white/[0.025]
            p-5
            transition
            duration-200
            hover:border-white/[0.08]
        "
                        >

                            <div className="flex items-center justify-between gap-4">

                                {/* TEXT */}

                                <div className="min-w-0">

                                    <p
                                        className="
                        text-xs
                        font-semibold
                        uppercase
                        tracking-wider
                        text-slate-400
                    "
                                    >
                                        Current Round
                                    </p>


                                    <p className="mt-3 text-xl font-black text-white">
                                        #{roundNumber}
                                    </p>

                                </div>


                                {/* ICON */}

                                <span
                                    className="
                    flex
                    h-11
                    w-11
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-violet-500/10
                    text-violet-400
                "
                                >

                                    <RotateCcw
                                        size={20}
                                        strokeWidth={1.8}
                                    />

                                </span>

                            </div>

                        </div>


                        {/* TIMER */}

                        <div
                            className="
            rounded-xl
            border
            border-white/[0.04]
            bg-white/[0.025]
            p-5
            transition
            duration-200
            hover:border-white/[0.08]
        "
                        >

                            <div className="flex items-center justify-between gap-4">

                                {/* TEXT */}

                                <div className="min-w-0">

                                    <p
                                        className="
                        text-xs
                        font-semibold
                        uppercase
                        tracking-wider
                        text-slate-400
                    "
                                    >
                                        Remaining Time
                                    </p>


                                    <p
                                        className="
                        mt-3
                        font-mono
                        text-2xl
                        font-black
                        tabular-nums
                        text-white
                    "
                                    >
                                        {formattedTimer}
                                    </p>

                                </div>


                                {/* ICON */}

                                <span
                                    className="
                    flex
                    h-11
                    w-11
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-orange-500/10
                    text-orange-400
                "
                                >

                                    <Clock3
                                        size={20}
                                        strokeWidth={1.8}
                                    />

                                </span>

                            </div>

                        </div>

                    </div>
                </section>

                {/* MAIN CONTROLS */}

                <section className="mt-6 rounded-2xl border border-white/[0.06] bg-[#0d101d] p-5 sm:p-6">
                    <div>
                        <p className="text-xs uppercase tracking-[0.15em] text-slate-400">
                            Game Engine
                        </p>

                        <h3 className="mt-1 text-lg font-bold">
                            Controls
                        </h3>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {/* START */}

                        <ControlButton
                            icon={
                                <Play
                                    size={19}
                                    strokeWidth={2}
                                />
                            }
                            title="Start Game"
                            description="Start the game engine"
                            onClick={() =>
                                executeAction(
                                    "start"
                                )
                            }
                            loading={
                                loading
                            }
                            disabled={
                                loading ||
                                isRunning ||
                                isPaused
                            }
                            className="border-purple-500/20 bg-purple-500/10 text-purple-300 hover:bg-purple-500/15"
                        />

                        {/* PAUSE */}

                        <ControlButton
                            icon={
                                <Pause
                                    size={19}
                                    strokeWidth={2}
                                />
                            }
                            title="Pause Game"
                            description="Pause the current game"
                            onClick={() =>
                                executeAction(
                                    "pause"
                                )
                            }
                            loading={
                                loading
                            }
                            disabled={
                                loading ||
                                !isRunning
                            }
                            className="border-yellow-500/20 bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/15"
                        />

                        {/* RESUME */}

                        <ControlButton
                            icon={
                                <PlayCircle
                                    size={20}
                                    strokeWidth={2}
                                />
                            }
                            title="Resume Game"
                            description="Resume the paused game"
                            onClick={() =>
                                executeAction(
                                    "resume"
                                )
                            }
                            loading={
                                loading
                            }
                            disabled={
                                loading ||
                                !isPaused
                            }
                            className="border-green-500/20 bg-green-500/10 text-green-300 hover:bg-green-500/15"
                        />

                        {/* EMERGENCY */}

                        <ControlButton
                            icon={
                                <ShieldAlert
                                    size={19}
                                    strokeWidth={2}
                                />
                            }
                            title="Emergency Stop"
                            description="Immediately stop the game"
                            onClick={() =>
                                executeAction(
                                    "emergency"
                                )
                            }
                            loading={
                                loading
                            }
                            disabled={
                                loading ||
                                isStopped
                            }
                            className="border-red-500/20 bg-red-500/10 text-red-300 hover:bg-red-500/15"
                        />
                    </div>
                </section>

                {/* CURRENT STATE */}

                <section className="mt-6 rounded-2xl border border-white/[0.06] bg-[#0d101d] p-5 sm:p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.15em] text-slate-400">
                                Live State
                            </p>

                            <h3 className="mt-1 text-lg font-bold">
                                Engine Status
                            </h3>
                        </div>

                        <div
                            className={`
                                flex
                                h-10
                                w-10
                                items-center
                                justify-center
                                rounded-xl

                                ${isRunning
                                    ? "bg-green-500/10 text-green-400"
                                    : isPaused
                                        ? "bg-yellow-500/10 text-yellow-400"
                                        : "bg-red-500/10 text-red-400"
                                }
                            `}
                        >
                            <Activity
                                size={19}
                            />
                        </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <StateRow
                            label="Game"
                            value={
                                isRunning
                                    ? "Running"
                                    : isPaused
                                        ? "Paused"
                                        : "Stopped"
                            }
                        />

                        <StateRow
                            label="Round"
                            value={`#${roundNumber}`}
                        />

                        <StateRow
                            label="Timer"
                            value={
                                formattedTimer
                            }
                        />
                    </div>
                </section>

                {/* EMERGENCY WARNING */}

                <section className="mt-6 rounded-2xl border border-red-500/15 bg-red-500/[0.025] p-5 sm:p-6">
                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                        <div className="flex gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                                <ShieldAlert
                                    size={21}
                                />
                            </div>

                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.15em] text-red-400">
                                    Critical Action
                                </p>

                                <h3 className="mt-1 font-bold">
                                    Emergency Stop
                                </h3>

                                <p className="mt-1 max-w-xl text-xs leading-5 text-slate-400">
                                    Use this only when
                                    an immediate game
                                    shutdown is required.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                executeAction(
                                    "emergency"
                                )
                            }
                            disabled={
                                loading ||
                                isStopped
                            }
                            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-3 text-sm font-bold text-red-400 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ShieldAlert
                                size={17}
                            />

                            {loading
                                ? "Processing..."
                                : "Emergency Stop"}
                        </button>
                    </div>
                </section>

                <footer className="py-8 text-center text-xs text-slate-500">
                    {siteName} Admin Control Center
                </footer>
            </div>
        </main>
    );
}

/*
|--------------------------------------------------------------------------
| CONTROL BUTTON
|--------------------------------------------------------------------------
*/

function ControlButton({
    icon,
    title,
    description,
    onClick,
    loading,
    disabled,
    className = "",
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`
                flex
                min-h-[100px]
                w-full
                cursor-pointer
                items-center
                gap-4
                rounded-xl
                border
                p-4
                text-left
                transition
                disabled:cursor-not-allowed
                disabled:opacity-40
                ${className}
            `}
        >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black/20">
                {loading ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-current/20 border-t-current" />
                ) : (
                    icon
                )}
            </div>

            <div className="min-w-0">
                <p className="text-sm font-bold">
                    {loading
                        ? "Processing..."
                        : title}
                </p>

                <p className="mt-1 text-[12px] text-slate-400">
                    {description}
                </p>
            </div>
        </button>
    );
}

/*
|--------------------------------------------------------------------------
| STATE ROW
|--------------------------------------------------------------------------
*/

function StateRow({
    label,
    value,
}) {
    return (
        <div className="flex items-center justify-between rounded-xl bg-white/[0.025] px-4 py-3">
            <span className="text-sm text-slate-400">
                {label}
            </span>

            <span className="text-sm font-semibold text-slate-300">
                {value}
            </span>
        </div>
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
    const isRunning =
        status === "running" ||
        status === "betting";

    const isPaused =
        status === "paused" ||
        status ===
        "game_paused";

    return (
        <span
            className={`
                inline-flex
                items-center
                gap-2
                rounded-full
                border
                px-3
                py-1.5
                text-[10px]
                font-bold
                uppercase

                ${isRunning
                    ? "border-green-500/20 bg-green-500/10 text-green-400"
                    : isPaused
                        ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
                        : "border-red-500/20 bg-red-500/10 text-red-400"
                }
            `}
        >
            <span
                className={`
                    h-1.5
                    w-1.5
                    rounded-full

                    ${isRunning
                        ? "bg-green-400"
                        : isPaused
                            ? "bg-yellow-400"
                            : "bg-red-400"
                    }
                `}
            />

            {getStatusLabel(status)}
        </span>
    );
}

/*
|--------------------------------------------------------------------------
| NORMALIZE STATUS
|--------------------------------------------------------------------------
*/

function normalizeStatus(
    status
) {
    return String(
        status || "stopped"
    )
        .trim()
        .toLowerCase()
        .replaceAll("-", "_")
        .replaceAll(" ", "_");
}

/*
|--------------------------------------------------------------------------
| STATUS LABEL
|--------------------------------------------------------------------------
*/

function getStatusLabel(
    status
) {
    switch (normalizeStatus(status)) {
        case "running":
            return "Running";

        case "betting":
            return "Betting";

        case "paused":
        case "game_paused":
            return "Paused";

        case "closed":
        case "betting_closed":
            return "Betting Closed";

        case "result":
        case "completed":
            return "Result";

        case "stopped":
        case "stop":
            return "Stopped";

        default:
            return String(
                status || "Stopped"
            )
                .replaceAll("_", " ")
                .replace(/\b\w/g, (char) =>
                    char.toUpperCase()
                );
    }
}