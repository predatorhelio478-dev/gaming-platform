const jwt = require("jsonwebtoken");
const User = require("../models/User");


// ======================================================
// AUTHENTICATION MIDDLEWARE
// ======================================================

module.exports = async (
    req,
    res,
    next
) => {

    try {

        // ==================================================
        // AUTHORIZATION HEADER
        // ==================================================

        const authHeader =
            req.headers.authorization;


        if (!authHeader) {

            return res.status(401).json({

                success: false,

                message:
                    "Unauthorized",

            });

        }


        // ==================================================
        // BEARER TOKEN
        // ==================================================

        const parts =
            authHeader.split(" ");


        if (
            parts.length !== 2 ||
            parts[0] !== "Bearer" ||
            !parts[1]
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid authorization format.",

            });

        }


        const token =
            parts[1];


        // ==================================================
        // VERIFY TOKEN
        // ==================================================

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );


        // ==================================================
        // FIND CURRENT USER
        // ==================================================

        const user =
            await User.findById(
                decoded.id
            );


        if (!user) {

            return res.status(401).json({

                success: false,

                message:
                    "User not found.",

            });

        }


        // ==================================================
        // BLOCKED USER
        // ==================================================

        if (
            user.status ===
            "blocked"
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Your account has been blocked.",

            });

        }


        // ==================================================
        // DEACTIVATED (SOFT-DELETED) USER
        // ==================================================

        if (user.isDeleted) {

            return res.status(403).json({

                success: false,

                message:
                    "This account is no longer active.",

            });

        }


        // ==================================================
        // ATTACH USER TO REQUEST
        // ==================================================

        req.user =
            user;


        // ==================================================
        // CONTINUE
        // ==================================================

        next();

    } catch (
    error
    ) {

        // ==================================================
        // EXPIRED TOKEN
        // ==================================================

        if (
            error?.name ===
            "TokenExpiredError"
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Token expired.",

            });

        }


        // ==================================================
        // INVALID TOKEN
        // ==================================================

        return res.status(401).json({

            success: false,

            message:
                "Invalid Token",

        });

    }

};