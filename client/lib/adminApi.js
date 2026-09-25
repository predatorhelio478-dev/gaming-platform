const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5000/api";


/*
 * ==========================================
 * GET ADMIN TOKEN
 * ==========================================
 */

const getAdminToken = () => {

    if (typeof window === "undefined") {
        return null;
    }

    return localStorage.getItem(
        "adminToken"
    );
};


/*
 * ==========================================
 * ADMIN API REQUEST
 * ==========================================
 */

const adminRequest = async (
    endpoint,
    options = {}
) => {

    const token = getAdminToken();


    const headers = {
        "Content-Type": "application/json",

        ...(options.headers || {}),
    };


    /*
     * Add admin JWT when available.
     */

    if (token) {

        headers.Authorization =
            `Bearer ${token}`;

    }


    const response = await fetch(
        `${API_URL}${endpoint}`,
        {
            ...options,
            headers,
        }
    );

    console.log(
        "ADMIN API REQUEST",
        {
            url: `${API_URL}${endpoint}`,
            method: options.method || "GET",
            status: response.status,
        }
    );

    let data = null;


    try {

        data = await response.json();

    } catch {

        data = null;

    }


    /*
     * Token expired / unauthorized
     */

    if (
        response.status === 401 ||
        response.status === 403
    ) {

        if (
            typeof window !== "undefined"
        ) {

            localStorage.removeItem(
                "adminToken"
            );

            localStorage.removeItem(
                "admin"
            );

        }

    }


    if (!response.ok) {

        console.error(
            "ADMIN API ERROR",
            {
                url: `${API_URL}${endpoint}`,
                status: response.status,
                statusText: response.statusText,
                response: data,
            }
        );

        const apiError =
            new Error(
                data?.message ||
                data?.error ||
                `Admin API failed: ${response.status} ${response.statusText}`
            );

        apiError.status = response.status;
        apiError.data = data;

        throw apiError;

    }


    return data;
};


/*
 * ==========================================
 * ADMIN LOGIN
 * ==========================================
 */

export const adminLogin = async (
    username,
    password
) => {

    return await adminRequest(
        "/admin/auth/login",
        {
            method: "POST",

            body: JSON.stringify({
                username,
                password,
            }),
        }
    );

};


/*
 * ==========================================
 * CURRENT ADMIN
 * ==========================================
 */

export const getCurrentAdmin = async () => {

    return await adminRequest(
        "/admin/auth/me",
        {
            method: "GET",
        }
    );

};


/*
 * ==========================================
 * ADMIN LOGOUT
 * ==========================================
 */

export const adminLogout = () => {

    if (
        typeof window === "undefined"
    ) {
        return;
    }


    localStorage.removeItem(
        "adminToken"
    );

    localStorage.removeItem(
        "admin"
    );

};


/*
 * ==========================================
 * SAVE ADMIN SESSION
 * ==========================================
 */

export const saveAdminSession = (
    response
) => {

    if (
        typeof window === "undefined"
    ) {
        return;
    }


    const token =
        response?.token;


    const admin =
        response?.admin;


    if (token) {

        localStorage.setItem(
            "adminToken",
            token
        );

    }


    if (admin) {

        localStorage.setItem(
            "admin",
            JSON.stringify(admin)
        );

    }

};


/*
 * ==========================================
 * CHECK ADMIN LOGIN
 * ==========================================
 */

export const isAdminLoggedIn = () => {

    if (
        typeof window === "undefined"
    ) {
        return false;
    }


    const token =
        localStorage.getItem(
            "adminToken"
        );


    return Boolean(token);

};

// ==========================================
// START GAME
// ==========================================

export const startGame = async () => {

    return await adminRequest(
        "/admin/game/start",
        {
            method: "POST",
        }
    );

};


// ==========================================
// PAUSE GAME
// ==========================================

export const pauseGame = async () => {

    return await adminRequest(
        "/admin/game/pause",
        {
            method: "POST",
        }
    );

};


