// ==========================================================
// HYBRID REALTIME CLIENT (Color Prediction)
// ==========================================================
//
// Drop-in replacement for a raw `io(SOCKET_URL)` instance.
// Exposes the same `.on/.off/.emit/.disconnect` surface the
// color-prediction page already uses, so none of its socket
// event handlers (game_state/new_round/timer/game_status/
// betting_closed/round_result) have to change - only the
// transport underneath does.
//
// Behavior:
//  - Socket.IO is primary. While connected, every event is
//    forwarded to listeners exactly as received (server-
//    authoritative, untouched).
//  - If Socket.IO disconnects, errors, or never connects
//    within CONNECT_FALLBACK_MS, this switches to polling
//    GET /api/game/status on an interval and synthesizes the
//    same event names from successive responses.
//  - When Socket.IO reconnects, polling stops and the next
//    "game_state" packet from the server (sent automatically
//    on join_color_game) becomes the new authoritative resync
//    point - no separate REST resync call needed, which is
//    what keeps this duplicate-event free.
//  - Exactly one poll interval and one socket connection ever
//    exist at a time (both guarded by refs), so timers/events
//    never double up between modes.
// ==========================================================

import { io } from "socket.io-client";

import { getGameStatus } from "./api";


const POLL_INTERVAL_MS = 2500;

const CONNECT_FALLBACK_MS = 4000;

const FORWARDED_SOCKET_EVENTS = [
    "new_round",
    "timer",
    "game_status",
    "betting_closed",
    "round_result",
    "emergency_stop",
];


