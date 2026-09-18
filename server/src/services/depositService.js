const mongoose =
    require("mongoose");

const Razorpay =
    require("razorpay");

const DepositRequest =
    require("../models/DepositRequest");

const walletService =
    require("./walletService");

const settingsService =
    require("./settingsService");

const {
    getRazorpayClient,
    getRazorpayKeyId,
    getRazorpayKeySecret,
    getRazorpayMode,
    isModeConfigured,
    isRazorpayConfigured,
} = require("../config/razorpay");

const { createAuditLog } =
    require("./auditLogService");

const notificationService =
    require("./notificationService");


const RAZORPAY_CURRENCY = "INR";


// ==========================================================
// VALIDATE DEPOSIT AMOUNT AGAINST SETTINGS
// ==========================================================
//
// Shared by the manual reference-submission flow and the
// Razorpay order-creation flow below.
// ==========================================================

const validateDepositAmount = async (amount) => {

    const depositSettings =
        await settingsService.getValues(
            "payment",
            [
                "deposit_enabled",
                "minimum_deposit",
                "maximum_deposit",
            ]
        );

    if (depositSettings.deposit_enabled !== true) {

        throw new Error(
            "Deposits are currently disabled."
        );

    }

    const numericAmount =
        Number(amount);

    const minimumDeposit =
        Number(depositSettings.minimum_deposit);

    const maximumDeposit =
        Number(depositSettings.maximum_deposit);

    if (
        !Number.isFinite(numericAmount) ||
        numericAmount <= 0
    ) {

        throw new Error(
            "Invalid deposit amount."
        );

    }

    if (
        Number.isFinite(minimumDeposit) &&
        numericAmount < minimumDeposit
    ) {

        throw new Error(
            `Minimum deposit amount is ${minimumDeposit}.`
        );

    }

    if (
        Number.isFinite(maximumDeposit) &&
        numericAmount > maximumDeposit
    ) {

        throw new Error(
            `Maximum deposit amount is ${maximumDeposit}.`
        );

    }

    return numericAmount;

};


// ==========================================================
// CREATE DEPOSIT REQUEST (MANUAL)
// ==========================================================

const createDepositRequest = async (
    userId,
    amount,
    referenceId,
    method = "other"
) => {

    const numericAmount =
        await validateDepositAmount(amount);

    const cleanReferenceId =
        String(referenceId || "").trim();

    if (!cleanReferenceId) {

        throw new Error(
            "Payment reference/UTR is required."
        );

    }

    try {

        const request =
            await DepositRequest.create({
                user: userId,
                amount: numericAmount,
                referenceId: cleanReferenceId,
                method: String(method || "other").trim(),
            });

        notificationService
            .notifyAdmins(
                "deposit",
                "New deposit request",
                `A manual deposit request for ₹${numericAmount} is awaiting review.`,
                { depositRequestId: String(request._id), userId: String(userId) }
            )
            .catch(() => {});

        return request;

    } catch (error) {

        if (error?.code === 11000) {

            throw new Error(
                "This payment reference has already been submitted."
            );

        }

        throw error;

    }

};


// ==========================================================
// LIST MY DEPOSIT REQUESTS
// ==========================================================

const listMyDepositRequests = async (
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
        filter.method = method;
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
            { referenceId: { $regex: cleanSearch, $options: "i" } },
            { razorpayPaymentId: { $regex: cleanSearch, $options: "i" } },
        ];

    }

    const [requests, total] = await Promise.all([

        DepositRequest.find(filter)
            .sort({ createdAt: -1 })
            .skip((safePage - 1) * safeLimit)
            .limit(safeLimit),

        DepositRequest.countDocuments(filter),

    ]);

    return {
        requests,
        total,
        page: safePage,
        totalPages: Math.max(Math.ceil(total / safeLimit), 1),
    };

};


// ==========================================================
// LIST ALL DEPOSIT REQUESTS (ADMIN)
// ==========================================================

const listAllDepositRequests = async (
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

        DepositRequest.find(filter)
            .populate("user", "fullName username email")
            .sort({ createdAt: -1 })
            .skip((safePage - 1) * safeLimit)
            .limit(safeLimit),

        DepositRequest.countDocuments(filter),

    ]);

    return {
        requests,
        total,
        page: safePage,
        totalPages: Math.max(Math.ceil(total / safeLimit), 1),
    };

};


