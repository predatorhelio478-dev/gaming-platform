"use client";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import { io } from "socket.io-client";

import { useRouter } from "next/navigation";

import {
    getMyBets,
    getGameHistory,
    getGameHistoryPaginated,
    placeBet,
    increaseBet,
} from "../../../lib/api";

import FullHistoryModal
    from "@/components/games/FullHistoryModal";

import UserLayout
    from "@/components/user/UserLayout";

import useAuth
    from "@/lib/useAuth";

import useWallet
    from "@/lib/useWallet";


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

    },

};


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

    const loadMyBets =
        async () => {

            if (!auth.isAuthenticated) {

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

                console.log("MY BETS RESPONSE:", response);

                if (response?.success) {
                    setMyBets(response.bets || []);
                }


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
    // INITIAL LOAD + SOCKET
    // ======================================================

    useEffect(
        () => {

            /*
             * Initial API data.
             *
             * loadWallet/loadMyBets are no-ops for guests
             * (see the auth.isAuthenticated guard inside
             * each) - loadGameHistory hits a public route
             * and is always safe to call.
             */

            loadWallet();

            loadMyBets();

            loadGameHistory();


            /*
             * Socket connection.
             */

            const newSocket =
                io(
                    SOCKET_URL
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

                const seconds =
                    (
                        new Date(round.endTime).getTime() -
                        new Date(round.startTime).getTime()
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
    // DISABLED STATE
    // ======================================================

    const bettingDisabled =
        timer <= 0 ||
        placingBet ||
        gamePaused ||
        gameStopped ||
        (
            betPlaced &&
            !canIncreaseBet
        );


    // ======================================================
    // RENDER
    // ======================================================

    return (

        <UserLayout
            title="Color Prediction"
            walletBalance={walletBalance}
            loadingWallet={loadingWallet}
        >

            <main className="min-h-screen overflow-x-hidden bg-[#030712] text-white">

                {/* ==================================================
                    BACKGROUND
                ================================================== */}

                <div className="pointer-events-none fixed inset-0 -z-0 bg-[radial-gradient(circle_at_45%_15%,rgba(124,58,237,0.12),transparent_32%),radial-gradient(circle_at_90%_55%,rgba(37,99,235,0.08),transparent_30%)]" />


                {/* ==================================================
                    CONTENT
                ================================================== */}

                <div className="relative z-10 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">


                    {/* =================================================
                        MAIN GAME + RECENT RESULTS
                    ================================================= */}

                    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">


                        {/* =================================================
                            GAME
                        ================================================= */}

                        <section className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-[#090f23]/90 p-5 shadow-2xl sm:p-7">

                            <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-96 -translate-x-1/2 rounded-full bg-violet-600/10 blur-3xl" />


                            {/* =================================================
                                ROUND
                            ================================================= */}

                            <div className="relative text-center">

                                <div className="flex items-center justify-center gap-3 text-xs uppercase tracking-[0.25em] text-slate-500">

                                    <span className="h-px w-10 bg-gradient-to-r from-transparent to-violet-500/60" />

                                    Round

                                    <span className="h-px w-10 bg-gradient-to-l from-transparent to-violet-500/60" />

                                </div>


                                <p className="mt-1 text-2xl font-black sm:text-3xl">

                                    #{round?.roundNumber || "----"}

                                </p>


                                {/* TIMER */}

                                <div className="relative mx-auto mt-6 h-36 w-36 sm:h-40 sm:w-40">

                                    <div
                                        className="absolute inset-0 rounded-full p-[6px] shadow-[0_0_45px_rgba(139,92,246,0.28)]"
                                        style={{
                                            background:
                                                `conic-gradient(from -90deg, #8b5cf6 ${timerProgress}%, rgba(51,65,85,0.45) ${timerProgress}% 100%)`,
                                        }}
                                    >

                                        <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#090f23]">

                                            <span className="text-4xl font-black sm:text-5xl">

                                                {timer}

                                            </span>


                                            <span className="text-xs text-slate-500">

                                                Seconds

                                            </span>

                                        </div>

                                    </div>


                                    <div className="absolute inset-2 rounded-full bg-violet-500/10 blur-xl" />

                                </div>


                                {/* STATUS */}

                                <span
                                    className={`mt-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold ${gameStopped
                                        ? "border-red-500/20 bg-red-500/10 text-red-400"
                                        : gamePaused
                                            ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
                                            : timer > 0
                                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                                                : "border-red-500/20 bg-red-500/10 text-red-400"
                                        }`}
                                >

                                    <span
                                        className={`h-1.5 w-1.5 rounded-full ${gameStopped
                                            ? "bg-red-400"
                                            : gamePaused
                                                ? "bg-yellow-400"
                                                : timer > 0
                                                    ? "bg-emerald-400"
                                                    : "bg-red-400"
                                            }`}
                                    />


                                    {gameStopped
                                        ? "Game Stopped"
                                        : gamePaused
                                            ? "Betting Paused"
                                            : timer > 0
                                                ? "Betting Open"
                                                : "Betting Closed"
                                    }

                                </span>

                            </div>


                            {/* =================================================
                                COLOR SELECTION
                            ================================================= */}

                            <div className="relative mt-9">

                                <div className="mb-5 flex items-center justify-center gap-4">

                                    <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />

                                    <h2 className="text-lg font-bold">
                                        Choose a color
                                    </h2>

                                    <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />

                                </div>


                                <div className="grid gap-3 sm:grid-cols-3">

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
                                                    disabled={
                                                        bettingDisabled
                                                    }
                                                    onClick={() =>
                                                        handleColorSelect(
                                                            color
                                                        )
                                                    }
                                                    className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${meta.bg} px-5 py-5 transition duration-200 ${meta.border} ${selected
                                                        ? `${meta.glow} scale-[1.02]`
                                                        : "border-white/10 hover:-translate-y-0.5 hover:border-white/25"
                                                        } disabled:cursor-not-allowed disabled:opacity-40`}
                                                >

                                                    <div className="absolute inset-0 bg-white/[0.02] opacity-0 transition group-hover:opacity-100" />


                                                    <span className={`relative mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full border-2 ${meta.border} ${meta.text} shadow-[0_0_20px_currentColor]`}>

                                                        <span className={`h-3 w-3 rounded-full ${meta.dot} shadow-[0_0_15px_currentColor]`} />

                                                    </span>


                                                    <span className="relative block text-base font-black tracking-wide">

                                                        {
                                                            meta.label
                                                        }

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

                                <div className="mx-auto mt-7 flex max-w-2xl items-center justify-center gap-2">

                                    {[
                                        { id: "real", label: "Real", balance: walletBalance },
                                        { id: "test", label: "Test", balance: testBalance },
                                    ].map((modeOption) => (

                                        <button
                                            key={modeOption.id}
                                            type="button"
                                            disabled={bettingDisabled}
                                            onClick={() => setWalletMode(modeOption.id)}
                                            className={`flex-1 rounded-xl border px-3 py-2.5 text-center text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                                                walletMode === modeOption.id
                                                    ? "border-violet-400 bg-violet-500/15 text-violet-200"
                                                    : "border-white/10 bg-[#0d1429] text-slate-400 hover:border-white/20"
                                            }`}
                                        >
                                            <div>{modeOption.label}</div>
                                            <div className="mt-0.5 text-[11px] font-semibold text-slate-300">
                                                ₹{Number(modeOption.balance || 0).toLocaleString("en-IN")}
                                            </div>
                                        </button>

                                    ))}

                                </div>

                            )}


                            {auth.isAuthenticated &&
                                walletMode === "real" &&
                                bonusBalance > 0 && (

                                <p className="mx-auto mt-2 max-w-2xl text-center text-[11px] text-violet-300/80">
                                    Bonus balance (₹{Number(bonusBalance).toLocaleString("en-IN")}) automatically
                                    covers up to 30% of your Real bet.
                                </p>

                            )}


                            {/* =================================================
                                BET AMOUNT
                            ================================================= */}

                            <div className="relative mx-auto mt-7 max-w-2xl">

                                <div className="mb-4 flex items-center justify-center gap-4">

                                    <span className="h-px flex-1 bg-white/10" />

                                    <h3 className="font-bold">
                                        Bet Amount
                                    </h3>

                                    <span className="h-px flex-1 bg-white/10" />

                                </div>


                                {/* PRESET AMOUNTS */}

                                <div className="grid grid-cols-5 gap-2">

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
                                                className={`rounded-xl border px-2 py-3 text-xs font-bold transition sm:text-sm ${Number(
                                                    amount
                                                ) ===
                                                    value
                                                    ? "border-violet-400 bg-violet-500/15 text-violet-200 shadow-[0_0_20px_rgba(139,92,246,0.18)]"
                                                    : "border-white/10 bg-[#0d1429] text-slate-300 hover:border-white/20 hover:bg-white/[0.05]"
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

                                <div className="mt-3 flex overflow-hidden rounded-xl border border-white/10 bg-[#050a19] focus-within:border-violet-500/60">

                                    <span className="flex items-center px-4 text-slate-500">
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
                                        className="min-w-0 flex-1 bg-transparent px-2 py-4 text-sm outline-none placeholder:text-slate-600 disabled:cursor-not-allowed"
                                    />


                                    <button
                                        type="button"
                                        disabled={
                                            timer <= 0 ||
                                            (
                                                betPlaced &&
                                                !canIncreaseBet
                                            ) ||
                                            placingBet ||
                                            activeBalance <= 0 ||
                                            gamePaused ||
                                            gameStopped
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
                                        className="m-1 rounded-lg bg-violet-600/80 px-4 text-xs font-black text-white transition hover:bg-violet-500 disabled:opacity-40"
                                    >

                                        MAX

                                    </button>

                                </div>


                                {/* AVAILABLE BALANCE */}

                                {auth.isAuthenticated && (

                                <p className="mt-2 text-center text-xs text-slate-500">

                                    Available {walletMode} Balance:

                                    <span className="font-semibold text-emerald-400">

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
                                                    gameStopped
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
                                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-500 px-5 py-4 font-bold shadow-[0_0_35px_rgba(139,92,246,0.24)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:grayscale disabled:opacity-40"
                                >

                                    <Icon
                                        name="target"
                                    />


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

                                </button>


                                {betPlaced && currentRoundBet && (

                                    <p className="mt-2 text-center text-[11px] text-slate-500">
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
                                    className={`relative mt-4 rounded-xl border px-4 py-3 text-center text-xs font-semibold ${messageType ===
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
                                                        : "border-white/10 bg-white/[0.03] text-slate-300"
                                        }`}
                                >

                                    {
                                        message
                                    }

                                </div>

                            )}


                            {/* =================================================
                                GAME INFO
                            ================================================= */}

                            <div className="relative mt-6 flex flex-wrap items-center justify-center gap-3 border-t border-white/5 pt-5">

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowRules(
                                            true
                                        )
                                    }
                                    className="text-xs text-slate-500 transition hover:text-violet-300"
                                >

                                    How to play

                                </button>


                                <span className="text-slate-700">
                                    •
                                </span>


                                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">

                                    <Icon
                                        name="shield"
                                        size={13}
                                    />

                                    Provably fair

                                </span>


                                <span className="text-slate-700">
                                    •
                                </span>


                                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">

                                    <Icon
                                        name="lock"
                                        size={13}
                                    />

                                    Secure

                                </span>

                            </div>

                        </section>


                        {/* =================================================
                            RECENT RESULTS
                        ================================================= */}

                        <section className="rounded-3xl border border-white/[0.07] bg-[#090f23]/90 p-5 shadow-2xl">

                            <div className="flex items-center justify-between">

                                <div className="flex items-center gap-2">

                                    <span className="text-violet-400">

                                        <Icon
                                            name="chart"
                                        />

                                    </span>


                                    <h2 className="font-bold">

                                        Recent Results

                                    </h2>

                                </div>


                                <span className="rounded-full bg-white/[0.04] px-2.5 py-1 text-[10px] text-slate-500">

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
                                                        className="flex items-center justify-between rounded-xl border border-white/5 bg-[#0d1429] px-3 py-3 transition hover:border-white/10"
                                                    >

                                                        <div className="flex items-center gap-3">

                                                            <span className={`h-2.5 w-2.5 rounded-full ${meta.dot} shadow-[0_0_10px_currentColor]`} />


                                                            <span className="text-xs font-medium text-slate-300">

                                                                #
                                                                {
                                                                    game.roundNumber
                                                                }

                                                            </span>

                                                        </div>


                                                        <span className={`text-xs font-bold ${meta.text}`}>

                                                            {
                                                                meta.label
                                                            }

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
                                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/5 bg-white/[0.025] py-3 text-xs font-semibold text-violet-300 transition hover:bg-white/[0.05]"
                            >

                                View Full History

                                <Icon
                                    name="arrow"
                                    size={14}
                                />

                            </button>

                        </section>


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
                        STATS
                    ================================================= */}

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                        {[
                            [
                                "Your Bets",
                                myBets.length,
                                "This account",
                                "users",
                                "text-red-400",
                            ],

                            [
                                "Total Staked",
                                `₹${totalStaked.toLocaleString("en-IN")}`,
                                "Last 20 bets",
                                "wallet",
                                "text-emerald-400",
                            ],

                            [
                                "Total Payout",
                                `₹${totalPayout.toLocaleString("en-IN")}`,
                                "Last 20 bets",
                                "transaction",
                                "text-blue-400",
                            ],

                            [
                                "Win Rate",
                                `${winRate}%`,
                                latestResult
                                    ? `Last: ${latestResult.toUpperCase()}`
                                    : "Waiting for result",
                                "chart",
                                "text-violet-400",
                            ],

                        ].map(
                            ([
                                label,
                                value,
                                sub,
                                icon,
                                iconColor,
                            ]) => (

                                <div
                                    key={
                                        label
                                    }
                                    className="rounded-2xl border border-white/[0.07] bg-[#090f23]/90 p-4 shadow-xl"
                                >

                                    <div className="flex items-center justify-between">

                                        <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] ${iconColor}`}>

                                            <Icon
                                                name={
                                                    icon
                                                }
                                            />

                                        </span>


                                        <span className="text-[11px] text-slate-500">

                                            {
                                                sub
                                            }

                                        </span>

                                    </div>


                                    <p className="mt-4 text-xs text-slate-500">

                                        {
                                            label
                                        }

                                    </p>


                                    <p className="mt-1 text-xl font-black">

                                        {
                                            value
                                        }

                                    </p>

                                </div>

                            )
                        )}

                    </div>


                    {/* =================================================
                        LOWER TABLES
                    ================================================= */}

                    <div className="mt-5 grid gap-5 xl:grid-cols-2">


                        {/* =================================================
                            MY BETS
                        ================================================= */}

                        <section
                            id="my-bets"
                            className="rounded-3xl border border-white/[0.07] bg-[#090f23]/90 p-5 shadow-2xl sm:p-6"
                        >

                            <div className="flex items-center justify-between">

                                <div>

                                    <p className="text-xs text-slate-500">

                                        Your Activity

                                    </p>


                                    <h2 className="mt-1 text-xl font-bold">

                                        My Bets

                                    </h2>

                                </div>


                                <span className="rounded-full bg-white/[0.04] px-3 py-1 text-[10px] text-slate-500">

                                    Last 20

                                </span>

                            </div>


                            <div className="mt-5 overflow-x-auto">

                                {loadingBets ? (

                                    <div className="py-8 text-center text-xs text-slate-500">

                                        Loading bets...

                                    </div>

                                ) : myBets.length === 0 ? (

                                    <div className="py-8 text-center text-xs text-slate-500">

                                        You haven&apos;t placed any bets yet.

                                    </div>

                                ) : (

                                    <table className="w-full min-w-[620px] text-left">

                                        <thead>

                                            <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-slate-600">

                                                <th className="px-3 py-3">
                                                    Round
                                                </th>

                                                <th className="px-3 py-3">
                                                    Color
                                                </th>

                                                <th className="px-3 py-3">
                                                    Amount
                                                </th>

                                                <th className="px-3 py-3">
                                                    Result
                                                </th>

                                                <th className="px-3 py-3">
                                                    Payout
                                                </th>

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


                                                        return (

                                                            <tr
                                                                key={
                                                                    bet._id
                                                                }
                                                                className="border-b border-white/[0.035] text-sm last:border-0"
                                                            >

                                                                <td className="px-3 py-4 font-bold">

                                                                    #
                                                                    {
                                                                        bet.round?.roundNumber ||
                                                                        "-"
                                                                    }

                                                                </td>


                                                                <td className="px-3 py-4">

                                                                    <span className={`inline-flex rounded-full ${meta.dot} px-2.5 py-1 text-[10px] font-black text-white`}>

                                                                        {
                                                                            meta.label
                                                                        }

                                                                    </span>

                                                                </td>


                                                                <td className="px-3 py-4 text-slate-300">

                                                                    ₹
                                                                    {Number(
                                                                        bet.amount ||
                                                                        0
                                                                    ).toLocaleString(
                                                                        "en-IN"
                                                                    )}

                                                                </td>


                                                                <td className={`px-3 py-4 text-xs font-black ${bet.result ===
                                                                    "won"
                                                                    ? "text-emerald-400"
                                                                    : bet.result ===
                                                                        "lost"
                                                                        ? "text-red-400"
                                                                        : "text-amber-400"
                                                                    }`}>

                                                                    {
                                                                        (
                                                                            bet.result ||
                                                                            "pending"
                                                                        ).toUpperCase()
                                                                    }

                                                                </td>


                                                                <td className="px-3 py-4 font-bold">

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

                                                                        <span className="text-slate-600">

                                                                            ₹0

                                                                        </span>

                                                                    )}

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

                        <section className="rounded-3xl border border-white/[0.07] bg-[#090f23]/90 p-5 shadow-2xl sm:p-6">

                            <div className="flex items-center justify-between">

                                <div>

                                    <p className="text-xs text-slate-500">

                                        Bet &amp; payout activity

                                    </p>


                                    <h2 className="mt-1 text-xl font-bold">

                                        Recent Activity

                                    </h2>

                                </div>


                                <span className="rounded-full bg-white/[0.04] px-3 py-1 text-[10px] text-slate-500">

                                    Live data

                                </span>

                            </div>


                            <div className="mt-5 space-y-2">

                                {myBets
                                    .slice(
                                        0,
                                        6
                                    )
                                    .length === 0 ? (

                                    <div className="py-8 text-center text-xs text-slate-500">

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
                                            ) => (

                                                <div
                                                    key={`activity-${bet._id}`}
                                                    className="flex items-center justify-between rounded-xl border border-white/5 bg-[#0d1429] px-3 py-3"
                                                >

                                                    <div className="flex items-center gap-3">

                                                        <span className={`flex h-8 w-8 items-center justify-center rounded-full ${bet.result ===
                                                            "won"
                                                            ? "bg-emerald-500/10 text-emerald-400"
                                                            : "bg-red-500/10 text-red-400"
                                                            }`}>

                                                            {
                                                                bet.result ===
                                                                    "won"
                                                                    ? "↑"
                                                                    : "↓"
                                                            }

                                                        </span>


                                                        <div>

                                                            <p className="text-sm font-semibold">

                                                                {
                                                                    bet.result ===
                                                                        "won"
                                                                        ? "Winning Payout"
                                                                        : "Bet Placed"
                                                                }

                                                            </p>


                                                            <p className="text-[12px] text-slate-500">

                                                                Round #
                                                                {
                                                                    bet.round?.roundNumber ||
                                                                    "-"
                                                                }

                                                            </p>

                                                        </div>

                                                    </div>


                                                    <span className={`text-sm font-black ${bet.result ===
                                                        "won"
                                                        ? "text-emerald-400"
                                                        : "text-red-400"
                                                        }`}>

                                                        {
                                                            bet.result ===
                                                                "won"
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

                                            )
                                        )

                                )}

                            </div>

                        </section>

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