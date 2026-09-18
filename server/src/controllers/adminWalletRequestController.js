const depositService =
    require("../services/depositService");

const withdrawalService =
    require("../services/withdrawalService");

const { createAuditLog } =
    require("../services/auditLogService");


// ==========================================================
// REQUEST CONTEXT (IP / USER AGENT)
// ==========================================================

const getRequestContext = (req) => ({

    ipAddress:
        req.ip ||
        req.headers["x-forwarded-for"] ||
        req.socket?.remoteAddress ||
        null,

    userAgent:
        req.headers["user-agent"] || null,

});


// ==========================================================
// LIST DEPOSIT REQUESTS
// ==========================================================

const getDepositRequests = async (req, res) => {

    try {

        const { page, limit, status } = req.query;

        const result =
            await depositService.listAllDepositRequests(
                { page, limit, status }
            );

        return res.status(200).json({
            success: true,
            ...result,
        });

    } catch (error) {

        console.error(
            "Admin List Deposit Requests Error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to fetch deposit requests.",
        });

    }

};


// ==========================================================
// APPROVE DEPOSIT REQUEST
// ==========================================================

const approveDepositRequest = async (req, res) => {

    try {

        const { id } = req.params;
        const { reviewNotes = "" } = req.body;

        const request =
            await depositService.approveDepositRequest(
                id,
                req.admin?._id || null,
                reviewNotes
            );

        await createAuditLog({
            actorType: "admin",
            actorId: req.admin?._id || null,
            action: "deposit.approve",
            module: "wallet",
            key: String(request._id),
            newValue: request.amount,
            metadata: { userId: String(request.user), reviewNotes },
            ...getRequestContext(req),
        }).catch(() => {});

        return res.status(200).json({
            success: true,
            message: "Deposit request approved and wallet credited.",
            data: request,
        });

    } catch (error) {

        console.error(
            "Admin Approve Deposit Error:",
            error.message
        );

        return res.status(400).json({
            success: false,
            message: error.message || "Unable to approve deposit request.",
        });

    }

};


// ==========================================================
// REJECT DEPOSIT REQUEST
// ==========================================================

const rejectDepositRequest = async (req, res) => {

    try {

        const { id } = req.params;
        const { reviewNotes = "" } = req.body;

        const request =
            await depositService.rejectDepositRequest(
                id,
                req.admin?._id || null,
                reviewNotes
            );

        await createAuditLog({
            actorType: "admin",
            actorId: req.admin?._id || null,
            action: "deposit.reject",
            module: "wallet",
            key: String(request._id),
            metadata: { userId: String(request.user), reviewNotes },
            ...getRequestContext(req),
        }).catch(() => {});

        return res.status(200).json({
            success: true,
            message: "Deposit request rejected.",
            data: request,
        });

    } catch (error) {

        console.error(
            "Admin Reject Deposit Error:",
            error.message
        );

        return res.status(400).json({
            success: false,
            message: error.message || "Unable to reject deposit request.",
        });

    }

};


// ==========================================================
// RECONCILE DEPOSIT REQUEST (stuck Razorpay orders)
// ==========================================================

const reconcileDepositRequest = async (req, res) => {

    try {

        const { id } = req.params;

        const request =
            await depositService.reconcileRazorpayDeposit(id);

        await createAuditLog({
            actorType: "admin",
            actorId: req.admin?._id || null,
            action: "deposit.reconcile",
            module: "wallet",
            key: String(request._id),
            newValue: request.status,
            metadata: { userId: String(request.user) },
            ...getRequestContext(req),
        }).catch(() => {});

        return res.status(200).json({
            success: true,
            message: `Deposit request reconciled - status: ${request.status}.`,
            data: request,
        });

    } catch (error) {

        console.error(
            "Admin Reconcile Deposit Error:",
            error.message
        );

        return res.status(400).json({
            success: false,
            message: error.message || "Unable to reconcile deposit request.",
        });

    }

};


// ==========================================================
// REFUND RAZORPAY DEPOSIT (real money back to the customer)
// ==========================================================

const refundDepositRequest = async (req, res) => {

    try {

        const { id } = req.params;
        const { reason = "" } = req.body;

        const request =
            await depositService.refundRazorpayDeposit(
                id,
                req.admin?._id || null,
                reason
            );

        return res.status(200).json({
            success: true,
            message: `Refund ${request.refundStatus === "processed" ? "completed" : "initiated"}.`,
            data: request,
        });

    } catch (error) {

        console.error(
            "Admin Refund Deposit Error:",
            error.message
        );

        return res.status(400).json({
            success: false,
            message: error.message || "Unable to refund deposit request.",
        });

    }

};


// ==========================================================
// RECONCILE A PENDING RAZORPAY REFUND
// ==========================================================

const reconcileDepositRefund = async (req, res) => {

    try {

        const { id } = req.params;

        const request =
            await depositService.reconcileRazorpayRefund(id);

        await createAuditLog({
            actorType: "admin",
            actorId: req.admin?._id || null,
            action: "deposit.refund_reconcile",
            module: "wallet",
            key: String(request._id),
            newValue: request.refundStatus,
            metadata: { userId: String(request.user) },
            ...getRequestContext(req),
        }).catch(() => {});

        return res.status(200).json({
            success: true,
            message: `Refund reconciled - status: ${request.refundStatus}.`,
            data: request,
        });

    } catch (error) {

        console.error(
            "Admin Reconcile Refund Error:",
            error.message
        );

        return res.status(400).json({
            success: false,
            message: error.message || "Unable to reconcile refund.",
        });

    }

};


