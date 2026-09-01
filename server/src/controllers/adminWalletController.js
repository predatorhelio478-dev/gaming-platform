const adminWalletService =
    require("../services/adminWalletService");

const walletService =
    require("../services/walletService");


// ======================================================
// GET WALLET OVERVIEW
// ======================================================

const getWalletOverview =
    async (
        req,
        res
    ) => {

        try {

            const overview =
                await adminWalletService.getWalletOverview();


            return res.status(200).json({

                success:
                    true,

                message:
                    "Wallet overview fetched successfully.",

                data:
                    overview,

            });

        } catch (
        error
        ) {

            console.error(
                "Admin Wallet Overview Error:",
                error
            );


            return res.status(500).json({

                success:
                    false,

                message:
                    error?.message ||
                    "Unable to fetch wallet overview.",

            });

        }

    };


// ======================================================
// GET USER WALLETS
// ======================================================

const getUserWallets =
    async (
        req,
        res
    ) => {

        try {

            const {

                page = 1,
                limit = 20,
                search = "",
                walletStatus = "all",
                transactionType = "all",
                dateFrom = "",
                dateTo = "",
                minBalance = "",
                maxBalance = "",

            } =
                req.query;


            const result =
                await adminWalletService.getUserWallets({

                    page,
                    limit,
                    search,

                    walletStatus,
                    transactionType,

                    dateFrom,
                    dateTo,

                    minBalance,
                    maxBalance,

                });


            return res.status(200).json({

                success:
                    true,

                message:
                    "User wallets fetched successfully.",

                data:
                    result?.data ||
                    [],

                pagination:
                    result?.pagination ||
                    {

                        page:
                            Number(page) || 1,

                        limit:
                            Number(limit) || 20,

                        total:
                            0,

                        totalPages:
                            1,

                        hasNextPage:
                            false,

                        hasPreviousPage:
                            false,

                    },

            });

        } catch (
        error
        ) {

            console.error(
                "Admin User Wallets Error:",
                error
            );


            return res.status(500).json({

                success:
                    false,

                message:
                    error?.message ||
                    "Unable to fetch user wallets.",

            });

        }

    };


// ======================================================
// GET USER WALLET DETAILS
// ======================================================

const getUserWalletDetails =
    async (
        req,
        res
    ) => {

        try {

            const {
                userId,
            } =
                req.params;


            if (!userId) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "User ID is required.",

                });

            }


            const result =
                await adminWalletService.getUserWalletDetails(
                    userId
                );


            return res.status(200).json({

                success:
                    true,

                message:
                    "User wallet details fetched successfully.",

                data:
                    result,

            });

        } catch (
        error
        ) {

            console.error(
                "Admin User Wallet Details Error:",
                error
            );


            if (

                error?.message ===
                "Invalid user ID." ||

                error?.message ===
                "User not found." ||

                error?.message ===
                "Wallet not found."

            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        error.message,

                });

            }


            return res.status(500).json({

                success:
                    false,

                message:
                    "Unable to fetch user wallet details.",

            });

        }

    };


// ======================================================
// GET WALLET TRANSACTIONS
// ======================================================

const getTransactions =
    async (
        req,
        res
    ) => {

        try {

            const {
                page = 1,
                limit = 20,

                search = "",

                type = "all",

                status = "all",

                userId = "",

                walletStatus = "all",

                dateFrom = "",

                dateTo = "",

                minBalance = "",

                maxBalance = "",

            } = req.query;


            const result =
                await adminWalletService.getTransactions({

                    page,
                    limit,

                    search,

                    type,

                    status,

                    userId,

                    walletStatus,

                    dateFrom,
                    dateTo,

                    minBalance,
                    maxBalance,

                });


            return res.status(200).json({

                success:
                    true,

                message:
                    "Wallet transactions fetched successfully.",

                data:
                    result?.data ||
                    [],

                pagination:
                    result?.pagination ||
                    {

                        page:
                            Number(page) || 1,

                        limit:
                            Number(limit) || 20,

                        total:
                            0,

                        totalPages:
                            1,

                        hasNextPage:
                            false,

                        hasPreviousPage:
                            false,

                    },

            });

        } catch (
        error
        ) {

            console.error(
                "Admin Wallet Transactions Error:",
                error
            );


            if (
                error?.message ===
                "Invalid user ID."
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        error.message,

                });

            }


            return res.status(500).json({

                success:
                    false,

                message:
                    error?.message ||
                    "Unable to fetch wallet transactions.",

            });

        }

    };


// ======================================================
// ADJUST USER WALLET
// ======================================================

const adjustUserWallet =
    async (
        req,
        res
    ) => {

        try {

            const {
                userId,
                type,
                amount,
                remark,
            } = req.body;


            // ==========================================
            // USER ID
            // ==========================================

            if (!userId) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "User ID is required.",

                });

            }


            // ==========================================
            // TYPE
            // ==========================================

            if (
                ![
                    "admin_credit",
                    "admin_debit",
                ].includes(type)
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Invalid wallet adjustment type.",

                });

            }


            // ==========================================
            // AMOUNT
            // ==========================================

            const numericAmount =
                Number(amount);


            if (
                !Number.isFinite(
                    numericAmount
                ) ||
                numericAmount <= 0
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Valid amount is required.",

                });

            }


            // ==========================================
            // REMARK
            // ==========================================

            const cleanRemark =
                String(
                    remark || ""
                ).trim();


            if (!cleanRemark) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Adjustment reason is required.",

                });

            }


            // ==========================================
            // CREDIT
            // ==========================================

            let result;


            if (
                type ===
                "admin_credit"
            ) {

                result =
                    await walletService.credit(

                        userId,

                        numericAmount,

                        "admin_credit",

                        cleanRemark

                    );

            }


            // ==========================================
            // DEBIT
            // ==========================================

            if (
                type ===
                "admin_debit"
            ) {

                result =
                    await walletService.debit(

                        userId,

                        numericAmount,

                        "admin_debit",

                        cleanRemark

                    );

            }


            // ==========================================
            // RESPONSE
            // ==========================================

            return res.status(200).json({

                success:
                    true,

                message:
                    type ===
                        "admin_credit"

                        ? "Wallet credited successfully."

                        : "Wallet debited successfully.",

                data: {

                    userId,

                    type,

                    amount:
                        numericAmount,

                    remark:
                        cleanRemark,

                    previousBalance:
                        result?.previousBalance,

                    currentBalance:
                        result?.currentBalance,

                    transaction:
                        result?.transaction,

                    transactionId:
                        result?.transactionId,

                },

            });

        } catch (
        error
        ) {

            console.error(
                "Admin Wallet Adjustment Error:",
                error
            );


            const message =
                error?.message ||
                "Unable to adjust wallet.";


            let statusCode =
                400;


            if (
                message ===
                "Wallet not found"
            ) {

                statusCode =
                    404;

            }


            if (
                message ===
                "Wallet not found."
            ) {

                statusCode =
                    404;

            }


            return res.status(
                statusCode
            ).json({

                success:
                    false,

                message,

            });

        }

    };

// ======================================================
// EXPORT
// ======================================================

module.exports = {

    getWalletOverview,

    getUserWallets,

    getUserWalletDetails,

    getTransactions,

    adjustUserWallet,
};