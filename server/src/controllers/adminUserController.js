const adminUserService =
    require("../services/adminUserService");

const { createAuditLog } =
    require("../services/auditLogService");

const notificationService =
    require("../services/notificationService");


// ======================================================
// REQUEST CONTEXT (IP / USER AGENT)
// ======================================================

const getRequestContext = (req) => ({

    ipAddress:
        req.ip ||
        req.headers["x-forwarded-for"] ||
        req.socket?.remoteAddress ||
        null,

    userAgent:
        req.headers["user-agent"] || null,

});


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

            notifyEmail,

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

                    notifyEmail: notifyEmail === true,

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


        if (!result.alreadyUpdated) {

            await createAuditLog({

                actorType: "admin",

                actorId: req.admin?._id || null,

                action: "user.status_changed",

                module: "users",

                key: id,

                newValue: status,

                ...getRequestContext(req),

            }).catch(() => {});

        }


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
// DEACTIVATE USER (SOFT DELETE)
// ======================================================

const deactivateUser = async (
    req,
    res
) => {

    try {

        const { id } = req.params;

        if (!id) {

            return res.status(400).json({
                success: false,
                message: "User ID is required.",
            });

        }

        const result =
            await adminUserService.deactivateUser(id);

        if (!result.alreadyDeactivated) {

            await createAuditLog({
                actorType: "admin",
                actorId: req.admin?._id || null,
                action: "user.deactivated",
                module: "users",
                key: id,
                ...getRequestContext(req),
            }).catch(() => {});

            notificationService
                .notifyAdmins(
                    "admin_action",
                    "User deactivated",
                    `User ${result.user?.username || id} was deactivated by an admin.`,
                    { userId: id, adminId: String(req.admin?._id || "") }
                )
                .catch(() => {});

        }

        return res.status(200).json({

            success: true,

            message:
                result.alreadyDeactivated
                    ? "User is already deactivated."
                    : "User deactivated successfully.",

            data: result.user,

            alreadyDeactivated: result.alreadyDeactivated,

        });

    } catch (error) {

        console.error(
            "Admin Deactivate User Error:",
            error
        );

        const message =
            error.message ||
            "Unable to deactivate user.";

        let statusCode = 400;

        if (message === "User not found.") {

            statusCode = 404;

        }

        return res.status(statusCode).json({
            success: false,
            message,
        });

    }

};


// ======================================================
// PERMANENTLY DELETE USER (anonymize)
// ======================================================
//
// A separate action from deactivate - anonymizes the
// account's identifying data in place rather than just
// blocking login, while every financial/bet/transaction/
// audit/support record keeps resolving to the same user _id.
// ======================================================

const deleteUser = async (
    req,
    res
) => {

    try {

        const { id } = req.params;

        if (!id) {

            return res.status(400).json({
                success: false,
                message: "User ID is required.",
            });

        }

        const result =
            await adminUserService.deleteUser(id);

        if (!result.alreadyDeleted) {

            await createAuditLog({
                actorType: "admin",
                actorId: req.admin?._id || null,
                action: "user.permanently_deleted",
                module: "users",
                key: id,
                metadata: {
                    targetUserId: id,
                    actorAdminId: String(req.admin?._id || ""),
                },
                ...getRequestContext(req),
            }).catch(() => {});

            notificationService
                .notifyAdmins(
                    "admin_action",
                    "User permanently deleted",
                    `A user account was permanently deleted by an admin.`,
                    { userId: id, adminId: String(req.admin?._id || "") }
                )
                .catch(() => {});

        }

        return res.status(200).json({

            success: true,

            message:
                result.alreadyDeleted
                    ? "User is already deleted."
                    : "User permanently deleted. Financial and activity history has been preserved.",

            data: result.user,

            alreadyDeleted: result.alreadyDeleted,

        });

    } catch (error) {

        console.error(
            "Admin Delete User Error:",
            error
        );

        const message =
            error.message ||
            "Unable to delete user.";

        let statusCode = 400;

        if (message === "User not found.") {

            statusCode = 404;

        }

        return res.status(statusCode).json({
            success: false,
            message,
        });

    }

};


// ======================================================
// ADMIN-INITIATED PASSWORD CHANGE (for a normal user)
// ======================================================
//
// Audited without ever logging the password/hash - only the
// fact that a change happened, and who performed it.
// ======================================================

