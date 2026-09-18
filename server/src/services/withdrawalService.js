const WithdrawalRequest =
    require("../models/WithdrawalRequest");

const User =
    require("../models/User");

const walletService =
    require("./walletService");

const settingsService =
    require("./settingsService");

const {
    isRazorpayXConfigured,
    getRazorpayXClient,
    getRazorpayXAccountNumber,
} = require("../config/razorpay");

const { createAuditLog } =
    require("./auditLogService");

const notificationService =
    require("./notificationService");


const DEFAULT_MIN_REAL_BALANCE_FOR_WITHDRAWAL = 50;


// ==========================================================
// CREATE WITHDRAWAL REQUEST
// ==========================================================
//
// Funds are moved out of spendable `balance` into
// `lockedBalance` immediately (via walletService.
// holdForWithdrawal), so the same money can never also be
// bet/spent while the request is being processed. Eligibility
// is computed ONLY from real `balance` - never balance +
// testBalance or balance + bonusBalance.
//
// `payoutTarget` is optional structured data
// ({ upiId } or { bankAccountNumber, bankIfsc }) needed ONLY
// when automatic payouts are enabled - manual mode only ever
// needs the human-readable `payoutDetails` string, unchanged.
// ==========================================================

const createWithdrawalRequest = async (
    userId,
    amount,
    payoutMethod,
    payoutDetails,
    payoutTarget = {}
) => {

    // ======================================================
    // VERIFICATION GATE
    // ======================================================
    //
    // Enforced here (not just in the frontend) on every
    // single withdrawal attempt - a UI checkbox is never
    // proof of anything.

    const user =
        await User.findById(userId).select(
            "status isDeleted emailVerified mobileVerified"
        );

    if (!user) {

        throw new Error(
            "User not found."
        );

    }

    if (user.status !== "active" || user.isDeleted) {

        throw new Error(
            "Your account is not active."
        );

    }

    if (!user.emailVerified) {

        throw Object.assign(
            new Error("Please verify your email before withdrawing."),
            { code: "EMAIL_NOT_VERIFIED" }
        );

    }

    if (!user.mobileVerified) {

        throw Object.assign(
            new Error("Please verify your mobile number before withdrawing."),
            { code: "MOBILE_NOT_VERIFIED" }
        );

    }


    const withdrawalSettings =
        await settingsService.getValues(
            "payment",
            [
                "withdrawal_enabled",
                "minimum_withdrawal",
                "maximum_withdrawal",
                "minimum_real_balance_for_withdrawal",
                "withdrawal_mode",
            ]
        );

    if (withdrawalSettings.withdrawal_enabled !== true) {

        throw new Error(
            "Withdrawals are currently disabled."
        );

    }

    const numericAmount =
        Number(amount);

    if (
        !Number.isFinite(numericAmount) ||
        numericAmount <= 0
    ) {

        throw new Error(
            "Invalid withdrawal amount."
        );

    }

    const minimumWithdrawal =
        Number(withdrawalSettings.minimum_withdrawal);

    const maximumWithdrawal =
        Number(withdrawalSettings.maximum_withdrawal);

    if (
        Number.isFinite(minimumWithdrawal) &&
        numericAmount < minimumWithdrawal
    ) {

        throw new Error(
            `Minimum withdrawal amount is ${minimumWithdrawal}.`
        );

    }

    if (
        Number.isFinite(maximumWithdrawal) &&
        numericAmount > maximumWithdrawal
    ) {

        throw new Error(
            `Maximum withdrawal amount is ${maximumWithdrawal}.`
        );

    }

    const cleanDetails =
        String(payoutDetails || "").trim();

    if (!cleanDetails) {

        throw new Error(
            "Payout details (bank/UPI) are required."
        );

    }

    const withdrawalMode =
        withdrawalSettings.withdrawal_mode === "automatic"
            ? "automatic"
            : "manual";

    if (withdrawalMode === "automatic") {

        if (
            !payoutTarget?.upiId &&
            !(payoutTarget?.bankAccountNumber && payoutTarget?.bankIfsc)
        ) {

            throw new Error(
                "A UPI ID, or bank account number + IFSC, is required for automatic payouts."
            );

        }

    }

    // ======================================================
    // ONE PENDING REQUEST AT A TIME (spam / abuse guard)
    // ======================================================

    const existingPending =
        await WithdrawalRequest.findOne({
            user: userId,
            status: "pending",
        });

    if (existingPending) {

        throw new Error(
            "You already have a pending withdrawal request."
        );

    }

    // ======================================================
    // REAL-BALANCE-ONLY ELIGIBILITY
    // ======================================================

    const wallet =
        await walletService.getWallet(userId);

    if (!wallet) {

        throw new Error(
            "Wallet not found."
        );

    }

    const minimumRealBalance =
        Number(
            withdrawalSettings.minimum_real_balance_for_withdrawal
        ) || DEFAULT_MIN_REAL_BALANCE_FOR_WITHDRAWAL;

    const realBalance =
        Number(wallet.balance || 0);

    if (realBalance < minimumRealBalance) {

        throw new Error(
            `A minimum real balance of ${minimumRealBalance} is required before withdrawing.`
        );

    }

    if (realBalance < numericAmount) {

        throw new Error(
            "Insufficient real balance for this withdrawal."
        );

    }

    // ======================================================
    // HOLD FUNDS + CREATE REQUEST
    // ======================================================

    await walletService.holdForWithdrawal(
        userId,
        numericAmount,
        "Withdrawal request submitted"
    );

    let request;

    try {

        request =
            await WithdrawalRequest.create({
                user: userId,
                amount: numericAmount,
                payoutMethod: String(payoutMethod || "bank_transfer").trim(),
                payoutDetails: cleanDetails,
                mode: withdrawalMode,
                upiId: payoutTarget?.upiId || null,
                bankAccountNumber: payoutTarget?.bankAccountNumber || null,
                bankIfsc: payoutTarget?.bankIfsc || null,
            });

    } catch (error) {

        // Roll back the hold if the request record couldn't be created.
        await walletService
            .refundWithdrawalHold(
                userId,
                numericAmount,
                "Withdrawal request creation failed - hold released"
            )
            .catch(() => {});

        throw error;

    }

    notificationService
        .notify(
            userId,
            "withdrawal",
            "Withdrawal request submitted",
            `Your withdrawal request for ₹${numericAmount} has been submitted.`,
            { withdrawalRequestId: String(request._id) }
        )
        .catch(() => {});

    if (withdrawalMode === "manual") {

        notificationService
            .notifyAdmins(
                "withdrawal",
                "New withdrawal request",
                `A withdrawal request for ₹${numericAmount} is awaiting review.`,
                { withdrawalRequestId: String(request._id), userId: String(userId) }
            )
            .catch(() => {});

    }

    if (withdrawalMode === "automatic") {

        // Best-effort from the caller's point of view: if the
        // gateway call itself fails unexpectedly here (not
        // handled inside initiateRazorpayPayout's own
        // try/catch), the request still exists in "pending"
        // with funds held - admin reconciliation covers it.
        // The withdrawal REQUEST was still created
        // successfully, so we don't throw from here.

        await initiateRazorpayPayout(request)
            .catch((error) => {

                console.error(
                    "Automatic payout initiation error:",
                    error.message
                );

            });

    }

    return request;

};


