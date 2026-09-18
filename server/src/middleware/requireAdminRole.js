/*
 * ==========================================
 * REQUIRE ADMIN ROLE
 * ==========================================
 *
 * Must run AFTER adminAuth (needs req.admin).
 * Restricts a route to one or more Admin.role values
 * (e.g. "super_admin"). Used for destructive actions
 * where every other admin endpoint intentionally stays
 * open to any active admin, per existing behavior.
 */

const requireAdminRole = (...allowedRoles) => (req, res, next) => {

    if (!req.admin) {

        return res.status(401).json({
            success: false,
            message: "Admin authorization required.",
        });

    }

    if (!allowedRoles.includes(req.admin.role)) {

        return res.status(403).json({
            success: false,
            message: "You do not have permission to perform this action.",
        });

    }

    next();

};

module.exports = requireAdminRole;
