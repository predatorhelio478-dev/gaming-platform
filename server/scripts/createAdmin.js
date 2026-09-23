require("dotenv").config({ quiet: true });

const mongoose = require("mongoose");

const seedAdmin = require("../src/seeders/adminSeeder");

/*
 * Standalone entrypoint for creating just the default admin.
 * Prefer `npm run seed` for full production setup (settings,
 * email templates, FAQ, admin) - this is kept for when only
 * the admin account is needed.
 *
 * Reads ADMIN_EMAIL / ADMIN_PASSWORD (required) and optional
 * ADMIN_USERNAME / ADMIN_NAME from the environment - see
 * src/seeders/adminSeeder.js for the idempotent creation logic
 * (skips if an admin already exists, never overwrites one).
 */

const run = async () => {

    try {

        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected.");

        await seedAdmin();

        process.exit(0);

    } catch (error) {

        console.error("Create Admin Error:", error.message);

        process.exit(1);

    }

};

run();
