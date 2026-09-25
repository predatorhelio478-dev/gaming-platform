const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5000/api";


// ======================================================
// GET AUTH TOKEN
// ======================================================

const getToken = () => {

    if (
        typeof window === "undefined"
    ) {
        return null;
    }

    return localStorage.getItem(
        "token"
    );

};


// ======================================================
// GET CURRENT PATH
// ======================================================

const getCurrentPath = () => {

    if (
        typeof window === "undefined"
    ) {
        return "/";
    }

    return (
        window.location.pathname +
        window.location.search +
        window.location.hash
    );

};


// ======================================================
// HANDLE SESSION EXPIRY
// ======================================================

export const handleSessionExpiry = () => {

    if (
        typeof window === "undefined"
    ) {
        return;
    }


    /*
     * Remove expired authentication.
     */

    localStorage.removeItem(
        "token"
    );

    localStorage.removeItem(
        "user"
    );


    /*
     * Current page.
     */

    const currentPath =
        getCurrentPath();


    /*
     * Do not create redirect loop.
     */

    if (
        currentPath === "/login" ||
        currentPath.startsWith(
            "/login?"
        )
    ) {
        return;
    }


    /*
     * Send user to login page
     * with current page as return URL.
     */

    const redirectUrl =
        `/login?redirect=${encodeURIComponent(
            currentPath
        )}`;


    window.location.replace(
        redirectUrl
    );

};


// ======================================================
// COMMON API REQUEST
// ======================================================

const apiRequest = async (
    endpoint,
    options = {}
) => {

    const token =
        getToken();


    const headers = {

        "Content-Type":
            "application/json",

        ...(options.headers || {}),

    };


    /*
     * Add JWT token.
     */

    if (token) {

        headers.Authorization =
            `Bearer ${token}`;

    }


    const response =
        await fetch(
            `${API_URL}${endpoint}`,
            {
                ...options,
                headers,
            }
        );


    /*
     * Read JSON safely.
     */

    const data =
        await response
            .json()
            .catch(
                () => null
            );


    /*
     * ==================================================
     * SESSION EXPIRED
     * ==================================================
     */

    if (
        response.status === 401 &&
        typeof window !== "undefined"
    ) {

        const message =
            data?.message ||
            "";


        /*
         * Backend explicitly tells us
         * that JWT/session expired.
         */

        if (
            message ===
            "Token expired." ||
            message ===
            "Unauthorized" ||
            message ===
            "Invalid Token"
        ) {

            handleSessionExpiry();

        }

    }


    /*
     * ==================================================
     * API ERROR
     * ==================================================
     */

    if (
        !response.ok
    ) {

        const error =
            new Error(
                data?.message ||
                "Something went wrong"
            );


        error.status =
            response.status;


        error.data =
            data;


        throw error;

    }


    return data;

};


// ======================================================
// AUTH APIs
// ======================================================

export const loginUser =
    async (
        payload
    ) => {

        return await apiRequest(
            "/auth/login",
            {

                method:
                    "POST",

                body:
                    JSON.stringify(
                        payload
                    ),

            }
        );

    };


export const registerUser =
    async (
        payload
    ) => {

        return await apiRequest(
            "/auth/register",
            {

                method:
                    "POST",

                body:
                    JSON.stringify(
                        payload
                    ),

            }
        );

    };


// ======================================================
// WALLET APIs
// ======================================================

export const getWallet =
    async () => {

        return await apiRequest(
            "/wallet",
            {
                method: "GET",
            }
        );

    };


// ======================================================
// PUBLIC SETTINGS (no auth required)
// ======================================================

export const getPublicSettings =
    async () => {

        return await apiRequest(
            "/settings/public",
            {
                method: "GET",
            }
        );

    };


// ======================================================
// GAME APIs
// ======================================================

export const getCurrentRound =
    async () => {

        return await apiRequest(
            "/game/current",
            {
                method: "GET",
            }
        );

    };


// REST fallback used by the color-prediction page's hybrid
// realtime client (see lib/hybridGameClient.js) when Socket.IO
// is unavailable - mirrors the "game_state" socket event.
export const getGameStatus =
    async () => {

        return await apiRequest(
            "/game/status",
            {
                method: "GET",
            }
        );

    };


export const getGameHistory =
    async () => {

        return await apiRequest(
            "/game/history",
            {
                method: "GET",
            }
        );

    };


export const getGameHistoryPaginated =
    async (
        { page = 1, limit = 20 } = {}
    ) => {

        return await apiRequest(
            `/game/history/paginated?page=${page}&limit=${limit}`,
            {
                method: "GET",
            }
        );

    };


// ======================================================
// BET HISTORY
// ======================================================

