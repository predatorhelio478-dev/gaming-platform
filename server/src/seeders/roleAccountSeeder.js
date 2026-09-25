const bcrypt = require("bcrypt");

const Admin = require("../models/Admin");
const User = require("../models/User");
const Wallet = require("../models/Wallet");
const generateReferralCode = require("../utils/referralCodeGenerator");

/*
 * ==========================================
 * SEED: ONE "admin"-ROLE ACCOUNT + ONE "user"-ROLE ACCOUNT
 * ==========================================
 *
 * Companion to adminSeeder.js (which seeds the one-time
 * bootstrap super_admin). Unlike that seeder's coarse "does ANY
 * admin exist" check, both accounts here are checked by their
 * OWN email/username - so this stays a true no-op on every
 * later boot once each specific account exists, never creates a
 * duplicate, and never touches/resets an existing account's
 * password. Each half is independently skipped (with a clear
 * log line) if its own EMAIL + PASSWORD env vars aren't both
 * set - a missing SEED_USER_* pair never blocks the admin half
 * or vice versa. Failures never propagate: this runs on every
 * server boot (config/db.js) and must never block startup.
 */

const createUniqueReferralCode = async () => {

    for (let attempt = 0; attempt < 5; attempt++) {

        const candidate = generateReferralCode();

        const exists = await User.exists({ referralCode: candidate });

        if (!exists) return candidate;

    }

    return null;

};


const seedAdminRoleAccount = async () => {

    try {

        const email = process.env.SEED_ADMIN_EMAIL;
        const password = process.env.SEED_ADMIN_PASSWORD;

        if (!email || !password) {

            console.log(
                "Seed admin skipped - set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to create it."
            );

            return;

        }

        const normalizedEmail = email.toLowerCase().trim();

        const username =
            (process.env.SEED_ADMIN_USERNAME || "admin_seed")
                .toLowerCase()
                .trim();

        const existing = await Admin.findOne({
            $or: [{ email: normalizedEmail }, { username }],
        });

        if (existing) {

            console.log(
                `Seed admin skipped - an admin with email "${normalizedEmail}" or username "${username}" already exists.`
            );

            return;

        }

        const hashedPassword = await bcrypt.hash(password, 12);

        await Admin.create({
            name: "Seeded Admin",
            username,
            email: normalizedEmail,
            password: hashedPassword,
            role: "admin",
            isActive: true,
            emailVerified: true,
            phoneVerified: true,
        });

        console.log("Seed admin created successfully.");

    } catch (error) {

        console.error("Seed admin creation failed:", error.message);

    }

};


const seedUserRoleAccount = async () => {

    try {

        const email = process.env.SEED_USER_EMAIL;
        const password = process.env.SEED_USER_PASSWORD;

        if (!email || !password) {

            console.log(
                "Seed user skipped - set SEED_USER_EMAIL and SEED_USER_PASSWORD to create it."
            );

            return;

        }

        const normalizedEmail = email.toLowerCase().trim();

        const username =
            (process.env.SEED_USER_USERNAME || "user_seed")
                .toLowerCase()
                .trim();

        const existing = await User.findOne({
            $or: [{ email: normalizedEmail }, { username }],
        });

        if (existing) {

            console.log(
                `Seed user skipped - a user with email "${normalizedEmail}" or username "${username}" already exists.`
            );

            return;

        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const referralCode = await createUniqueReferralCode();

        const user = await User.create({
            fullName: "Seeded User",
            username,
            email: normalizedEmail,
            password: hashedPassword,
            role: "user",
            status: "active",
            emailVerified: true,
            mobileVerified: true,
            ...(referralCode ? { referralCode } : {}),
        });

        await Wallet.create({ user: user._id });

        console.log("Seed user created successfully.");

    } catch (error) {

        console.error("Seed user creation failed:", error.message);

    }

};


const seedRoleAccounts = async () => {

    await seedAdminRoleAccount();
    await seedUserRoleAccount();

};

module.exports = seedRoleAccounts;
