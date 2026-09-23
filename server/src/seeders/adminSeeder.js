const bcrypt = require("bcryptjs");

const Admin = require("../models/Admin");

/*
 * ==========================================
 * DEFAULT ADMIN SEED
 * ==========================================
 *
 * Production-safe: only creates an admin when ADMIN_EMAIL and
 * ADMIN_PASSWORD are set in the environment, and only if no
 * admin already exists with that email or username. Never
 * touches an existing admin's password/role/fields on re-run
 * (no credentials to reset, nothing to overwrite), so this is
 * safe to call every time the seed command runs.
 *
 * The Admin model has no password-hashing hook, so the
 * password is hashed here before Admin.create() - same as
 * every other admin-password call site in this codebase.
 */

const seedAdmin = async () => {
    try {
        const email = process.env.ADMIN_EMAIL;
        const password = process.env.ADMIN_PASSWORD;

        if (!email || !password) {
            console.log(
                "Admin seeding skipped - set ADMIN_EMAIL and ADMIN_PASSWORD to create a default admin."
            );

            return;
        }

        const username =
            (process.env.ADMIN_USERNAME || "admin")
                .toLowerCase()
                .trim();

        const normalizedEmail =
            email.toLowerCase().trim();

        const existingAdmin = await Admin.findOne({
            $or: [
                { email: normalizedEmail },
                { username },
            ],
        });

        if (existingAdmin) {
            console.log(
                "Admin seeding skipped - an admin with this email/username already exists."
            );

            return;
        }

        const hashedPassword =
            await bcrypt.hash(password, 12);

        await Admin.create({
            name: process.env.ADMIN_NAME || "System Administrator",
            username,
            email: normalizedEmail,
            password: hashedPassword,
            role: "super_admin",
            isActive: true,
        });

        console.log(`Default admin "${username}" created.`);
    } catch (error) {
        console.error("Admin seeding failed:", error.message);
        throw error;
    }
};

module.exports = seedAdmin;
