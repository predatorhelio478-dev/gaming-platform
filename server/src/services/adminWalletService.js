const mongoose =
    require("mongoose");

const User =
    require("../models/User");

const Wallet =
    require("../models/Wallet");

const Transaction =
    require("../models/Transaction");


// ======================================================
// HELPERS
// ======================================================

const toNumber = (
    value
) => {

    const number =
        Number(value);

    return Number.isFinite(number)
        ? number
        : 0;

};


// ======================================================
// PAGINATION
// ======================================================

const normalizePagination = (
    page,
    limit
) => {

    const safePage =
        Math.max(
            Number(page) || 1,
            1
        );


    const safeLimit =
        Math.min(
            Math.max(
                Number(limit) || 20,
                1
            ),
            100
        );


    return {

        page:
            safePage,

        limit:
            safeLimit,

        skip:
            (
                safePage -
                1
            ) *
            safeLimit,

    };

};


// ======================================================
// DATE RANGE
// ======================================================

/*
 * Frontend sends:
 *
 * 2026-09-01
 * 2026-09-02
 *
 * We treat these as India dates.
 *
 * 01 Sep 00:00:00 IST
 * to
 * 02 Sep 23:59:59.999 IST
 */

const buildDateRange = (
    dateFrom = "",
    dateTo = ""
) => {

    const range = {};


    if (
        dateFrom
    ) {

        const start =
            new Date(
                `${dateFrom}T00:00:00+05:30`
            );


        if (
            !Number.isNaN(
                start.getTime()
            )
        ) {

            range.$gte =
                start;

        }

    }


    if (
        dateTo
    ) {

        const end =
            new Date(
                `${dateTo}T23:59:59.999+05:30`
            );


        if (
            !Number.isNaN(
                end.getTime()
            )
        ) {

            range.$lte =
                end;

        }

    }


    return range;

};


// ======================================================
// GET USER IDS FROM TRANSACTIONS
// ======================================================

const getUserIdsByTransactionFilters =
    async ({
        transactionType = "all",
        dateFrom = "",
        dateTo = "",
    } = {}) => {

        const transactionQuery = {};


        // ==================================================
        // TYPE
        // ==================================================

        if (
            transactionType &&
            transactionType !== "all"
        ) {

            transactionQuery.type =
                transactionType;

        }


        // ==================================================
        // DATE
        // ==================================================

        const dateRange =
            buildDateRange(
                dateFrom,
                dateTo
            );


        if (
            Object.keys(
                dateRange
            ).length > 0
        ) {

            transactionQuery.createdAt =
                dateRange;

        }


        // ==================================================
        // NO TRANSACTION FILTER
        // ==================================================

        if (
            Object.keys(
                transactionQuery
            ).length === 0
        ) {

            return null;

        }


        // ==================================================
        // FIND USER IDS
        // ==================================================

        const userIds =
            await Transaction.distinct(
                "user",
                transactionQuery
            );


        return userIds;

    };


// ======================================================
// GET WALLET OVERVIEW
// ======================================================