// ==========================================================
// INITIATE RAZORPAYX PAYOUT
// ==========================================================
//
// Creates a Contact + Fund Account + Payout for this
// withdrawal request. Uses the request's own _id as the
// idempotency key, so a retry after an uncertain network
// failure can't create a second payout for the same request.
// ==========================================================

const initiateRazorpayPayout = async (
    request
) => {

    if (!(await isRazorpayXConfigured())) {

        // Automatic mode was selected but RazorpayX isn't
        // actually configured yet - fail safe: release the
        // hold rather than leaving the user's money stuck
        // with no path forward.

        await walletService.refundWithdrawalHold(
            request.user,
            request.amount,
            "Automatic payouts are not configured - withdrawal could not be processed"
        );

        request.status = "rejected";
        request.gatewayStatus = "failed";
        request.reviewNotes = "Automatic payouts are not configured.";
        request.reviewedAt = new Date();

        await request.save();

        return request;

    }

    const client =
        await getRazorpayXClient();

    const user =
        await User.findById(request.user).select(
            "fullName email mobile"
        );

    try {

        // ==================================================
        // CONTACT
        // ==================================================

        const contactResponse =
            await client.post("/contacts", {
                name: user?.fullName || "Player",
                email: user?.email || undefined,
                contact: user?.mobile || undefined,
                type: "customer",
                reference_id: String(request.user),
            });

        const contactId =
            contactResponse.data.id;

        // ==================================================
        // FUND ACCOUNT
        // ==================================================

        const fundAccountPayload =
            request.upiId
                ? {
                    contact_id: contactId,
                    account_type: "vpa",
                    vpa: { address: request.upiId },
                }
                : {
                    contact_id: contactId,
                    account_type: "bank_account",
                    bank_account: {
                        name: user?.fullName || "Player",
                        ifsc: request.bankIfsc,
                        account_number: request.bankAccountNumber,
                    },
                };

        const fundAccountResponse =
            await client.post("/fund_accounts", fundAccountPayload);

        const fundAccountId =
            fundAccountResponse.data.id;

        // ==================================================
        // PAYOUT
        // ==================================================

        const payoutResponse =
            await client.post(
                "/payouts",
                {
                    account_number: getRazorpayXAccountNumber(),
                    fund_account_id: fundAccountId,
                    amount: Math.round(request.amount * 100), // paise
                    currency: "INR",
                    mode: request.upiId ? "UPI" : "IMPS",
                    purpose: "payout",
                    queue_if_low_balance: true,
                    reference_id: String(request._id),
                    narration: "Wallet withdrawal",
                },
                {
                    headers: {
                        "X-Payout-Idempotency": String(request._id),
                    },
                }
            );

        const payout =
            payoutResponse.data;

        request.razorpayContactId = contactId;
        request.razorpayFundAccountId = fundAccountId;
        request.razorpayPayoutId = payout.id;
        request.gatewayStatus = payout.status;
        request.gatewayResponse = {
            id: payout.id,
            status: payout.status,
            mode: payout.mode,
            utr: payout.utr || null,
        };

        await request.save();

        await createAuditLog({
            actorType: "system",
            action: "withdrawal.payout_initiated",
            module: "wallet",
            key: String(request._id),
            newValue: payout.status,
            metadata: {
                userId: String(request.user),
                razorpayPayoutId: payout.id,
            },
        }).catch(() => {});

        // Some UPI payouts can already be terminal by the
        // time the create call returns.

        if (payout.status === "processed") {

            return await finalizeWithdrawalSuccess(request);

        }

        if (
            payout.status === "failed" ||
            payout.status === "rejected" ||
            payout.status === "cancelled"
        ) {

            return await finalizeWithdrawalFailure(
                request,
                `Payout ${payout.status} by gateway`
            );

        }

        return request;

    } catch (error) {

        const gatewayRespondedWithError =
            Boolean(error?.response?.data);

        if (gatewayRespondedWithError) {

            // A clear rejection (bad account details, etc.) -
            // safe to release the hold immediately.

            const reason =
                error.response.data?.error?.description ||
                "Payout could not be created.";

            return await finalizeWithdrawalFailure(request, reason);

        }

        // Network error / timeout - genuinely uncertain
        // whether Razorpay created the payout or not. DO NOT
        // guess. Keep the hold, mark for reconciliation.

        request.gatewayStatus = "unknown";

        await request.save();

        await createAuditLog({
            actorType: "system",
            action: "withdrawal.payout_uncertain",
            module: "wallet",
            key: String(request._id),
            metadata: {
                userId: String(request.user),
                error: error.message,
            },
        }).catch(() => {});

        notificationService
            .notifyAdmins(
                "withdrawal",
                "Payout status uncertain - needs reconciliation",
                `Withdrawal ${request._id} for ₹${request.amount} could not be confirmed with the gateway (${error.message}). Please reconcile.`,
                { withdrawalRequestId: String(request._id), userId: String(request.user) }
            )
            .catch(() => {});

        throw error;

    }

};


