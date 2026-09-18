const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const crypto = require("crypto");

const User =
    require("../models/User");

const Wallet =
    require("../models/Wallet");

const Bet =
    require("../models/Bet");

const Transaction =
    require("../models/Transaction");

const Payout =
    require("../models/Payout");

const generateTransactionId =
    require("../utils/transactionIdGenerator");

const walletService =
    require("./walletService");


// ======================================================
// HELPERS
// ======================================================

const isValidObjectId = (id) => {

    return mongoose.Types.ObjectId.isValid(
        id
    );

};


const buildUserResponse = (
    user,
    wallet = null
) => {

    if (!user) {
        return null;
    }


    return {

        _id:
            user._id,

        fullName:
            user.fullName || "",

        username:
            user.username || "",

        email:
            user.email || "",

        mobile:
            user.mobile || "",

        role:
            user.role || "user",

        status:
            user.status || "active",

        isDeleted:
            Boolean(
                user.isDeleted
            ),

        deletedAt:
            user.deletedAt || null,

        isPermanentlyDeleted:
            Boolean(
                user.isPermanentlyDeleted
            ),

        permanentlyDeletedAt:
            user.permanentlyDeletedAt || null,

        isVerified:
            Boolean(
                user.isVerified
            ),

        emailVerified:
            Boolean(
                user.emailVerified
            ),

        mobileVerified:
            Boolean(
                user.mobileVerified
            ),

        referralCode:
            user.referralCode || null,

        referredBy:
            user.referredBy || null,

        lastLogin:
            user.lastLogin || null,

        createdAt:
            user.createdAt,

        updatedAt:
            user.updatedAt,

        wallet:
            wallet
                ? {

                    _id:
                        wallet._id,

                    balance:
                        Number(
                            wallet.balance || 0
                        ),

                    totalDeposit:
                        Number(
                            wallet.totalDeposit || 0
                        ),

                    totalWithdraw:
                        Number(
                            wallet.totalWithdraw || 0
                        ),

                    totalBet:
                        Number(
                            wallet.totalBet || 0
                        ),

                    totalWin:
                        Number(
                            wallet.totalWin || 0
                        ),

                    winningBalance:
                        Number(
                            wallet.winningBalance || 0
                        ),

                }
                : null,

    };

};


// ======================================================
// GET USERS
// ======================================================