const getWalletOverview =
    async () => {

        const [

            totalUsers,

            usersWithBalance,

            walletStats,

            transactionStats,

        ] =
            await Promise.all([

                // ==========================================
                // TOTAL USERS
                // ==========================================

                User.countDocuments({}),


                // ==========================================
                // USERS WITH BALANCE
                // ==========================================

                Wallet.countDocuments({

                    balance: {
                        $gt: 0,
                    },

                }),


                // ==========================================
                // WALLET TOTALS
                // ==========================================

                Wallet.aggregate([

                    {
                        $group: {

                            _id:
                                null,

                            totalBalance: {

                                $sum: {

                                    $ifNull: [
                                        "$balance",
                                        0,
                                    ],

                                },

                            },

                            totalWinningBalance: {

                                $sum: {

                                    $ifNull: [
                                        "$winningBalance",
                                        0,
                                    ],

                                },

                            },

                            totalBonusBalance: {

                                $sum: {

                                    $ifNull: [
                                        "$bonusBalance",
                                        0,
                                    ],

                                },

                            },

                            totalLockedBalance: {

                                $sum: {

                                    $ifNull: [
                                        "$lockedBalance",
                                        0,
                                    ],

                                },

                            },

                            totalDeposit: {

                                $sum: {

                                    $ifNull: [
                                        "$totalDeposit",
                                        0,
                                    ],

                                },

                            },

                            totalWithdraw: {

                                $sum: {

                                    $ifNull: [
                                        "$totalWithdraw",
                                        0,
                                    ],

                                },

                            },

                            totalBet: {

                                $sum: {

                                    $ifNull: [
                                        "$totalBet",
                                        0,
                                    ],

                                },

                            },

                            totalWin: {

                                $sum: {

                                    $ifNull: [
                                        "$totalWin",
                                        0,
                                    ],

                                },

                            },

                        },

                    },

                ]),


                // ==========================================
                // TRANSACTION STATISTICS
                // ==========================================

                Transaction.aggregate([

                    {
                        $group: {

                            _id:
                                "$type",

                            count: {

                                $sum:
                                    1,

                            },

                            amount: {

                                $sum: {

                                    $ifNull: [
                                        "$amount",
                                        0,
                                    ],

                                },

                            },

                        },

                    },

                ]),

            ]);


        const wallet =
            walletStats?.[0] ||
            {};


        const transactions = {};


        transactionStats.forEach(
            (
                item
            ) => {

                if (
                    !item?._id
                ) {

                    return;

                }


                transactions[
                    item._id
                ] = {

                    count:
                        Number(
                            item.count
                        ) || 0,

                    amount:
                        toNumber(
                            item.amount
                        ),

                };

            }
        );


        return {

            totalUsers:
                Number(
                    totalUsers
                ) || 0,

            usersWithBalance:
                Number(
                    usersWithBalance
                ) || 0,

            users:
                Number(
                    totalUsers
                ) || 0,


            totalBalance:
                toNumber(
                    wallet.totalBalance
                ),

            totalWinningBalance:
                toNumber(
                    wallet.totalWinningBalance
                ),

            totalBonusBalance:
                toNumber(
                    wallet.totalBonusBalance
                ),

            totalLockedBalance:
                toNumber(
                    wallet.totalLockedBalance
                ),


            totalDeposit:
                toNumber(
                    wallet.totalDeposit
                ),

            totalWithdraw:
                toNumber(
                    wallet.totalWithdraw
                ),

            totalBet:
                toNumber(
                    wallet.totalBet
                ),

            totalWin:
                toNumber(
                    wallet.totalWin
                ),


            transactions,

        };

    };


// ======================================================
// GET USER WALLETS
// ======================================================

