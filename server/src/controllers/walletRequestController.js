const depositService =
    require("../services/depositService");

const withdrawalService =
    require("../services/withdrawalService");


// ==========================================================
// CREATE DEPOSIT REQUEST
// ==========================================================

const createDepositRequest = async (req, res) => {

    try {

        const userId =
            req.user?.id || req.user?._id;

        const { amount, referenceId, method } = req.body;

        const request =
            await depositService.createDepositRequest(
                userId,
                amount,
                referenceId,
                method
            );

        return res.status(201).json({
            success: true,
            message: "Deposit request submitted. It will be reviewed by an admin.",
            data: request,
        });

    } catch (error) {

        console.error(
            "Create Deposit Request Error:",
            error.message
        );

        return res.status(400).json({
            success: false,
            message: error.message || "Unable to submit deposit request.",
        });

    }

};


// ==========================================================
// CREATE RAZORPAY ORDER (real deposit)
// ==========================================================

const createRazorpayOrder = async (req, res) => {

    try {

        const userId =
            req.user?.id || req.user?._id;

        const { amount } = req.body;

        const order =
            await depositService.createRazorpayOrder(
                userId,
                amount
            );

        return res.status(201).json({
            success: true,
            ...order,
        });

    } catch (error) {

        console.error(
            "Create Razorpay Order Error:",
            error.message
        );

        return res.status(400).json({
            success: false,
            message: error.message || "Unable to start payment.",
        });

    }

};


// ==========================================================
// VERIFY RAZORPAY PAYMENT (fast UX path; the webhook is the
// authoritative one and will confirm the same state even if
// this call never arrives)
// ==========================================================

const verifyRazorpayPayment = async (req, res) => {

    try {

        const {
            razorpay_order_id: razorpayOrderId,
            razorpay_payment_id: razorpayPaymentId,
            razorpay_signature: razorpaySignature,
        } = req.body;

        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {

            return res.status(400).json({
                success: false,
                message: "Incomplete payment verification payload.",
            });

        }

        const request =
            await depositService.confirmRazorpayPayment(
                razorpayOrderId,
                razorpayPaymentId,
                razorpaySignature,
                "verify"
            );

        return res.status(200).json({
            success: true,
            message: "Payment verified. Your wallet has been credited.",
            data: request,
        });

    } catch (error) {

        console.error(
            "Verify Razorpay Payment Error:",
            error.message
        );

        return res.status(400).json({
            success: false,
            message: error.message || "Unable to verify payment.",
        });

    }

};


// ==========================================================
// MY DEPOSIT REQUESTS
// ==========================================================

const getMyDepositRequests = async (req, res) => {

    try {

        const userId =
            req.user?.id || req.user?._id;

        const { page, limit, status, method, search, dateFrom, dateTo } = req.query;

        const result =
            await depositService.listMyDepositRequests(
                userId,
                { page, limit, status, method, search, dateFrom, dateTo }
            );

        return res.status(200).json({
            success: true,
            ...result,
        });

    } catch (error) {

        console.error(
            "Get My Deposit Requests Error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to fetch deposit requests.",
        });

    }

};


// ==========================================================
// CREATE WITHDRAWAL REQUEST
// ==========================================================

const createWithdrawalRequest = async (req, res) => {

    try {

        const userId =
            req.user?.id || req.user?._id;

        const {
            amount,
            payoutMethod,
            payoutDetails,
            upiId,
            bankAccountNumber,
            bankIfsc,
        } = req.body;

        const request =
            await withdrawalService.createWithdrawalRequest(
                userId,
                amount,
                payoutMethod,
                payoutDetails,
                { upiId, bankAccountNumber, bankIfsc }
            );

        let message =
            "Withdrawal request submitted. It will be reviewed by an admin.";

        if (request.mode === "automatic") {

            if (request.status === "approved") {
                message = "Withdrawal payout completed successfully.";
            } else if (request.status === "rejected") {
                message = `Withdrawal could not be processed automatically: ${request.reviewNotes || "payout failed"}. Held funds have been released.`;
            } else {
                message = "Withdrawal request submitted and payout initiated. It may take a few minutes to complete.";
            }

        }

        return res.status(201).json({
            success: true,
            message,
            data: request,
        });

    } catch (error) {

        console.error(
            "Create Withdrawal Request Error:",
            error.message
        );

        return res.status(400).json({
            success: false,
            code: error.code || null,
            message: error.message || "Unable to submit withdrawal request.",
        });

    }

};


// ==========================================================
// MY WITHDRAWAL REQUESTS
// ==========================================================

const getMyWithdrawalRequests = async (req, res) => {

    try {

        const userId =
            req.user?.id || req.user?._id;

        const { page, limit, status, method, search, dateFrom, dateTo } = req.query;

        const result =
            await withdrawalService.listMyWithdrawalRequests(
                userId,
                { page, limit, status, method, search, dateFrom, dateTo }
            );

        return res.status(200).json({
            success: true,
            ...result,
        });

    } catch (error) {

        console.error(
            "Get My Withdrawal Requests Error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to fetch withdrawal requests.",
        });

    }

};


module.exports = {
    createDepositRequest,
    createRazorpayOrder,
    verifyRazorpayPayment,
    getMyDepositRequests,
    createWithdrawalRequest,
    getMyWithdrawalRequests,
};
