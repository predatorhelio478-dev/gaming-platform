const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const Admin = require("../models/Admin");


// ======================================================
// HELPERS
// ======================================================

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const ROLES = ["super_admin", "admin", "operator"];

const buildAdminResponse = (admin) => {

    if (!admin) return null;

    return {
        _id: admin._id,
        fullName: admin.name,
        username: admin.username,
        email: admin.email,
        mobile: admin.mobile || "",
        role: admin.role,
        isActive: admin.isActive,
        emailVerified: admin.emailVerified,
        phoneVerified: admin.phoneVerified,
        lastLogin: admin.lastLogin,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
    };

};


// ======================================================
// PERMISSION CHECKS (defense-in-depth - the route also
// gates via requireAdminRole, but every branch here is
// re-checked so a bug in route wiring can never alone
// grant privilege escalation).
// ======================================================

const assertCanAssignRole = (actingAdmin, targetRole) => {

    if (targetRole === "super_admin" && actingAdmin.role !== "super_admin") {

        const error = new Error(
            "Only a super admin can create or promote another super admin."
        );
        error.statusCode = 403;
        throw error;

    }

    if (actingAdmin.role === "operator") {

        const error = new Error(
            "You do not have permission to manage admin accounts."
        );
        error.statusCode = 403;
        throw error;

    }

};

const assertCanModifyTarget = (actingAdmin, targetAdmin) => {

    if (targetAdmin.role === "super_admin" && actingAdmin.role !== "super_admin") {

        const error = new Error(
            "Only a super admin can modify another super admin's account."
        );
        error.statusCode = 403;
        throw error;

    }

};


// ======================================================
// LIST ADMINS + ROLE COUNTS
// ======================================================

const listAdmins = async ({ page = 1, limit = 20, search = "", role = "all" }) => {

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));

    const filter = {};

    if (role !== "all" && ROLES.includes(role)) {
        filter.role = role;
    }

    if (search?.trim()) {

        const term = search.trim();

        filter.$or = [
            { name: { $regex: term, $options: "i" } },
            { username: { $regex: term, $options: "i" } },
            { email: { $regex: term, $options: "i" } },
            { mobile: { $regex: term, $options: "i" } },
        ];

    }

    const [admins, total, roleCounts] = await Promise.all([

        Admin.find(filter)
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .lean(),

        Admin.countDocuments(filter),

        Admin.aggregate([
            { $group: { _id: "$role", count: { $sum: 1 } } },
        ]),

    ]);

    const counts = { total: 0, super_admin: 0, admin: 0, operator: 0 };

    for (const row of roleCounts) {
        counts[row._id] = row.count;
        counts.total += row.count;
    }

    return {
        admins: admins.map(buildAdminResponse),
        counts,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum) || 1,
        },
    };

};


// ======================================================
// CREATE ADMIN
// ======================================================

const createAdmin = async (
    { fullName, username, email, mobile = "", password, role = "admin" },
    actingAdmin
) => {

    if (!fullName?.trim()) throw new Error("Full name is required.");
    if (!username?.trim()) throw new Error("Username is required.");
    if (!email?.trim()) throw new Error("Email is required.");
    if (!password || password.length < 6) throw new Error("Password must be at least 6 characters.");
    if (!ROLES.includes(role)) throw new Error("Invalid admin role.");

    assertCanAssignRole(actingAdmin, role);

    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await Admin.findOne({
        $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
    }).lean();

    if (existing) {

        if (existing.email === normalizedEmail) throw new Error("Email is already registered.");
        if (existing.username === normalizedUsername) throw new Error("Username is already taken.");
        throw new Error("Admin already exists.");

    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await Admin.create({
        name: fullName.trim(),
        username: normalizedUsername,
        email: normalizedEmail,
        mobile: mobile ? String(mobile).trim() : "",
        password: hashedPassword,
        role,
        isActive: true,
    });

    return buildAdminResponse(admin);

};


// ======================================================
// UPDATE ADMIN (status / role / profile fields)
// ======================================================

const updateAdmin = async (id, updates, actingAdmin) => {

    if (!isValidObjectId(id)) throw new Error("Invalid admin ID.");

    const admin = await Admin.findById(id);

    if (!admin) {
        const error = new Error("Admin not found.");
        error.statusCode = 404;
        throw error;
    }

    assertCanModifyTarget(actingAdmin, admin);

    const before = {
        role: admin.role,
        isActive: admin.isActive,
    };

    if (updates.fullName !== undefined) admin.name = String(updates.fullName).trim();
    if (updates.mobile !== undefined) admin.mobile = String(updates.mobile).trim();

    if (updates.role !== undefined && updates.role !== admin.role) {

        if (!ROLES.includes(updates.role)) throw new Error("Invalid admin role.");

        assertCanAssignRole(actingAdmin, updates.role);

        admin.role = updates.role;

    }

    if (updates.isActive !== undefined) {

        if (String(admin._id) === String(actingAdmin._id) && updates.isActive === false) {

            const error = new Error("You cannot deactivate your own account.");
            error.statusCode = 403;
            throw error;

        }

        admin.isActive = Boolean(updates.isActive);

    }

    await admin.save();

    return {
        admin: buildAdminResponse(admin),
        before,
        after: { role: admin.role, isActive: admin.isActive },
    };

};


// ======================================================
// DEACTIVATE ADMIN (soft delete - preserves audit trail
// integrity since AuditLog.actorId can still reference it)
// ======================================================

const deactivateAdmin = async (id, actingAdmin) => {

    if (!isValidObjectId(id)) throw new Error("Invalid admin ID.");

    if (String(id) === String(actingAdmin._id)) {

        const error = new Error("You cannot delete your own account.");
        error.statusCode = 403;
        throw error;

    }

    const admin = await Admin.findById(id);

    if (!admin) {
        const error = new Error("Admin not found.");
        error.statusCode = 404;
        throw error;
    }

    assertCanModifyTarget(actingAdmin, admin);

    if (!admin.isActive) {
        return { admin: buildAdminResponse(admin), alreadyDeactivated: true };
    }

    admin.isActive = false;
    await admin.save();

    return { admin: buildAdminResponse(admin), alreadyDeactivated: false };

};


module.exports = {
    listAdmins,
    createAdmin,
    updateAdmin,
    deactivateAdmin,
    buildAdminResponse,
};
