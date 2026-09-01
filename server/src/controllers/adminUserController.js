const adminUserService =
    require("../services/adminUserService");


// ======================================================
// GET USERS
// ======================================================

const getUsers = async (
    req,
    res
) => {

    try {

        const {

            page = 1,

            limit = 20,

            search = "",

            status = "all",

            role = "all",

        } = req.query;


        const result =
            await adminUserService.getUsers({

                page,

                limit,

                search,

                status,

                role,

            });


        return res.status(200).json({

            success:
                true,

            ...result,

        });

    } catch (
    error
    ) {

        console.error(
            "Admin Get Users Error:",
            error
        );


        return res.status(500).json({

            success:
                false,

            message:
                error.message ||
                "Unable to fetch users.",

        });

    }

};


// ======================================================
// GET USER DETAILS
// ======================================================

const getUserById = async (
    req,
    res
) => {

    try {

        const {
            id,
        } = req.params;


        if (!id) {

            return res.status(400).json({

                success:
                    false,

                message:
                    "User ID is required.",

            });

        }


        const result =
            await adminUserService.getUserById(
                id
            );


        return res.status(200).json({

            success:
                true,

            ...result,

        });

    } catch (
    error
    ) {

        console.error(
            "Admin Get User Details Error:",
            error
        );


        const message =
            error.message ||
            "Unable to fetch user details.";


        const statusCode =
            message ===
                "User not found."
                ? 404
                : message ===
                    "Invalid user ID."
                    ? 400
                    : 500;


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
// CREATE USER
// ======================================================

const createUser = async (
    req,
    res
) => {

    try {

        const {

            fullName,

            username,

            email,

            mobile,

            password,

            role,

            status,

            isVerified,

        } = req.body;


        const result =
            await adminUserService.createUser({

                fullName,

                username,

                email,

                mobile,

                password,

                role,

                status,

                isVerified,

            });


        return res.status(201).json({

            success:
                true,

            message:
                "User created successfully.",

            data:
                result.user,

        });

    } catch (
    error
    ) {

        console.error(
            "Admin Create User Error:",
            error
        );


        const message =
            error.message ||
            "Unable to create user.";


        let statusCode =
            400;


        /*
         * Duplicate key / server errors.
         */

        if (
            error?.code ===
            11000
        ) {

            statusCode =
                409;

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
// UPDATE USER
// ======================================================

const updateUser = async (
    req,
    res
) => {

    try {

        const {
            id,
        } = req.params;


        if (!id) {

            return res.status(400).json({

                success:
                    false,

                message:
                    "User ID is required.",

            });

        }


        const {

            fullName,

            username,

            email,

            mobile,

            role,

            status,

            isVerified,

        } = req.body;


        const result =
            await adminUserService.updateUser(

                id,

                {

                    fullName,

                    username,

                    email,

                    mobile,

                    role,

                    status,

                    isVerified,

                }

            );


        return res.status(200).json({

            success:
                true,

            message:
                "User updated successfully.",

            data:
                result.user,

        });

    } catch (
    error
    ) {

        console.error(
            "Admin Update User Error:",
            error
        );


        const message =
            error.message ||
            "Unable to update user.";


        let statusCode =
            400;


        if (
            message ===
            "User not found."
        ) {

            statusCode =
                404;

        }


        if (
            message ===
            "Invalid user ID."
        ) {

            statusCode =
                400;

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
// UPDATE USER STATUS
// ======================================================

const updateUserStatus = async (
    req,
    res
) => {

    try {

        const {
            id,
        } = req.params;


        const {
            status,
        } = req.body;


        if (!id) {

            return res.status(400).json({

                success:
                    false,

                message:
                    "User ID is required.",

            });

        }


        if (!status) {

            return res.status(400).json({

                success:
                    false,

                message:
                    "User status is required.",

            });

        }


        const result =
            await adminUserService.updateUserStatus(

                id,

                status

            );


        return res.status(200).json({

            success:
                true,

            message:
                result.alreadyUpdated

                    ? `User is already ${status}.`

                    : `User ${status === "blocked"
                        ? "blocked"
                        : "activated"
                    } successfully.`,

            data:
                result.user,

            alreadyUpdated:
                result.alreadyUpdated,

        });

    } catch (
    error
    ) {

        console.error(
            "Admin Update User Status Error:",
            error
        );


        const message =
            error.message ||
            "Unable to update user status.";


        let statusCode =
            400;


        if (
            message ===
            "User not found."
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
// ADJUST USER BALANCE
// ======================================================

const adjustUserBalance = async (
    req,
    res
) => {

    try {

        const {
            id,
        } = req.params;


        if (!id) {

            return res.status(400).json({

                success:
                    false,

                message:
                    "User ID is required.",

            });

        }


        const {

            amount,

            action,

            remark,

        } = req.body;


        /*
         * ==========================================
         * BASIC VALIDATION
         * ==========================================
         */

        if (
            amount ===
            undefined ||
            amount ===
            null ||
            amount ===
            ""
        ) {

            return res.status(400).json({

                success:
                    false,

                message:
                    "Amount is required.",

            });

        }


        if (
            !action
        ) {

            return res.status(400).json({

                success:
                    false,

                message:
                    "Balance action is required.",

            });

        }


        if (
            !remark ||
            !remark.trim()
        ) {

            return res.status(400).json({

                success:
                    false,

                message:
                    "Reason is required.",

            });

        }


        /*
         * ==========================================
         * ADMIN ID
         * ==========================================
         *
         * adminAuth should normally attach
         * the authenticated admin to req.admin
         * or req.user.
         *
         * We support both.
         */

        const adminId =
            req.admin?._id ||
            req.admin?.id ||
            req.user?._id ||
            req.user?.id ||
            null;


        /*
         * ==========================================
         * SERVICE
         * ==========================================
         */

        const result =
            await adminUserService.adjustUserBalance(

                id,

                amount,

                action,

                remark,

                adminId

            );


        return res.status(200).json({

            success:
                true,

            message:
                action === "add"

                    ? "Balance added successfully."

                    : "Balance deducted successfully.",

            data:
                result,

        });

    } catch (
    error
    ) {

        console.error(
            "Admin Adjust User Balance Error:",
            error
        );


        const message =
            error.message ||
            "Unable to adjust user balance.";


        let statusCode =
            400;


        if (
            message ===
            "User not found."
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


        if (
            message ===
            "Invalid user ID."
        ) {

            statusCode =
                400;

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
// GET USER STATS
// ======================================================

const getUserStats = async (
    req,
    res
) => {

    try {

        const stats =
            await adminUserService.getUserStats();


        return res.status(200).json({

            success:
                true,

            data:
                stats,

        });

    } catch (
    error
    ) {

        console.error(
            "Admin Get User Stats Error:",
            error
        );


        return res.status(500).json({

            success:
                false,

            message:
                error.message ||
                "Unable to fetch user statistics.",

        });

    }

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

    adjustUserBalance,

    getUserStats,

};