const changeUserPassword = async (
    req,
    res
) => {

    try {

        const { id } = req.params;
        const { newPassword } = req.body;

        if (!id) {

            return res.status(400).json({
                success: false,
                message: "User ID is required.",
            });

        }

        await adminUserService.changeUserPassword(
            id,
            newPassword
        );

        await createAuditLog({
            actorType: "admin",
            actorId: req.admin?._id || null,
            action: "user.password_changed_by_admin",
            module: "users",
            key: id,
            metadata: {
                targetUserId: id,
                actorAdminId: String(req.admin?._id || ""),
            },
            ...getRequestContext(req),
        }).catch(() => {});

        return res.status(200).json({
            success: true,
            message: "User password changed successfully.",
        });

    } catch (error) {

        console.error(
            "Admin Change User Password Error:",
            error.message
        );

        const message =
            error.message ||
            "Unable to change user password.";

        let statusCode = 400;

        if (message === "User not found.") {

            statusCode = 404;

        }

        return res.status(statusCode).json({
            success: false,
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


        await createAuditLog({

            actorType: "admin",

            actorId: adminId,

            action:
                action === "add"
                    ? "wallet.admin_credit"
                    : "wallet.admin_debit",

            module: "wallet",

            key: id,

            oldValue: result.previousBalance,

            newValue: result.currentBalance,

            metadata: {
                amount: result.amount,
                remark: remark.trim(),
            },

            ...getRequestContext(req),

        }).catch(() => {});


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
// MANUAL EMAIL/MOBILE VERIFY *OR* UNVERIFY (Super Admin only)
// ======================================================
//
// Route-gated to super_admin via requireAdminRole - a normal
// admin must not be able to reach this at all. Bypasses OTP
// entirely; every call is audit-logged with who/target/what.
// Body: { verified?: boolean (default true), notifyEmail?: boolean }
// ======================================================

const manuallyVerifyEmail = async (req, res) => {

    try {

        const { id } = req.params;

        const { verified, notifyEmail } = req.body || {};

        const desired = verified !== false;

        const result = await adminUserService.manuallyVerifyContact(
            id,
            "email",
            desired,
            notifyEmail === true
        );

        if (!result.alreadyVerified) {

            await createAuditLog({
                actorType: "admin",
                actorId: req.admin?._id || null,
                action: desired ? "user.email_manually_verified" : "user.email_manually_unverified",
                module: "users",
                key: id,
                newValue: { emailVerified: desired },
                ...getRequestContext(req),
            }).catch(() => {});

        }

        return res.status(200).json({
            success: true,
            message:
                result.alreadyVerified
                    ? `This user's email is already ${desired ? "verified" : "unverified"}.`
                    : `User's email marked as ${desired ? "verified" : "unverified"}.`,
            data: result.user,
        });

    } catch (error) {

        console.error("Admin Manual Email Verify Error:", error);

        const statusCode = error.statusCode || 400;

        return res.status(statusCode).json({
            success: false,
            message: error.message || "Unable to update email verification.",
        });

    }

};

const manuallyVerifyMobile = async (req, res) => {

    try {

        const { id } = req.params;

        const { verified, notifyEmail } = req.body || {};

        const desired = verified !== false;

        const result = await adminUserService.manuallyVerifyContact(
            id,
            "mobile",
            desired,
            notifyEmail === true
        );

        if (!result.alreadyVerified) {

            await createAuditLog({
                actorType: "admin",
                actorId: req.admin?._id || null,
                action: desired ? "user.mobile_manually_verified" : "user.mobile_manually_unverified",
                module: "users",
                key: id,
                newValue: { mobileVerified: desired },
                ...getRequestContext(req),
            }).catch(() => {});

        }

        return res.status(200).json({
            success: true,
            message:
                result.alreadyVerified
                    ? `This user's mobile number is already ${desired ? "verified" : "unverified"}.`
                    : `User's mobile number marked as ${desired ? "verified" : "unverified"}.`,
            data: result.user,
        });

    } catch (error) {

        console.error("Admin Manual Mobile Verify Error:", error);

        const statusCode = error.statusCode || 400;

        return res.status(statusCode).json({
            success: false,
            message: error.message || "Unable to update mobile verification.",
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

    deactivateUser,

    deleteUser,

    changeUserPassword,

    adjustUserBalance,

    getUserStats,

    manuallyVerifyEmail,

    manuallyVerifyMobile,

};