// ==========================================================
// APPROVE DEPOSIT REQUEST
// ==========================================================

const approveDepositRequest = async (
    requestId,
    adminId,
    reviewNotes = ""
) => {

    const request =
        await DepositRequest.findById(requestId);

    if (!request) {

        throw new Error(
            "Deposit request not found."
        );

    }

    if (request.status !== "pending") {

        throw new Error(
            `Deposit request is already ${request.status}.`
        );

    }

    const walletResult =
        await walletService.credit(
            request.user,
            request.amount,
            "deposit",
            `Deposit approved - Ref ${request.referenceId}`
        );

    request.status = "approved";
    request.reviewedBy = adminId;
    request.reviewNotes = reviewNotes;
    request.reviewedAt = new Date();
    request.transactionId = walletResult.transactionId;

    await request.save();

    notificationService
        .notify(
            request.user,
            "deposit",
            "Deposit approved",
            `Your deposit of ₹${request.amount} has been approved and credited to your wallet.`,
            { depositRequestId: String(request._id) }
        )
        .catch(() => {});

    return request;

};


// ==========================================================
// REJECT DEPOSIT REQUEST
// ==========================================================

const rejectDepositRequest = async (
    requestId,
    adminId,
    reviewNotes = ""
) => {

    const request =
        await DepositRequest.findById(requestId);

    if (!request) {

        throw new Error(
            "Deposit request not found."
        );

    }

    if (request.status !== "pending") {

        throw new Error(
            `Deposit request is already ${request.status}.`
        );

    }

    request.status = "rejected";
    request.reviewedBy = adminId;
    request.reviewNotes = reviewNotes;
    request.reviewedAt = new Date();

    await request.save();

    notificationService
        .notify(
            request.user,
            "deposit",
            "Deposit rejected",
            `Your deposit request of ₹${request.amount} was rejected.${reviewNotes ? ` Reason: ${reviewNotes}` : ""}`,
            { depositRequestId: String(request._id) }
        )
        .catch(() => {});

    return request;

};


// ==========================================================
// CREATE RAZORPAY ORDER
// ==========================================================
//
// Creates the order with Razorpay AND the corresponding
// DepositRequest row up front (status "pending",
// gatewayStatus "created") so the request is trackable
// even if the user abandons checkout before paying.
// ==========================================================

const createRazorpayOrder = async (
    userId,
    amount
) => {

    // The active Razorpay mode (Test/Live) is resolved ONCE
    // here and pinned to this specific order (razorpayMode
    // below) - every later step for this order (signature
    // verification, refund, reconciliation) reuses this exact
    // mode, never whatever the "currently active" setting
    // happens to be at that later point.

    const mode =
        await getRazorpayMode();

    if (!isModeConfigured(mode)) {

        throw new Error(
            mode === "live"
                ? "Live Razorpay credentials are not configured."
                : "Test Razorpay credentials are not configured."
        );

    }

    // The admin's payment_mode setting must actually control
    // this, not just steer which form the frontend shows -
    // otherwise a direct API call could create a real Razorpay
    // order while the admin believes automatic payments are
    // disabled.

    const paymentMode =
        await settingsService.getValue(
            "payment",
            "payment_mode",
            "manual"
        );

    if (paymentMode !== "automatic") {

        throw new Error(
            "Automatic payments are currently disabled. Please use the manual deposit option."
        );

    }

    const numericAmount =
        await validateDepositAmount(amount);

    const client =
        await getRazorpayClient(mode);

    const order =
        await client.orders.create({

            amount:
                Math.round(numericAmount * 100), // paise

            currency:
                RAZORPAY_CURRENCY,

            receipt:
                `dep_${userId}_${Date.now()}`,

            notes: {
                userId: String(userId),
            },

        });

    try {

        const depositRequest =
            await DepositRequest.create({
                user: userId,
                amount: numericAmount,
                method: "razorpay",
                referenceId: order.id,
                initiatedVia: "razorpay",
                razorpayOrderId: order.id,
                razorpayMode: mode,
                gatewayStatus: "created",
            });

        return {
            depositRequestId: depositRequest._id,
            orderId: order.id,
            amount: numericAmount,
            currency: RAZORPAY_CURRENCY,
            keyId: await getRazorpayKeyId(mode),
        };

    } catch (error) {

        if (error?.code === 11000) {

            throw new Error(
                "This order has already been created."
            );

        }

        throw error;

    }

};