const getUsers = async ({
    page = 1,
    limit = 20,
    search = "",
    status = "all",
    role = "all",
} = {}) => {


    page =
        Math.max(
            Number(page) || 1,
            1
        );


    limit =
        Math.min(
            Math.max(
                Number(limit) || 20,
                1
            ),
            100
        );


    const skip =
        (page - 1) * limit;


    const filter = {};


    // ==================================================
    // STATUS FILTER
    // ==================================================

    if (
        status &&
        status !== "all" &&
        [
            "active",
            "blocked",
        ].includes(status)
    ) {

        filter.status =
            status;

    }


    // ==================================================
    // ROLE FILTER
    // ==================================================

    if (
        role &&
        role !== "all" &&
        [
            "user",
            "admin",
        ].includes(role)
    ) {

        filter.role =
            role;

    }


    // ==================================================
    // SEARCH
    // ==================================================

    if (
        search &&
        search.trim()
    ) {

        const searchText =
            search.trim();


        const searchRegex =
            new RegExp(
                searchText.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&"
                ),
                "i"
            );


        const orConditions = [

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

            {
                mobile:
                    searchRegex,
            },

            {
                referralCode:
                    searchRegex,
            },

        ];


        /*
         * Search by ObjectId when valid.
         */

        if (
            isValidObjectId(
                searchText
            )
        ) {

            const objectId =
                new mongoose.Types.ObjectId(
                    searchText
                );


            orConditions.push({

                _id:
                    objectId,

            });


            orConditions.push({

                referredBy:
                    objectId,

            });

        }


        filter.$or =
            orConditions;

    }


    // ==================================================
    // FETCH USERS
    // ==================================================

    const [
        users,
        total,
    ] = await Promise.all([

        User.find(filter)

            /*
             * Explicitly exclude password even though
             * User schema already has select:false.
             */

            .select("-password")

            .populate(
                "referredBy",
                "fullName username referralCode"
            )

            .sort({
                createdAt:
                    -1,
            })

            .skip(skip)

            .limit(limit)

            .lean(),


        User.countDocuments(
            filter
        ),

    ]);


    // ==================================================
    // FETCH WALLETS
    // ==================================================

    const userIds =
        users.map(
            (user) =>
                user._id
        );


    let walletMap = {};


    if (
        userIds.length > 0
    ) {

        const wallets =
            await Wallet.find({

                user: {
                    $in:
                        userIds,
                },

            })
                .lean();


        walletMap =
            wallets.reduce(
                (
                    accumulator,
                    wallet
                ) => {

                    accumulator[
                        String(
                            wallet.user
                        )
                    ] =
                        wallet;

                    return accumulator;

                },
                {}
            );

    }


    // ==================================================
    // FORMAT USERS
    // ==================================================

    const data =
        users.map(
            (user) => {

                return buildUserResponse(

                    user,

                    walletMap[
                    String(
                        user._id
                    )
                    ] || null

                );

            }
        );


    // ==================================================
    // PAGINATION
    // ==================================================

    const totalPages =
        Math.ceil(
            total /
            limit
        );


    return {

        data,

        pagination: {

            page,

            limit,

            total,

            totalPages,

            hasNextPage:
                page <
                totalPages,

            hasPreviousPage:
                page >
                1,

        },

    };

};


// ======================================================
// GET USER BY ID
// ======================================================

// ======================================================
// GET USER BY ID
// ======================================================

