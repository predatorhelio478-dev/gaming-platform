const adminPayoutService =
    require("../services/adminPayoutService");

const { createAuditLog } =
    require("../services/auditLogService");


// ==========================================
// REQUEST CONTEXT (IP / USER AGENT)
// ==========================================

const getRequestContext = (req) => ({

    ipAddress:
        req.ip ||
        req.headers["x-forwarded-for"] ||
        req.socket?.remoteAddress ||
        null,

    userAgent:
        req.headers["user-agent"] || null,

});


// ==========================================
// GET ADMIN PAYOUTS
// ==========================================

const getPayouts = async (
    req,
    res
) => {

    try {

        const {
            page = 1,
            limit = 20,
            search = "",
            status = "all",
        } = req.query;


        const data =
            await adminPayoutService.getPayouts({
                page,
                limit,
                search,
                status,
            });


        return res.status(200).json({

            success: true,

            ...data,

        });

    } catch (error) {

        console.error(
            "Admin Get Payouts Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to fetch payouts.",

        });

    }

};


// ==========================================
// RETRY PAYOUT
// ==========================================

const retryPayout = async (
    req,
    res
) => {

    try {

        const {
            id,
        } = req.params;


        if (!id) {

            return res.status(400).json({
                success: false,
                message:
                    "Payout ID is required.",
            });

        }


        const payout =
            await adminPayoutService.retryPayout(
                id,
                req.admin?._id
            );


        if (!payout.alreadyPaid) {

            await createAuditLog({
                actorType: "admin",
                actorId: req.admin?._id || null,
                action: "payout.retry",
                module: "payouts",
                key: id,
                ...getRequestContext(req),
            }).catch(() => {});

        }


        return res.status(200).json({

            success: true,

            message:
                payout.alreadyPaid
                    ? "Payout is already paid."
                    : "Payout retried successfully.",

            data:
                payout,

        });

    } catch (error) {

        console.error(
            "Admin Retry Payout Error:",
            error
        );


        return res.status(400).json({

            success: false,

            message:
                error.message ||
                "Unable to retry payout.",

        });

    }

};


// ==========================================
// MANUAL REVIEW
// ==========================================

const markManualReview = async (
    req,
    res
) => {

    try {

        const {
            id,
        } = req.params;


        const {
            reason = "",
        } = req.body;


        const payout =
            await adminPayoutService.markManualReview(
                id,
                reason,
                req.admin?._id
            );


        await createAuditLog({
            actorType: "admin",
            actorId: req.admin?._id || null,
            action: "payout.manual_review",
            module: "payouts",
            key: id,
            metadata: { reason },
            ...getRequestContext(req),
        }).catch(() => {});


        return res.status(200).json({

            success: true,

            message:
                "Payout moved to manual review.",

            data:
                payout,

        });

    } catch (error) {

        console.error(
            "Admin Manual Review Error:",
            error
        );


        return res.status(400).json({

            success: false,

            message:
                error.message ||
                "Unable to move payout to manual review.",

        });

    }

};


// ==========================================
// CANCEL PAYOUT
// ==========================================

const cancelPayout = async (
    req,
    res
) => {

    try {

        const {
            id,
        } = req.params;


        const {
            reason = "",
        } = req.body;


        const payout =
            await adminPayoutService.cancelPayout(
                id,
                reason,
                req.admin?._id
            );


        await createAuditLog({
            actorType: "admin",
            actorId: req.admin?._id || null,
            action: "payout.cancel",
            module: "payouts",
            key: id,
            metadata: { reason },
            ...getRequestContext(req),
        }).catch(() => {});


        return res.status(200).json({

            success: true,

            message:
                "Payout cancelled successfully.",

            data:
                payout,

        });

    } catch (error) {

        console.error(
            "Admin Cancel Payout Error:",
            error
        );


        return res.status(400).json({

            success: false,

            message:
                error.message ||
                "Unable to cancel payout.",

        });

    }

};

// ==========================================
// REVERSE PAYOUT
// ==========================================