// ==========================================================
// FINALIZE WITHDRAWAL - SUCCESS (payout confirmed processed)
// ==========================================================

const finalizeWithdrawalSuccess = async (
    request
) => {

    if (request.status !== "pending") {

        return request;

    }

    await walletService.releaseWithdrawalHold(
        request.user,
        request.amount
    );

    request.status = "approved";
    request.gatewayStatus = "processed";
    request.reviewedAt = new Date();

    await request.save();

    await createAuditLog({
        actorType: "system",
        action: "withdrawal.payout_success",
        module: "wallet",
        key: String(request._id),
        newValue: request.amount,
        metadata: {
            userId: String(request.user),
            razorpayPayoutId: request.razorpayPayoutId,
        },
    }).catch(() => {});

    notificationService
        .notify(
            request.user,
            "withdrawal",
            "Withdrawal successful",
            `Your withdrawal of ₹${request.amount} has been processed successfully.`,
            { withdrawalRequestId: String(request._id) }
        )
        .catch(() => {});

    return request;

};


// ==========================================================
// FINALIZE WITHDRAWAL - FAILURE (release the hold)
// ==========================================================

const finalizeWithdrawalFailure = async (
    request,
    reason
) => {

    if (request.status !== "pending") {

        return request;

    }

    const walletResult =
        await walletService.refundWithdrawalHold(
            request.user,
            request.amount,
            `Payout failed: ${reason}`
        );

    request.status = "rejected";
    request.gatewayStatus =
        request.gatewayStatus === "unknown"
            ? "failed"
            : request.gatewayStatus;
    request.reviewNotes = reason;
    request.reviewedAt = new Date();
    request.transactionId = walletResult.transactionId;

    await request.save();

    await createAuditLog({
        actorType: "system",
        action: "withdrawal.payout_failed",
        module: "wallet",
        key: String(request._id),
        metadata: {
            userId: String(request.user),
            reason,
        },
    }).catch(() => {});

    notificationService
        .notify(
            request.user,
            "withdrawal",
            "Withdrawal failed",
            `Your withdrawal of ₹${request.amount} could not be completed. The held amount has been released back to your balance.${reason ? ` ${reason}` : ""}`,
            { withdrawalRequestId: String(request._id) }
        )
        .catch(() => {});

    notificationService
        .notifyAdmins(
            "withdrawal",
            "Payout failed",
            `Automatic payout for withdrawal ${request._id} failed: ${reason}`,
            { withdrawalRequestId: String(request._id), userId: String(request.user) }
        )
        .catch(() => {});

    return request;

};