export const getMyBets =
    async (
        { page = 1, limit = 20, color, result, search, dateFrom, dateTo } = {}
    ) => {

        const params = new URLSearchParams({ page, limit });

        if (color && color !== "all") params.set("color", color);
        if (result && result !== "all") params.set("result", result);
        if (search) params.set("search", search);
        if (dateFrom) params.set("dateFrom", dateFrom);
        if (dateTo) params.set("dateTo", dateTo);

        return await apiRequest(
            `/bets/history?${params.toString()}`,
            {
                method: "GET",
            }
        );

    };


// ======================================================
// BETTING
// ======================================================

export const placeBet =
    async (
        color,
        amount,
        mode = "real"
    ) => {

        return await apiRequest(
            "/bets",
            {

                method:
                    "POST",

                body:
                    JSON.stringify({

                        color,

                        amount,

                        mode,

                    }),

            }
        );

    };


export const increaseBet =
    async (
        color,
        amount
    ) => {

        return await apiRequest(
            "/bets/increase",
            {

                method:
                    "POST",

                body:
                    JSON.stringify({

                        color,

                        amount,

                    }),

            }
        );

    };


// ======================================================
// TRANSACTIONS
// ======================================================

export const getTransactions =
    async (
        params = {}
    ) => {

        const cleanParams = Object.fromEntries(
            Object.entries(params).filter(
                ([, value]) => value !== undefined && value !== null && value !== "" && value !== "all"
            )
        );

        const query =
            new URLSearchParams(
                cleanParams
            ).toString();

        return await apiRequest(
            `/wallet/transactions${query ? `?${query}` : ""}`,
            {
                method: "GET",
            }
        );

    };


// ======================================================
// REFERRALS
// ======================================================

export const getReferralInfo =
    async () => {

        return await apiRequest(
            "/wallet/referral",
            {
                method: "GET",
            }
        );

    };

export const getReferredUsers =
    async (
        { page = 1, limit = 20 } = {}
    ) => {

        return await apiRequest(
            `/wallet/referral/users?page=${page}&limit=${limit}`,
            {
                method: "GET",
            }
        );

    };


// ======================================================
// DEPOSIT REQUESTS
// ======================================================

export const createDepositRequest =
    async (
        payload
    ) => {

        return await apiRequest(
            "/wallet/deposit-requests",
            {
                method: "POST",
                body: JSON.stringify(payload),
            }
        );

    };


// ======================================================
// RAZORPAY DEPOSIT (REAL MONEY)
// ======================================================

export const createRazorpayOrder =
    async (
        amount
    ) => {

        return await apiRequest(
            "/wallet/deposit/razorpay/order",
            {
                method: "POST",
                body: JSON.stringify({ amount }),
            }
        );

    };


export const verifyRazorpayPayment =
    async (
        payload
    ) => {

        return await apiRequest(
            "/wallet/deposit/razorpay/verify",
            {
                method: "POST",
                body: JSON.stringify(payload),
            }
        );

    };


export const getMyDepositRequests =
    async (
        params = {}
    ) => {

        const cleanParams = Object.fromEntries(
            Object.entries(params).filter(
                ([, value]) => value !== undefined && value !== null && value !== "" && value !== "all"
            )
        );

        const query =
            new URLSearchParams(
                cleanParams
            ).toString();

        return await apiRequest(
            `/wallet/deposit-requests${query ? `?${query}` : ""}`,
            {
                method: "GET",
            }
        );

    };


// ======================================================
// WITHDRAWAL REQUESTS
// ======================================================

export const createWithdrawalRequest =
    async (
        payload
    ) => {

        return await apiRequest(
            "/wallet/withdrawal-requests",
            {
                method: "POST",
                body: JSON.stringify(payload),
            }
        );

    };


export const getMyWithdrawalRequests =
    async (
        params = {}
    ) => {

        const cleanParams = Object.fromEntries(
            Object.entries(params).filter(
                ([, value]) => value !== undefined && value !== null && value !== "" && value !== "all"
            )
        );

        const query =
            new URLSearchParams(
                cleanParams
            ).toString();

        return await apiRequest(
            `/wallet/withdrawal-requests${query ? `?${query}` : ""}`,
            {
                method: "GET",
            }
        );

    };


// ======================================================
// OTP (EMAIL / MOBILE VERIFICATION)
// ======================================================

export const requestOtp =
    async (
        payload
    ) => {

        return await apiRequest(
            "/otp/request",
            {
                method: "POST",
                body: JSON.stringify(payload),
            }
        );

    };


export const verifyOtp =
    async (
        payload
    ) => {

        return await apiRequest(
            "/otp/verify",
            {
                method: "POST",
                body: JSON.stringify(payload),
            }
        );

    };