// ==========================================================
// CONFIRM RAZORPAY PAYMENT (idempotent, credit-once)
// ==========================================================
//
// Called from BOTH the frontend verify endpoint (right after
// Razorpay Checkout succeeds - fast UX path) and the webhook
// handler (authoritative reconciliation, and the only path
// that fires if the user closes the tab before the verify
// call goes out). Whichever call wins the atomic status flip
// below credits the wallet; the other is a no-op that just
// confirms the same already-applied state.
// ==========================================================

// ==========================================================
// CREDIT A DEPOSIT EXACTLY ONCE (shared core)
// ==========================================================
//
// Used by every "a payment is confirmed" entry point
// (checkout verify, webhook, admin reconciliation) so there
// is exactly one atomic credit-once implementation. Callers
// are responsible for establishing trust FIRST (signature
// check, webhook envelope verification, or a trusted
// Razorpay API response) - this function itself does not
// re-derive a signature.
// ==========================================================

const creditDepositOnce = async (
    razorpayOrderId,
    razorpayPaymentId,
    source,
    extraFields = {}
) => {

    const session =
        await mongoose.startSession();

    try {

        session.startTransaction();

        const request =
            await DepositRequest.findOneAndUpdate(
                {
                    razorpayOrderId,
                    gatewayStatus: { $ne: "paid" },
                },
                {
                    $set: {
                        gatewayStatus: "paid",
                        razorpayPaymentId,
                        ...extraFields,
                    },
                },
                {
                    session,
                    new: true,
                }
            );

        if (!request) {

            // Already processed by a previous call
            // (verify vs webhook race, or a redelivered
            // webhook) - idempotent no-op.

            await session.abortTransaction();

            const existing =
                await DepositRequest.findOne({ razorpayOrderId });

            if (!existing) {

                throw new Error(
                    "Deposit request not found."
                );

            }

            return existing;

        }

        const walletResult =
            await walletService.credit(
                request.user,
                request.amount,
                "deposit",
                `Razorpay deposit - Payment ${razorpayPaymentId}`,
                { session }
            );

        request.status = "approved";
        request.transactionId = walletResult.transactionId;
        request.reviewedAt = new Date();

        await request.save({ session });

        await session.commitTransaction();

        await createAuditLog({
            actorType: "system",
            action: "deposit.razorpay_confirmed",
            module: "wallet",
            key: String(request._id),
            newValue: request.amount,
            metadata: {
                userId: String(request.user),
                razorpayOrderId,
                razorpayPaymentId,
                source,
            },
        }).catch(() => {});

        notificationService
            .notify(
                request.user,
                "deposit",
                "Deposit successful",
                `Your deposit of ₹${request.amount} was successful and has been credited to your wallet.`,
                { depositRequestId: String(request._id) }
            )
            .catch(() => {});

        return request;

    } catch (error) {

        if (session.inTransaction()) {

            await session.abortTransaction();

        }


        // A genuine concurrent-write race (both the verify
        // call and the webhook landed at the same instant) -
        // MongoDB aborts the loser with a write conflict.
        // Treat it the same as "already processed" rather
        // than surfacing a scary error.

        if (error?.errorLabels?.includes("TransientTransactionError")) {

            const existing =
                await DepositRequest.findOne({ razorpayOrderId });

            if (existing) {

                return existing;

            }

        }

        throw error;

    } finally {

        session.endSession();

    }

};


// ==========================================================
// CONFIRM RAZORPAY PAYMENT (checkout verify path - signature
// checked against the client-supplied razorpay_signature)
// ==========================================================
//
// Called from the frontend verify endpoint right after
// Razorpay Checkout succeeds (fast UX path). The webhook
// (confirmRazorpayPaymentTrusted below) is the authoritative
// path that fires even if this call never happens (tab
// closed mid-checkout, network failure, etc). Whichever
// wins the atomic flip in creditDepositOnce credits the
// wallet; the other is a no-op confirming the same state.
// ==========================================================