// ==========================================
// RESUME GAME
// ==========================================

export const resumeGame = async () => {

    return await adminRequest(
        "/admin/game/resume",
        {
            method: "POST",
        }
    );

};


// ==========================================
// STOP GAME
// ==========================================

export const stopGame = async () => {

    return await adminRequest(
        "/admin/game/stop",
        {
            method: "POST",
        }
    );

};


// ==========================================
// EMERGENCY STOP
// ==========================================

export const emergencyStop = async () => {

    return await adminRequest(
        "/admin/game/emergency-stop",
        {
            method: "POST",
        }
    );

};


// ==========================================
// START NEW ROUND
// ==========================================

export const startNewRound = async () => {

    return await adminRequest(
        "/admin/game/new-round",
        {
            method: "POST",
        }
    );

};


// ==========================================
// VOID ROUND
// ==========================================

export const voidCurrentRound = async () => {

    return await adminRequest(
        "/admin/game/void-round",
        {
            method: "POST",
        }
    );

};

// ==========================================
// GET GAME STATUS
// ==========================================

export const getGameStatus = async () => {
    return await adminRequest(
        "/admin/game/status",
        {
            method: "GET",
        }
    );
};

// ==========================================
// GET ROUND HISTORY
// ==========================================

// ==========================================
// GET ADMIN ROUNDS
// ==========================================

export const getAdminRounds = async ({
    page = 1,
    limit = 20,
    search = "",
    status = "all",
    result = "all",
} = {}) => {
    const params =
        new URLSearchParams();

    params.set(
        "page",
        String(page)
    );

    params.set(
        "limit",
        String(limit)
    );

    if (search) {
        params.set(
            "search",
            search
        );
    }

    if (
        status &&
        status !== "all"
    ) {
        params.set(
            "status",
            status
        );
    }

    if (
        result &&
        result !== "all"
    ) {
        params.set(
            "result",
            result
        );
    }

    return await adminRequest(
        `/admin/rounds?${params.toString()}`,
        {
            method: "GET",
        }
    );
};

// ==========================================
// GET ADMIN ROUND DETAIL
// ==========================================

export const getAdminRoundById = async (
    roundId
) => {
    if (!roundId) {
        throw new Error(
            "Round ID is required."
        );
    }

    return await adminRequest(
        `/admin/rounds/${roundId}`,
        {
            method: "GET",
        }
    );
};

// ==========================================
// GET ADMIN BETS
// ==========================================

export const getAdminBets = async ({
    page = 1,
    limit = 20,
    search = "",
    color = "all",
    result = "all",
} = {}) => {

    const params =
        new URLSearchParams();


    params.set(
        "page",
        String(page)
    );


    params.set(
        "limit",
        String(limit)
    );


    if (search) {

        params.set(
            "search",
            search
        );

    }


    if (
        color &&
        color !== "all"
    ) {

        params.set(
            "color",
            color
        );

    }


    if (
        result &&
        result !== "all"
    ) {

        params.set(
            "result",
            result
        );

    }


    return await adminRequest(
        `/admin/bets?${params.toString()}`,
        {
            method: "GET",
        }
    );

};

// ==========================================
// GET ADMIN PAYOUTS
// ==========================================

export const getAdminPayouts = async ({
    page = 1,
    limit = 20,
    search = "",
    status = "all",
} = {}) => {

    const params =
        new URLSearchParams();


    params.set(
        "page",
        String(page)
    );


    params.set(
        "limit",
        String(limit)
    );


    if (search) {

        params.set(
            "search",
            search
        );

    }


    if (
        status &&
        status !== "all"
    ) {

        params.set(
            "status",
            status
        );

    }


    return await adminRequest(
        `/admin/payouts?${params.toString()}`,
        {
            method: "GET",
        }
    );

};

// ==========================================
// RETRY ADMIN PAYOUT
// ==========================================

export const retryAdminPayout = async (
    payoutId
) => {

    return await adminRequest(
        `/admin/payouts/${payoutId}/retry`,
        {
            method: "POST",
        }
    );

};


