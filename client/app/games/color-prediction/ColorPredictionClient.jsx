"use client";

import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import { createHybridGameClient } from "../../../lib/hybridGameClient";

import { useRouter } from "next/navigation";

import {
    getMyBets,
    getGameHistory,
    getGameHistoryPaginated,
    placeBet,
    increaseBet,
    getPublicSettings,
} from "../../../lib/api";

import FullHistoryModal
    from "@/components/games/FullHistoryModal";

import UserLayout
    from "@/components/user/UserLayout";

import useAuth, { getStoredToken }
    from "@/lib/useAuth";

import useWallet
    from "@/lib/useWallet";

import useSiteSettings
    from "@/lib/useSiteSettings";

import {
    ArrowRight,
    BookOpen,
    Check,
    ChevronRight,
    Coins,
    Crown,
    Dices,
    FlaskConical,
    Gamepad2,
    Lock,
    RefreshCw,
    ShieldCheck,
    Sparkles,
    Target,
    Trophy,
    X,
    Zap,
    ArrowDown,
    ArrowUp,
} from "lucide-react";


// ======================================================
// CONFIG
// ======================================================

const SOCKET_URL =
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    "http://localhost:5000";


const COLORS = [
    "red",
    "green",
    "blue",
];


const AMOUNT_OPTIONS = [
    10,
    50,
    100,
    500,
    1000,
];


// ======================================================
// COLOR META
// ======================================================

const colorMeta = {

    red: {

        label: "RED",

        short: "R",

        bg:
            "from-red-500/25 to-red-950/30",

        border:
            "border-red-500/70",

        text:
            "text-red-400",

        glow:
            "shadow-[0_0_35px_rgba(239,68,68,0.28)]",

        dot:
            "bg-red-500",

    },


    green: {

        label: "GREEN",

        short: "G",

        bg:
            "from-emerald-500/25 to-emerald-950/30",

        border:
            "border-emerald-500/70",

        text:
            "text-emerald-400",

        glow:
            "shadow-[0_0_35px_rgba(16,185,129,0.28)]",

        dot:
            "bg-emerald-500",

    },


    blue: {

        label: "BLUE",

        short: "B",

        bg:
            "from-blue-500/25 to-blue-950/30",

        border:
            "border-blue-500/70",

        text:
            "text-blue-400",

        glow:
            "shadow-[0_0_35px_rgba(59,130,246,0.28)]",

        dot:
            "bg-blue-500",

        card:
            "border-blue-400/55 bg-[linear-gradient(180deg,rgba(50,100,246,0.54)_0%,rgba(30,64,210,0.34)_50%,rgba(14,24,110,0.42)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.18),inset_0_0_26px_rgba(96,140,255,0.14),0_0_16px_rgba(59,130,246,0.16)]",

        cardSelected:
            "border-blue-300/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.24),inset_0_0_30px_rgba(96,140,255,0.2),0_0_22px_rgba(59,130,246,0.35)]",

        pill:
            "bg-blue-700/90 ring-1 ring-blue-400/40",

        check:
            "bg-blue-500",

        badge:
            "border-blue-200/60 bg-gradient-to-b from-[#4f7dff] to-[#1d4ed8] shadow-[0_0_14px_rgba(59,130,246,0.75)]",

    },

};


// Card-only visuals for red/green (kept alongside the shared
// meta above so every per-color style lives in one object).
Object.assign(colorMeta.red, {
    card: "border-red-400/55 bg-[linear-gradient(180deg,rgba(236,56,82,0.52)_0%,rgba(180,20,52,0.3)_50%,rgba(90,10,40,0.38)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.18),inset_0_0_26px_rgba(255,90,110,0.12),0_0_16px_rgba(239,68,68,0.16)]",
    cardSelected: "border-red-400/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.24),inset_0_0_30px_rgba(255,90,110,0.18),0_0_22px_rgba(239,68,68,0.38)]",
    pill: "bg-red-700/90 ring-1 ring-red-400/40",
    check: "bg-red-500",
    badge: "border-rose-200/60 bg-gradient-to-b from-[#ff3b5c] to-[#e11d48] shadow-[0_0_14px_rgba(244,63,94,0.75)]",
});

Object.assign(colorMeta.green, {
    card: "border-emerald-400/45 bg-[linear-gradient(180deg,rgba(16,185,110,0.42)_0%,rgba(5,120,75,0.26)_50%,rgba(4,60,45,0.36)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.16),inset_0_0_26px_rgba(52,211,153,0.1),0_0_16px_rgba(16,185,129,0.14)]",
    cardSelected: "border-emerald-300/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_0_30px_rgba(52,211,153,0.16),0_0_22px_rgba(16,185,129,0.32)]",
    pill: "bg-emerald-700/90 ring-1 ring-emerald-400/35",
    check: "bg-emerald-500",
    badge: "border-emerald-200/60 bg-gradient-to-b from-[#1fd28f] to-[#059669] shadow-[0_0_14px_rgba(16,185,129,0.7)]",
});


// ======================================================
// 3D COLOR BALL (pure CSS sphere)
// ======================================================

const BALL_GRADIENTS = {
    red: "radial-gradient(circle at 34% 28%, #ffd9d9 0%, #ff7b7b 9%, #ef1c35 34%, #a30d22 66%, #4a0610 100%)",
    green: "radial-gradient(circle at 34% 28%, #d8ffe8 0%, #5ff091 9%, #16b454 34%, #086f2f 66%, #032e18 100%)",
    blue: "radial-gradient(circle at 34% 28%, #dde7ff 0%, #7c9cff 9%, #2352f0 34%, #0f2d9e 66%, #050f45 100%)",
};

const BALL_GLOWS = {
    red: "rgba(239,28,53,0.55)",
    green: "rgba(22,180,84,0.5)",
    blue: "rgba(35,82,240,0.55)",
};

function Ball({
    color = "red",
    size = 48,
    glow = true,
    className = "",
    style,
}) {

    return (
        <span
            aria-hidden="true"
            // Position/display come from the caller (relative/absolute,
            // block/hidden) so they never fight a hardcoded default.
            className={`shrink-0 rounded-full ${className || "relative block"}`}
            style={{
                width: size,
                height: size,
                background: BALL_GRADIENTS[color] || BALL_GRADIENTS.red,
                boxShadow: [
                    `inset ${-size * 0.08}px ${-size * 0.1}px ${size * 0.2}px rgba(0,0,0,0.45)`,
                    `inset ${size * 0.04}px ${size * 0.04}px ${size * 0.1}px rgba(255,255,255,0.22)`,
                    glow ? `0 0 ${size * 0.55}px ${BALL_GLOWS[color] || BALL_GLOWS.red}` : null,
                ].filter(Boolean).join(", "),
                ...style,
            }}
        >
            <span className="absolute left-[18%] top-[11%] h-[22%] w-[36%] -rotate-[28deg] rounded-full bg-white/55 blur-[1.5px]" />
        </span>
    );

}


// ======================================================
// GOLD COIN STACK (pure CSS decoration)
// ======================================================

function CoinStack({
    coins = 6,
    className = "",
}) {

    return (
        <span
            aria-hidden="true"
            className={`flex flex-col items-center ${className}`}
        >
            <span className="relative z-10 block h-[14px] w-[60px] rounded-[50%] border border-amber-100/50 bg-[radial-gradient(ellipse_at_50%_40%,#fff1b8_0%,#fbbf24_45%,#b45309_100%)]" />

            {Array.from({ length: coins }).map((_, index) => (
                <span
                    key={index}
                    className="-mt-[7px] block h-[14px] w-[60px] rounded-[50%] border-b border-amber-950/70 bg-[linear-gradient(90deg,#78350f_0%,#f59e0b_30%,#fde68a_50%,#d97706_72%,#78350f_100%)]"
                />
            ))}
        </span>
    );

}


// ======================================================
// ICON
// ======================================================

function Icon({
    name,
    size = 18,
}) {

    const common = {

        width:
            size,

        height:
            size,

        viewBox:
            "0 0 24 24",

        fill:
            "none",

        stroke:
            "currentColor",

        strokeWidth:
            1.8,

        strokeLinecap:
            "round",

        strokeLinejoin:
            "round",

        "aria-hidden":
            true,

    };


    const paths = {

        users: (
            <>
                <circle
                    cx="9"
                    cy="8"
                    r="3"
                />

                <path
                    d="M3 20a6 6 0 0 1 12 0"
                />

                <path
                    d="M16 5.5a3 3 0 0 1 0 5.8"
                />

                <path
                    d="M18 14a5 5 0 0 1 3 4"
                />
            </>
        ),


        wallet: (
            <>
                <path
                    d="M3 7.5A2.5 2.5 0 0 1 5.5 5H20v14H5.5A2.5 2.5 0 0 1 3 16.5v-9Z"
                />

                <path
                    d="M3 8h14"
                />

                <path
                    d="M16 13h5"
                />

                <circle
                    cx="16"
                    cy="13"
                    r=".5"
                    fill="currentColor"
                />
            </>
        ),


        transaction: (
            <>
                <path
                    d="M4 7h12"
                />

                <path
                    d="m13 4 3 3-3 3"
                />

                <path
                    d="M20 17H8"
                />

                <path
                    d="m11 14-3 3 3 3"
                />
            </>
        ),


        game: (
            <>
                <rect
                    x="3"
                    y="6"
                    width="18"
                    height="12"
                    rx="3"
                />

                <path
                    d="M8 12h4M10 10v4"
                />

                <circle
                    cx="16"
                    cy="11"
                    r="1"
                />

                <circle
                    cx="18"
                    cy="13"
                    r="1"
                />
            </>
        ),


        chart: (
            <>
                <path
                    d="M4 19V5"
                />

                <path
                    d="M4 19h16"
                />

                <path
                    d="m7 15 3-4 3 2 4-6"
                />
            </>
        ),


        target: (
            <>
                <circle
                    cx="12"
                    cy="12"
                    r="8"
                />

                <circle
                    cx="12"
                    cy="12"
                    r="4"
                />

                <circle
                    cx="12"
                    cy="12"
                    r="1"
                    fill="currentColor"
                />
            </>
        ),


        shield: (
            <>
                <path
                    d="M12 3 20 6v5c0 5-3.4 8.3-8 10-4.6-1.7-8-5-8-10V6l8-3Z"
                />

                <path
                    d="m9 12 2 2 4-4"
                />
            </>
        ),


        lock: (
            <>
                <rect
                    x="5"
                    y="10"
                    width="14"
                    height="10"
                    rx="2"
                />

                <path
                    d="M8 10V7a4 4 0 0 1 8 0v3"
                />
            </>
        ),


        arrow: (
            <>
                <path
                    d="M5 12h13"
                />

                <path
                    d="m14 7 5 5-5 5"
                />
            </>
        ),

    };


    return (
        <svg {...common}>
            {
                paths[name] ||
                paths.game
            }
        </svg>
    );

}