export const createHybridGameClient = (
    {
        socketUrl,
    } = {}
) => {

    const listeners = new Map();

    let socket = null;

    let pollTimer = null;

    let pollInFlight = false;

    let connectFallbackTimer = null;

    let mode = "connecting";

    let destroyed = false;

    let snapshot = null;


    const emit = (
        event,
        payload
    ) => {

        const set = listeners.get(event);

        if (!set) {

            return;

        }

        for (const fn of set) {

            try {

                fn(payload);

            } catch (error) {

                console.error(
                    `Hybrid Game Client Listener Error (${event}):`,
                    error.message
                );

            }

        }

    };


    const on = (
        event,
        fn
    ) => {

        if (!listeners.has(event)) {

            listeners.set(event, new Set());

        }

        listeners.get(event).add(fn);

    };


    const off = (
        event,
        fn
    ) => {

        listeners.get(event)?.delete(fn);

    };


    const setMode = (
        next
    ) => {

        if (mode === next) {

            return;

        }

        mode = next;

        emit("mode", { mode: next });

    };


    // ======================================================
    // REST POLL FALLBACK
    // ======================================================
    //
    // Diffs each response against the previous one to
    // synthesize the same discrete events a live socket would
    // have sent, so downstream handlers stay identical.
    // ======================================================

    const applySnapshot = (
        data
    ) => {

        if (!data) {

            return;

        }

        const isFirst =
            snapshot === null;

        const roundNumber =
            data.round?.roundNumber ??
            null;

        const roundStatus =
            data.round?.status ??
            null;

        if (isFirst) {

            emit(
                "game_state",
                {
                    round: data.round || null,
                    remainingSeconds: data.remainingSeconds || 0,
                    status: data.status,
                    paused: data.paused,
                    stopped: data.stopped,
                    running: data.running,
                    emergencyStopped: data.emergencyStopped,
                }
            );

        } else {

            if (
                roundNumber !== snapshot.roundNumber &&
                roundStatus === "betting"
            ) {

                emit(
                    "new_round",
                    {
                        round: data.round,
                        remainingSeconds: data.remainingSeconds || 0,
                    }
                );

            } else {

                emit(
                    "timer",
                    { remainingSeconds: data.remainingSeconds || 0 }
                );

            }

            if (
                data.status !== snapshot.status ||
                data.paused !== snapshot.paused ||
                data.stopped !== snapshot.stopped
            ) {

                emit(
                    "game_status",
                    {
                        status: data.status,
                        remainingSeconds: data.remainingSeconds || 0,
                    }
                );

            }

            if (
                roundStatus === "locked" &&
                snapshot.roundStatus === "betting" &&
                roundNumber === snapshot.roundNumber
            ) {

                emit(
                    "betting_closed",
                    { roundNumber }
                );

            }

            if (
                data.lastResult &&
                data.lastResult.roundNumber !== snapshot.lastResultRoundNumber
            ) {

                emit(
                    "round_result",
                    {
                        roundNumber: data.lastResult.roundNumber,
                        result: data.lastResult.result,
                        totalPlayers: data.lastResult.totalPlayers,
                        totalBetAmount: data.lastResult.totalBetAmount,
                        totalPayout: data.lastResult.totalPayout,
                    }
                );

            }

        }

        snapshot = {
            roundNumber,
            roundStatus,
            status: data.status,
            paused: data.paused,
            stopped: data.stopped,
            lastResultRoundNumber:
                data.lastResult?.roundNumber ??
                snapshot?.lastResultRoundNumber ??
                null,
        };

    };


    const pollOnce = async () => {

        if (
            pollInFlight ||
            destroyed
        ) {

            return;

        }

        pollInFlight = true;

        try {

            const data =
                await getGameStatus();

            if (
                !destroyed &&
                mode === "poll" &&
                data?.success
            ) {

                applySnapshot(data);

            }

        } catch {

            // Stay in poll mode - retry on the next tick.

        } finally {

            pollInFlight = false;

        }

    };


    const startPolling = () => {

        if (
            pollTimer ||
            destroyed
        ) {

            return;

        }

        setMode("poll");

        pollOnce();

        pollTimer = setInterval(
            pollOnce,
            POLL_INTERVAL_MS
        );

    };


    const stopPolling = () => {

        if (pollTimer) {

            clearInterval(pollTimer);

            pollTimer = null;

        }

    };


    // ======================================================
    // SOCKET.IO PRIMARY
    // ======================================================

    const clearConnectFallback = () => {

        if (connectFallbackTimer) {

            clearTimeout(connectFallbackTimer);

            connectFallbackTimer = null;

        }

    };


    const connectSocket = () => {

        socket = io(
            socketUrl,
            {
                transports: ["websocket", "polling"],
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                timeout: 10000,
            }
        );

        socket.on(
            "connect",
            () => {

                if (destroyed) {

                    return;

                }

                clearConnectFallback();

                stopPolling();

                setMode("socket");

                emit("connect");

            }
        );

        socket.on(
            "disconnect",
            () => {

                if (destroyed) {

                    return;

                }

                emit("disconnect");

                startPolling();

            }
        );

        socket.on(
            "connect_error",
            () => {

                if (destroyed) {

                    return;

                }

                if (mode !== "poll") {

                    startPolling();

                }

            }
        );

        for (const event of FORWARDED_SOCKET_EVENTS) {

            socket.on(
                event,
                (data) => {

                    if (
                        destroyed ||
                        mode !== "socket"
                    ) {

                        return;

                    }

                    emit(event, data);

                }
            );

        }

        // Server sends this in direct response to
        // join_color_game - the authoritative resync point on
        // both first connect and every reconnect. Not gated on
        // `mode === "socket"` since it's the packet that
        // proves the socket is actually live.

        socket.on(
            "game_state",
            (data) => {

                if (destroyed) {

                    return;

                }

                stopPolling();

                setMode("socket");

                snapshot = null;

                applySnapshot(data);

            }
        );

        // If the socket never manages to connect at all
        // (blocked transport, unreachable host, an
        // environment that never supports WebSockets) fall
        // back to REST polling proactively instead of waiting
        // indefinitely.

        connectFallbackTimer = setTimeout(
            () => {

                if (
                    !destroyed &&
                    mode !== "socket"
                ) {

                    startPolling();

                }

            },
            CONNECT_FALLBACK_MS
        );

    };


    // ======================================================
    // PUBLIC API
    // ======================================================

    return {

        on,

        off,

        emit: (
            event,
            payload
        ) => {

            if (socket?.connected) {

                socket.emit(event, payload);

                return;

            }

            // Not connected via socket - polling is the only
            // way to stay updated while joined; make sure it's
            // running (join/leave have no REST equivalent).

            if (
                event === "join_color_game" &&
                !pollTimer
            ) {

                startPolling();

            }

        },

        connect: () => {

            connectSocket();

        },

        disconnect: () => {

            destroyed = true;

            clearConnectFallback();

            stopPolling();

            if (socket) {

                socket.removeAllListeners();

                socket.disconnect();

                socket = null;

            }

            listeners.clear();

        },

        getMode: () => mode,

    };

};