// ==========================================
// MANUAL REVIEW ADMIN PAYOUT
// ==========================================

export const manualReviewAdminPayout =
    async (
        payoutId,
        reason = ""
    ) => {

        return await adminRequest(
            `/admin/payouts/${payoutId}/manual-review`,
            {
                method: "POST",

                body: JSON.stringify({
                    reason,
                }),
            }
        );

    };


// ==========================================
// CANCEL ADMIN PAYOUT
// ==========================================

export const cancelAdminPayout =
    async (
        payoutId,
        reason = ""
    ) => {

        return await adminRequest(
            `/admin/payouts/${payoutId}/cancel`,
            {
                method: "POST",

                body: JSON.stringify({
                    reason,
                }),
            }
        );

    };

// ==========================================
// REVERSE ADMIN PAYOUT
// ==========================================

export const reverseAdminPayout =
    async (
        payoutId,
        reason = ""
    ) => {

        return await adminRequest(
            `/admin/payouts/${payoutId}/reverse`,
            {
                method: "POST",

                body: JSON.stringify({
                    reason,
                }),
            }
        );

    };

// ==========================================
// REFUND ADMIN PAYOUT
// ==========================================

export const refundAdminPayout = async (
    payoutId,
    amount,
    reason = ""
) => {

    return await adminRequest(
        `/admin/payouts/${payoutId}/refund`,
        {
            method: "POST",

            body: JSON.stringify({
                amount,
                reason,
            }),
        }
    );

};

// ==========================================
// RESTORE ADMIN PAYOUT
// ==========================================

export const restoreAdminPayout = async (
    payoutId,
    reason = ""
) => {

    return await adminRequest(
        `/admin/payouts/${payoutId}/restore`,
        {
            method: "POST",

            body: JSON.stringify({
                reason,
            }),
        }
    );

};

// ==========================================
// GET ADMIN USERS
// ==========================================

export const getAdminUsers = async ({
    page = 1,
    limit = 20,
    search = "",
    status = "all",
    role = "all",
} = {}) => {

    const params =
        new URLSearchParams();


    params.set(
        "page",
        String(page)
    );


    params.set(
        "limit",
        String(limit)
    );


    if (search) {

        params.set(
            "search",
            search
        );

    }


    if (
        status &&
        status !== "all"
    ) {

        params.set(
            "status",
            status
        );

    }


    if (
        role &&
        role !== "all"
    ) {

        params.set(
            "role",
            role
        );

    }


    return await adminRequest(
        `/admin/users?${params.toString()}`,
        {
            method: "GET",
        }
    );

};


// ==========================================
// GET ADMIN USER STATS
// ==========================================

export const getAdminUserStats =
    async () => {

        return await adminRequest(
            "/admin/users/stats",
            {
                method: "GET",
            }
        );

    };


// ==========================================
// GET ADMIN USER DETAIL
// ==========================================

export const getAdminUserById =
    async (
        userId
    ) => {

        if (!userId) {

            throw new Error(
                "User ID is required."
            );

        }


        return await adminRequest(
            `/admin/users/${userId}`,
            {
                method: "GET",
            }
        );

    };


// ==========================================
// UPDATE ADMIN USER STATUS
// ==========================================

export const updateAdminUserStatus =
    async (
        userId,
        status
    ) => {

        if (!userId) {

            throw new Error(
                "User ID is required."
            );

        }


        if (
            ![
                "active",
                "blocked",
            ].includes(
                status
            )
        ) {

            throw new Error(
                "Invalid user status."
            );

        }


        return await adminRequest(
            `/admin/users/${userId}/status`,
            {
                method: "PATCH",

                body: JSON.stringify({

                    status,

                }),
            }
        );

    };

// ==========================================
// CREATE ADMIN USER
// ==========================================