const reversePayout = async (
    req,
    res
) => {

    try {

        const {
            id,
        } = req.params;


        const {
            reason = "",
        } = req.body;


        if (!id) {

            return res.status(400).json({
                success: false,
                message:
                    "Payout ID is required.",
            });

        }


        if (
            !String(reason).trim()
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Reverse reason is required.",
            });

        }


        const payout =
            await adminPayoutService.reversePayout(
                id,
                reason,
                req.admin?._id
            );


        if (!payout.alreadyReversed) {

            await createAuditLog({
                actorType: "admin",
                actorId: req.admin?._id || null,
                action: "payout.reverse",
                module: "payouts",
                key: id,
                metadata: { reason },
                ...getRequestContext(req),
            }).catch(() => {});

        }


        return res.status(200).json({

            success: true,

            message:
                payout.alreadyReversed
                    ? "Payout is already reversed."
                    : "Payout reversed successfully.",

            data:
                payout,

        });

    } catch (error) {

        console.error(
            "Admin Reverse Payout Error:",
            error
        );


        return res.status(400).json({

            success: false,

            message:
                error.message ||
                "Unable to reverse payout.",

        });

    }

};


// ==========================================
// REFUND PAYOUT
// ==========================================

const refundPayout = async (
    req,
    res
) => {

    try {

        const {
            id,
        } = req.params;


        const {
            amount,
            reason = "",
        } = req.body;


        if (!id) {

            return res.status(400).json({
                success: false,
                message:
                    "Payout ID is required.",
            });

        }


        if (
            !Number.isFinite(
                Number(amount)
            ) ||
            Number(amount) <= 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Valid refund amount is required.",
            });

        }


        if (
            !String(reason).trim()
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Refund reason is required.",
            });

        }


        const result =
            await adminPayoutService.refundPayout(
                id,
                Number(amount),
                reason.trim(),
                req.admin?._id
            );


        if (!result.alreadyRefunded) {

            await createAuditLog({
                actorType: "admin",
                actorId: req.admin?._id || null,
                action: "payout.refund",
                module: "payouts",
                key: id,
                newValue: Number(amount),
                metadata: { reason: reason.trim() },
                ...getRequestContext(req),
            }).catch(() => {});

        }


        return res.status(200).json({

            success: true,

            message:
                result.alreadyRefunded
                    ? "Refund was already processed."
                    : "Payout refunded successfully.",

            data:
                result,

        });

    } catch (error) {

        console.error(
            "Admin Refund Payout Error:",
            error
        );


        return res.status(400).json({

            success: false,

            message:
                error.message ||
                "Unable to refund payout.",

        });

    }

};

// ==========================================
// RESTORE PAYOUT
// ==========================================

const restorePayout = async (
    req,
    res
) => {

    try {

        const {
            id,
        } = req.params;


        const {
            reason = "",
        } = req.body;


        if (!id) {

            return res.status(400).json({
                success: false,
                message:
                    "Payout ID is required.",
            });

        }


        if (
            !String(reason).trim()
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Restore reason is required.",
            });

        }


        const result =
            await adminPayoutService.restorePayout(
                id,
                reason.trim(),
                req.admin?._id
            );


        if (!result.alreadyRestored) {

            await createAuditLog({
                actorType: "admin",
                actorId: req.admin?._id || null,
                action: "payout.restore",
                module: "payouts",
                key: id,
                metadata: { reason: reason.trim() },
                ...getRequestContext(req),
            }).catch(() => {});

        }


        return res.status(200).json({

            success: true,

            message:
                result.alreadyRestored
                    ? "Payout is already restored."
                    : "Payout restored successfully.",

            data:
                result,

        });

    } catch (error) {

        console.error(
            "Admin Restore Payout Error:",
            error
        );


        return res.status(400).json({

            success: false,

            message:
                error.message ||
                "Unable to restore payout.",

        });

    }

};

module.exports = {
    getPayouts,
    retryPayout,
    markManualReview,
    cancelPayout,
    reversePayout,
    refundPayout,
    restorePayout,
};