const getUserWallets =
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

        const pagination =
            normalizePagination(
                page,
                limit
            );


        // ==================================================
        // USER QUERY
        // ==================================================

        const userQuery = {};


        // ==================================================
        // SEARCH
        // ==================================================

        if (
            search &&
            String(search).trim()
        ) {

            const searchText =
                String(
                    search
                ).trim();


            const searchRegex =
                new RegExp(
                    searchText.replace(
                        /[.*+?^${}()|[\]\\]/g,
                        "\\$&"
                    ),
                    "i"
                );


            userQuery.$or = [

                {
                    fullName:
                        searchRegex,
                },

                {
                    username:
                        searchRegex,
                },

                {
                    email:
                        searchRegex,
                },

                /*
                 * ObjectId search is handled separately
                 * below because Mongo ObjectId cannot be
                 * searched using regex.
                 */

            ];


            if (
                mongoose.Types.ObjectId.isValid(
                    searchText
                )
            ) {

                userQuery.$or.push({

                    _id:
                        searchText,

                });

            }

        }


        // ==================================================
        // TRANSACTION-BASED USER FILTER
        // ==================================================

        const transactionUserIds =
            await getUserIdsByTransactionFilters({

                transactionType,

                dateFrom,

                dateTo,

            });


        if (
            transactionUserIds !== null
        ) {

            /*
             * No matching transactions means
             * no users should be returned.
             */

            if (
                transactionUserIds.length === 0
            ) {

                return {

                    data: [],

                    pagination: {

                        page:
                            pagination.page,

                        limit:
                            pagination.limit,

                        total:
                            0,

                        totalPages:
                            1,

                        hasNextPage:
                            false,

                        hasPreviousPage:
                            false,

                    },

                };

            }


            /*
             * Combine with existing user filters.
             */

            userQuery._id = {

                $in:
                    transactionUserIds,

            };

        }


        // ==================================================
        // WALLET STATUS
        // ==================================================

        /*
         * Wallet status is derived from:
         *
         * - User status
         * - Wallet balance
         * - Locked balance
         *
         * Supported values:
         *
         * active
         * inactive
         * blocked
         * positive
         * zero
         * negative
         * locked
         */

        let walletStatusFilter =
            null;


        if (
            walletStatus &&
            walletStatus !== "all"
        ) {

            walletStatusFilter =
                String(
                    walletStatus
                ).trim().toLowerCase();

        }


        // ==================================================
        // USER STATUS FILTER
        // ==================================================

        if (
            walletStatusFilter ===
            "active"
        ) {

            userQuery.status =
                "active";

        }


        if (
            walletStatusFilter ===
            "blocked"
        ) {

            userQuery.status =
                "blocked";

        }


        if (
            walletStatusFilter ===
            "inactive"
        ) {

            userQuery.status = {

                $ne:
                    "active",

            };

        }


        // ==================================================
        // FIND USERS
        // ==================================================

        const users =
            await User.find(
                userQuery
            )
                .select(
                    "_id fullName username email role status createdAt"
                )
                .lean();


        const userIds =
            users.map(
                (
                    user
                ) =>
                    user._id
            );


        if (
            userIds.length === 0
        ) {

            return {

                data: [],

                pagination: {

                    page:
                        pagination.page,

                    limit:
                        pagination.limit,

                    total:
                        0,

                    totalPages:
                        1,

                    hasNextPage:
                        false,

                    hasPreviousPage:
                        false,

                },

            };

        }


        // ==================================================
        // WALLET QUERY
        // ==================================================

        const walletQuery = {

            user: {

                $in:
                    userIds,

            },

        };


        // ==================================================
        // MIN BALANCE
        // ==================================================

        const numericMin =
            Number(
                minBalance
            );


        if (
            minBalance !==
            undefined &&
            minBalance !==
            null &&
            String(
                minBalance
            ).trim() !== "" &&
            Number.isFinite(
                numericMin
            )
        ) {

            walletQuery.balance = {

                ...(walletQuery.balance || {}),

                $gte:
                    numericMin,

            };

        }


        // ==================================================
        // MAX BALANCE
        // ==================================================

        const numericMax =
            Number(
                maxBalance
            );


        if (
            maxBalance !==
            undefined &&
            maxBalance !==
            null &&
            String(
                maxBalance
            ).trim() !== "" &&
            Number.isFinite(
                numericMax
            )
        ) {

            walletQuery.balance = {

                ...(walletQuery.balance || {}),

                $lte:
                    numericMax,

            };

        }


        // ==================================================
        // WALLET STATUS: POSITIVE
        // ==================================================

        if (
            walletStatusFilter ===
            "positive" ||
            walletStatusFilter ===
            "with_balance" ||
            walletStatusFilter ===
            "funded"
        ) {

            walletQuery.balance = {

                ...(walletQuery.balance || {}),

                $gt:
                    0,

            };

        }


        // ==================================================
        // WALLET STATUS: ZERO
        // ==================================================

        if (
            walletStatusFilter ===
            "zero"
        ) {

            walletQuery.balance =
                0;

        }


        // ==================================================
        // WALLET STATUS: NEGATIVE
        // ==================================================

        if (
            walletStatusFilter ===
            "negative"
        ) {

            walletQuery.balance = {

                ...(walletQuery.balance || {}),

                $lt:
                    0,

            };

        }


        // ==================================================
        // WALLET STATUS: LOCKED
        // ==================================================

        if (
            walletStatusFilter ===
            "locked"
        ) {

            walletQuery.lockedBalance = {

                $gt:
                    0,

            };

        }


        // ==================================================
        // COUNT
        // ==================================================

        const total =
            await Wallet.countDocuments(
                walletQuery
            );


        // ==================================================
        // FETCH
        // ==================================================

        const wallets =
            await Wallet.find(
                walletQuery
            )
                .sort({

                    balance:
                        -1,

                    updatedAt:
                        -1,

                })
                .skip(
                    pagination.skip
                )
                .limit(
                    pagination.limit
                )
                .lean();


        // ==================================================
        // USER MAP
        // ==================================================

        const userMap =
            new Map(

                users.map(
                    (
                        user
                    ) => [

                            String(
                                user._id
                            ),

                            user,

                        ]
                )

            );


        // ==================================================
        // COMBINE
        // ==================================================

        const data =
            wallets.map(
                (
                    wallet
                ) => {

                    const user =
                        userMap.get(
                            String(
                                wallet.user
                            )
                        );


                    return {

                        _id:
                            wallet._id,

                        user:
                            user ||
                            null,


                        balance:
                            toNumber(
                                wallet.balance
                            ),

                        winningBalance:
                            toNumber(
                                wallet.winningBalance
                            ),

                        bonusBalance:
                            toNumber(
                                wallet.bonusBalance
                            ),

                        lockedBalance:
                            toNumber(
                                wallet.lockedBalance
                            ),

                        totalDeposit:
                            toNumber(
                                wallet.totalDeposit
                            ),

                        totalWithdraw:
                            toNumber(
                                wallet.totalWithdraw
                            ),

                        totalBet:
                            toNumber(
                                wallet.totalBet
                            ),

                        totalWin:
                            toNumber(
                                wallet.totalWin
                            ),

                        createdAt:
                            wallet.createdAt,

                        updatedAt:
                            wallet.updatedAt,

                    };

                }
            );


        // ==================================================
        // PAGINATION
        // ==================================================

        const totalPages =
            total > 0
                ? Math.ceil(
                    total /
                    pagination.limit
                )
                : 1;


        return {

            data,

            pagination: {

                page:
                    pagination.page,

                limit:
                    pagination.limit,

                total,

                totalPages,

                hasNextPage:
                    pagination.page <
                    totalPages,

                hasPreviousPage:
                    pagination.page >
                    1,

            },

        };

    };