export const createAdminUser = async (
    userData
) => {

    if (!userData) {

        throw new Error(
            "User data is required."
        );

    }


    const {
        fullName,
        username,
        email,
        mobile,
        password,
        role,
        status,
        isVerified,
    } = userData;


    if (!fullName?.trim()) {

        throw new Error(
            "Full name is required."
        );

    }


    if (!username?.trim()) {

        throw new Error(
            "Username is required."
        );

    }


    if (!email?.trim()) {

        throw new Error(
            "Email is required."
        );

    }


    if (!password) {

        throw new Error(
            "Password is required."
        );

    }


    return await adminRequest(
        "/admin/users",
        {

            method:
                "POST",

            body:
                JSON.stringify({

                    fullName:
                        fullName.trim(),

                    username:
                        username.trim(),

                    email:
                        email.trim(),

                    mobile:
                        mobile?.trim() || "",

                    password,

                    role:
                        role || "user",

                    status:
                        status || "active",

                    isVerified:
                        Boolean(
                            isVerified
                        ),

                }),

        }
    );

};


// ==========================================
// UPDATE ADMIN USER
// ==========================================

export const updateAdminUser = async (
    userId,
    userData
) => {

    if (!userId) {

        throw new Error(
            "User ID is required."
        );

    }


    if (
        !userData ||
        typeof userData !== "object"
    ) {

        throw new Error(
            "User data is required."
        );

    }


    const {
        fullName,
        username,
        email,
        mobile,
        role,
        status,
        isVerified,
    } = userData;


    if (!fullName?.trim()) {

        throw new Error(
            "Full name is required."
        );

    }


    if (!username?.trim()) {

        throw new Error(
            "Username is required."
        );

    }


    if (!email?.trim()) {

        throw new Error(
            "Email is required."
        );

    }


    return await adminRequest(
        `/admin/users/${userId}`,
        {

            method:
                "PATCH",

            body:
                JSON.stringify({

                    fullName:
                        fullName.trim(),

                    username:
                        username.trim(),

                    email:
                        email.trim(),

                    mobile:
                        mobile?.trim() || "",

                    role:
                        role || "user",

                    status:
                        status || "active",

                    isVerified:
                        Boolean(
                            isVerified
                        ),

                }),

        }
    );

};


// ==========================================
// ADJUST ADMIN USER BALANCE
// ==========================================

export const adjustAdminUserBalance =
    async (
        userId,
        amount,
        action,
        remark
    ) => {

        if (!userId) {

            throw new Error(
                "User ID is required."
            );

        }


        if (
            amount ===
            undefined ||
            amount ===
            null ||
            amount ===
            ""
        ) {

            throw new Error(
                "Amount is required."
            );

        }


        if (
            !["add", "deduct"].includes(
                action
            )
        ) {

            throw new Error(
                "Invalid balance action."
            );

        }


        if (
            !remark ||
            !remark.trim()
        ) {

            throw new Error(
                "Reason is required."
            );

        }


        const numericAmount =
            Number(amount);


        if (
            !Number.isFinite(
                numericAmount
            ) ||
            numericAmount <= 0
        ) {

            throw new Error(
                "Invalid amount."
            );

        }


        return await adminRequest(
            `/admin/users/${userId}/balance`,
            {

                method:
                    "POST",

                body:
                    JSON.stringify({

                        amount:
                            numericAmount,

                        action,

                        remark:
                            remark.trim(),

                    }),

            }
        );

    };
// ======================================================
// ADMIN WALLET APIs
// ======================================================


// ======================================================
// GET WALLET OVERVIEW
// ======================================================

export const getAdminWalletOverview =
    async () => {

        return await adminRequest(
            "/admin/wallet/overview",
            {
                method: "GET",
            }
        );

    };

// ======================================================
// GET USER WALLETS
// ======================================================

