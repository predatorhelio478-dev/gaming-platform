const express =
    require("express");

const router =
    express.Router();

const adminUserController =
    require("../controllers/adminUserController");

const adminAuth =
    require("../middleware/adminAuth");

const requireAdminRole =
    require("../middleware/requireAdminRole");

const { adminChangeUserPasswordValidators } =
    require("../validators/requestValidators");


// ======================================================
// GET USERS
// ======================================================

router.get(
    "/",
    adminAuth,
    adminUserController.getUsers
);


// ======================================================
// GET USER STATS
// ======================================================

router.get(
    "/stats",
    adminAuth,
    adminUserController.getUserStats
);


// ======================================================
// CREATE USER
// ======================================================
//
// POST /api/admin/users
//
// Body:
//
// {
//   "fullName": "John Doe",
//   "username": "john",
//   "email": "john@example.com",
//   "mobile": "9876543210",
//   "password": "password123",
//   "role": "user",
//   "status": "active",
//   "isVerified": true
// }
//
// ======================================================

router.post(
    "/",
    adminAuth,
    adminUserController.createUser
);


// ======================================================
// UPDATE USER
// ======================================================
//
// PATCH /api/admin/users/:id
//
// ======================================================

router.patch(
    "/:id",
    adminAuth,
    adminUserController.updateUser
);


// ======================================================
// UPDATE USER STATUS
// ======================================================
//
// PATCH /api/admin/users/:id/status
//
// Body:
//
// {
//   "status": "blocked"
// }
//
// OR
//
// {
//   "status": "active"
// }
//
// ======================================================

router.patch(
    "/:id/status",
    adminAuth,
    adminUserController.updateUserStatus
);


// ======================================================
// ADJUST USER BALANCE
// ======================================================
//
// POST /api/admin/users/:id/balance
//
// Add:
//
// {
//   "amount": 500,
//   "action": "add",
//   "remark": "Manual balance adjustment"
// }
//
// Deduct:
//
// {
//   "amount": 200,
//   "action": "deduct",
//   "remark": "Balance correction"
// }
//
// Restricted to admin/super_admin - directly mutates a
// user's real money outside the normal deposit/withdrawal
// flow, so the lowest-trust "operator" role must not be able
// to call this.
//
// ======================================================

router.post(
    "/:id/balance",
    adminAuth,
    requireAdminRole("super_admin", "admin"),
    adminUserController.adjustUserBalance
);


// ======================================================
// DEACTIVATE USER (SOFT DELETE)
// ======================================================
//
// DELETE /api/admin/users/:id
//
// Restricted to admin/super_admin - a destructive-adjacent
// action that blocks a user's login/access while
// preserving their financial/audit/bet/referral history.
// Widened from super_admin-only to admin+super_admin per
// explicit instruction; operator remains excluded.
//
// ======================================================

router.delete(
    "/:id",
    adminAuth,
    requireAdminRole("super_admin", "admin"),
    adminUserController.deactivateUser
);


// ======================================================
// PERMANENTLY DELETE USER (anonymize)
// ======================================================
//
// DELETE /api/admin/users/:id/permanent
//
// Separate action from deactivate - restricted to
// admin/super_admin, never operator. Only ever anonymizes a
// "user"-role account (never role:"admin"); all financial/
// bet/transaction/audit/support records stay intact.
//
// ======================================================

router.delete(
    "/:id/permanent",
    adminAuth,
    requireAdminRole("super_admin", "admin"),
    adminUserController.deleteUser
);


// ======================================================
// ADMIN-INITIATED PASSWORD CHANGE (for a normal user)
// ======================================================
//
// POST /api/admin/users/:id/password
//
// Restricted to admin/super_admin, never operator. Only
// ever applies to a "user"-role account.
//
// ======================================================

router.post(
    "/:id/password",
    adminAuth,
    requireAdminRole("super_admin", "admin"),
    adminChangeUserPasswordValidators,
    adminUserController.changeUserPassword
);


// ======================================================
// GET USER DETAILS
// ======================================================
//
// GET /api/admin/users/:id
//
// ======================================================

router.get(
    "/:id",
    adminAuth,
    adminUserController.getUserById
);


// ======================================================
// EXPORT
// ======================================================

module.exports =
    router;