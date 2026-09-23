const bcrypt = require("bcryptjs");

const Admin = require("../models/Admin");
const settingsService = require("../services/settingsService");
const emailTemplateService = require("../services/emailTemplateService");

/*
 * ==========================================
 * DEFAULT ADMIN SEED
 * ==========================================
 *
 * Production-safe: only creates an admin when ADMIN_EMAIL and
 * ADMIN_PASSWORD are set in the environment, and only if NO
 * admin exists yet anywhere in the collection - this is a
 * one-time bootstrap for the very first admin account, not a
 * per-email check. That matters: if it only checked whether an
 * admin with this exact email/username existed, rotating
 * ADMIN_EMAIL later (a config change, a typo fix, handing the
 * env var to a new ops person) would create an *additional*
 * admin on the next deploy instead of being a no-op. Once any
 * admin exists, this never creates another one and never
 * touches an existing admin's password/role/fields - nothing to
 * reset, nothing to overwrite - so it's safe to call every time
 * the server boots.
 *
 * The Admin model has no password-hashing hook, so the
 * password is hashed here before Admin.create() - same as
 * every other admin-password call site in this codebase.
 *
 * Unlike the other seeders in this chain, failures here never
 * propagate: this runs on every server boot (config/db.js), and
 * ADMIN_EMAIL/ADMIN_PASSWORD are fallible user-supplied runtime
 * config (a typo'd value is far more likely here than in the
 * hardcoded settings/FAQ/email-template seed data) - a bad
 * value should mean "no admin got created, fix the env var and
 * redeploy", not "the entire platform fails to boot".
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

        const anyAdminExists =
            await Admin.exists({});

        if (anyAdminExists) {
            console.log("Admin already exists");

            return;
        }

        const hashedPassword =
            await bcrypt.hash(password, 12);

        const name =
            process.env.ADMIN_NAME || "System Administrator";

        const admin = await Admin.create({
            name,
            username,
            email: normalizedEmail,
            password: hashedPassword,
            role: "super_admin",
            isActive: true,
        });

        console.log("Admin seeded successfully");

        /*
         * Same welcome-email mechanism already proven to work
         * for user registration (see authController.js's
         * sendWelcomeEmail -> emailTemplateService.
         * sendTemplatedEmail) - looks up the "admin_welcome"
         * template (seeded by emailTemplateSeeder.js, admin-
         * editable), falls back to plain text if that template
         * is missing/inactive, and never includes the password -
         * whoever set ADMIN_PASSWORD already knows it. The actual
         * send is fire-and-forget and logs its own exact
         * success/failure reason (via emailService) without ever
         * throwing, so a delivery failure here can never undo the
         * admin account that was already created above.
         */

        const siteName =
            await settingsService
                .getValue("general", "site_name", "Gaming Platform")
                .catch(() => "Gaming Platform");

        await emailTemplateService.sendTemplatedEmail({
            key: "admin_welcome",
            to: admin.email,
            variables: {
                name: admin.name,
                username: admin.username,
                email: admin.email,
                role: admin.role,
                site_name: siteName,
            },
            fallbackSubject: `Your admin account on ${siteName} is ready`,
            fallbackText:
                `Hi ${admin.name},\n\n` +
                `An admin account has been created for you on ${siteName}.\n\n` +
                `Username: ${admin.username}\n` +
                `Email: ${admin.email}\n` +
                `Role: ${admin.role}\n\n` +
                `Log in with the username/email above and the password that was configured for this account.`,
        });

    } catch (error) {
        console.error("Admin seeding failed:", error.message);
    }
};

module.exports = seedAdmin;
