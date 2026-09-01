const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const adminAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Admin authorization token is required.",
            });
        }

        if (!authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Invalid authorization format.",
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Admin token is missing.",
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        if (decoded.type !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Admin access required.",
            });
        }

        const admin = await Admin.findById(
            decoded.adminId
        ).select("+password");

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Admin account not found.",
            });
        }

        if (!admin.isActive) {
            return res.status(403).json({
                success: false,
                message: "Admin account is disabled.",
            });
        }

        req.admin = admin;

        next();
    } catch (error) {
        console.error(
            "Admin Auth Error:",
            error.message
        );

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Admin token expired.",
            });
        }

        return res.status(401).json({
            success: false,
            message: "Invalid admin token.",
        });
    }
};

module.exports = adminAuth;