// ======================================================
// COLOR PREDICTION PAGE
// ======================================================

export default function ColorPredictionPage() {

    // ==================================================
    // AUTH
    // ==================================================
    //
    // Guests can view the whole game page; protected
    // actions (betting, wallet/bet history) check this
    // and prompt for login instead of failing silently
    // against 401s.

    const auth = useAuth();

    const router = useRouter();


    // ==================================================
    // GAME STATE
    // ==================================================

    const [
        connected,
        setConnected,
    ] = useState(false);


    const [
        realtimeMode,
        setRealtimeMode,
    ] = useState("connecting");


    const [
        round,
        setRound,
    ] = useState(null);


    const [
        timer,
        setTimer,
    ] = useState(0);


    const [
        result,
        setResult,
    ] = useState(null);


    const [
        selectedColor,
        setSelectedColor,
    ] = useState(null);


    const [
        amount,
        setAmount,
    ] = useState("");


    // ==================================================
    // WALLET (shared store - see lib/useWallet.js. Fixes the
    // "shows 0 until you visit /wallet" bug: this page used to
    // fetch its own copy inside a one-shot mount effect that
    // could race ahead of auth hydration on a hard refresh.)
    // ==================================================

    const wallet =
        useWallet();

    const walletBalance =
        wallet.balance;

    const testBalance =
        wallet.testBalance;

    const bonusBalance =
        wallet.bonusBalance;

    const loadingWallet =
        wallet.loading;


    const [
        walletMode,
        setWalletMode,
    ] = useState("real");


    // ==================================================
    // ACTIVE BALANCE (matches the selected wallet mode)
    // ==================================================
    //
    // The server is authoritative on which pool a bet
    // draws from (walletMode sent with the bet request) -
    // this is only used client-side to validate/display
    // before submitting. "bonus" is no longer a selectable
    // mode - bonus balance is now automatically blended (up
    // to 30%) into every "real" mode bet - see
    // getRequiredRealBalance() below.

    const activeBalance =
        walletMode === "test"
            ? testBalance
            : walletBalance;


    // ==================================================
    // REAL BALANCE ACTUALLY REQUIRED FOR A GIVEN AMOUNT
    // ==================================================
    //
    // Mirrors the server's computeBonusSplit() (30% cap) for
    // UX purposes only - the server independently recomputes
    // and enforces this on every request, this is just so the
    // affordability check/MAX button don't wrongly block a bet
    // that's actually affordable once bonus balance is blended
    // in.

    const BONUS_BET_CAP_RATIO = 0.3;

    const getRequiredRealBalance = (amount) => {

        const bonusCap =
            amount * BONUS_BET_CAP_RATIO;

        const bonusApplied =
            Math.min(bonusBalance, bonusCap);

        return Math.max(amount - bonusApplied, 0);

    };

    const getMaxAffordableRealBet = () => {

        if (bonusBalance <= 0) {

            return walletBalance;

        }

        // If bonus alone can always cover 30% of the max
        // affordable amount, real balance is the binding
        // constraint at a 70/30 split: amount = real / 0.7.
        const uncappedMax =
            walletBalance / (1 - BONUS_BET_CAP_RATIO);

        if (bonusBalance >= uncappedMax * BONUS_BET_CAP_RATIO) {

            return uncappedMax;

        }

        // Otherwise bonus runs out first - use all of both.
        return walletBalance + bonusBalance;

    };


    // ==================================================
    // BETS
    // ==================================================

    const [
        myBets,
        setMyBets,
    ] = useState([]);


    const [
        loadingBets,
        setLoadingBets,
    ] = useState(true);


    // ==================================================
    // HISTORY
    // ==================================================

    const [
        gameHistory,
        setGameHistory,
    ] = useState([]);


    const [
        loadingHistory,
        setLoadingHistory,
    ] = useState(true);


    // ==================================================
    // BET ACTION
    // ==================================================

    const [
        placingBet,
        setPlacingBet,
    ] = useState(false);


    const [
        betPlaced,
        setBetPlaced,
    ] = useState(false);


    // ==================================================
    // MESSAGE
    // ==================================================

    const [
        message,
        setMessage,
    ] = useState("");


    const [
        messageType,
        setMessageType,
    ] = useState("");




    // ==================================================
    // RULES
    // ==================================================

    const [
        showRules,
        setShowRules,
    ] = useState(false);


    const [
        showFullHistory,
        setShowFullHistory,
    ] = useState(false);


    // ==================================================
    // GAME STATUS
    // ==================================================

    const [
        gamePaused,
        setGamePaused,
    ] = useState(false);


    const [
        gameStopped,
        setGameStopped,
    ] = useState(false);


    // ======================================================
    // LOAD WALLET
    // ======================================================

    const loadWallet =
        wallet.refresh;


    // ======================================================
    // LOAD MY BETS
    // ======================================================

    //
    // Reads the token straight from storage at call time rather
    // than the closed-over auth.isAuthenticated. That value is
    // always false on the first render after a hard refresh
    // (useSyncExternalStore's server snapshot), and the socket
    // "round_result" listener below is registered once and keeps
    // that first-render copy of this function forever - so
    // trusting it meant the initial load AND every round-result
    // refresh were silently skipped, and bets only reappeared
    // after placing a new one (handlePlaceBet gets a fresh copy).

    const loadMyBets =
        async () => {

            if (!getStoredToken()) {

                // Logged out (or switched away) - never keep
                // showing the previous account's bets.
                setMyBets([]);

                setLoadingBets(false);

                return;

            }

            try {

                setLoadingBets(
                    true
                );


                const response =
                    await getMyBets(
                        { limit: 100 }
                    );


                if (
                    response?.success
                ) {

                    setMyBets(
                        response.bets ||
                        []
                    );

                }

            } catch (
            error
            ) {

                console.error(
                    "Bet History Error:",
                    error.message
                );

            } finally {

                setLoadingBets(
                    false
                );

            }

        };


    // ======================================================
    // LOAD GAME HISTORY
    // ======================================================

    const loadGameHistory =
        async () => {

            try {

                setLoadingHistory(
                    true
                );


                const response =
                    await getGameHistory();


                if (
                    response?.success
                ) {

                    setGameHistory(
                        response.history ||
                        []
                    );

                }

            } catch (
            error
            ) {

                console.error(
                    "Game History Error:",
                    error.message
                );

            } finally {

                setLoadingHistory(
                    false
                );

            }

        };


    // ======================================================
    // MY BETS - LOAD PER LOGIN SESSION
    // ======================================================
    //
    // Keyed on auth.isAuthenticated so it also reacts to a
    // login/logout (incl. from another tab) while this page stays
    // mounted, but decides from the actual stored token (see
    // loadMyBets) - so a hard refresh fetches immediately on
    // mount instead of waiting for, or being skipped by, the
    // hydration-time "logged out" snapshot. The ref makes the
    // hydration flip (false -> true, same token) a no-op rather
    // than a second identical request.

    const loadedBetsForTokenRef =
        useRef(undefined);

    useEffect(
        () => {

            const token =
                getStoredToken();

            if (loadedBetsForTokenRef.current === token) {

                return;

            }

            loadedBetsForTokenRef.current =
                token;


            // Fetches when a token exists, clears when it doesn't.
            loadMyBets();

        },
        [auth.isAuthenticated]
    );


    // ======================================================
    // INITIAL LOAD + SOCKET
    // ======================================================

    useEffect(
        () => {

            /*
             * Initial API data.
             *
             * loadWallet is a no-op for guests; my bets are
             * loaded by the per-session effect above;
             * loadGameHistory hits a public route and is
             * always safe to call.
             */

            loadWallet();

            loadGameHistory();


            /*
             * Hybrid realtime connection - Socket.IO primary,
             * automatic REST polling fallback if it fails or
             * disconnects, automatic switch back once it
             * reconnects. See lib/hybridGameClient.js.
             */

            const newSocket =
                createHybridGameClient(
                    { socketUrl: SOCKET_URL }
                );


            newSocket.on(
                "connect",
                () => {

                    setConnected(
                        true
                    );


                    newSocket.emit(
                        "join_color_game"
                    );

                }
            );


            newSocket.on(
                "disconnect",
                () => {

                    setConnected(
                        false
                    );

                }
            );


            newSocket.on(
                "mode",
                (data) => {

                    setRealtimeMode(
                        data?.mode ||
                        "connecting"
                    );

                    if (
                        data?.mode ===
                        "poll"
                    ) {

                        setConnected(
                            true
                        );

                    }

                }
            );


            newSocket.connect();


            // ==================================================
            // GAME STATE
            // ==================================================

            newSocket.on(
                "game_state",
                (
                    data
                ) => {

                    console.log(
                        "INITIAL GAME STATE:",
                        data
                    );


                    if (!data) {
                        return;
                    }


                    setRound(
                        data.round ||
                        null
                    );


                    setTimer(
                        Number(
                            data.remainingSeconds ||
                            0
                        )
                    );


                    if (
                        data.status ===
                        "paused"
                    ) {

                        setGamePaused(
                            true
                        );


                        setGameStopped(
                            false
                        );


                        setMessage(
                            "Betting is temporarily paused by administrator."
                        );


                        setMessageType(
                            "paused"
                        );

                    } else if (
                        data.status ===
                        "stopped"
                    ) {

                        setGamePaused(
                            false
                        );


                        setGameStopped(
                            true
                        );


                        setMessage(
                            "Game is currently unavailable."
                        );


                        setMessageType(
                            "stopped"
                        );

                    } else {

                        setGamePaused(
                            false
                        );


                        setGameStopped(
                            false
                        );


                        setMessage(
                            ""
                        );


                        setMessageType(
                            ""
                        );

                    }

                }
            );


            // ==================================================
            // NEW ROUND
            // ==================================================

            newSocket.on(
                "new_round",
                (
                    data
                ) => {

                    setRound(
                        data.round
                    );


                    setTimer(
                        Number(
                            data.remainingSeconds ||
                            0
                        )
                    );


                    setResult(
                        null
                    );


                    setSelectedColor(
                        null
                    );


                    setAmount(
                        ""
                    );


                    setMessage(
                        ""
                    );


                    setMessageType(
                        ""
                    );


                    setBetPlaced(
                        false
                    );


                    setGamePaused(
                        false
                    );


                    setGameStopped(
                        false
                    );

                }
            );


            // ==================================================
            // TIMER
            // ==================================================

            newSocket.on(
                "timer",
                (
                    data
                ) => {

                    setTimer(
                        Number(
                            data?.remainingSeconds ||
                            0
                        )
                    );

                }
            );


            // ==================================================
            // GAME STATUS
            // ==================================================

            newSocket.on(
                "game_status",
                (
                    data
                ) => {

                    console.log(
                        "Game Status:",
                        data
                    );


                    if (
                        data?.status ===
                        "paused"
                    ) {

                        setGamePaused(
                            true
                        );


                        setGameStopped(
                            false
                        );


                        if (
                            data.remainingSeconds !==
                            undefined
                        ) {

                            setTimer(
                                Number(
                                    data.remainingSeconds
                                )
                            );

                        }


                        setMessage(
                            "Betting is temporarily paused by administrator."
                        );


                        setMessageType(
                            "paused"
                        );


                        return;

                    }


                    if (
                        data?.status ===
                        "stopped"
                    ) {

                        setGameStopped(
                            true
                        );


                        setGamePaused(
                            false
                        );


                        if (
                            data.remainingSeconds !==
                            undefined
                        ) {

                            setTimer(
                                Number(
                                    data.remainingSeconds
                                )
                            );

                        }


                        setMessage(
                            "Game is currently unavailable."
                        );


                        setMessageType(
                            "stopped"
                        );


                        return;

                    }


                    if (
                        data?.status ===
                        "betting" ||
                        data?.status ===
                        "running"
                    ) {

                        setGamePaused(
                            false
                        );


                        setGameStopped(
                            false
                        );


                        if (
                            data.remainingSeconds !==
                            undefined
                        ) {

                            setTimer(
                                Number(
                                    data.remainingSeconds
                                )
                            );

                        }


                        setMessage(
                            ""
                        );


                        setMessageType(
                            ""
                        );

                    }

                }
            );


            // ==================================================
            // BETTING CLOSED
            // ==================================================

            newSocket.on(
                "betting_closed",
                () => {

                    setMessage(
                        "Betting closed. Waiting for result..."
                    );


                    setMessageType(
                        "info"
                    );

                }
            );


            // ==================================================
            // ROUND RESULT
            // ==================================================

            newSocket.on(
                "round_result",
                (
                    data
                ) => {

                    setResult(
                        data.result
                    );


                    setMessage(
                        `Round ${data.roundNumber} result: ${data.result.toUpperCase()}`
                    );


                    setMessageType(
                        "result"
                    );


                    loadWallet();

                    loadMyBets();

                    loadGameHistory();

                }
            );


            // ==================================================
            // CLEANUP
            // ==================================================

            return () => {

                newSocket.emit(
                    "leave_color_game"
                );


                newSocket.disconnect();

            };

        },
        []
    );


    // ======================================================
    // COLOR SELECT
    // ======================================================

    const handleColorSelect =
        (
            color
        ) => {

            if (
                timer <= 0
            ) {

                setMessage(
                    "Betting is closed."
                );


                setMessageType(
                    "error"
                );


                return;

            }


            if (
                betPlaced
            ) {

                if (
                    !currentRoundBet ||
                    currentRoundBet.color !==
                    color
                ) {

                    setMessage(
                        `You can only increase your bet on the color you already selected (${currentRoundBet?.color?.toUpperCase() || "your original pick"}).`
                    );


                    setMessageType(
                        "error"
                    );


                    return;

                }

                // Same color as the existing bet - fall
                // through and (re)confirm the selection so the
                // increase-bet button/amount panel stays usable.

            }


            if (
                gamePaused
            ) {

                setMessage(
                    "Betting is temporarily paused by administrator."
                );


                setMessageType(
                    "info"
                );


                return;

            }


            if (
                gameStopped
            ) {

                setMessage(
                    "Game is currently unavailable."
                );


                setMessageType(
                    "error"
                );


                return;

            }


            setSelectedColor(
                color
            );


            if (
                !betPlaced
            ) {

                setMessage(
                    `${color.toUpperCase()} selected`
                );


                setMessageType(
                    "info"
                );

            }

        };


    // ======================================================
    // AMOUNT SELECT
    // ======================================================

    const handleAmountSelect =
        (
            value
        ) => {

            if (
                gamePaused ||
                gameStopped
            ) {

                return;

            }


            if (
                timer <= 0
            ) {

                setMessage(
                    "Betting is closed."
                );


                setMessageType(
                    "error"
                );


                return;

            }


            if (
                betPlaced &&
                !canIncreaseBet
            ) {

                return;

            }


            setAmount(
                String(
                    value
                )
            );

        };


    // ======================================================
    // PLACE BET
    // ======================================================

    const handlePlaceBet =
        async () => {

            if (
                !auth.isAuthenticated
            ) {

                setMessage(
                    "Please login to place a bet."
                );


                setMessageType(
                    "auth"
                );


                return;

            }


            if (
                gamePaused
            ) {

                setMessage(
                    "Betting is temporarily paused by administrator."
                );


                setMessageType(
                    "info"
                );


                return;

            }


            if (
                gameStopped
            ) {

                setMessage(
                    "Game is currently unavailable."
                );


                setMessageType(
                    "error"
                );


                return;

            }


            if (
                timer <= 0
            ) {

                setMessage(
                    "Betting is closed."
                );


                setMessageType(
                    "error"
                );


                return;

            }


            if (
                !selectedColor
            ) {

                setMessage(
                    "Please select a color."
                );


                setMessageType(
                    "error"
                );


                return;

            }


            const betAmount =
                Number(
                    amount
                );


            if (
                !Number.isFinite(
                    betAmount
                ) ||
                betAmount <= 0
            ) {

                setMessage(
                    "Please enter a valid amount."
                );


                setMessageType(
                    "error"
                );


                return;

            }


            if (
                betAmount < 10
            ) {

                setMessage(
                    "Minimum bet amount is ₹10."
                );


                setMessageType(
                    "error"
                );


                return;

            }


            if (
                betAmount > 10000
            ) {

                setMessage(
                    "Maximum bet amount is ₹10,000."
                );


                setMessageType(
                    "error"
                );


                return;

            }


            if (
                walletMode === "real"
                    ? getRequiredRealBalance(betAmount) > walletBalance
                    : betAmount > activeBalance
            ) {

                setMessage(
                    `Insufficient ${walletMode} balance.`
                );


                setMessageType(
                    "error"
                );


                return;

            }


            try {

                setPlacingBet(
                    true
                );


                setMessage(
                    ""
                );


                setMessageType(
                    ""
                );


                const response =
                    await placeBet(
                        selectedColor,
                        betAmount,
                        walletMode
                    );


                if (
                    response?.success
                ) {

                    setBetPlaced(
                        true
                    );


                    wallet.refresh();


                    await loadMyBets();


                    setMessage(
                        `Bet placed successfully on ${selectedColor.toUpperCase()} for ₹${betAmount}.`
                    );


                    setMessageType(
                        "success"
                    );


                    setAmount(
                        ""
                    );

                } else {

                    setMessage(
                        response?.message ||
                        "Unable to place bet."
                    );


                    setMessageType(
                        "error"
                    );

                }

            } catch (
            error
            ) {

                console.error(
                    "Place Bet Error:",
                    error.message
                );


                setMessage(
                    error.message ||
                    "Unable to place bet."
                );


                setMessageType(
                    "error"
                );

            } finally {

                setPlacingBet(
                    false
                );

            }

        };


    // ======================================================
    // CALCULATIONS
    // ======================================================

    const totalStaked =
        useMemo(
            () =>
                myBets.reduce(
                    (
                        sum,
                        bet
                    ) =>
                        sum +
                        Number(
                            bet.amount ||
                            0
                        ),
                    0
                ),
            [
                myBets,
            ]
        );


    const totalPayout =
        useMemo(
            () =>
                myBets.reduce(
                    (
                        sum,
                        bet
                    ) =>
                        sum +
                        Number(
                            bet.payout ||
                            0
                        ),
                    0
                ),
            [
                myBets,
            ]
        );


    const wins =
        useMemo(
            () =>
                myBets.filter(
                    (
                        bet
                    ) =>
                        bet.result ===
                        "won"
                ).length,
            [
                myBets,
            ]
        );


    const winRate =
        myBets.length
            ? Math.round(
                (
                    wins /
                    myBets.length
                ) *
                100
            )
            : 0;


    const latestResult =
        gameHistory[0]?.result?.toLowerCase() ||
        result?.toLowerCase();


    // ======================================================
    // ROUND DURATION (server-authoritative, not hardcoded)
    // ======================================================
    //
    // `round` comes straight from the server (game_state /
    // new_round / game_status socket events) and carries
    // startTime/endTime, so the ring always reflects the
    // ACTUAL configured round length (Settings ->
    // game.round_duration), whatever it's set to.

    const roundDurationSeconds =
        useMemo(
            () => {

                if (
                    !round?.startTime ||
                    !round?.endTime
                ) {

                    return 30;

                }

                // endTime is pushed forward by any admin pause /
                // maintenance time (round.pausedMs) - excluded
                // so the ring keeps the real round length.
                const seconds =
                    (
                        new Date(round.endTime).getTime() -
                        new Date(round.startTime).getTime() -
                        (Number(round.pausedMs) || 0)
                    ) / 1000;

                return Number.isFinite(seconds) && seconds > 0
                    ? seconds
                    : 30;

            },
            [round]
        );


    const timerProgress =
        Math.max(
            0,
            Math.min(
                100,
                (
                    timer /
                    roundDurationSeconds
                ) *
                100
            )
        );


    // ======================================================
    // CURRENT ROUND'S OWN BET (for increase-bet flow)
    // ======================================================
    //
    // Client-side derivation only, for UX (which button/label
    // to show, whether to lock color selection). The server
    // independently re-derives and enforces all of this from
    // its own DB state and clock in betService.increaseBet -
    // this frontend value is never trusted for the actual
    // increase decision.

    const currentRoundBet =
        useMemo(
            () =>
                myBets.find(
                    (bet) =>
                        String(
                            bet.round?._id ||
                            bet.round ||
                            ""
                        ) ===
                        String(
                            round?._id ||
                            ""
                        ) &&
                        bet.result ===
                        "pending"
                ) ||
                null,
            [
                myBets,
                round,
            ]
        );


    // Same >5-second rule the server enforces - shown here
    // only to drive the button's label/disabled state, never
    // trusted as the actual security check (increaseBet on
    // the server re-derives this from round.endTime itself).
    const canIncreaseBet =
        Boolean(currentRoundBet) &&
        timer > 5 &&
        !gamePaused &&
        !gameStopped;


    // ======================================================
    // INCREASE BET
    // ======================================================

    const handleIncreaseBet =
        async () => {

            if (
                !currentRoundBet
            ) {

                return;

            }


            const increaseAmount =
                Number(
                    amount
                );


            if (
                !Number.isFinite(
                    increaseAmount
                ) ||
                increaseAmount <= 0
            ) {

                setMessage(
                    "Please enter a valid increase amount."
                );


                setMessageType(
                    "error"
                );


                return;

            }


            if (
                walletMode === "real"
                    ? getRequiredRealBalance(increaseAmount) > walletBalance
                    : increaseAmount > activeBalance
            ) {

                setMessage(
                    `Insufficient ${walletMode} balance.`
                );


                setMessageType(
                    "error"
                );


                return;

            }


            if (
                timer <= 5
            ) {

                setMessage(
                    "Bet increases are only allowed while more than 5 seconds remain."
                );


                setMessageType(
                    "error"
                );


                return;

            }


            try {

                setPlacingBet(
                    true
                );


                setMessage(
                    ""
                );


                setMessageType(
                    ""
                );


                const response =
                    await increaseBet(
                        currentRoundBet.color,
                        increaseAmount
                    );


                if (
                    response?.success
                ) {

                    wallet.refresh();


                    await loadMyBets();


                    setMessage(
                        `Bet increased by ₹${increaseAmount} on ${currentRoundBet.color.toUpperCase()}.`
                    );


                    setMessageType(
                        "success"
                    );


                    setAmount(
                        ""
                    );

                } else {

                    setMessage(
                        response?.message ||
                        "Unable to increase bet."
                    );


                    setMessageType(
                        "error"
                    );

                }

            } catch (
            error
            ) {

                console.error(
                    "Increase Bet Error:",
                    error.message
                );


                setMessage(
                    error.message ||
                    "Unable to increase bet."
                );


                setMessageType(
                    "error"
                );

            } finally {

                setPlacingBet(
                    false
                );

            }

        };


    // ======================================================
    // GAMES ENABLED (Settings -> Game -> games_enabled)
    // ======================================================
    //
    // The server already rejects bets (and increases) while games
    // are disabled; this makes the page say so instead of showing
    // "Betting Open". Fetched directly (not via useSiteSettings,
    // whose per-session cache would miss admin changes).

    const [gamesEnabled, setGamesEnabled] =
        useState(null);

    useEffect(() => {

        getPublicSettings()
            .then((response) => {
                setGamesEnabled(response?.data?.game?.games_enabled !== false);
            })
            .catch(() => {});

    }, []);

    const gamesDisabled =
        gamesEnabled === false;


    // ======================================================
    // DISABLED STATE
    // ======================================================

    const bettingDisabled =
        timer <= 0 ||
        placingBet ||
        gamePaused ||
        gameStopped ||
        gamesDisabled ||
        (
            betPlaced &&
            !canIncreaseBet
        );

    // ======================================================
    // PRESENTATION HELPERS (display-only, no game logic)
    // ======================================================

    const { payoutMultiplier } =
        useSiteSettings();

    const payoutLabel =
        `${Number(payoutMultiplier || 2).toLocaleString("en-IN")}x`;


    const historyStats =
        useMemo(
            () => {

                const counts = {
                    red: 0,
                    green: 0,
                    blue: 0,
                };

                gameHistory.forEach((game) => {

                    const value =
                        game.result?.toLowerCase();

                    if (counts[value] !== undefined) {

                        counts[value] += 1;

                    }

                });

                const total =
                    counts.red + counts.green + counts.blue;

                const percent = (count) =>
                    total ? Math.round((count / total) * 100) : 0;

                return {
                    total,
                    red: percent(counts.red),
                    green: percent(counts.green),
                    blue: percent(counts.blue),
                };

            },
            [gameHistory]
        );


    const roundsPlayed =
        Number(gameHistory[0]?.roundNumber || 0);


    const formatResultTime =
        (value) => {

            if (!value) {

                return "--:--:--";

            }

            const date =
                new Date(value);

            if (Number.isNaN(date.getTime())) {

                return "--:--:--";

            }

            return date.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
            });

        };


    const statusTone =
        gamesDisabled
            ? "disabled"
            : gameStopped
            ? "stopped"
            : gamePaused
                ? "paused"
                : timer > 0
                    ? "open"
                    : "closed";

    const statusLabel = {
        disabled: "Games Disabled",
        stopped: "Game Stopped",
        paused: "Betting Paused",
        open: "Betting Open",
        closed: "Betting Closed",
    }[statusTone];

    const statusClasses = {
        disabled: "border-red-500/40 bg-red-500/15 text-red-300",
        stopped: "border-red-500/40 bg-red-500/15 text-red-300",
        paused: "border-yellow-500/40 bg-yellow-500/15 text-yellow-300",
        open: "border-emerald-400/40 bg-emerald-500/15 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.25)]",
        closed: "border-red-500/40 bg-red-500/15 text-red-300",
    }[statusTone];

    const statusDot = {
        disabled: "bg-red-400",
        stopped: "bg-red-400",
        paused: "bg-yellow-400",
        open: "bg-emerald-400",
        closed: "bg-red-400",
    }[statusTone];


    const features = [
        { title: "Fast Rounds", sub: "Every Few Seconds", icon: Zap, tone: "bg-amber-500/15 text-amber-400" },
        { title: "100% Fair", sub: "Provably Fair", icon: ShieldCheck, tone: "bg-emerald-500/15 text-emerald-400" },
        { title: "Instant Payouts", sub: `Win Upto ${payoutLabel}`, icon: Trophy, tone: "bg-amber-500/15 text-amber-400" },
        { title: "Secure & Safe", sub: "Encrypted Gaming", icon: Lock, tone: "bg-fuchsia-500/15 text-fuchsia-400" },
    ];


    const maxDisabled =
        timer <= 0 ||
        (
            betPlaced &&
            !canIncreaseBet
        ) ||
        placingBet ||
        activeBalance <= 0 ||
        gamePaused ||
        gameStopped ||
        gamesDisabled;


    // ======================================================
    // RENDER
    // ======================================================

    return (

        <UserLayout
            title="Color Prediction"
            walletBalance={walletBalance}
            loadingWallet={loadingWallet}
            requireAuth={false}
        >

            <main className="min-h-screen overflow-x-hidden bg-[#060818] text-white">

                {/* ==================================================
                    BACKGROUND
                ================================================== */}

                <div className="pointer-events-none fixed inset-0 -z-0 bg-[radial-gradient(circle_at_45%_15%,rgba(124,58,237,0.14),transparent_35%),radial-gradient(circle_at_90%_55%,rgba(37,99,235,0.08),transparent_30%)]" />


                {/* ==================================================
                    CONTENT
                ================================================== */}

                <div className="relative z-10 px-4 py-4 sm:px-6 lg:px-5 lg:py-5">


                    {/* =================================================
                        MAIN GAME + SIDE PANEL
                    ================================================= */}

                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">


                        {/* =================================================
                            GAME
                        ================================================= */}

                        <section className="relative min-w-0 lg:overflow-hidden lg:rounded-[22px] lg:border lg:border-white/[0.08] lg:bg-[#080a20] lg:px-7 lg:pb-6 lg:pt-7 lg:shadow-[0_20px_60px_rgba(0,0,0,0.45)]">

                            {/* Desktop arena artwork */}

                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-x-0 top-0 hidden h-[520px] bg-cover bg-[position:50%_38%] lg:block"
                                style={{ backgroundImage: "url(/games/color-prediction/arena-desktop.webp)" }}
                            />

                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-x-0 top-0 hidden h-[522px] lg:block"
                                style={{
                                    background:
                                        "linear-gradient(90deg, rgba(8,10,32,0.96) 0%, rgba(8,10,32,0.82) 38%, rgba(8,10,32,0.3) 62%, rgba(8,10,32,0.05) 100%), linear-gradient(180deg, rgba(8,10,32,0.1) 0%, rgba(8,10,32,0.2) 55%, #080a20 100%)",
                                }}
                            />

                            {/* Faint arena balls behind the lower controls */}

                            <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden lg:block">
                                <Ball color="blue" size={70} glow={false} className="absolute left-[2%] top-[58%] opacity-20 blur-[3px]" />
                                <Ball color="red" size={54} glow={false} className="absolute left-[9%] top-[74%] opacity-20 blur-[3px]" />
                                <Ball color="red" size={110} glow={false} className="absolute -right-6 top-[66%] opacity-25 blur-[3px]" />
                                <Ball color="blue" size={60} glow={false} className="absolute right-[6%] top-[86%] opacity-15 blur-[3px]" />
                            </div>


                            {/* =================================================
                                HERO + ROUND
                            ================================================= */}

                            <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">


                                {/* HERO */}

                                <div className="relative overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0b0d28] px-5 pb-4 pt-5 shadow-[0_18px_40px_rgba(0,0,0,0.4)] lg:max-w-[540px] lg:flex-1 lg:overflow-visible lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">

                                    {/* Mobile arena artwork */}

                                    <div
                                        aria-hidden="true"
                                        className="pointer-events-none absolute inset-0 bg-cover bg-[position:70%_44%] lg:hidden"
                                        style={{ backgroundImage: "url(/games/color-prediction/arena-mobile.webp)" }}
                                    />

                                    <div
                                        aria-hidden="true"
                                        className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(11,13,40,0.97)_0%,rgba(11,13,40,0.85)_48%,rgba(11,13,40,0.25)_100%)] lg:hidden"
                                    />


                                    <div className="relative">

                                        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-300 lg:hidden">

                                            <Crown size={20} className="fill-amber-400/90 text-amber-400" />

                                            Color Prediction

                                        </p>


                                        <h2 className="mt-3 text-[30px] font-black leading-[1.08] tracking-tight min-[400px]:text-[34px] lg:mt-1 lg:text-[40px] xl:text-[50px]">

                                            <span className="block">
                                                Bet Now &amp;
                                            </span>

                                            <span className="block">

                                                <span className="bg-gradient-to-r from-fuchsia-400 to-fuchsia-500 bg-clip-text text-transparent lg:from-pink-400 lg:to-fuchsia-500">
                                                    Double
                                                </span>

                                                {" "}

                                                <span className="text-white lg:bg-gradient-to-r lg:from-fuchsia-500 lg:to-violet-500 lg:bg-clip-text lg:text-transparent">
                                                    Your Money
                                                </span>

                                            </span>

                                        </h2>


                                        <p className="mt-3 max-w-[330px] text-[13px] leading-relaxed text-slate-200 min-[400px]:text-sm lg:max-w-[440px] lg:text-[17px]">

                                            Predict the next color, place your bet and win up to{" "}

                                            <span className="font-bold text-amber-400">
                                                {payoutLabel} your amount instantly!
                                            </span>

                                        </p>


                                        {/* FEATURES */}

                                        <div className="mt-5 grid grid-cols-2 gap-2 min-[400px]:grid-cols-4 lg:mt-6 lg:flex lg:flex-wrap lg:gap-1.5 xl:w-[560px] xl:flex-nowrap">

                                            {features.map((feature) => {

                                                const FeatureIcon =
                                                    feature.icon;

                                                return (

                                                    <div
                                                        key={feature.title}
                                                        className="flex min-w-0 items-center gap-2 rounded-xl bg-black/20 py-1 pr-1 lg:gap-1.5 lg:rounded-lg lg:border lg:border-white/[0.06] lg:bg-white/[0.05] lg:py-1 lg:pl-1 lg:pr-2.5"
                                                    >

                                                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full lg:rounded-lg ${feature.tone}`}>

                                                            <FeatureIcon size={17} className="fill-current/20" />

                                                        </span>


                                                        <span className="min-w-0">

                                                            <span className="block text-[11px] font-medium leading-tight text-slate-100 lg:text-[11px] lg:font-bold">
                                                                {feature.title}
                                                            </span>

                                                            <span className="hidden text-[9px] leading-tight text-slate-400 lg:block">
                                                                {feature.sub}
                                                            </span>

                                                        </span>

                                                    </div>

                                                );

                                            })}

                                        </div>


                                        {/* Mobile slide dots (decorative) */}

                                        <div aria-hidden="true" className="mt-4 flex justify-center gap-1.5 lg:hidden">
                                            <span className="h-1.5 w-6 rounded-full bg-fuchsia-500" />
                                            <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
                                            <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
                                        </div>

                                    </div>

                                </div>


                                {/* ROUND */}

                                <div className="relative overflow-hidden rounded-2xl border border-white/[0.09] bg-[radial-gradient(circle_at_50%_40%,#2a1060_0%,#130d35_45%,#0a0b25_100%)] px-5 py-5 text-center shadow-[0_18px_40px_rgba(0,0,0,0.4)] lg:w-[200px] lg:shrink-0 lg:overflow-visible lg:rounded-none lg:border-0 lg:bg-none lg:p-0 lg:shadow-none">

                                    {/* Mobile decorative balls */}

                                    <div aria-hidden="true" className="pointer-events-none lg:hidden">
                                        <Ball color="red" size={64} glow={false} className="absolute left-[12%] top-[18%] opacity-55 blur-[0.5px]" />
                                        <Ball color="green" size={56} glow={false} className="absolute left-[22%] top-[52%] opacity-45 blur-[0.5px]" />
                                        <Ball color="blue" size={60} glow={false} className="absolute right-[12%] top-[14%] opacity-50 blur-[0.5px]" />
                                        <Ball color="blue" size={70} glow={false} className="absolute right-[18%] top-[50%] opacity-55 blur-[0.5px]" />
                                    </div>


                                    <div className="relative">

                                        <div className="flex items-center justify-center gap-3 text-xs font-medium uppercase tracking-[0.15em] text-slate-300">

                                            <span className="h-px w-10 bg-gradient-to-r from-transparent to-violet-500" />

                                            Round

                                            <span className="h-px w-10 bg-gradient-to-l from-transparent to-violet-500" />

                                        </div>


                                        <p className="mt-0.5 text-[28px] font-black leading-tight lg:text-[26px]">

                                            #{round?.roundNumber || "----"}

                                        </p>


                                        {/* TIMER */}

                                        <div className="relative mx-auto mt-3 h-[136px] w-[136px] lg:mt-2 lg:h-[152px] lg:w-[152px]">

                                            <div className="absolute -inset-3 rounded-full bg-violet-600/25 blur-2xl" />

                                            <div
                                                className="absolute inset-0 rounded-full p-[7px] shadow-[0_0_30px_rgba(139,92,246,0.45)]"
                                                style={{
                                                    background:
                                                        `conic-gradient(from 0deg, #c084fc 0%, #8b5cf6 ${timerProgress}%, rgba(76,29,149,0.55) ${timerProgress}% 100%)`,
                                                }}
                                            >

                                                <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[radial-gradient(circle_at_50%_35%,#1c1845_0%,#0b0b26_70%)] shadow-[inset_0_0_22px_rgba(0,0,0,0.7)]">

                                                    <span className="text-[46px] font-black leading-none lg:text-[50px]">

                                                        {timer}

                                                    </span>


                                                    <span className="mt-1 text-sm text-slate-300">

                                                        Seconds

                                                    </span>

                                                </div>

                                            </div>

                                        </div>


                                        {/* STATUS */}

                                        <span
                                            className={`mt-4 inline-flex items-center gap-2 rounded-full border px-5 py-1.5 text-sm font-bold ${statusClasses}`}
                                        >

                                            <span className={`h-2 w-2 rounded-full ${statusDot}`} />

                                            {statusLabel}

                                        </span>

                                    </div>

                                </div>

                            </div>


                            {gamesDisabled && (
                                <div className="relative mt-6 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-center text-sm font-semibold text-red-300">
                                    Games are currently disabled. Betting is unavailable right now.
                                </div>
                            )}


                            {/* =================================================
                                COLOR SELECTION
                            ================================================= */}

                            <div className="relative mt-6 lg:mt-7">

                                <div className="mb-3 flex items-center justify-center gap-4">

                                    <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/15" />

                                    <h2 className="text-base font-bold lg:text-lg">
                                        Choose a color
                                    </h2>

                                    <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/15" />

                                </div>


                                <div className="grid grid-cols-3 gap-2.5 lg:gap-4">

                                    {COLORS.map(
                                        (
                                            color
                                        ) => {

                                            const meta =
                                                colorMeta[
                                                color
                                                ];


                                            const selected =
                                                selectedColor ===
                                                color;


                                            return (

                                                <button
                                                    key={
                                                        color
                                                    }
                                                    type="button"
                                                    aria-pressed={selected}
                                                    disabled={
                                                        bettingDisabled
                                                    }
                                                    onClick={() =>
                                                        handleColorSelect(
                                                            color
                                                        )
                                                    }
                                                    className={`group relative isolate flex flex-col items-center overflow-hidden rounded-xl border px-2 pb-3 pt-3 backdrop-blur-md transition duration-200 lg:rounded-[14px] lg:pb-4 lg:pt-4 ${meta.card} ${selected
                                                        ? meta.cardSelected
                                                        : "hover:-translate-y-0.5 hover:brightness-110"
                                                        } disabled:cursor-not-allowed disabled:opacity-40`}
                                                >

                                                    {/* Glass sheen + floor arc */}

                                                    <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-1/2 bg-gradient-to-b from-white/[0.09] to-transparent" />

                                                    <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[58%] -z-10 h-16 w-[85%] -translate-x-1/2 rounded-[50%] border-t border-white/[0.14] bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_70%)]" />


                                                    {/* Decorative dim balls seen through the glass */}

                                                    <Ball
                                                        color={color}
                                                        size={56}
                                                        glow={false}
                                                        className="pointer-events-none absolute -left-3 top-[34%] -z-10 hidden opacity-30 blur-[2px] brightness-[0.6] lg:block"
                                                    />

                                                    <Ball
                                                        color={color}
                                                        size={60}
                                                        glow={false}
                                                        className="pointer-events-none absolute -right-2 top-[38%] -z-10 hidden opacity-30 blur-[2px] brightness-[0.6] lg:block"
                                                    />


                                                    {/* Check indicator */}

                                                    <span
                                                        className={`absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full border-2 lg:right-3 lg:top-3 lg:h-7 lg:w-7 ${selected
                                                            ? `border-white ${meta.check} shadow-[0_0_12px_rgba(255,255,255,0.35)]`
                                                            : "border-white/60 bg-transparent"
                                                            }`}
                                                    >

                                                        {selected && (
                                                            <Check size={14} strokeWidth={3.5} className="text-white" />
                                                        )}

                                                    </span>


                                                    <Ball
                                                        color={color}
                                                        size={44}
                                                        className="relative block lg:hidden"
                                                    />

                                                    <Ball
                                                        color={color}
                                                        size={72}
                                                        className="relative hidden lg:block"
                                                    />


                                                    <span className="relative -mt-2 rounded-full bg-black/55 px-3 py-0.5 text-sm font-extrabold tracking-wide text-white backdrop-blur-sm lg:-mt-3 lg:px-4 lg:text-lg">

                                                        {
                                                            meta.label
                                                        }

                                                    </span>


                                                    <span className={`relative mt-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white lg:px-4 lg:text-xs ${meta.pill}`}>

                                                        {payoutLabel} Payout

                                                    </span>

                                                </button>

                                            );

                                        }
                                    )}

                                </div>

                            </div>


                            {/* =================================================
                                WALLET MODE (logged-in users only)
                            ================================================= */}

                            {auth.isAuthenticated && (

                                <div className="relative mx-auto mt-4 grid max-w-[690px] grid-cols-2 gap-2.5 lg:mt-5 lg:gap-3">

                                    {[
                                        { id: "real", label: "Real Money", sub: "Play with real balance", icon: Coins, balance: walletBalance },
                                        { id: "test", label: "Test Mode", sub: "Play with virtual credits", icon: FlaskConical, balance: testBalance },
                                    ].map((modeOption) => {

                                        const ModeIcon =
                                            modeOption.icon;

                                        const active =
                                            walletMode === modeOption.id;

                                        return (

                                            <button
                                                key={modeOption.id}
                                                type="button"
                                                aria-pressed={active}
                                                disabled={bettingDisabled}
                                                onClick={() => setWalletMode(modeOption.id)}
                                                title={`Balance: ₹${Number(modeOption.balance || 0).toLocaleString("en-IN")}`}
                                                className={`flex items-center justify-center gap-3 rounded-xl border px-3 py-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-40 lg:gap-4 lg:py-3 ${active
                                                    ? "border-fuchsia-400/70 bg-gradient-to-r from-[#6d28d9] to-[#9333ea] shadow-[0_0_24px_rgba(168,85,247,0.45)]"
                                                    : "border-white/10 bg-[#0c0f2c]/90 hover:border-white/25"
                                                    }`}
                                            >

                                                <ModeIcon size={30} strokeWidth={1.6} className="hidden shrink-0 text-white/90 min-[380px]:block" />

                                                <span className="min-w-0">

                                                    <span className="block text-sm font-bold leading-tight lg:text-[15px]">
                                                        {modeOption.label}
                                                    </span>

                                                    <span className="mt-0.5 block text-[11px] leading-tight text-white/75 lg:text-xs">
                                                        {modeOption.sub}
                                                    </span>

                                                </span>

                                            </button>

                                        );

                                    })}

                                </div>

                            )}


                            {auth.isAuthenticated &&
                                walletMode === "real" &&
                                bonusBalance > 0 && (

                                <p className="relative mx-auto mt-2 max-w-[690px] text-center text-[11px] text-violet-300/80">
                                    Bonus balance (₹{Number(bonusBalance).toLocaleString("en-IN")}) automatically
                                    covers up to 30% of your Real bet.
                                </p>

                            )}


                            {/* =================================================
                                BET AMOUNT
                            ================================================= */}

                            <div className="relative mx-auto mt-5 max-w-[690px]">

                                <div className="mb-3 flex items-center justify-center gap-4">

                                    <span className="h-px flex-1 bg-white/15" />

                                    <h3 className="text-base font-bold">
                                        Bet Amount
                                    </h3>

                                    <span className="h-px flex-1 bg-white/15" />

                                </div>


                                {/* PRESET AMOUNTS */}

                                <div className="grid grid-cols-5 gap-2 lg:gap-2.5">

                                    {AMOUNT_OPTIONS.map(
                                        (
                                            value
                                        ) => (

                                            <button
                                                key={
                                                    value
                                                }
                                                type="button"
                                                disabled={
                                                    bettingDisabled
                                                }
                                                onClick={() =>
                                                    handleAmountSelect(
                                                        value
                                                    )
                                                }
                                                className={`h-12 rounded-xl border px-1 text-[13px] font-bold transition min-[400px]:text-sm lg:text-[15px] ${Number(
                                                    amount
                                                ) ===
                                                    value
                                                    ? "border-fuchsia-400/80 bg-gradient-to-b from-[#6d28d9] to-[#5b21b6] text-white shadow-[0_0_20px_rgba(168,85,247,0.45)]"
                                                    : "border-white/10 bg-[#0c0f2c]/90 text-white hover:border-white/25 hover:bg-white/[0.06]"
                                                    } disabled:cursor-not-allowed disabled:opacity-40`}
                                            >

                                                ₹
                                                {value.toLocaleString(
                                                    "en-IN"
                                                )}

                                            </button>

                                        )
                                    )}

                                </div>


                                {/* CUSTOM AMOUNT */}

                                <div className="mt-3 flex gap-2.5">

                                    <div className="flex h-[52px] min-w-0 flex-1 items-center rounded-xl border border-white/10 bg-[#07091e]/95 focus-within:border-violet-500/70">

                                        <span className="flex items-center pl-4 pr-2 text-lg text-slate-300">
                                            ₹
                                        </span>


                                        <input
                                            type="number"
                                            min="10"
                                            max="10000"
                                            step="1"
                                            value={
                                                amount
                                            }
                                            disabled={
                                                bettingDisabled
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setAmount(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Enter amount"
                                            className="h-full min-w-0 flex-1 bg-transparent px-2 text-[15px] outline-none placeholder:text-slate-500 disabled:cursor-not-allowed"
                                        />


                                        {amount !== "" && !bettingDisabled && (

                                            <button
                                                type="button"
                                                aria-label="Clear amount"
                                                onClick={() => setAmount("")}
                                                className="mr-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-300 text-[#07091e] transition hover:bg-white"
                                            >

                                                <X size={14} strokeWidth={3} />

                                            </button>

                                        )}

                                    </div>


                                    <button
                                        type="button"
                                        disabled={
                                            maxDisabled
                                        }
                                        onClick={() =>
                                            setAmount(
                                                String(
                                                    Math.floor(
                                                        walletMode === "real"
                                                            ? getMaxAffordableRealBet()
                                                            : activeBalance
                                                    )
                                                )
                                            )
                                        }
                                        className="h-[52px] w-[78px] shrink-0 rounded-xl bg-gradient-to-b from-[#7c3aed] to-[#5b21b6] text-[15px] font-black text-white shadow-[0_0_18px_rgba(124,58,237,0.35)] transition hover:brightness-110 disabled:opacity-40 lg:w-[88px]"
                                    >

                                        MAX

                                    </button>

                                </div>


                                {/* AVAILABLE BALANCE */}

                                {auth.isAuthenticated && (

                                    <div className="mt-2 flex items-center justify-center gap-2 text-[13px] text-slate-300">

                                        <p>

                                            Available {walletMode} Balance:

                                            <span className="font-bold text-emerald-400">

                                                {" "}
                                                ₹
                                                {Number(activeBalance || 0).toLocaleString(
                                                    "en-IN",
                                                    {
                                                        minimumFractionDigits:
                                                            2,
                                                    }
                                                )}

                                            </span>

                                        </p>


                                        <button
                                            type="button"
                                            aria-label="Refresh balance"
                                            onClick={() => loadWallet()}
                                            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.06] text-slate-300 transition hover:bg-white/[0.12] hover:text-white"
                                        >

                                            <RefreshCw size={14} className={loadingWallet ? "animate-spin" : ""} />

                                        </button>

                                    </div>

                                )}


                                {/* PLACE / INCREASE BET */}

                                <button
                                    type="button"
                                    disabled={
                                        auth.isAuthenticated && (
                                            betPlaced
                                                ? (
                                                    !canIncreaseBet ||
                                                    !amount ||
                                                    placingBet
                                                )
                                                : (
                                                    timer <= 0 ||
                                                    !selectedColor ||
                                                    !amount ||
                                                    placingBet ||
                                                    gamePaused ||
                                                    gameStopped ||
                                                    gamesDisabled
                                                )
                                        )
                                    }
                                    onClick={
                                        !auth.isAuthenticated
                                            ? () =>
                                                router.push(
                                                    "/login?redirect=/games/color-prediction"
                                                )
                                            : betPlaced
                                                ? handleIncreaseBet
                                                : handlePlaceBet
                                    }
                                    className="relative mt-4 flex h-[58px] w-full items-center justify-center gap-3 overflow-hidden rounded-2xl border border-fuchsia-300/30 bg-gradient-to-r from-[#6d28d9] via-[#9333ea] to-[#d946ef] px-12 text-lg font-bold shadow-[0_0_35px_rgba(168,85,247,0.45)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:grayscale disabled:opacity-40 lg:h-[60px] lg:text-xl"
                                >

                                    <Target size={26} strokeWidth={2.2} className="shrink-0" />


                                    <span className="truncate">

                                        {
                                            !auth.isAuthenticated
                                                ? "Login to Bet"
                                                : placingBet
                                                    ? (
                                                        betPlaced
                                                            ? "Increasing Bet..."
                                                            : "Placing Bet..."
                                                    )
                                                    : betPlaced
                                                        ? (
                                                            canIncreaseBet
                                                                ? `Increase Bet on ${currentRoundBet?.color?.toUpperCase() || ""}`
                                                                : "Bet Locked (<5s left)"
                                                        )
                                                        : "Place Bet"
                                        }

                                    </span>


                                    <ArrowRight size={24} className="absolute right-5 shrink-0" />

                                </button>


                                {betPlaced && currentRoundBet && (

                                    <p className="mt-2 text-center text-[11px] text-slate-400">
                                        Current bet on {currentRoundBet.color.toUpperCase()}: ₹{Number(currentRoundBet.amount || 0).toLocaleString("en-IN")}
                                        {canIncreaseBet ? " - enter an amount above to increase it." : " - locked (less than 5 seconds remaining)."}
                                    </p>

                                )}

                            </div>


                            {/* =================================================
                                MESSAGE
                            ================================================= */}

                            {message && (

                                <div
                                    className={`relative mx-auto mt-4 max-w-[690px] rounded-xl border px-4 py-3 text-center text-xs font-semibold ${messageType ===
                                        "success"
                                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                                        : messageType ===
                                            "error"
                                            ? "border-red-500/20 bg-red-500/10 text-red-400"
                                            : messageType ===
                                                "paused"
                                                ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-300"
                                                : messageType ===
                                                    "stopped"
                                                    ? "border-red-500/20 bg-red-500/10 text-red-400"
                                                    : messageType ===
                                                        "result"
                                                        ? "border-violet-500/20 bg-violet-500/10 text-violet-300"
                                                        : messageType ===
                                                            "auth"
                                                            ? "border-purple-500/20 bg-purple-500/10 text-purple-300"
                                                            : "border-white/10 bg-white/[0.03] text-slate-300"
                                        }`}
                                >

                                    {
                                        message
                                    }

                                    {messageType === "auth" && (

                                        <button
                                            type="button"
                                            onClick={() =>
                                                router.push(
                                                    `/login?redirect=${encodeURIComponent("/games/color-prediction")}`
                                                )
                                            }
                                            className="ml-2 inline-flex items-center rounded-lg bg-purple-600 px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-purple-500"
                                        >
                                            Login
                                        </button>

                                    )}

                                </div>

                            )}


                            {/* =================================================
                                GAME INFO
                            ================================================= */}

                            <div className="relative mx-auto mt-5 flex max-w-[690px] items-center justify-around gap-2 rounded-2xl border border-white/[0.08] bg-[#0b0d28]/90 px-3 py-4 text-slate-300 lg:mt-4 lg:justify-center lg:gap-8 lg:border-0 lg:bg-transparent lg:p-0 lg:text-slate-400">

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowRules(
                                            true
                                        )
                                    }
                                    className="inline-flex items-center gap-2 text-[13px] transition hover:text-violet-300 lg:text-xs"
                                >

                                    <BookOpen size={18} className="text-slate-300 lg:h-4 lg:w-4" />

                                    How to play

                                </button>


                                <span className="inline-flex items-center gap-2 text-[13px] lg:text-xs">

                                    <ShieldCheck size={18} className="fill-slate-300/80 text-[#0b0d28] lg:h-4 lg:w-4" />

                                    Provably fair

                                </span>


                                <span className="inline-flex items-center gap-2 text-[13px] lg:text-xs">

                                    <Lock size={18} className="fill-slate-300/80 text-slate-300 lg:h-4 lg:w-4" />

                                    <span className="hidden min-[380px]:inline">Secure &amp; Encrypted</span>
                                    <span className="min-[380px]:hidden">Secure</span>

                                </span>

                            </div>

                        </section>


                        {/* =================================================
                            SIDE PANEL
                        ================================================= */}

                        <aside className="flex min-w-0 flex-col gap-4">


                            {/* RECENT RESULTS */}

                            <section className="rounded-2xl border border-white/[0.08] bg-[#0a0c24]/95 p-4 shadow-2xl">

                                <div className="flex items-center justify-between">

                                    <div className="flex items-center gap-2.5">

                                        <Sparkles size={20} className="text-slate-200" />

                                        <h2 className="text-[17px] font-bold">
                                            Recent Results
                                        </h2>

                                    </div>


                                    <span className="rounded-lg bg-white/[0.06] px-3 py-1 text-xs text-slate-300">
                                        Last 20
                                    </span>

                                </div>


                                <div className="mt-4 space-y-2">

                                    {loadingHistory ? (

                                        <div className="py-10 text-center text-xs text-slate-500">
                                            Loading results...
                                        </div>

                                    ) : gameHistory.length === 0 ? (

                                        <div className="py-10 text-center text-xs text-slate-500">
                                            No results yet.
                                        </div>

                                    ) : (

                                        gameHistory
                                            .slice(
                                                0,
                                                10
                                            )
                                            .map(
                                                (
                                                    game
                                                ) => {

                                                    const value =
                                                        game.result?.toLowerCase();


                                                    const meta =
                                                        colorMeta[
                                                        value
                                                        ] ||
                                                        colorMeta.blue;


                                                    return (

                                                        <div
                                                            key={
                                                                game._id
                                                            }
                                                            className="grid grid-cols-[18px_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-white/[0.06] bg-[#0e1130] px-3.5 py-2.5 transition hover:border-white/15"
                                                        >

                                                            <span className={`h-3.5 w-3.5 rounded-full ${meta.dot} ring-2 ring-white/15 shadow-[0_0_10px_currentColor] ${meta.text}`} />


                                                            <span className="truncate text-[13px] font-medium tabular-nums text-slate-200" title={`#${game.roundNumber}`}>
                                                                #{game.roundNumber}
                                                            </span>


                                                            <span className={`truncate text-[13px] font-bold ${meta.text}`}>
                                                                {meta.label}
                                                            </span>


                                                            <span className="text-xs tabular-nums text-slate-400">
                                                                {formatResultTime(game.endTime || game.createdAt)}
                                                            </span>

                                                        </div>

                                                    );

                                                }
                                            )

                                    )}

                                </div>


                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowFullHistory(
                                            true
                                        )
                                    }
                                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-[#0e1130] py-3 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
                                >

                                    View Full History

                                    <ArrowRight size={16} />

                                </button>

                            </section>


                            {/* GAME STATISTICS */}

                            <section className="rounded-2xl border border-white/[0.08] bg-[#0a0c24]/95 p-4 shadow-2xl">

                                <div className="flex items-center justify-between">

                                    <div className="flex items-center gap-2.5">

                                        <Dices size={20} className="text-slate-200" />

                                        <h2 className="text-[17px] font-bold">
                                            Game Statistics
                                        </h2>

                                    </div>


                                    <span className="rounded-lg bg-white/[0.06] px-3 py-1 text-xs text-slate-300">
                                        Last {historyStats.total}
                                    </span>

                                </div>


                                <div className="mt-4 grid grid-cols-2 gap-2.5">

                                    <div className="flex min-w-0 flex-col items-start gap-2 rounded-xl border border-white/[0.06] bg-[#0e1130] p-3 sm:flex-row sm:items-center sm:gap-3 xl:flex-col xl:items-start xl:gap-2">

                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white shadow-[0_0_14px_rgba(124,58,237,0.5)]">
                                            <Gamepad2 size={20} />
                                        </span>

                                        <div className="w-full min-w-0">
                                            <p
                                                className="truncate text-base font-bold leading-tight tabular-nums"
                                                title={roundsPlayed.toLocaleString("en-IN")}
                                            >
                                                {roundsPlayed.toLocaleString("en-IN")}
                                            </p>
                                            <p className="truncate text-[11px] text-slate-400">
                                                Total Rounds
                                            </p>
                                        </div>

                                    </div>


                                    {[
                                        ["red", "Red Wins"],
                                        ["green", "Green Wins"],
                                        ["blue", "Blue Wins"],
                                    ].map(([color, label]) => (

                                        <div
                                            key={color}
                                            className="flex min-w-0 flex-col items-start gap-2 rounded-xl border border-white/[0.06] bg-[#0e1130] p-3 sm:flex-row sm:items-center sm:gap-3 xl:flex-col xl:items-start xl:gap-2"
                                        >

                                            <Ball color={color} size={28} className="relative block sm:ml-1 xl:ml-0" />

                                            <div className="w-full min-w-0">
                                                <p className="truncate text-base font-bold leading-tight">
                                                    {historyStats[color]}%
                                                </p>
                                                <p className="truncate text-[11px] text-slate-400">
                                                    {label}
                                                </p>
                                            </div>

                                        </div>

                                    ))}

                                </div>

                            </section>


                            {/* RESPONSIBLE GAMING */}

                            <button
                                type="button"
                                onClick={() => router.push("/legal-help")}
                                className="group flex items-center gap-4 rounded-2xl border border-fuchsia-500/25 bg-[radial-gradient(circle_at_15%_50%,rgba(168,85,247,0.35),transparent_55%),linear-gradient(135deg,#2a0f52_0%,#170b36_60%,#100a2a_100%)] p-4 text-left shadow-[0_0_30px_rgba(168,85,247,0.15)] transition hover:border-fuchsia-400/50"
                            >

                                <Trophy size={52} strokeWidth={1.4} className="shrink-0 fill-amber-500/40 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.45)]" />

                                <span className="min-w-0 flex-1">

                                    <span className="block bg-gradient-to-r from-fuchsia-400 to-pink-400 bg-clip-text text-[17px] font-black leading-tight text-transparent">
                                        Play Smart
                                        <br />
                                        Bet Responsibly!
                                    </span>

                                    <span className="mt-1.5 block text-xs text-slate-300">
                                        Set limits and enjoy the game safely.
                                    </span>

                                </span>

                                <ChevronRight size={20} className="shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-white" />

                            </button>

                        </aside>


                        <FullHistoryModal
                            open={
                                showFullHistory
                            }
                            onClose={() =>
                                setShowFullHistory(
                                    false
                                )
                            }
                        />

                    </div>



                    {/* =================================================
                        STATS + LOWER TABLES (shared arena backdrop so
                        the glass cards have something to show through)
                    ================================================= */}

                    <div className="relative isolate mt-4">

                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute -inset-x-4 -bottom-4 -top-4 -z-10 overflow-hidden [mask-image:linear-gradient(180deg,transparent_0%,black_12%,black_82%,transparent_100%)] sm:-inset-x-6 lg:-inset-x-5"
                        >

                            <div
                                className="absolute inset-0 bg-cover bg-center opacity-45 blur-[2px]"
                                style={{ backgroundImage: "url(/games/color-prediction/arena-desktop.webp)" }}
                            />

                            <div className="absolute inset-0 bg-[linear-gradient(180deg,#060818_0%,rgba(6,8,24,0.55)_18%,rgba(6,8,24,0.5)_75%,#060818_100%)]" />

                            <Ball color="red" size={220} glow={false} className="absolute -bottom-16 right-[2%] opacity-35 blur-[6px]" />
                            <Ball color="blue" size={120} glow={false} className="absolute right-[28%] top-[48%] opacity-25 blur-[6px]" />

                        </div>


                        {/* =================================================
                            STATS
                        ================================================= */}

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">

                            {[
                                {
                                    label: "Your Bets",
                                    value: myBets.length,
                                    sub: "This account",
                                    icon: "users",
                                    card: "border-fuchsia-400/45 bg-[linear-gradient(135deg,rgba(126,34,206,0.38)_0%,rgba(28,16,70,0.5)_55%,rgba(190,24,93,0.28)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_0_26px_rgba(168,85,247,0.22)]",
                                    iconBox: "from-fuchsia-500 to-violet-600 text-white shadow-[0_0_14px_rgba(217,70,239,0.5)]",
                                    deco: <Ball color="red" size={96} className="absolute -bottom-6 -right-3" />,
                                },
                                {
                                    label: "Total Staked",
                                    value: `₹${totalStaked.toLocaleString("en-IN")}`,
                                    sub: "Last 20 bets",
                                    icon: "wallet",
                                    card: "border-amber-400/55 bg-[linear-gradient(135deg,rgba(146,90,14,0.34)_0%,rgba(30,20,40,0.5)_55%,rgba(120,70,10,0.3)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_0_26px_rgba(245,158,11,0.2)]",
                                    iconBox: "from-amber-400 to-orange-500 text-amber-950 shadow-[0_0_14px_rgba(245,158,11,0.5)]",
                                    deco: (
                                        <span className="absolute -bottom-1 right-3 flex items-end">
                                            <CoinStack coins={3} className="-mr-4 opacity-90" />
                                            <CoinStack coins={7} />
                                        </span>
                                    ),
                                },
                                {
                                    label: "Total Payout",
                                    value: `₹${totalPayout.toLocaleString("en-IN")}`,
                                    sub: "Last 20 bets",
                                    icon: "transaction",
                                    card: "border-emerald-400/55 bg-[linear-gradient(135deg,rgba(6,110,80,0.38)_0%,rgba(8,30,44,0.5)_55%,rgba(6,95,70,0.3)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_0_26px_rgba(16,185,129,0.2)]",
                                    iconBox: "from-emerald-400 to-teal-600 text-white shadow-[0_0_14px_rgba(16,185,129,0.5)]",
                                    deco: <Ball color="green" size={110} className="absolute -bottom-5 right-5" />,
                                },
                                {
                                    label: "Win Rate",
                                    value: `${winRate}%`,
                                    sub: latestResult
                                        ? `Last: ${latestResult.toUpperCase()}`
                                        : "Waiting for result",
                                    icon: "chart",
                                    card: "border-indigo-400/55 bg-[linear-gradient(135deg,rgba(55,48,200,0.38)_0%,rgba(15,18,62,0.5)_55%,rgba(37,60,200,0.3)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_0_26px_rgba(99,102,241,0.24)]",
                                    iconBox: "from-indigo-500 to-violet-600 text-white shadow-[0_0_14px_rgba(99,102,241,0.55)]",
                                    deco: <Ball color="blue" size={110} className="absolute -bottom-3 right-3" />,
                                },
                            ].map((stat) => (

                                <div
                                    key={stat.label}
                                    className={`relative isolate min-h-[132px] overflow-hidden rounded-2xl border p-4 backdrop-blur-md lg:min-h-[150px] ${stat.card}`}
                                >

                                    {/* Decorations */}

                                    <Crown
                                        aria-hidden="true"
                                        size={70}
                                        strokeWidth={1}
                                        className="pointer-events-none absolute left-1/2 top-5 -z-10 -translate-x-1/2 text-white/[0.045]"
                                    />

                                    <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
                                        {stat.deco}
                                    </span>


                                    <div className="flex items-start justify-between gap-2">

                                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${stat.iconBox}`}>

                                            <Icon
                                                name={stat.icon}
                                                size={20}
                                            />

                                        </span>


                                        <span className="truncate text-xs text-white/75">
                                            {stat.sub}
                                        </span>

                                    </div>


                                    <p className="mt-4 text-base text-white/85 lg:text-[17px]">
                                        {stat.label}
                                    </p>


                                    <p className="mt-0.5 max-w-[70%] truncate text-[28px] font-black leading-tight tracking-tight lg:text-[30px]">
                                        {stat.value}
                                    </p>

                                </div>

                            ))}

                        </div>


                        {/* =================================================
                            LOWER TABLES
                        ================================================= */}

                        <div className="mt-4 grid gap-4 xl:grid-cols-2">


                            {/* =================================================
                                MY BETS
                            ================================================= */}

                            <section
                                id="my-bets"
                                className="min-w-0 rounded-2xl border border-violet-400/25 bg-[#0b0c2a]/55 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_30px_rgba(124,58,237,0.12)] backdrop-blur-md sm:p-6"
                            >

                                <div className="flex items-start justify-between gap-3">

                                    <div>

                                        <p className="flex items-center gap-2 text-sm text-slate-300">

                                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-500/20 text-violet-300">
                                                <Icon name="users" size={14} />
                                            </span>

                                            Your Activity

                                        </p>


                                        <h2 className="mt-1.5 text-2xl font-bold">
                                            My Bets
                                        </h2>

                                    </div>


                                    <span className="mt-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-1.5 text-xs text-slate-200">
                                        Last 20
                                    </span>

                                </div>


                                <div className="mt-5 overflow-x-auto">

                                    {loadingBets && myBets.length === 0 ? (

                                        <div className="py-8 text-center text-xs text-slate-400">
                                            Loading bets...
                                        </div>

                                    ) : myBets.length === 0 ? (

                                        <div className="py-8 text-center text-xs text-slate-400">
                                            You haven&apos;t placed any bets yet.
                                        </div>

                                    ) : (

                                        <table className="w-full min-w-[560px] border-separate border-spacing-y-1.5 text-left">

                                            <thead>

                                                <tr className="text-[11px] uppercase tracking-wider text-slate-400 [&>th]:border-y [&>th]:border-white/[0.07] [&>th]:bg-white/[0.035] [&>th:first-child]:rounded-l-xl [&>th:first-child]:border-l [&>th:last-child]:rounded-r-xl [&>th:last-child]:border-r">

                                                    <th className="px-4 py-3 font-medium">Round</th>

                                                    <th className="px-3 py-3 font-medium">Color</th>

                                                    <th className="px-3 py-3 font-medium">Amount</th>

                                                    <th className="px-3 py-3 font-medium">Result</th>

                                                    <th className="px-3 py-3 font-medium">Payout</th>

                                                    <th className="w-8 px-3 py-3" aria-hidden="true" />

                                                </tr>

                                            </thead>


                                            <tbody>

                                                {myBets
                                                    .slice(
                                                        0,
                                                        6
                                                    )
                                                    .map(
                                                        (
                                                            bet
                                                        ) => {

                                                            const meta =
                                                                colorMeta[
                                                                bet.color?.toLowerCase()
                                                                ] ||
                                                                colorMeta.blue;


                                                            const won =
                                                                bet.result === "won";


                                                            return (

                                                                <tr
                                                                    key={
                                                                        bet._id
                                                                    }
                                                                    className={`text-[15px] transition [&>td]:border-y [&>td:first-child]:rounded-l-xl [&>td:first-child]:border-l [&>td:last-child]:rounded-r-xl [&>td:last-child]:border-r ${won
                                                                        ? "[&>td]:border-emerald-400/45 [&>td]:bg-emerald-500/[0.1] hover:[&>td]:bg-emerald-500/[0.16]"
                                                                        : "[&>td]:border-white/[0.07] [&>td]:bg-white/[0.03] hover:[&>td]:border-white/15 hover:[&>td]:bg-white/[0.06]"
                                                                        }`}
                                                                >

                                                                    <td className="px-4 py-3.5 font-semibold">

                                                                        #
                                                                        {
                                                                            bet.round?.roundNumber ||
                                                                            "-"
                                                                        }

                                                                    </td>


                                                                    <td className="px-3 py-3.5">

                                                                        <span className={`inline-flex rounded-full border px-4 py-1 text-[11px] font-black tracking-wide ${meta.badge}`}>

                                                                            <span className="text-white">
                                                                                {
                                                                                    meta.label
                                                                                }
                                                                            </span>

                                                                        </span>

                                                                    </td>


                                                                    <td className="px-3 py-3.5 text-slate-100">

                                                                        ₹
                                                                        {Number(
                                                                            bet.amount ||
                                                                            0
                                                                        ).toLocaleString(
                                                                            "en-IN"
                                                                        )}

                                                                    </td>


                                                                    <td className={`px-3 py-3.5 text-sm font-black ${won
                                                                        ? "text-emerald-400"
                                                                        : bet.result ===
                                                                            "lost"
                                                                            ? "text-red-500"
                                                                            : "text-amber-400"
                                                                        }`}>

                                                                        {
                                                                            (
                                                                                bet.result ||
                                                                                "pending"
                                                                            ).toUpperCase()
                                                                        }

                                                                    </td>


                                                                    <td className="px-3 py-3.5 font-bold">

                                                                        {Number(
                                                                            bet.payout ||
                                                                            0
                                                                        ) > 0 ? (

                                                                            <span className="text-emerald-400">

                                                                                +₹
                                                                                {Number(
                                                                                    bet.payout
                                                                                ).toLocaleString(
                                                                                    "en-IN"
                                                                                )}

                                                                            </span>

                                                                        ) : (

                                                                            <span className="font-medium text-slate-500">
                                                                                ₹0
                                                                            </span>

                                                                        )}

                                                                    </td>


                                                                    <td className="px-3 py-3.5 text-slate-500" aria-hidden="true">
                                                                        <ChevronRight size={16} />
                                                                    </td>

                                                                </tr>

                                                            );

                                                        }
                                                    )}

                                            </tbody>

                                        </table>

                                    )}

                                </div>

                            </section>


                            {/* =================================================
                                RECENT ACTIVITY
                            ================================================= */}

                            <section className="min-w-0 rounded-2xl border border-violet-400/25 bg-[#0b0c2a]/55 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_30px_rgba(124,58,237,0.12)] backdrop-blur-md sm:p-6">

                                <div className="flex items-start justify-between gap-3">

                                    <div>

                                        <p className="flex items-center gap-2 text-sm text-slate-300">

                                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-500/20 text-violet-300">
                                                <Icon name="transaction" size={14} />
                                            </span>

                                            Bet &amp; payout activity

                                        </p>


                                        <h2 className="mt-1.5 text-2xl font-bold">
                                            Recent Activity
                                        </h2>

                                    </div>


                                    <span className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-1.5 text-xs text-slate-200">

                                        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />

                                        Live data

                                    </span>

                                </div>


                                <div className="mt-5 space-y-2">

                                    {loadingBets && myBets.length === 0 ? (

                                        <div className="py-8 text-center text-xs text-slate-400">
                                            Loading activity...
                                        </div>

                                    ) : myBets
                                        .slice(
                                            0,
                                            6
                                        )
                                        .length === 0 ? (

                                        <div className="py-8 text-center text-xs text-slate-400">
                                            No activity yet.
                                        </div>

                                    ) : (

                                        myBets
                                            .slice(
                                                0,
                                                6
                                            )
                                            .map(
                                                (
                                                    bet
                                                ) => {

                                                    const won =
                                                        bet.result === "won";

                                                    return (

                                                        <div
                                                            key={`activity-${bet._id}`}
                                                            className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3 backdrop-blur-sm transition sm:px-4 ${won
                                                                ? "border-emerald-400/45 bg-emerald-500/[0.1] hover:bg-emerald-500/[0.16]"
                                                                : "border-white/[0.08] bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.06]"
                                                                }`}
                                                        >

                                                            <div className="flex min-w-0 items-center gap-3">

                                                                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-[1.5px] ${won
                                                                    ? "border-emerald-200/50 bg-[radial-gradient(circle_at_50%_35%,#34d399_0%,#047857_62%,#022c22_100%)] text-white shadow-[0_0_16px_rgba(16,185,129,0.55)]"
                                                                    : "border-rose-300/50 bg-[radial-gradient(circle_at_50%_35%,#f43f5e_0%,#9f1239_62%,#4c0519_100%)] text-white shadow-[0_0_16px_rgba(244,63,94,0.5)]"
                                                                    }`}>

                                                                    {won
                                                                        ? <ArrowUp size={18} strokeWidth={2.6} />
                                                                        : <ArrowDown size={18} strokeWidth={2.6} />
                                                                    }

                                                                </span>


                                                                <div className="min-w-0">

                                                                    <p className="truncate text-[15px] font-medium text-white">

                                                                        {
                                                                            won
                                                                                ? "Winning Payout"
                                                                                : "Bet Placed"
                                                                        }

                                                                    </p>


                                                                    <p className="text-[13px] text-slate-400">

                                                                        Round #
                                                                        {
                                                                            bet.round?.roundNumber ||
                                                                            "-"
                                                                        }

                                                                    </p>

                                                                </div>

                                                            </div>


                                                            <span className={`shrink-0 text-lg font-extrabold ${won
                                                                ? "text-emerald-400"
                                                                : "text-red-500"
                                                                }`}>

                                                                {
                                                                    won
                                                                        ? `+₹${Number(
                                                                            bet.payout ||
                                                                            0
                                                                        ).toLocaleString(
                                                                            "en-IN"
                                                                        )}`
                                                                        : `-₹${Number(
                                                                            bet.amount ||
                                                                            0
                                                                        ).toLocaleString(
                                                                            "en-IN"
                                                                        )}`
                                                                }

                                                            </span>

                                                        </div>

                                                    );

                                                }
                                            )

                                    )}

                                </div>

                            </section>

                        </div>

                    </div>

                </div>


                {/* =================================================
                    RULES MODAL
                ================================================= */}

                {showRules && (

                    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">

                        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0a1024] p-6 shadow-2xl">

                            <div className="flex items-center justify-between">

                                <div>

                                    <p className="text-xs text-violet-400">

                                        GAME RULES

                                    </p>


                                    <h2 className="mt-1 text-xl font-bold">

                                        How to Play

                                    </h2>

                                </div>


                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowRules(
                                            false
                                        )
                                    }
                                    className="rounded-xl bg-white/[0.05] px-3 py-2 text-slate-400 hover:text-white"
                                >

                                    ✕

                                </button>

                            </div>


                            <div className="mt-5 space-y-3 text-sm text-slate-400">

                                {[
                                    "Choose RED, GREEN or BLUE while betting is open.",
                                    "Select a preset amount or enter your own amount.",
                                    "Confirm the bet before the countdown reaches zero.",
                                    "The round result is published automatically after betting closes.",
                                    "Winning payouts are reflected in your wallet after the round completes.",
                                ].map(
                                    (
                                        rule,
                                        index
                                    ) => (

                                        <div
                                            key={
                                                rule
                                            }
                                            className="flex gap-3 rounded-xl border border-white/5 bg-white/[0.025] p-3"
                                        >

                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-xs font-bold text-violet-300">

                                                {
                                                    index +
                                                    1
                                                }

                                            </span>


                                            <p>

                                                {
                                                    rule
                                                }

                                            </p>

                                        </div>

                                    )
                                )}

                            </div>


                            <button
                                type="button"
                                onClick={() =>
                                    setShowRules(
                                        false
                                    )
                                }
                                className="mt-5 w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 py-3 font-bold"
                            >

                                Got it

                            </button>

                        </div>

                    </div>

                )}

            </main>

        </UserLayout>

    );

}