const confirmRazorpayPayment = async (
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    source = "verify"
) => {

    // Pinned to whichever mode this specific order was
    // actually created under (see createRazorpayOrder) -
    // never the currently active setting, so an admin
    // flipping Test/Live mid-checkout can't cause a live
    // order to be verified against test credentials or
    // vice versa.

    const existingRequest =
        await DepositRequest.findOne({ razorpayOrderId })
            .select("razorpayMode");

    const orderMode =
        existingRequest?.razorpayMode || null;

    const keySecret =
        await getRazorpayKeySecret(orderMode);

    const signatureIsValid =
        Razorpay.validateWebhookSignature(
            `${razorpayOrderId}|${razorpayPaymentId}`,
            razorpaySignature,
            keySecret
        );

    if (!signatureIsValid) {

        throw new Error(
            "Payment signature verification failed."
        );

    }

    return creditDepositOnce(
        razorpayOrderId,
        razorpayPaymentId,
        source,
        { razorpaySignature }
    );

};


// ==========================================================
// CONFIRM RAZORPAY PAYMENT - TRUSTED SOURCE (webhook /
// admin reconciliation)
// ==========================================================
//
// No per-payment signature to check here: the webhook
// envelope itself is already signature-verified by the
// caller (razorpayWebhookController) before this runs, and
// the reconciliation path only ever calls this with a
// payment Razorpay's own (API-secret-authenticated) Fetch
// API just returned - both are already trusted.
// ==========================================================

const confirmRazorpayPaymentTrusted = async (
    razorpayOrderId,
    razorpayPaymentId,
    source
) => {

    if (!(await isRazorpayConfigured())) {

        throw new Error(
            "Payment gateway is not configured."
        );

    }

    return creditDepositOnce(
        razorpayOrderId,
        razorpayPaymentId,
        source
    );

};


// ==========================================================
// MARK RAZORPAY PAYMENT FAILED
// ==========================================================

const markRazorpayPaymentFailed = async (
    razorpayOrderId,
    reason = ""
) => {

    const request =
        await DepositRequest.findOneAndUpdate(
            {
                razorpayOrderId,
                gatewayStatus: { $ne: "paid" },
            },
            {
                $set: {
                    gatewayStatus: "failed",
                    status: "rejected",
                    reviewNotes: reason,
                    reviewedAt: new Date(),
                },
            },
            { new: true }
        );

    if (request) {

        await createAuditLog({
            actorType: "system",
            action: "deposit.razorpay_failed",
            module: "wallet",
            key: String(request._id),
            metadata: {
                userId: String(request.user),
                razorpayOrderId,
                reason,
            },
        }).catch(() => {});

        notificationService
            .notify(
                request.user,
                "deposit",
                "Deposit failed",
                `Your deposit of ₹${request.amount} could not be completed.${reason ? ` ${reason}` : ""}`,
                { depositRequestId: String(request._id) }
            )
            .catch(() => {});

    }

    return request;

};


// ==========================================================
// RECONCILE A STUCK RAZORPAY DEPOSIT (ADMIN)
// ==========================================================
//
// For orders that never got a webhook or verify call (user
// closed the tab mid-checkout, app crashed, etc.) - pulls
// the real status from Razorpay and resolves it.
// ==========================================================

const reconcileRazorpayDeposit = async (
    requestId
) => {

    const request =
        await DepositRequest.findById(requestId);

    if (!request) {

        throw new Error(
            "Deposit request not found."
        );

    }

    if (!request.razorpayOrderId) {

        throw new Error(
            "This deposit request has no associated Razorpay order."
        );

    }

    if (request.status !== "pending") {

        return request;

    }

    // Pinned to the mode this order was actually created
    // under, not whatever mode is currently active.

    const client =
        await getRazorpayClient(request.razorpayMode);

    const payments =
        await client.orders.fetchPayments(
            request.razorpayOrderId
        );

    const capturedPayment =
        (payments?.items || []).find(
            (payment) => payment.status === "captured"
        );

    if (capturedPayment) {

        // Reconciliation is a different trust path than
        // confirmRazorpayPayment above: there's no client-
        // supplied signature to check because the payment
        // status came directly from Razorpay's own
        // (API-secret-authenticated) Fetch Payments response,
        // not from a browser redirect or webhook body.

        return await confirmRazorpayPaymentTrusted(
            request.razorpayOrderId,
            capturedPayment.id,
            "reconcile"
        );

    }

    const failedPayment =
        (payments?.items || []).find(
            (payment) => payment.status === "failed"
        );

    if (failedPayment) {

        return await markRazorpayPaymentFailed(
            request.razorpayOrderId,
            "Reconciled as failed via Razorpay Fetch Payments API"
        );

    }

    // Still no terminal state at Razorpay's end.

    return request;

};