const getUserById = async (
    userId
) => {

    // ==================================================
    // VALIDATE ID
    // ==================================================

    if (
        !isValidObjectId(
            userId
        )
    ) {

        throw new Error(
            "Invalid user ID."
        );

    }


    // ==================================================
    // FETCH USER
    // ==================================================

    const user =
        await User.findById(
            userId
        )

            .select("-password")

            .populate(
                "referredBy",
                "fullName username referralCode"
            )

            .lean();


    if (!user) {

        throw new Error(
            "User not found."
        );

    }


    // ==================================================
    // FETCH WALLET
    // ==================================================

    const wallet =
        await Wallet.findOne({

            user:
                user._id,

        }).lean();


    // ==================================================
    // BASIC COUNTS
    // ==================================================

    const [

        totalBets,

        totalTransactions,

        totalPayouts,

    ] = await Promise.all([

        /*
         * ALL HISTORICAL BETS
         */

        Bet.countDocuments({

            user:
                user._id,

        }),


        /*
         * ALL HISTORICAL TRANSACTIONS
         */

        Transaction.countDocuments({

            user:
                user._id,

        }),


        /*
         * ALL HISTORICAL PAYOUT RECORDS
         */

        Payout.countDocuments({

            user:
                user._id,

        }),

    ]);


    // ==================================================
    // BET STATISTICS
    // ==================================================

    const betSummary =
        await Bet.aggregate([

            {
                $match: {

                    user:
                        user._id,

                },

            },


            {
                $group: {

                    _id:
                        null,


                    /*
                     * Total amount user has
                     * historically bet.
                     */

                    totalBetAmount: {

                        $sum:
                        {
                            $ifNull: [
                                "$amount",
                                0,
                            ],
                        },

                    },


                    /*
                     * Total payout recorded
                     * against bets.
                     */

                    totalWinAmount: {

                        $sum:
                        {
                            $ifNull: [
                                "$payout",
                                0,
                            ],
                        },

                    },


                    /*
                     * Count winning bets.
                     */

                    totalWins: {

                        $sum: {

                            $cond: [

                                {
                                    $eq: [
                                        "$result",
                                        "won",
                                    ],
                                },

                                1,

                                0,

                            ],

                        },

                    },


                    /*
                     * Count losing bets.
                     */

                    totalLosses: {

                        $sum: {

                            $cond: [

                                {
                                    $eq: [
                                        "$result",
                                        "lost",
                                    ],
                                },

                                1,

                                0,

                            ],

                        },

                    },


                    /*
                     * Count pending bets.
                     */

                    totalPending: {

                        $sum: {

                            $cond: [

                                {
                                    $eq: [
                                        "$result",
                                        "pending",
                                    ],
                                },

                                1,

                                0,

                            ],

                        },

                    },

                },

            },

        ]);


    const betStats =
        betSummary[0] || {

            totalBetAmount:
                0,

            totalWinAmount:
                0,

            totalWins:
                0,

            totalLosses:
                0,

            totalPending:
                0,

        };


    // ==================================================
    // TRANSACTION STATISTICS
    // ==================================================

    const transactionSummary =
        await Transaction.aggregate([

            {
                $match: {

                    user:
                        user._id,

                },

            },


            {
                $group: {

                    _id:
                        "$type",


                    totalAmount: {

                        $sum:
                        {
                            $cond: [

                                {
                                    $eq: [
                                        "$status",
                                        "success",
                                    ],
                                },

                                {
                                    $ifNull: [
                                        "$amount",
                                        0,
                                    ],
                                },

                                0,

                            ],
                        },

                    },


                    totalCount: {

                        $sum:
                            1,

                    },


                    successfulCount: {

                        $sum: {

                            $cond: [

                                {
                                    $eq: [
                                        "$status",
                                        "success",
                                    ],
                                },

                                1,

                                0,

                            ],

                        },

                    },

                },

            },

        ]);


    /*
     * Keep the original type-wise
     * transaction information too.
     */

    const transactionStatsByType = {};


    transactionSummary.forEach(
        (item) => {

            transactionStatsByType[
                item._id
            ] = {

                amount:
                    Number(
                        item.totalAmount ||
                        0
                    ),

                count:
                    Number(
                        item.totalCount ||
                        0
                    ),

                successfulCount:
                    Number(
                        item.successfulCount ||
                        0
                    ),

            };

        }
    );


    // ==================================================
    // NORMALIZED TRANSACTION VALUES
    // ==================================================

    /*
     * Deposit transaction.
     */

    const depositStats =
        transactionStatsByType[
        "deposit"
        ] || {

            amount:
                0,

            count:
                0,

            successfulCount:
                0,

        };


    /*
     * Withdrawal transaction.
     *
     * Your wallet service uses:
     *
     * type === "withdraw"
     */

    const withdrawalStats =
        transactionStatsByType[
        "withdraw"
        ] || {

            amount:
                0,

            count:
                0,

            successfulCount:
                0,

        };


    // ==================================================
    // PAYOUT STATISTICS
    // ==================================================

    const payoutSummary =
        await Payout.aggregate([

            {
                $match: {

                    user:
                        user._id,

                },

            },


            {
                $group: {

                    _id:
                        "$status",


                    amount: {

                        $sum:
                        {
                            $ifNull: [
                                "$payoutAmount",
                                0,
                            ],
                        },

                    },


                    count: {

                        $sum:
                            1,

                    },

                },

            },

        ]);


    const payoutStatsByStatus = {};


    payoutSummary.forEach(
        (item) => {

            payoutStatsByStatus[
                item._id
            ] = {

                amount:
                    Number(
                        item.amount ||
                        0
                    ),

                count:
                    Number(
                        item.count ||
                        0
                    ),

            };

        }
    );


    // ==================================================
    // PAID PAYOUTS
    // ==================================================

    const paidPayouts =
        payoutStatsByStatus[
        "paid"
        ] || {

            amount:
                0,

            count:
                0,

        };


    // ==================================================
    // FINAL NORMALIZED RESPONSE
    // ==================================================

    return {

        // ==================================================
        // USER
        // ==================================================

        user:
            buildUserResponse(
                user,
                wallet
            ),


        // ==================================================
        // BETTING STATISTICS
        // ==================================================

        bettingStats: {

            totalBets:
                Number(
                    totalBets
                ),

            totalBetAmount:
                Number(
                    betStats.totalBetAmount ||
                    0
                ),

            totalWins:
                Number(
                    betStats.totalWins ||
                    0
                ),

            totalWinAmount:
                Number(
                    betStats.totalWinAmount ||
                    0
                ),

            totalLosses:
                Number(
                    betStats.totalLosses ||
                    0
                ),

            totalPending:
                Number(
                    betStats.totalPending ||
                    0
                ),

        },


        // ==================================================
        // TRANSACTION STATISTICS
        // ==================================================

        transactionStats: {

            totalTransactions:
                Number(
                    totalTransactions
                ),

            totalDeposits:
                Number(
                    depositStats.amount ||
                    0
                ),

            totalWithdrawals:
                Number(
                    withdrawalStats.amount ||
                    0
                ),

            depositCount:
                Number(
                    depositStats.successfulCount ||
                    0
                ),

            withdrawalCount:
                Number(
                    withdrawalStats.successfulCount ||
                    0
                ),

            /*
             * Keep detailed transaction
             * type information for future UI.
             */

            byType:
                transactionStatsByType,

        },


        // ==================================================
        // PAYOUT STATISTICS
        // ==================================================

        payoutStats: {

            /*
             * Number of payouts that
             * actually reached wallet.
             */

            totalPayouts:
                Number(
                    paidPayouts.count ||
                    0
                ),

            totalPayoutAmount:
                Number(
                    paidPayouts.amount ||
                    0
                ),

            /*
             * Keep complete status breakdown.
             */

            byStatus:
                payoutStatsByStatus,

            /*
             * Total payout records,
             * including non-paid records.
             */

            totalRecords:
                Number(
                    totalPayouts
                ),

        },


        // ==================================================
        // BACKWARD COMPATIBILITY
        // ==================================================

        /*
         * Keep these fields so any older
         * frontend code doesn't immediately break.
         */

        stats: {

            totalBets:
                Number(
                    totalBets
                ),

            totalTransactions:
                Number(
                    totalTransactions
                ),

            totalPayouts:
                Number(
                    totalPayouts
                ),

            totalBetAmount:
                Number(
                    betStats.totalBetAmount ||
                    0
                ),

            totalBetPayout:
                Number(
                    betStats.totalWinAmount ||
                    0
                ),

        },

    };

};