export const getAdminUserWallets =
    async ({
        page = 1,
        limit = 20,

        search = "",

        walletStatus = "all",

        transactionType = "all",

        dateFrom = "",

        dateTo = "",

        minBalance = "",

        maxBalance = "",

    } = {}) => {

        const params =
            new URLSearchParams();


        params.set(
            "page",
            String(page)
        );


        params.set(
            "limit",
            String(limit)
        );


        if (
            String(search).trim()
        ) {

            params.set(
                "search",
                String(search).trim()
            );

        }


        if (
            walletStatus &&
            walletStatus !== "all"
        ) {

            params.set(
                "walletStatus",
                String(walletStatus)
            );

        }


        if (
            transactionType &&
            transactionType !== "all"
        ) {

            params.set(
                "transactionType",
                String(transactionType)
            );

        }


        if (dateFrom) {

            params.set(
                "dateFrom",
                String(dateFrom)
            );

        }


        if (dateTo) {

            params.set(
                "dateTo",
                String(dateTo)
            );

        }


        if (
            minBalance !== "" &&
            minBalance !== null &&
            minBalance !== undefined
        ) {

            params.set(
                "minBalance",
                String(minBalance)
            );

        }


        if (
            maxBalance !== "" &&
            maxBalance !== null &&
            maxBalance !== undefined
        ) {

            params.set(
                "maxBalance",
                String(maxBalance)
            );

        }


        return await adminRequest(
            `/admin/wallet/users?${params.toString()}`,
            {
                method: "GET",
            }
        );

    };


// ======================================================
// GET SINGLE USER WALLET DETAILS
// ======================================================

export const getAdminUserWalletDetails =
    async (
        userId
    ) => {

        if (!userId) {

            throw new Error(
                "User ID is required."
            );

        }


        return await adminRequest(
            `/admin/wallet/users/${userId}`,
            {
                method: "GET",
            }
        );

    };


// ======================================================
// GET WALLET TRANSACTIONS
// ======================================================

export const getAdminWalletTransactions = async ({
    page = 1,
    limit = 20,
    search = "",
    type = "all",
    status = "all",
    userId = "",
    walletStatus = "all",
    minBalance = "",
    maxBalance = "",
    dateFrom = "",
    dateTo = "",
} = {}) => {

    const params = new URLSearchParams();

    params.set("page", String(page));
    params.set("limit", String(limit));

    if (String(search).trim()) {
        params.set("search", String(search).trim());
    }

    if (type && type !== "all") {
        params.set("type", type);
    }

    if (status && status !== "all") {
        params.set("status", status);
    }

    if (userId) {
        params.set("userId", userId);
    }

    if (walletStatus && walletStatus !== "all") {
        params.set("walletStatus", walletStatus);
    }

    if (dateFrom) {
        params.set("dateFrom", dateFrom);
    }

    if (dateTo) {
        params.set("dateTo", dateTo);
    }

    if (
        minBalance !== "" &&
        minBalance !== null &&
        minBalance !== undefined
    ) {
        params.set("minBalance", String(minBalance));
    }

    if (
        maxBalance !== "" &&
        maxBalance !== null &&
        maxBalance !== undefined
    ) {
        params.set("maxBalance", String(maxBalance));
    }

    return await adminRequest(
        `/admin/wallet/transactions?${params.toString()}`,
        {
            method: "GET",
        }
    );
};


// ======================================================
// ADJUST USER WALLET
// ======================================================

export const adjustAdminUserWallet =
    async ({
        userId,
        type,
        amount,
        remark,
    } = {}) => {

        if (!userId) {

            throw new Error(
                "User ID is required."
            );

        }


        if (
            type !==
            "admin_credit" &&
            type !==
            "admin_debit"
        ) {

            throw new Error(
                "Invalid wallet adjustment type."
            );

        }


        const numericAmount =
            Number(
                amount
            );


        if (
            !Number.isFinite(
                numericAmount
            ) ||
            numericAmount <= 0
        ) {

            throw new Error(
                "Valid amount is required."
            );

        }


        const cleanRemark =
            String(
                remark || ""
            ).trim();


        if (!cleanRemark) {

            throw new Error(
                "Adjustment reason is required."
            );

        }


        return await adminRequest(
            "/admin/wallet/adjust",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",
                },

                body: JSON.stringify({

                    userId,

                    type,

                    amount:
                        numericAmount,

                    remark:
                        cleanRemark,

                }),

            }
        );

    };


