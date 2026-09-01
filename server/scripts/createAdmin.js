require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Admin = require("../src/models/Admin");

const createAdmin = async () => {
    try {
        await mongoose.connect(
            process.env.MONGO_URI
        );

        console.log(
            "MongoDB connected."
        );

        const existingAdmin =
            await Admin.findOne({
                username: "admin",
            });

        if (existingAdmin) {
            console.log(
                "Admin already exists."
            );

            process.exit(0);
        }

        const hashedPassword =
            await bcrypt.hash(
                "Admin@12345",
                12
            );

        const admin =
            await Admin.create({
                name: "System Administrator",

                username: "admin",

                email:
                    "admin@gamingplatform.local",

                password:
                    hashedPassword,

                role: "super_admin",

                isActive: true,
            });

        console.log(
            "Admin created successfully."
        );

        console.log(
            "Username: admin"
        );

        console.log(
            "Password: Admin@12345"
        );

        console.log(
            "Admin ID:",
            admin._id.toString()
        );

        process.exit(0);

    } catch (error) {
        console.error(
            "Create Admin Error:",
            error
        );

        process.exit(1);
    }
};

createAdmin();