// ==========================================================
// LIST WITHDRAWAL REQUESTS
// ==========================================================

const getWithdrawalRequests = async (req, res) => {

    try {

        const { page, limit, status } = req.query;

        const result =
            await withdrawalService.listAllWithdrawalRequests(
                { page, limit, status }
            );

        return res.status(200).json({
            success: true,
            ...result,
        });

    } catch (error) {

        console.error(
            "Admin List Withdrawal Requests Error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to fetch withdrawal requests.",
        });

    }

};


// ==========================================================
// APPROVE WITHDRAWAL REQUEST
// ==========================================================

const approveWithdrawalRequest = async (req, res) => {

    try {

        const { id } = req.params;
        const { reviewNotes = "" } = req.body;

        const request =
            await withdrawalService.approveWithdrawalRequest(
                id,
                req.admin?._id || null,
                reviewNotes
            );

        await createAuditLog({
            actorType: "admin",
            actorId: req.admin?._id || null,
            action: "withdrawal.approve",
            module: "wallet",
            key: String(request._id),
            newValue: request.amount,
            metadata: { userId: String(request.user), reviewNotes },
            ...getRequestContext(req),
        }).catch(() => {});

        return res.status(200).json({
            success: true,
            message: "Withdrawal request approved.",
            data: request,
        });

    } catch (error) {

        console.error(
            "Admin Approve Withdrawal Error:",
            error.message
        );

        return res.status(400).json({
            success: false,
            message: error.message || "Unable to approve withdrawal request.",
        });

    }

};


// ==========================================================
// REJECT WITHDRAWAL REQUEST
// ==========================================================

const rejectWithdrawalRequest = async (req, res) => {

    try {

        const { id } = req.params;
        const { reviewNotes = "" } = req.body;

        const request =
            await withdrawalService.rejectWithdrawalRequest(
                id,
                req.admin?._id || null,
                reviewNotes
            );

        await createAuditLog({
            actorType: "admin",
            actorId: req.admin?._id || null,
            action: "withdrawal.reject",
            module: "wallet",
            key: String(request._id),
            metadata: { userId: String(request.user), reviewNotes },
            ...getRequestContext(req),
        }).catch(() => {});

        return res.status(200).json({
            success: true,
            message: "Withdrawal request rejected and held funds refunded.",
            data: request,
        });

    } catch (error) {

        console.error(
            "Admin Reject Withdrawal Error:",
            error.message
        );

        return res.status(400).json({
            success: false,
            message: error.message || "Unable to reject withdrawal request.",
        });

    }

};


// ==========================================================
// RECONCILE WITHDRAWAL REQUEST (check RazorpayX payout status)
// ==========================================================

const reconcileWithdrawalRequest = async (req, res) => {

    try {

        const { id } = req.params;

        const request =
            await withdrawalService.reconcileWithdrawalPayout(id);

        await createAuditLog({
            actorType: "admin",
            actorId: req.admin?._id || null,
            action: "withdrawal.reconcile",
            module: "wallet",
            key: String(request._id),
            newValue: request.status,
            metadata: { userId: String(request.user) },
            ...getRequestContext(req),
        }).catch(() => {});

        return res.status(200).json({
            success: true,
            message: `Withdrawal request reconciled - status: ${request.status}.`,
            data: request,
        });

    } catch (error) {

        console.error(
            "Admin Reconcile Withdrawal Error:",
            error.message
        );

        return res.status(400).json({
            success: false,
            message: error.message || "Unable to reconcile withdrawal request.",
        });

    }

};


// ==========================================================
// RETRY WITHDRAWAL PAYOUT (never confirmed created at gateway)
// ==========================================================

const retryWithdrawalRequest = async (req, res) => {

    try {

        const { id } = req.params;

        const request =
            await withdrawalService.retryWithdrawalPayout(id);

        await createAuditLog({
            actorType: "admin",
            actorId: req.admin?._id || null,
            action: "withdrawal.retry",
            module: "wallet",
            key: String(request._id),
            newValue: request.gatewayStatus,
            metadata: { userId: String(request.user) },
            ...getRequestContext(req),
        }).catch(() => {});

        return res.status(200).json({
            success: true,
            message: "Withdrawal payout retried.",
            data: request,
        });

    } catch (error) {

        console.error(
            "Admin Retry Withdrawal Error:",
            error.message
        );

        return res.status(400).json({
            success: false,
            message: error.message || "Unable to retry withdrawal payout.",
        });

    }

};


module.exports = {
    getDepositRequests,
    approveDepositRequest,
    rejectDepositRequest,
    reconcileDepositRequest,
    refundDepositRequest,
    reconcileDepositRefund,
    getWithdrawalRequests,
    approveWithdrawalRequest,
    rejectWithdrawalRequest,
    reconcileWithdrawalRequest,
    retryWithdrawalRequest,
};