// ==========================================
// SETTINGS
// ==========================================

export const getAdminSettingsByCategory = async (
    category
) => {

    return await adminRequest(
        `/admin/settings/category/${category}`,
        {
            method: "GET",
        }
    );

};

export const updateAdminSettings = async (
    category,
    settings
) => {

    return await adminRequest(
        `/admin/settings/category/${category}`,
        {
            method: "PUT",
            body: JSON.stringify({ settings }),
        }
    );

};

export const resetAdminSettings = async (
    category
) => {

    return await adminRequest(
        `/admin/settings/category/${category}/reset`,
        {
            method: "POST",
        }
    );

};


// ==========================================
// AUDIT LOGS
// ==========================================

export const getAdminAuditLogs = async ({
    page = 1,
    limit = 20,
    search = "",
    module: moduleFilter = "",
    action = "",
    actorType = "",
    category = "",
    key = "",
    dateFrom = "",
    dateTo = "",
} = {}) => {

    const params = new URLSearchParams();

    params.set("page", String(page));
    params.set("limit", String(limit));

    if (search) params.set("search", search);
    if (moduleFilter) params.set("module", moduleFilter);
    if (action) params.set("action", action);
    if (actorType) params.set("actorType", actorType);
    if (category) params.set("category", category);
    if (key) params.set("key", key);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);

    return await adminRequest(
        `/admin/audit-logs?${params.toString()}`,
        {
            method: "GET",
        }
    );

};

export const getAdminAuditLogById = async (
    id
) => {

    return await adminRequest(
        `/admin/audit-logs/${id}`,
        {
            method: "GET",
        }
    );

};


// ==========================================
// DEACTIVATE USER (SOFT DELETE)
// ==========================================

export const deactivateAdminUser = async (
    userId
) => {

    return await adminRequest(
        `/admin/users/${userId}`,
        {
            method: "DELETE",
        }
    );

};


// ==========================================
// DEPOSIT REQUESTS
// ==========================================

export const getAdminDepositRequests = async ({
    page = 1,
    limit = 20,
    status = "all",
} = {}) => {

    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (status && status !== "all") {
        params.set("status", status);
    }

    return await adminRequest(
        `/admin/wallet/deposit-requests?${params.toString()}`,
        { method: "GET" }
    );

};

export const approveAdminDepositRequest = async (
    id,
    reviewNotes = ""
) => {

    return await adminRequest(
        `/admin/wallet/deposit-requests/${id}/approve`,
        {
            method: "POST",
            body: JSON.stringify({ reviewNotes }),
        }
    );

};

export const rejectAdminDepositRequest = async (
    id,
    reviewNotes = ""
) => {

    return await adminRequest(
        `/admin/wallet/deposit-requests/${id}/reject`,
        {
            method: "POST",
            body: JSON.stringify({ reviewNotes }),
        }
    );

};

export const reconcileAdminDepositRequest = async (
    id
) => {

    return await adminRequest(
        `/admin/wallet/deposit-requests/${id}/reconcile`,
        { method: "POST" }
    );

};

export const refundAdminDepositRequest = async (
    id,
    reason = ""
) => {

    return await adminRequest(
        `/admin/wallet/deposit-requests/${id}/refund`,
        {
            method: "POST",
            body: JSON.stringify({ reason }),
        }
    );

};

export const reconcileAdminDepositRefund = async (
    id
) => {

    return await adminRequest(
        `/admin/wallet/deposit-requests/${id}/refund/reconcile`,
        { method: "POST" }
    );

};


// ==========================================
// WITHDRAWAL REQUESTS
// ==========================================