// ======================================================
// GET USER WALLET DETAILS
// ======================================================

const getUserWalletDetails =
    async (
        userId
    ) => {

        if (
            !mongoose.Types.ObjectId.isValid(
                userId
            )
        ) {

            throw new Error(
                "Invalid user ID."
            );

        }


        const user =
            await User.findById(
                userId
            )
                .select(
                    "_id fullName username email role status createdAt lastLogin"
                )
                .lean();


        if (!user) {

            throw new Error(
                "User not found."
            );

        }


        const wallet =
            await Wallet.findOne({

                user:
                    userId,

            }).lean();


        if (!wallet) {

            throw new Error(
                "Wallet not found."
            );

        }


        const transactions =
            await Transaction.find({

                user:
                    userId,

            })
                .sort({

                    createdAt:
                        -1,

                })
                .limit(
                    20
                )
                .lean();


        return {

            user,

            wallet: {

                ...wallet,

                balance:
                    toNumber(
                        wallet.balance
                    ),

                winningBalance:
                    toNumber(
                        wallet.winningBalance
                    ),

                bonusBalance:
                    toNumber(
                        wallet.bonusBalance
                    ),

                lockedBalance:
                    toNumber(
                        wallet.lockedBalance
                    ),

                totalDeposit:
                    toNumber(
                        wallet.totalDeposit
                    ),

                totalWithdraw:
                    toNumber(
                        wallet.totalWithdraw
                    ),

                totalBet:
                    toNumber(
                        wallet.totalBet
                    ),

                totalWin:
                    toNumber(
                        wallet.totalWin
                    ),

            },

            transactions,

        };

    };


