const mongoose = require("mongoose");
const seedSettings = require("../seeders/settingsSeeder");
const seedEmailTemplates = require("../seeders/emailTemplateSeeder");
const seedFaq = require("../seeders/faqSeeder");
const seedAdmin = require("../seeders/adminSeeder");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        await seedSettings();
        await seedEmailTemplates();
        await seedFaq();

        /*
         * Runs on every server boot, on every platform - this is
         * what guarantees the default admin gets created on
         * Render (whose start command always runs this, even if
         * its build command never invokes `npm run build`/`npm
         * run seed`), not just on Hostinger's build-step wiring
         * (scripts/seed.js). Idempotent either way: only creates
         * an admin when ADMIN_EMAIL/ADMIN_PASSWORD are set and no
         * admin already exists (see seeders/adminSeeder.js).
         */
        await seedAdmin();

        console.log("MongoDB Connected");
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

module.exports = connectDB;