const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Admin = require("../models/Admin");


// ==========================================
// ADMIN LOGIN
// ==========================================

const adminLogin = async (req, res) => {
    try {
        const {
            username,
            password,
        } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message:
                    "Username and password are required.",
            });
        }

        const admin = await Admin.findOne({
            $or: [
                {
                    username:
                        username.toLowerCase(),
                },
                {
                    email:
                        username.toLowerCase(),
                },
            ],
        }).select("+password");

        if (!admin) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid admin credentials.",
            });
        }

        if (!admin.isActive) {
            return res.status(403).json({
                success: false,
                message:
                    "Admin account is disabled.",
            });
        }

        const passwordMatch =
            await bcrypt.compare(
                password,
                admin.password
            );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid admin credentials.",
            });
        }

        const token = jwt.sign(
            {
                adminId: admin._id,
                role: admin.role,
                type: "admin",
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d",
            }
        );

        admin.lastLogin = new Date();

        await admin.save();

        return res.status(200).json({
            success: true,
            message:
                "Admin login successful.",

            token,

            admin: {
                id: admin._id,
                name: admin.name,
                username: admin.username,
                email: admin.email,
                role: admin.role,
            },
        });

    } catch (error) {
        console.error(
            "Admin Login Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Internal server error.",
        });
    }
};


// ==========================================
// GET CURRENT ADMIN
// ==========================================

const getCurrentAdmin = async (req, res) => {
    try {
        const admin = req.admin;

        return res.status(200).json({
            success: true,

            admin: {
                id: admin._id,
                name: admin.name,
                username: admin.username,
                email: admin.email,
                role: admin.role,
                isActive: admin.isActive,
                lastLogin: admin.lastLogin,
            },
        });

    } catch (error) {
        console.error(
            "Current Admin Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to fetch admin.",
        });
    }
};


module.exports = {
    adminLogin,
    getCurrentAdmin,
};