export const getAdminWithdrawalRequests = async ({
    page = 1,
    limit = 20,
    status = "all",
} = {}) => {

    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (status && status !== "all") {
        params.set("status", status);
    }

    return await adminRequest(
        `/admin/wallet/withdrawal-requests?${params.toString()}`,
        { method: "GET" }
    );

};

export const approveAdminWithdrawalRequest = async (
    id,
    reviewNotes = ""
) => {

    return await adminRequest(
        `/admin/wallet/withdrawal-requests/${id}/approve`,
        {
            method: "POST",
            body: JSON.stringify({ reviewNotes }),
        }
    );

};

export const rejectAdminWithdrawalRequest = async (
    id,
    reviewNotes = ""
) => {

    return await adminRequest(
        `/admin/wallet/withdrawal-requests/${id}/reject`,
        {
            method: "POST",
            body: JSON.stringify({ reviewNotes }),
        }
    );

};

export const reconcileAdminWithdrawalRequest = async (
    id
) => {

    return await adminRequest(
        `/admin/wallet/withdrawal-requests/${id}/reconcile`,
        { method: "POST" }
    );

};

export const retryAdminWithdrawalRequest = async (
    id
) => {

    return await adminRequest(
        `/admin/wallet/withdrawal-requests/${id}/retry`,
        { method: "POST" }
    );

};

// ==========================================
// ADMIN NOTIFICATIONS
// ==========================================

export const getAdminNotifications = async ({
    page = 1,
    limit = 20,
} = {}) => {

    return await adminRequest(
        `/admin/notifications?page=${page}&limit=${limit}`,
        { method: "GET" }
    );

};

export const getAdminNotificationUnreadCount = async () => {

    return await adminRequest(
        "/admin/notifications/unread-count",
        { method: "GET" }
    );

};

export const markAdminNotificationRead = async (id) => {

    return await adminRequest(
        `/admin/notifications/${id}/read`,
        { method: "POST" }
    );

};

export const markAllAdminNotificationsRead = async () => {

    return await adminRequest(
        "/admin/notifications/read-all",
        { method: "POST" }
    );

};


// ==========================================
// ADMIN SUPPORT TICKETS
// ==========================================

export const getAdminSupportTickets = async ({
    page = 1,
    limit = 20,
    status = "all",
    priority = "all",
    category = "all",
    assignedAdmin = "all",
    search = "",
} = {}) => {

    const params = new URLSearchParams({
        page, limit, status, priority, category, assignedAdmin,
    });

    if (search) {
        params.set("search", search);
    }

    return await adminRequest(
        `/admin/support/tickets?${params.toString()}`,
        { method: "GET" }
    );

};

export const getAdminSupportTicketById = async (id) => {

    return await adminRequest(
        `/admin/support/tickets/${id}`,
        { method: "GET" }
    );

};

export const replyToAdminSupportTicket = async (id, message) => {

    return await adminRequest(
        `/admin/support/tickets/${id}/reply`,
        {
            method: "POST",
            body: JSON.stringify({ message }),
        }
    );

};

export const changeAdminSupportTicketStatus = async (id, status) => {

    return await adminRequest(
        `/admin/support/tickets/${id}/status`,
        {
            method: "POST",
            body: JSON.stringify({ status }),
        }
    );

};

export const changeAdminSupportTicketPriority = async (id, priority) => {

    return await adminRequest(
        `/admin/support/tickets/${id}/priority`,
        {
            method: "POST",
            body: JSON.stringify({ priority }),
        }
    );

};

export const assignAdminSupportTicket = async (id, adminId) => {

    return await adminRequest(
        `/admin/support/tickets/${id}/assign`,
        {
            method: "POST",
            body: JSON.stringify({ adminId }),
        }
    );

};

export const getAdminSupportStats = async () => {

    return await adminRequest(
        "/admin/support/stats",
        { method: "GET" }
    );

};


// ==========================================
// ADMIN FORGOT / RESET PASSWORD
// ==========================================

export const adminForgotPassword = async (username) => {

    return await adminRequest(
        "/admin/auth/forgot-password",
        {
            method: "POST",
            body: JSON.stringify({ username }),
        }
    );

};