// ==========================================================
// HANDLE PAYOUT WEBHOOK (payout.processed / .failed / .reversed)
// ==========================================================
//
// Guards on the request's CURRENT status so a redelivered
// webhook is always a safe no-op.
// ==========================================================

const handlePayoutWebhook = async (
    razorpayPayoutId,
    outcome, // "processed" | "failed" | "reversed"
    payoutEntity
) => {

    const request =
        await WithdrawalRequest.findOne({ razorpayPayoutId });

    if (!request) {

        console.warn(
            "[withdrawalService] Webhook for unknown payout:",
            razorpayPayoutId
        );

        return null;

    }

    if (request.status !== "pending") {

        // Already resolved - idempotent no-op.

        return request;

    }

    if (outcome === "processed") {

        return await finalizeWithdrawalSuccess(request);

    }

    return await finalizeWithdrawalFailure(
        request,
        `Payout ${outcome}${payoutEntity?.failure_reason ? `: ${payoutEntity.failure_reason}` : ""}`
    );

};


// ==========================================================
// ADMIN: RECONCILE A STUCK/UNCERTAIN PAYOUT
// ==========================================================

const reconcileWithdrawalPayout = async (
    requestId
) => {

    if (!(await isRazorpayXConfigured())) {

        throw new Error(
            "Automatic payouts are not configured."
        );

    }

    const request =
        await WithdrawalRequest.findById(requestId);

    if (!request) {

        throw new Error(
            "Withdrawal request not found."
        );

    }

    if (!request.razorpayPayoutId) {

        throw new Error(
            "This withdrawal has no associated payout to reconcile - use retry instead."
        );

    }

    if (request.status !== "pending") {

        return request;

    }

    const client =
        await getRazorpayXClient();

    const response =
        await client.get(`/payouts/${request.razorpayPayoutId}`);

    const payout =
        response.data;

    request.gatewayStatus = payout.status;

    if (payout.status === "processed") {

        return await finalizeWithdrawalSuccess(request);

    }

    if (
        payout.status === "failed" ||
        payout.status === "rejected" ||
        payout.status === "cancelled" ||
        payout.status === "reversed"
    ) {

        return await finalizeWithdrawalFailure(
            request,
            `Reconciled as ${payout.status}`
        );

    }

    await request.save();

    return request;

};


