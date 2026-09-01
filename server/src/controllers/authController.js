const bcrypt = require("bcrypt");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const Wallet = require("../models/Wallet");


// ======================================================
// REGISTER
// ======================================================

exports.register = async (req, res) => {

    try {

        const {
            fullName,
            username,
            email,
            password,
        } = req.body;


        // ==================================================
        // CHECK EXISTING USER
        // ==================================================

        const userExists =
            await User.findOne({
                $or: [
                    { email },
                    { username },
                ],
            });


        if (userExists) {

            return res.status(400).json({

                success:
                    false,

                message:
                    "User already exists",

            });

        }


        // ==================================================
        // HASH PASSWORD
        // ==================================================

        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );


        // ==================================================
        // CREATE USER
        // ==================================================

        const user =
            await User.create({

                fullName,

                username,

                email,

                password:
                    hashedPassword,

            });


        // ==================================================
        // CREATE WALLET
        // ==================================================

        await Wallet.create({

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

        });


        // ==================================================
        // GENERATE TOKEN
        // ==================================================

        const token =
            generateToken(
                user._id
            );


        return res.status(201).json({

            success:
                true,

            token,

            user,

        });

    } catch (
    err
    ) {

        console.error(
            "Register Error:",
            err
        );


        return res.status(500).json({

            success:
                false,

            message:
                err.message,

        });

    }

};


// ======================================================
// LOGIN
// ======================================================

exports.login = async (
    req,
    res
) => {

    try {

        const {
            email,
            password,
        } = req.body;


        // ==================================================
        // FIND USER
        // ==================================================

        const user =
            await User.findOne({
                email,
            }).select(
                "+password"
            );


        if (!user) {

            return res.status(401).json({

                success:
                    false,

                message:
                    "Invalid credentials",

            });

        }


        // ==================================================
        // CHECK PASSWORD
        // ==================================================

        const isMatch =
            await bcrypt.compare(
                password,
                user.password
            );


        if (!isMatch) {

            return res.status(401).json({

                success:
                    false,

                message:
                    "Invalid credentials",

            });

        }


        // ==================================================
        // CHECK ACCOUNT STATUS
        // IMPORTANT:
        // Do this BEFORE generating the token.
        // ==================================================

        if (
            user.status ===
            "blocked"
        ) {

            return res.status(403).json({

                success:
                    false,

                message:
                    "Your account has been blocked.",

            });

        }


        // ==================================================
        // UPDATE LAST LOGIN
        // ==================================================

        user.lastLogin =
            new Date();


        await user.save();


        // ==================================================
        // GENERATE TOKEN
        // ==================================================

        const token =
            generateToken(
                user._id
            );


        // ==================================================
        // RESPONSE
        // ==================================================

        return res.json({

            success:
                true,

            token,

            user,

        });

    } catch (
    err
    ) {

        console.error(
            "Login Error:",
            err
        );


        return res.status(500).json({

            success:
                false,

            message:
                err.message,

        });

    }

};