// ==========================================================
// REFUND A RAZORPAY DEPOSIT (real money back to the customer)
// ==========================================================
//
// Only applies to deposits that were actually collected via
// Razorpay and successfully credited (status "approved",
// initiatedVia "razorpay"). Calls Razorpay's real Refund API
// - never fakes a refund. The wallet is only debited once the
// gateway confirms the refund (either synchronously in the
// API response, or later via the refund.processed webhook) -
// never optimistically ahead of gateway confirmation.
//
// Idempotency: guarded the same way as creditDepositOnce -
// an atomic conditional update on refundStatus prevents two
// concurrent calls (e.g. an admin double-click, or a retried
// request) from debiting the wallet twice for one refund.
// ==========================================================

const refundRazorpayDeposit = async (
    requestId,
    adminId,
    reason = ""
) => {

    const request =
        await DepositRequest.findById(requestId).select("+razorpaySignature");

    if (!request) {

        throw new Error(
            "Deposit request not found."
        );

    }

    if (request.initiatedVia !== "razorpay" || !request.razorpayPaymentId) {

        throw new Error(
            "Only Razorpay-collected deposits can be refunded through this action."
        );

    }

    if (request.status !== "approved") {

        throw new Error(
            `Only approved (credited) deposits can be refunded. Current status: ${request.status}.`
        );

    }

    if (request.refundStatus === "processed") {

        // Idempotent no-op - already fully refunded.

        return request;

    }

    const cleanReason =
        String(reason || "").trim() || "Admin-initiated refund";

    // Pinned to the mode this deposit was actually collected
    // under, not whatever mode is currently active.

    const client =
        await getRazorpayClient(request.razorpayMode);

    let refundResponse;

    try {

        refundResponse =
            await client.payments.refund(
                request.razorpayPaymentId,
                {
                    amount: Math.round(request.amount * 100), // full refund, paise
                    speed: "optimum",
                    notes: {
                        depositRequestId: String(request._id),
                        reason: cleanReason,
                    },
                }
            );

    } catch (error) {

        // A genuine gateway rejection (already refunded at
        // Razorpay's end, invalid payment, etc.) - surface it,
        // never guess at a fabricated success.

        throw new Error(
            error?.error?.description ||
            error.message ||
            "Razorpay refund request failed."
        );

    }

    // Atomic conditional update - guards against a double
    // debit if this function is somehow invoked twice
    // concurrently for the same request.

    const claimed =
        await DepositRequest.findOneAndUpdate(
            {
                _id: request._id,
                refundStatus: { $ne: "processed" },
            },
            {
                $set: {
                    razorpayRefundId: refundResponse.id,
                    refundStatus: refundResponse.status === "processed" ? "processed" : "pending",
                },
            },
            { new: true }
        );

    if (!claimed) {

        // Another call already finalized this refund.

        return await DepositRequest.findById(requestId);

    }

    await createAuditLog({
        actorType: "admin",
        actorId: adminId,
        action: "deposit.refund_initiated",
        module: "wallet",
        key: String(claimed._id),
        newValue: refundResponse.status,
        metadata: {
            userId: String(claimed.user),
            razorpayRefundId: refundResponse.id,
            reason: cleanReason,
        },
    }).catch(() => {});

    if (refundResponse.status !== "processed") {

        // Refund accepted by Razorpay but not yet settled
        // (common for bank transfers) - wallet stays
        // untouched until the refund.processed webhook (or a
        // later reconcile) confirms it.

        return claimed;

    }

    return await finalizeDepositRefund(claimed, adminId, cleanReason);

};


// ==========================================================
// FINALIZE DEPOSIT REFUND (debit the wallet once the gateway
// has actually confirmed the refund as processed)
// ==========================================================

