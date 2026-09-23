require("dotenv").config();

const mongoose = require("mongoose");

const seedSettings = require("../src/seeders/settingsSeeder");
const seedEmailTemplates = require("../src/seeders/emailTemplateSeeder");
const seedFaq = require("../src/seeders/faqSeeder");
const seedAdmin = require("../src/seeders/adminSeeder");

/*
 * ==========================================
 * PRODUCTION SEED
 * ==========================================
 *
 * Run once after deployment:
 *
 *   npm run seed
 *
 * Safe to re-run any time - every seeder here is idempotent:
 *   - Settings / Email Templates: upsert per key, only ever
 *     insert missing keys ($setOnInsert - never overwrites a
 *     value an admin already changed).
 *   - FAQ: seeds once on a fresh install, no-op once any FAQ
 *     category exists.
 *   - Admin: only creates an admin if ADMIN_EMAIL/ADMIN_PASSWORD
 *     are set in the environment and no admin already exists.
 *
 * Does not connect the game engine, socket.io or SMTP checks -
 * this only opens a DB connection long enough to seed, then
 * disconnects.
 */

const run = async () => {

    try {

        await mongoose.connect(process.env.MONGO_URI);

        console.log("Connected to MongoDB.");

        await seedSettings();
        await seedEmailTemplates();
        await seedFaq();
        await seedAdmin();

        console.log("Production seed complete.");

    } catch (error) {

        console.error("Seed failed:", error.message);

        process.exitCode = 1;

    } finally {

        await mongoose.disconnect();

    }

};

run();