export const adminResetPassword = async (payload) => {

    return await adminRequest(
        "/admin/auth/reset-password",
        {
            method: "POST",
            body: JSON.stringify(payload),
        }
    );

};


// ==========================================
// PERMANENTLY DELETE USER (admin/super_admin only)
// ==========================================

export const deleteAdminUser = async (userId) => {

    return await adminRequest(
        `/admin/users/${userId}/permanent`,
        { method: "DELETE" }
    );

};


// ==========================================
// ADMIN-INITIATED PASSWORD CHANGE (for a normal user)
// ==========================================

export const changeAdminUserPassword = async (userId, newPassword) => {

    return await adminRequest(
        `/admin/users/${userId}/password`,
        {
            method: "POST",
            body: JSON.stringify({ newPassword }),
        }
    );

};


// ==========================================
// FAQ MANAGEMENT
// ==========================================

export const getAdminFaqCategories = async () => {
    return await adminRequest("/admin/faq/categories", { method: "GET" });
};

export const createFaqCategory = async (payload) => {
    return await adminRequest("/admin/faq/categories", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};

export const updateFaqCategory = async (id, payload) => {
    return await adminRequest(`/admin/faq/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
};

export const deleteFaqCategory = async (id) => {
    return await adminRequest(`/admin/faq/categories/${id}`, { method: "DELETE" });
};

export const getAdminFaqItems = async (categoryId) => {
    const query = categoryId ? `?category=${categoryId}` : "";
    return await adminRequest(`/admin/faq/items${query}`, { method: "GET" });
};

export const createFaqItem = async (payload) => {
    return await adminRequest("/admin/faq/items", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};

export const updateFaqItem = async (id, payload) => {
    return await adminRequest(`/admin/faq/items/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
};

export const deleteFaqItem = async (id) => {
    return await adminRequest(`/admin/faq/items/${id}`, { method: "DELETE" });
};


// ==========================================
// EMAIL TEMPLATE MANAGEMENT
// ==========================================

export const getAdminEmailTemplates = async () => {
    return await adminRequest("/admin/email-templates", { method: "GET" });
};

export const getAdminEmailTemplate = async (key) => {
    return await adminRequest(`/admin/email-templates/${key}`, { method: "GET" });
};

export const previewAdminEmailTemplate = async (key) => {
    return await adminRequest(`/admin/email-templates/${key}/preview`, { method: "GET" });
};

export const updateAdminEmailTemplate = async (key, payload) => {
    return await adminRequest(`/admin/email-templates/${key}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
};


// ==========================================
// ADMIN ACCOUNT MANAGEMENT (super_admin/admin/operator
// accounts themselves - distinct from getAdminUsers()
// above, which manages the User/player collection)
// ==========================================

export const getAdminAdmins = async ({ page = 1, limit = 20, search = "", role = "all" } = {}) => {

    const params = new URLSearchParams();

    params.set("page", String(page));
    params.set("limit", String(limit));

    if (search) params.set("search", search);
    if (role && role !== "all") params.set("role", role);

    return await adminRequest(`/admin/admins?${params.toString()}`, { method: "GET" });

};

export const createAdminAccount = async (payload) => {
    return await adminRequest("/admin/admins", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};

export const updateAdminAccount = async (id, payload) => {
    return await adminRequest(`/admin/admins/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
};

export const deactivateAdminAccount = async (id) => {
    return await adminRequest(`/admin/admins/${id}`, { method: "DELETE" });
};


// ==========================================
// MANUAL USER EMAIL/MOBILE VERIFICATION
// (Super Admin only - enforced server-side)
// ==========================================

export const manuallyVerifyUserEmail = async (userId) => {
    return await adminRequest(`/admin/users/${userId}/verify-email`, { method: "POST" });
};

export const manuallyVerifyUserMobile = async (userId) => {
    return await adminRequest(`/admin/users/${userId}/verify-mobile`, { method: "POST" });
};