// ==========================================================
// ADMIN: RETRY A NEVER-CONFIRMED PAYOUT
// ==========================================================
//
// Only meaningful when no payout was ever confirmed created
// at Razorpay's end (gatewayStatus "unknown" with no
// razorpayPayoutId, or an early failure before a payout
// record existed) - otherwise use reconcile, never retry,
// to avoid a double payout.
// ==========================================================

const retryWithdrawalPayout = async (
    requestId
) => {

    const request =
        await WithdrawalRequest.findById(requestId);

    if (!request) {

        throw new Error(
            "Withdrawal request not found."
        );

    }

    if (request.status !== "pending") {

        throw new Error(
            `Withdrawal request is already ${request.status}.`
        );

    }

    if (request.razorpayPayoutId) {

        throw new Error(
            "A payout already exists for this request - use reconcile instead of retry."
        );

    }

    return await initiateRazorpayPayout(request);

};


// ==========================================================
// LIST MY WITHDRAWAL REQUESTS
// ==========================================================

const listMyWithdrawalRequests = async (
    userId,
    { page = 1, limit = 20, status = "all", method = "all", search = "", dateFrom, dateTo } = {}
) => {

    const safeLimit =
        Math.min(Math.max(Number(limit) || 20, 1), 100);

    const safePage =
        Math.max(Number(page) || 1, 1);

    const filter = { user: userId };

    if (status && status !== "all") {
        filter.status = status;
    }

    if (method && method !== "all") {
        filter.payoutMethod = method;
    }

    if (dateFrom || dateTo) {

        filter.createdAt = {};

        if (dateFrom) {

            const from = new Date(dateFrom);

            if (!Number.isNaN(from.getTime())) {
                filter.createdAt.$gte = from;
            }

        }

        if (dateTo) {

            const to = new Date(dateTo);

            if (!Number.isNaN(to.getTime())) {

                to.setHours(23, 59, 59, 999);

                filter.createdAt.$lte = to;

            }

        }

        if (Object.keys(filter.createdAt).length === 0) {
            delete filter.createdAt;
        }

    }

    const cleanSearch = String(search || "").trim();

    if (cleanSearch) {

        filter.$or = [
            { payoutDetails: { $regex: cleanSearch, $options: "i" } },
            { razorpayPayoutId: { $regex: cleanSearch, $options: "i" } },
        ];

    }

    const [requests, total] = await Promise.all([

        WithdrawalRequest.find(filter)
            .sort({ createdAt: -1 })
            .skip((safePage - 1) * safeLimit)
            .limit(safeLimit),

        WithdrawalRequest.countDocuments(filter),

    ]);

    return {
        requests,
        total,
        page: safePage,
        totalPages: Math.max(Math.ceil(total / safeLimit), 1),
    };

};


