const express =
    require("express");

const router =
    express.Router();

const adminUserController =
    require("../controllers/adminUserController");

const adminAuth =
    require("../middleware/adminAuth");


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
// ======================================================

router.post(
    "/:id/balance",
    adminAuth,
    adminUserController.adjustUserBalance
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