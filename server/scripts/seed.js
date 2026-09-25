require("dotenv").config({ quiet: true });

const mongoose = require("mongoose");

const seedSettings = require("../src/seeders/settingsSeeder");
const seedEmailTemplates = require("../src/seeders/emailTemplateSeeder");
const seedFaq = require("../src/seeders/faqSeeder");
const seedAdmin = require("../src/seeders/adminSeeder");
const seedRoleAccounts = require("../src/seeders/roleAccountSeeder");

/*
 * ==========================================
 * PRODUCTION SEED
 * ==========================================
 *
 * Runs automatically on every deploy, as part of the "build"
 * step (see package.json "build" - Hostinger's Node.js
 * pipeline runs install -> build -> start, and there is no SSH
 * access to run npm commands by hand there). Also runnable
 * directly:
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
 * Does not start the game engine, Socket.IO or the SMTP check -
 * this only opens a DB connection long enough to seed, then
 * disconnects. Those only start from src/server.js, which this
 * script never requires.
 *
 * Never fails the build: some hosts only inject runtime env
 * vars at the "start" phase (no MONGO_URI yet at build time),
 * and with no SSH access there is no way to manually re-run a
 * failed step. A missing/unreachable database is logged and
 * skipped rather than treated as fatal - the idempotent seed
 * simply catches up on the next deploy once connectivity/env
 * vars are correct.
 */

const run = async () => {

    if (!process.env.MONGO_URI) {

        console.log(
            "Seed skipped - MONGO_URI not set at this deploy phase."
        );

        return;

    }

    try {

        await mongoose.connect(
            process.env.MONGO_URI,
            { serverSelectionTimeoutMS: 8000 }
        );

        console.log("Connected to MongoDB.");

        await seedSettings();
        await seedEmailTemplates();
        await seedFaq();
        await seedAdmin();
        await seedRoleAccounts();

        console.log("Production seed complete.");

    } catch (error) {

        console.error(
            "Seed failed (non-fatal - will retry on next deploy):",
            error.message
        );

    } finally {

        await mongoose.disconnect().catch(() => {});

    }

};

run();
