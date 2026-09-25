const bcrypt = require("bcrypt");

const Admin = require("../models/Admin");
const User = require("../models/User");
const Wallet = require("../models/Wallet");
const generateReferralCode = require("../utils/referralCodeGenerator");

/*
 * ==========================================
 * SEED: ONE super_admin + ONE "admin"-ROLE ACCOUNT + ONE "user"-ROLE ACCOUNT
 * ==========================================
 *
 * Companion to adminSeeder.js (which ALSO reads the
 * SEED_SUPER_ADMIN_ and legacy ADMIN_ vars, but only as a coarse,
 * one-time "does ANY admin exist anywhere" bootstrap - it silently skips
 * entirely once any admin account exists, even a completely
 * unrelated one). That coarse check means adminSeeder.js alone
 * cannot add a NEW super_admin to a database that already has a
 * different admin in it - which is exactly the situation on any
 * real deployment after its first admin was created. The
 * super_admin half below closes that gap: it is checked by its
 * OWN specific email/username (same fine-grained pattern as the
 * admin/user halves), so it fires independently of whatever else
 * already exists, and is a true no-op once that specific account
 * exists. All three halves are independently skipped (with a
 * clear log line) if their own EMAIL + PASSWORD env vars aren't
 * both set, and none of them ever overwrite an existing account's
 * password. Failures never propagate: this runs on every server
 * boot (config/db.js) and must never block startup.
 */

const createUniqueReferralCode = async () => {

    for (let attempt = 0; attempt < 5; attempt++) {

        const candidate = generateReferralCode();

        const exists = await User.exists({ referralCode: candidate });

        if (!exists) return candidate;

    }

    return null;

};


const seedSuperAdminRoleAccount = async () => {

    try {

        const email = process.env.SEED_SUPER_ADMIN_EMAIL;
        const password = process.env.SEED_SUPER_ADMIN_PASSWORD;

        if (!email || !password) {

            console.log(
                "Seed super admin skipped - set SEED_SUPER_ADMIN_EMAIL and SEED_SUPER_ADMIN_PASSWORD to create it."
            );

            return;

        }

        const normalizedEmail = email.toLowerCase().trim();

        const username =
            (process.env.SEED_SUPER_ADMIN_USERNAME || "super_admin_seed")
                .toLowerCase()
                .trim();

        const existing = await Admin.findOne({
            $or: [{ email: normalizedEmail }, { username }],
        });

        if (existing) {

            console.log(
                `Seed super admin skipped - an admin with email "${normalizedEmail}" or username "${username}" already exists.`
            );

            return;

        }

        const hashedPassword = await bcrypt.hash(password, 12);

        await Admin.create({
            name: process.env.SEED_SUPER_ADMIN_NAME || "Seeded Super Admin",
            username,
            email: normalizedEmail,
            password: hashedPassword,
            role: "super_admin",
            isActive: true,
            emailVerified: true,
            phoneVerified: true,
        });

        console.log("Seed super admin created successfully.");

    } catch (error) {

        console.error("Seed super admin creation failed:", error.message);

    }

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

    await seedSuperAdminRoleAccount();
    await seedAdminRoleAccount();
    await seedUserRoleAccount();

};

module.exports = seedRoleAccounts;