// ==========================================================
// LIST ALL WITHDRAWAL REQUESTS (ADMIN)
// ==========================================================

const listAllWithdrawalRequests = async (
    { page = 1, limit = 20, status = "all" } = {}
) => {

    const safeLimit =
        Math.min(Math.max(Number(limit) || 20, 1), 100);

    const safePage =
        Math.max(Number(page) || 1, 1);

    const filter =
        status && status !== "all"
            ? { status }
            : {};

    const [requests, total] = await Promise.all([

        WithdrawalRequest.find(filter)
            .populate("user", "fullName username email")
            .sort({ createdAt: -1 })
            .skip((safePage - 1) * safeLimit)
            .limit(safeLimit),

        WithdrawalRequest.countDocuments(filter),

    ]);

    return {
        requests,
        total,
        page: safePage,
        totalPages: Math.max(Math.ceil(total / safeLimit), 1),
    };

};


// ==========================================================
// APPROVE WITHDRAWAL REQUEST (MANUAL MODE)
// ==========================================================
//
// Balance was already debited at request time; approval
// only releases the lock (money has genuinely left the
// platform to the user's bank/UPI by this point).
// ==========================================================

const approveWithdrawalRequest = async (
    requestId,
    adminId,
    reviewNotes = ""
) => {

    const request =
        await WithdrawalRequest.findById(requestId);

    if (!request) {

        throw new Error(
            "Withdrawal request not found."
        );

    }

    if (request.status !== "pending") {

        throw new Error(
            `Withdrawal request is already ${request.status}.`
        );

    }

    await walletService.releaseWithdrawalHold(
        request.user,
        request.amount
    );

    request.status = "approved";
    request.reviewedBy = adminId;
    request.reviewNotes = reviewNotes;
    request.reviewedAt = new Date();

    await request.save();

    notificationService
        .notify(
            request.user,
            "withdrawal",
            "Withdrawal approved",
            `Your withdrawal of ₹${request.amount} has been approved.`,
            { withdrawalRequestId: String(request._id) }
        )
        .catch(() => {});

    return request;

};


// ==========================================================
// REJECT WITHDRAWAL REQUEST (MANUAL MODE)
// ==========================================================
//
// Refunds the held amount back to spendable real balance.
// ==========================================================

const rejectWithdrawalRequest = async (
    requestId,
    adminId,
    reviewNotes = ""
) => {

    const request =
        await WithdrawalRequest.findById(requestId);

    if (!request) {

        throw new Error(
            "Withdrawal request not found."
        );

    }

    if (request.status !== "pending") {

        throw new Error(
            `Withdrawal request is already ${request.status}.`
        );

    }

    const walletResult =
        await walletService.refundWithdrawalHold(
            request.user,
            request.amount,
            `Withdrawal request rejected: ${reviewNotes || "No reason given"}`
        );

    request.status = "rejected";
    request.reviewedBy = adminId;
    request.reviewNotes = reviewNotes;
    request.reviewedAt = new Date();
    request.transactionId = walletResult.transactionId;

    await request.save();

    notificationService
        .notify(
            request.user,
            "withdrawal",
            "Withdrawal rejected",
            `Your withdrawal request of ₹${request.amount} was rejected and the held amount has been returned to your balance.${reviewNotes ? ` Reason: ${reviewNotes}` : ""}`,
            { withdrawalRequestId: String(request._id) }
        )
        .catch(() => {});

    return request;

};


module.exports = {
    createWithdrawalRequest,
    listMyWithdrawalRequests,
    listAllWithdrawalRequests,
    approveWithdrawalRequest,
    rejectWithdrawalRequest,
    handlePayoutWebhook,
    reconcileWithdrawalPayout,
    retryWithdrawalPayout,
};