const finalizeDepositRefund = async (
    request,
    adminId,
    reason
) => {

    const session =
        await mongoose.startSession();

    let shortfall = 0;

    try {

        session.startTransaction();

        const wallet =
            await require("../models/Wallet")
                .findOne({ user: request.user })
                .session(session);

        if (!wallet) {

            throw new Error("Wallet not found.");

        }

        const availableBalance =
            Number(wallet.balance || 0);

        const debitAmount =
            Math.min(availableBalance, Number(request.amount));

        shortfall =
            Number(request.amount) - debitAmount;

        if (debitAmount > 0) {

            await walletService.debit(
                request.user,
                debitAmount,
                "refund",
                `Deposit refunded via Razorpay - ${reason}`,
                { session }
            );

        }

        await session.commitTransaction();

    } catch (error) {

        await session.abortTransaction();
        throw error;

    } finally {

        session.endSession();

    }

    if (shortfall > 0) {

        // The user's wallet no longer holds enough real
        // balance to cover the refund (already withdrawn/bet
        // elsewhere) - the gateway refund still genuinely
        // happened, so we don't block on it, but this MUST be
        // flagged for manual finance follow-up rather than
        // silently absorbed.

        await createAuditLog({
            actorType: "system",
            action: "deposit.refund_wallet_shortfall",
            module: "wallet",
            key: String(request._id),
            newValue: shortfall,
            metadata: {
                userId: String(request.user),
                message: "Wallet balance was insufficient to fully offset the gateway refund.",
            },
        }).catch(() => {});

        notificationService
            .notifyAdmins(
                "deposit",
                "Refund wallet shortfall",
                `Deposit ${request._id} was refunded via Razorpay but the user's wallet balance could not fully cover it (shortfall ₹${shortfall}).`,
                { depositRequestId: String(request._id), userId: String(request.user), shortfall }
            )
            .catch(() => {});

    }

    notificationService
        .notify(
            request.user,
            "deposit",
            "Deposit refunded",
            `Your deposit of ₹${request.amount} has been refunded.`,
            { depositRequestId: String(request._id) }
        )
        .catch(() => {});

    return request;

};


// ==========================================================
// HANDLE REFUND WEBHOOK (refund.processed)
// ==========================================================

const handleRefundWebhook = async (
    razorpayRefundId,
    status
) => {

    const request =
        await DepositRequest.findOne({ razorpayRefundId });

    if (!request) {

        console.warn(
            "[depositService] Webhook for unknown refund:",
            razorpayRefundId
        );

        return null;

    }

    if (request.refundStatus === "processed") {

        // Idempotent no-op.

        return request;

    }

    if (status !== "processed") {

        request.refundStatus = "failed";
        await request.save();
        return request;

    }

    const claimed =
        await DepositRequest.findOneAndUpdate(
            {
                _id: request._id,
                refundStatus: { $ne: "processed" },
            },
            { $set: { refundStatus: "processed" } },
            { new: true }
        );

    if (!claimed) {

        return await DepositRequest.findById(request._id);

    }

    return await finalizeDepositRefund(claimed, null, "Confirmed via webhook");

};


// ==========================================================
// RECONCILE A PENDING RAZORPAY REFUND
// ==========================================================

const reconcileRazorpayRefund = async (
    requestId
) => {

    const request =
        await DepositRequest.findById(requestId);

    if (!request) {

        throw new Error(
            "Deposit request not found."
        );

    }

    if (!request.razorpayRefundId) {

        throw new Error(
            "This deposit request has no associated refund to reconcile."
        );

    }

    if (request.refundStatus === "processed") {

        return request;

    }

    // Pinned to the mode this deposit was actually collected
    // under, not whatever mode is currently active.

    const client =
        await getRazorpayClient(request.razorpayMode);

    const refund =
        await client.refunds.fetch(request.razorpayRefundId);

    return await handleRefundWebhook(request.razorpayRefundId, refund.status);

};


module.exports = {
    createDepositRequest,
    listMyDepositRequests,
    listAllDepositRequests,
    approveDepositRequest,
    rejectDepositRequest,
    createRazorpayOrder,
    confirmRazorpayPayment,
    confirmRazorpayPaymentTrusted,
    markRazorpayPaymentFailed,
    reconcileRazorpayDeposit,
    refundRazorpayDeposit,
    handleRefundWebhook,
    reconcileRazorpayRefund,
};
