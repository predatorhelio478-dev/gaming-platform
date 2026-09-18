const walletService = require("../services/walletService");
const Transaction = require("../models/Transaction");
const User = require("../models/User");

exports.getWallet = async (req, res) => {
    try {
        const wallet = await walletService.getWallet(req.user.id);

        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: "Wallet not found",
            });
        }

        res.json({
            success: true,
            wallet,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// ==========================================================
// MY TRANSACTIONS
// ==========================================================

exports.getMyTransactions = async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

        const filter = { user: req.user.id };

        if (req.query.type && req.query.type !== "all") {
            filter.type = req.query.type;
        }

        if (req.query.walletMode && req.query.walletMode !== "all") {
            filter.walletMode = req.query.walletMode;
        }

        if (req.query.dateFrom || req.query.dateTo) {

            filter.createdAt = {};

            if (req.query.dateFrom) {

                const from = new Date(req.query.dateFrom);

                if (!Number.isNaN(from.getTime())) {
                    filter.createdAt.$gte = from;
                }

            }

            if (req.query.dateTo) {

                const to = new Date(req.query.dateTo);

                if (!Number.isNaN(to.getTime())) {

                    to.setHours(23, 59, 59, 999);

                    filter.createdAt.$lte = to;

                }

            }

            if (Object.keys(filter.createdAt).length === 0) {
                delete filter.createdAt;
            }

        }

        if (req.query.search) {

            const cleanSearch = String(req.query.search).trim();

            if (cleanSearch) {

                filter.$or = [
                    { remark: { $regex: cleanSearch, $options: "i" } },
                    { transactionId: { $regex: cleanSearch, $options: "i" } },
                ];

            }

        }

        const [transactions, total] = await Promise.all([
            Transaction.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),

            Transaction.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            transactions,
            total,
            page,
            totalPages: Math.max(Math.ceil(total / limit), 1),
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Unable to fetch transactions.",
        });
    }
};


// ==========================================================
// MY REFERRAL INFO
// ==========================================================

exports.getReferralInfo = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select(
            "referralCode"
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        const [referredCount, qualifiedCount, bonusTransactions] =
            await Promise.all([
                User.countDocuments({ referredBy: req.user.id }),
                User.countDocuments({
                    referredBy: req.user.id,
                    referralQualified: true,
                }),
                Transaction.find({
                    user: req.user.id,
                    type: "bonus",
                }),
            ]);

        const bonusEarned = bonusTransactions.reduce(
            (sum, transaction) => sum + Number(transaction.amount || 0),
            0
        );

        return res.status(200).json({
            success: true,
            referralCode: user.referralCode,
            referredCount,
            qualifiedCount,
            bonusEarned,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Unable to fetch referral info.",
        });
    }
};


// ==========================================================
// MY REFERRED USERS (paginated)
// ==========================================================
//
// Only exposes non-sensitive fields about each referred user
// (name/username, join date, qualified status) - never their
// email, mobile, or financial data.
// ==========================================================

exports.getReferredUsers = async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

        const filter = { referredBy: req.user.id };

        const [users, total] = await Promise.all([
            User.find(filter)
                .select("fullName username referralQualified createdAt")
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            User.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            users,
            total,
            page,
            totalPages: Math.max(Math.ceil(total / limit), 1),
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Unable to fetch referred users.",
        });
    }
};