// ======================================================
// UPDATE USER STATUS
// ======================================================

const updateUserStatus = async (
    userId,
    status
) => {


    if (
        !isValidObjectId(
            userId
        )
    ) {

        throw new Error(
            "Invalid user ID."
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


    const user =
        await User.findById(
            userId
        );


    if (!user) {

        throw new Error(
            "User not found."
        );

    }


    /*
     * Admin account protection.
     *
     * Current User model has role:
     * user / admin.
     *
     * We should not allow the Users page
     * to accidentally block an admin.
     */

    if (
        user.role ===
        "admin"
    ) {

        throw new Error(
            "Admin users cannot be blocked from the Users module."
        );

    }


    /*
     * Already same status.
     */

    if (
        user.status ===
        status
    ) {

        return {

            alreadyUpdated:
                true,

            user:
                buildUserResponse(
                    user.toObject()
                ),

        };

    }


    user.status =
        status;


    await user.save();


    return {

        alreadyUpdated:
            false,

        user:
            buildUserResponse(
                user.toObject()
            ),

    };

};

// ======================================================
// DEACTIVATE USER (SOFT DELETE)
// ======================================================
//
// Financial/audit/bet/referral records are untouched -
// they still reference this user's ObjectId. Only login
// and API access are blocked (see middleware/auth.js and
// authController.login).
// ======================================================

const deactivateUser = async (
    userId
) => {

    if (
        !isValidObjectId(
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
        );


    if (!user) {

        throw new Error(
            "User not found."
        );

    }


    if (
        user.role ===
        "admin"
    ) {

        throw new Error(
            "Admin users cannot be deactivated from the Users module."
        );

    }


    if (user.isDeleted) {

        return {

            alreadyDeactivated:
                true,

            user:
                buildUserResponse(
                    user.toObject()
                ),

        };

    }


    user.isDeleted =
        true;

    user.deletedAt =
        new Date();


    await user.save();


    return {

        alreadyDeactivated:
            false,

        user:
            buildUserResponse(
                user.toObject()
            ),

    };

};


// ======================================================
// PERMANENTLY DELETE USER (anonymize, never hard-delete
// the document - every financial/bet/transaction/audit/
// support record must keep resolving to this same user)
// ======================================================

const deleteUser = async (
    userId
) => {

    if (
        !isValidObjectId(
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
        );


    if (!user) {

        throw new Error(
            "User not found."
        );

    }


    if (
        user.role ===
        "admin"
    ) {

        throw new Error(
            "Admin users cannot be deleted from the Users module."
        );

    }


    if (user.isPermanentlyDeleted) {

        return {

            alreadyDeleted:
                true,

            user:
                buildUserResponse(
                    user.toObject()
                ),

        };

    }


    /*
     * ==========================================
     * ANONYMIZE (account data only - never touches
     * Wallet/Bet/Transaction/DepositRequest/
     * WithdrawalRequest/Payout/SupportTicket/
     * Notification/AuditLog, which all keep
     * referencing this same _id)
     * ==========================================
     */

    const anonymizedTag =
        String(user._id);

    const unusablePasswordHash =
        await bcrypt.hash(
            crypto.randomBytes(32).toString("hex"),
            10
        );

    user.fullName =
        "Deleted User";

    user.username =
        `deleted_${anonymizedTag}`;

    user.email =
        `deleted_${anonymizedTag}@deleted.local`;

    user.mobile =
        "";

    user.password =
        unusablePasswordHash;

    user.status =
        "blocked";

    user.isDeleted =
        true;

    user.deletedAt =
        user.deletedAt || new Date();

    user.isPermanentlyDeleted =
        true;

    user.permanentlyDeletedAt =
        new Date();


    await user.save();


    return {

        alreadyDeleted:
            false,

        user:
            buildUserResponse(
                user.toObject()
            ),

    };

};


// ======================================================
// ADMIN-INITIATED PASSWORD CHANGE (for a normal user)
// ======================================================

const changeUserPassword = async (
    userId,
    newPassword
) => {

    if (
        !isValidObjectId(
            userId
        )
    ) {

        throw new Error(
            "Invalid user ID."
        );

    }


    if (
        !newPassword ||
        String(newPassword).length < 6
    ) {

        throw new Error(
            "New password must be at least 6 characters."
        );

    }


    const user =
        await User.findById(
            userId
        );


    if (!user) {

        throw new Error(
            "User not found."
        );

    }


    if (
        user.role ===
        "admin"
    ) {

        throw new Error(
            "This user's password cannot be changed from the Users module."
        );

    }


    if (user.isPermanentlyDeleted) {

        throw new Error(
            "This user account has been deleted."
        );

    }


    user.password =
        await bcrypt.hash(
            newPassword,
            10
        );


    await user.save();


    return {

        user:
            buildUserResponse(
                user.toObject()
            ),

    };

};


// ======================================================
// CREATE USER
// ======================================================

const createUser = async ({
    fullName,
    username,
    email,
    mobile = "",
    password,
    role = "user",
    status = "active",
}) => {

    /*
     * ==========================================
     * VALIDATION
     * ==========================================
     */

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

    if (!password || password.length < 6) {
        throw new Error(
            "Password must be at least 6 characters."
        );
    }

    if (
        !["user", "admin"].includes(role)
    ) {
        throw new Error(
            "Invalid user role."
        );
    }

    if (
        !["active", "blocked"].includes(status)
    ) {
        throw new Error(
            "Invalid user status."
        );
    }


    /*
     * ==========================================
     * NORMALIZE
     * ==========================================
     */

    const normalizedUsername =
        username.trim().toLowerCase();

    const normalizedEmail =
        email.trim().toLowerCase();


    /*
     * ==========================================
     * DUPLICATE CHECK
     * ==========================================
     */

    const existingUser =
        await User.findOne({
            $or: [
                {
                    email:
                        normalizedEmail,
                },
                {
                    username:
                        normalizedUsername,
                },
            ],
        }).lean();


    if (existingUser) {

        if (
            existingUser.email ===
            normalizedEmail
        ) {
            throw new Error(
                "Email is already registered."
            );
        }

        if (
            existingUser.username ===
            normalizedUsername
        ) {
            throw new Error(
                "Username is already taken."
            );
        }

        throw new Error(
            "User already exists."
        );
    }


    /*
     * ==========================================
     * HASH PASSWORD
     * ==========================================
     */

    const hashedPassword =
        await bcrypt.hash(
            password,
            10
        );


    /*
     * ==========================================
     * CREATE USER + WALLET
     * ==========================================
     */

    const session =
        await mongoose.startSession();


    try {

        session.startTransaction();


        const createdUsers =
            await User.create(
                [
                    {
                        fullName:
                            fullName.trim(),

                        username:
                            normalizedUsername,

                        email:
                            normalizedEmail,

                        mobile:
                            mobile?.trim() || "",

                        password:
                            hashedPassword,

                        role,

                        status,
                    },
                ],
                {
                    session,
                }
            );


        const user =
            createdUsers[0];


        await Wallet.create(
            [
                {
                    user:
                        user._id,

                    balance:
                        0,

                    bonusBalance:
                        0,

                    winningBalance:
                        0,

                    lockedBalance:
                        0,

                    totalDeposit:
                        0,

                    totalWithdraw:
                        0,

                    totalBet:
                        0,

                    totalWin:
                        0,
                },
            ],
            {
                session,
            }
        );


        await session.commitTransaction();


        /*
         * Fetch clean response.
         */

        const createdUser =
            await User.findById(
                user._id
            )
                .select("-password")
                .lean();


        const wallet =
            await Wallet.findOne({
                user:
                    user._id,
            }).lean();


        return {
            user:
                buildUserResponse(
                    createdUser,
                    wallet
                ),
        };


    } catch (error) {

        await session.abortTransaction();

        /*
         * Handle Mongo duplicate-key errors.
         */

        if (
            error?.code === 11000
        ) {

            if (
                error?.keyPattern?.email
            ) {
                throw new Error(
                    "Email is already registered."
                );
            }

            if (
                error?.keyPattern?.username
            ) {
                throw new Error(
                    "Username is already taken."
                );
            }

            throw new Error(
                "User already exists."
            );
        }

        throw error;

    } finally {

        await session.endSession();

    }

};

// ======================================================
// UPDATE USER
// ======================================================

const updateUser = async (
    userId,
    {
        fullName,
        username,
        email,
        mobile,
        role,
        status,
    } = {}
) => {

    if (
        !isValidObjectId(
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
        );


    if (!user) {
        throw new Error(
            "User not found."
        );
    }


    /*
     * ==========================================
     * ADMIN PROTECTION
     * ==========================================
     */

    if (
        user.role === "admin"
    ) {

        /*
         * Existing admin cannot be blocked.
         */

        if (
            status === "blocked"
        ) {
            throw new Error(
                "Admin users cannot be blocked from the Users module."
            );
        }

    }


    /*
     * ==========================================
     * VALIDATE ROLE
     * ==========================================
     */

    if (
        role !== undefined &&
        !["user", "admin"].includes(role)
    ) {
        throw new Error(
            "Invalid user role."
        );
    }


    /*
     * ==========================================
     * VALIDATE STATUS
     * ==========================================
     */

    if (
        status !== undefined &&
        !["active", "blocked"].includes(status)
    ) {
        throw new Error(
            "Invalid user status."
        );
    }


    /*
     * ==========================================
     * NORMALIZE EMAIL / USERNAME
     * ==========================================
     */

    const normalizedUsername =
        username !== undefined
            ? username.trim().toLowerCase()
            : undefined;

    const normalizedEmail =
        email !== undefined
            ? email.trim().toLowerCase()
            : undefined;


    /*
     * ==========================================
     * DUPLICATE USERNAME / EMAIL
     * ==========================================
     */

    if (
        normalizedUsername &&
        normalizedUsername !== user.username
    ) {

        const existingUsername =
            await User.findOne({

                username:
                    normalizedUsername,

                _id: {
                    $ne:
                        user._id,
                },

            }).lean();


        if (existingUsername) {
            throw new Error(
                "Username is already taken."
            );
        }
    }


    if (
        normalizedEmail &&
        normalizedEmail !== user.email
    ) {

        const existingEmail =
            await User.findOne({

                email:
                    normalizedEmail,

                _id: {
                    $ne:
                        user._id,
                },

            }).lean();


        if (existingEmail) {
            throw new Error(
                "Email is already registered."
            );
        }
    }


    /*
     * ==========================================
     * APPLY CHANGES
     * ==========================================
     */

    if (
        fullName !== undefined
    ) {
        if (!fullName.trim()) {
            throw new Error(
                "Full name cannot be empty."
            );
        }

        user.fullName =
            fullName.trim();
    }


    if (
        normalizedUsername !== undefined
    ) {
        if (!normalizedUsername) {
            throw new Error(
                "Username cannot be empty."
            );
        }

        user.username =
            normalizedUsername;
    }


    if (
        normalizedEmail !== undefined
    ) {
        if (!normalizedEmail) {
            throw new Error(
                "Email cannot be empty."
            );
        }

        // Changing the email invalidates the previous
        // verification - it must be re-verified via OTP,
        // never assumed to still be trusted.
        if (normalizedEmail !== user.email) {

            user.emailVerified = false;

        }

        user.email =
            normalizedEmail;
    }


    if (
        mobile !== undefined
    ) {

        const cleanMobile =
            mobile?.trim() || "";

        if (cleanMobile !== user.mobile) {

            user.mobileVerified = false;

        }

        user.mobile =
            cleanMobile;
    }


    if (
        role !== undefined
    ) {
        user.role =
            role;
    }


    if (
        status !== undefined
    ) {
        user.status =
            status;
    }


    await user.save();


    const updatedUser =
        await User.findById(
            user._id
        )
            .select("-password")
            .lean();


    const wallet =
        await Wallet.findOne({
            user:
                user._id,
        }).lean();


    return {
        user:
            buildUserResponse(
                updatedUser,
                wallet
            ),
    };

};

// ======================================================
// ADJUST USER BALANCE
// ======================================================

const adjustUserBalance = async (
    userId,
    amount,
    action,
    remark = "",
    adminId = null
) => {

    if (
        !isValidObjectId(
            userId
        )
    ) {
        throw new Error(
            "Invalid user ID."
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


    if (
        !remark?.trim()
    ) {
        throw new Error(
            "Reason is required."
        );
    }


    const session =
        await mongoose.startSession();


    try {

        session.startTransaction();


        /*
         * ==========================================
         * GET USER
         * ==========================================
         */

        const user =
            await User.findById(
                userId
            )
                .session(
                    session
                );


        if (!user) {
            throw new Error(
                "User not found."
            );
        }


        /*
         * ==========================================
         * ADJUST WALLET
         * ==========================================
         *
         * Routed through walletService so admin
         * balance adjustments use the same atomic,
         * audited path as every other wallet mutation
         * (e.g. adminWalletController.adjustUserWallet)
         * instead of a second, divergent implementation.
         *
         * IMPORTANT:
         * admin_credit/admin_debit are NOT deposit/withdraw,
         * so totalDeposit/totalWithdraw remain unchanged
         * (walletService only bumps those stats for
         * "deposit"/"withdraw" typed transactions).
         */

        const transactionType =
            action === "add"
                ? "admin_credit"
                : "admin_debit";


        const walletResult =
            action === "add"
                ? await walletService.credit(
                    userId,
                    numericAmount,
                    transactionType,
                    remark.trim(),
                    { session }
                )
                : await walletService.debit(
                    userId,
                    numericAmount,
                    transactionType,
                    remark.trim(),
                    { session }
                );


        await session.commitTransaction();


        return {

            userId,

            action,

            amount:
                numericAmount,

            previousBalance:
                walletResult.previousBalance,

            currentBalance:
                walletResult.currentBalance,

            transactionId:
                walletResult.transactionId,

            transaction:
                walletResult.transaction,

        };


    } catch (error) {

        await session.abortTransaction();

        throw error;

    } finally {

        await session.endSession();

    }

};

// ======================================================
// GET USER STATS
// ======================================================

const getUserStats = async () => {


    const [

        totalUsers,

        activeUsers,

        blockedUsers,

        verifiedUsers,

        unverifiedUsers,

        adminUsers,

    ] = await Promise.all([

        User.countDocuments({}),


        User.countDocuments({

            status:
                "active",

            role:
                "user",

        }),


        User.countDocuments({

            status:
                "blocked",

            role:
                "user",

        }),


        User.countDocuments({

            emailVerified:
                true,

            mobileVerified:
                true,

            role:
                "user",

        }),


        User.countDocuments({

            $or: [
                { emailVerified: false },
                { mobileVerified: false },
            ],

            role:
                "user",

        }),


        User.countDocuments({

            role:
                "admin",

        }),

    ]);


    /*
     * New users:
     *
     * Last 24 hours
     * Last 7 days
     * Last 30 days
     */

    const now =
        new Date();


    const last24Hours =
        new Date(
            now.getTime() -
            (
                24 *
                60 *
                60 *
                1000
            )
        );


    const last7Days =
        new Date(
            now.getTime() -
            (
                7 *
                24 *
                60 *
                60 *
                1000
            )
        );


    const last30Days =
        new Date(
            now.getTime() -
            (
                30 *
                24 *
                60 *
                60 *
                1000
            )
        );


    const [

        newUsers24Hours,

        newUsers7Days,

        newUsers30Days,

    ] = await Promise.all([

        User.countDocuments({

            role:
                "user",

            createdAt: {
                $gte:
                    last24Hours,
            },

        }),


        User.countDocuments({

            role:
                "user",

            createdAt: {
                $gte:
                    last7Days,
            },

        }),


        User.countDocuments({

            role:
                "user",

            createdAt: {
                $gte:
                    last30Days,
            },

        }),

    ]);


    return {

        totalUsers:
            Number(
                totalUsers
            ),

        activeUsers:
            Number(
                activeUsers
            ),

        blockedUsers:
            Number(
                blockedUsers
            ),

        verifiedUsers:
            Number(
                verifiedUsers
            ),

        unverifiedUsers:
            Number(
                unverifiedUsers
            ),

        adminUsers:
            Number(
                adminUsers
            ),

        newUsers24Hours:
            Number(
                newUsers24Hours
            ),

        newUsers7Days:
            Number(
                newUsers7Days
            ),

        newUsers30Days:
            Number(
                newUsers30Days
            ),

    };

};


// ======================================================
// EXPORT
// ======================================================

module.exports = {

    getUsers,

    getUserById,

    createUser,

    updateUser,

    updateUserStatus,

    deactivateUser,

    deleteUser,

    changeUserPassword,

    adjustUserBalance,

    getUserStats,

};