// ======================================================
// EMAIL-NOT-VERIFIED LOGIN RECOVERY (no session required)
// ======================================================

export const resendVerificationOtp =
    async (
        payload
    ) => {

        return await apiRequest(
            "/auth/resend-verification",
            {
                method: "POST",
                body: JSON.stringify(payload),
            }
        );

    };


export const verifyAndLogin =
    async (
        payload
    ) => {

        return await apiRequest(
            "/auth/verify-login",
            {
                method: "POST",
                body: JSON.stringify(payload),
            }
        );

    };


// ======================================================
// PROFILE / ACCOUNT SETTINGS
// ======================================================

export const updateMyProfile =
    async (
        payload
    ) => {

        return await apiRequest(
            "/users/me",
            {
                method: "PATCH",
                body: JSON.stringify(payload),
            }
        );

    };

export const requestEmailChange =
    async (
        payload
    ) => {

        return await apiRequest(
            "/users/me/email/change",
            {
                method: "POST",
                body: JSON.stringify(payload),
            }
        );

    };

export const requestMobileChange =
    async (
        payload
    ) => {

        return await apiRequest(
            "/users/me/mobile/change",
            {
                method: "POST",
                body: JSON.stringify(payload),
            }
        );

    };

export const changeMyPassword =
    async (
        payload
    ) => {

        return await apiRequest(
            "/users/me/password",
            {
                method: "POST",
                body: JSON.stringify(payload),
            }
        );

    };

// ======================================================
// NOTIFICATIONS
// ======================================================

export const getMyNotifications =
    async (
        { page = 1, limit = 20 } = {}
    ) => {

        return await apiRequest(
            `/notifications?page=${page}&limit=${limit}`,
            {
                method: "GET",
            }
        );

    };

export const getMyNotificationUnreadCount =
    async () => {

        return await apiRequest(
            "/notifications/unread-count",
            {
                method: "GET",
            }
        );

    };

export const markNotificationRead =
    async (
        id
    ) => {

        return await apiRequest(
            `/notifications/${id}/read`,
            {
                method: "POST",
            }
        );

    };

export const markAllNotificationsRead =
    async () => {

        return await apiRequest(
            "/notifications/read-all",
            {
                method: "POST",
            }
        );

    };


// ======================================================
// SUPPORT TICKETS (USER)
// ======================================================

export const createSupportTicket =
    async (
        payload
    ) => {

        return await apiRequest(
            "/support/tickets",
            {
                method: "POST",
                body: JSON.stringify(payload),
            }
        );

    };

export const getMySupportTickets =
    async (
        { page = 1, limit = 20, status = "all" } = {}
    ) => {

        const params = new URLSearchParams({ page, limit, status });

        return await apiRequest(
            `/support/tickets?${params.toString()}`,
            {
                method: "GET",
            }
        );

    };

export const getMySupportTicketById =
    async (
        id
    ) => {

        return await apiRequest(
            `/support/tickets/${id}`,
            {
                method: "GET",
            }
        );

    };

export const replyToMySupportTicket =
    async (
        id,
        message
    ) => {

        return await apiRequest(
            `/support/tickets/${id}/reply`,
            {
                method: "POST",
                body: JSON.stringify({ message }),
            }
        );

    };

export const closeMySupportTicket =
    async (
        id
    ) => {

        return await apiRequest(
            `/support/tickets/${id}/close`,
            {
                method: "POST",
            }
        );

    };

export const reopenMySupportTicket =
    async (
        id
    ) => {

        return await apiRequest(
            `/support/tickets/${id}/reopen`,
            {
                method: "POST",
            }
        );

    };


// ======================================================
// FORGOT / RESET PASSWORD (USER)
// ======================================================

export const forgotPassword =
    async (
        identifier
    ) => {

        return await apiRequest(
            "/auth/forgot-password",
            {
                method: "POST",
                body: JSON.stringify({ identifier }),
            }
        );

    };

export const resetPassword =
    async (
        payload
    ) => {

        return await apiRequest(
            "/auth/reset-password",
            {
                method: "POST",
                body: JSON.stringify(payload),
            }
        );

    };


// ======================================================
// FAQ (public)
// ======================================================

export const getFaq =
    async () => {

        return await apiRequest(
            "/faq",
            {
                method: "GET",
            }
        );

    };


// ======================================================
// LEADERBOARD
// ======================================================

export const getLeaderboard =
    async (
        { page = 1, limit = 20 } = {}
    ) => {

        return await apiRequest(
            `/leaderboard?page=${page}&limit=${limit}`,
            {
                method: "GET",
            }
        );

    };