// ======================================================
// GET TRANSACTIONS
// ======================================================

const getTransactions =
    async ({
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

    } = {}) => {

        const pagination =
            normalizePagination(
                page,
                limit
            );


        const query = {};


        // ==================================================
        // TYPE
        // ==================================================

        if (
            type &&
            type !== "all"
        ) {

            query.type =
                type;

        }


        // ==================================================
        // STATUS
        // ==================================================

        if (
            status &&
            status !== "all"
        ) {

            query.status =
                status;

        }


        // ==================================================
        // DATE
        // ==================================================

        const dateRange =
            buildDateRange(
                dateFrom,
                dateTo
            );


        if (
            Object.keys(
                dateRange
            ).length > 0
        ) {

            query.createdAt =
                dateRange;

        }


        // ==================================================
        // USER ID
        // ==================================================

        if (
            userId
        ) {

            if (
                !mongoose.Types.ObjectId.isValid(
                    userId
                )
            ) {

                throw new Error(
                    "Invalid user ID."
                );

            }


            query.user =
                userId;

        }


        // ==================================================
        // SEARCH
        // ==================================================

        if (
            search &&
            String(search).trim()
        ) {

            const searchText =
                String(
                    search
                ).trim();


            const searchRegex =
                new RegExp(
                    searchText.replace(
                        /[.*+?^${}()|[\]\\]/g,
                        "\\$&"
                    ),
                    "i"
                );


            /*
             * Search transaction ID
             * and remark.
             */

            query.$or = [

                {
                    transactionId:
                        searchRegex,
                },

                {
                    remark:
                        searchRegex,
                },

            ];


            /*
             * Search user name/email/username
             * too.
             *
             * We resolve matching users first.
             */

            const matchingUsers =
                await User.find({

                    $or: [

                        {
                            fullName:
                                searchRegex,
                        },

                        {
                            username:
                                searchRegex,
                        },

                        {
                            email:
                                searchRegex,
                        },

                    ],

                })
                    .select(
                        "_id"
                    )
                    .lean();


            const matchingUserIds =
                matchingUsers.map(
                    (
                        user
                    ) =>
                        user._id
                );


            if (
                matchingUserIds.length > 0
            ) {

                query.$or.push({

                    user: {

                        $in:
                            matchingUserIds,

                    },

                });

            }


            /*
             * If search is a valid ObjectId,
             * include that user too.
             */

            if (
                mongoose.Types.ObjectId.isValid(
                    searchText
                )
            ) {

                query.$or.push({

                    user:
                        searchText,

                });

            }

        }


        // ==================================================
        // WALLET STATUS / BALANCE FILTER
        // ==================================================

        /*
         * For transaction records, wallet status
         * and current balance are properties of
         * the user's wallet.
         *
         * We resolve matching wallet user IDs
         * and intersect them with the transaction
         * query.
         */

        let walletUserIds =
            null;


        const walletFilterActive =
            Boolean(
                walletStatus &&
                walletStatus !== "all"
            ) ||
            (
                minBalance !== "" &&
                minBalance !== null &&
                minBalance !== undefined
            ) ||
            (
                maxBalance !== "" &&
                maxBalance !== null &&
                maxBalance !== undefined
            );


        if (
            walletFilterActive
        ) {

            const walletQuery = {};


            // ==============================================
            // BALANCE RANGE
            // ==============================================

            const numericMin =
                Number(
                    minBalance
                );


            if (
                minBalance !==
                undefined &&
                minBalance !==
                null &&
                String(
                    minBalance
                ).trim() !== "" &&
                Number.isFinite(
                    numericMin
                )
            ) {

                walletQuery.balance = {

                    ...(walletQuery.balance || {}),

                    $gte:
                        numericMin,

                };

            }


            const numericMax =
                Number(
                    maxBalance
                );


            if (
                maxBalance !==
                undefined &&
                maxBalance !==
                null &&
                String(
                    maxBalance
                ).trim() !== "" &&
                Number.isFinite(
                    numericMax
                )
            ) {

                walletQuery.balance = {

                    ...(walletQuery.balance || {}),

                    $lte:
                        numericMax,

                };

            }


            // ==============================================
            // STATUS
            // ==============================================

            const normalizedStatus =
                String(
                    walletStatus ||
                    ""
                )
                    .trim()
                    .toLowerCase();


            if (
                normalizedStatus ===
                "positive" ||
                normalizedStatus ===
                "with_balance" ||
                normalizedStatus ===
                "funded"
            ) {

                walletQuery.balance = {

                    ...(walletQuery.balance || {}),

                    $gt:
                        0,

                };

            }


            if (
                normalizedStatus ===
                "zero"
            ) {

                walletQuery.balance =
                    0;

            }


            if (
                normalizedStatus ===
                "negative"
            ) {

                walletQuery.balance = {

                    ...(walletQuery.balance || {}),

                    $lt:
                        0,

                };

            }


            if (
                normalizedStatus ===
                "locked"
            ) {

                walletQuery.lockedBalance = {

                    $gt:
                        0,

                };

            }


            const matchingWallets =
                await Wallet.find(
                    walletQuery
                )
                    .select(
                        "user"
                    )
                    .lean();


            walletUserIds =
                matchingWallets.map(
                    (
                        wallet
                    ) =>
                        wallet.user
                );


            /*
             * No matching wallets means
             * no transactions.
             */

            if (
                walletUserIds.length === 0
            ) {

                return {

                    data: [],

                    pagination: {

                        page:
                            pagination.page,

                        limit:
                            pagination.limit,

                        total:
                            0,

                        totalPages:
                            1,

                        hasNextPage:
                            false,

                        hasPreviousPage:
                            false,

                    },

                };

            }


            // ==============================================
            // INTERSECT USER FILTER
            // ==============================================

            if (
                query.user
            ) {

                /*
                 * Specific user + wallet filter.
                 */

                const specificUser =
                    String(
                        query.user
                    );


                const exists =
                    walletUserIds.some(
                        (
                            id
                        ) =>
                            String(id) ===
                            specificUser
                    );


                if (
                    !exists
                ) {

                    return {

                        data: [],

                        pagination: {

                            page:
                                pagination.page,

                            limit:
                                pagination.limit,

                            total:
                                0,

                            totalPages:
                                1,

                            hasNextPage:
                                false,

                            hasPreviousPage:
                                false,

                        },

                    };

                }

            } else {

                /*
                 * Apply wallet user IDs.
                 */

                query.user = {

                    $in:
                        walletUserIds,

                };

            }

        }


        // ==================================================
        // COUNT
        // ==================================================

        const total =
            await Transaction.countDocuments(
                query
            );


        // ==================================================
        // FETCH
        // ==================================================

        const transactions =
            await Transaction.find(
                query
            )
                .populate(
                    "user",
                    "_id fullName username email role status"
                )
                .populate(
                    "wallet",
                    "_id balance winningBalance bonusBalance lockedBalance"
                )
                .populate(
                    "payout",
                    "_id"
                )
                .sort({

                    createdAt:
                        -1,

                })
                .skip(
                    pagination.skip
                )
                .limit(
                    pagination.limit
                )
                .lean();


        // ==================================================
        // PAGINATION
        // ==================================================

        const totalPages =
            total > 0
                ? Math.ceil(
                    total /
                    pagination.limit
                )
                : 1;


        return {

            data:
                transactions,

            pagination: {

                page:
                    pagination.page,

                limit:
                    pagination.limit,

                total,

                totalPages,

                hasNextPage:
                    pagination.page <
                    totalPages,

                hasPreviousPage:
                    pagination.page >
                    1,

            },

        };

    };


// ======================================================
// EXPORT
// ======================================================

module.exports = {

    getWalletOverview,

    getUserWallets,

    getUserWalletDetails,

    getTransactions,

};