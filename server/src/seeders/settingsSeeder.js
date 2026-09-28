const crypto = require("crypto");
const Setting = require("../models/Setting");
const defaultSettings = require("../config/defaultSettings");

const seedSettings = async () => {
    try {
        for (const setting of defaultSettings) {
            await Setting.findOneAndUpdate(
                {
                    category: setting.category,
                    key: setting.key,
                },
                {
                    $setOnInsert: setting,
                },
                {
                    upsert: true,
                    new: true,
                }
            );
        }

        // one-time cleanup: two_factor_enabled was removed from
        // defaultSettings.js (no 2FA feature exists to gate) -
        // this deletes any row already seeded by an earlier
        // deploy on an existing database. No-op once gone.
        await Setting.deleteOne({
            category: "security",
            key: "two_factor_enabled",
        });

        // one-time metadata fix for rows seeded before these
        // flags changed ($setOnInsert above never updates an
        // existing row). Only the flags - the saved value is
        // left untouched:
        //  - debug_mode was isSensitive, which disabled its
        //    toggle AND made every System-tab save fail
        //    ("Sensitive setting cannot be updated").
        //  - maintenance_mode must be public so the frontend
        //    can render the maintenance page.
        await Setting.updateOne(
            { category: "system", key: "debug_mode" },
            { $set: { isSensitive: false } }
        );

        await Setting.updateOne(
            { category: "system", key: "maintenance_mode" },
            { $set: { isPublic: true } }
        );

        // content upgrade: bring the Terms & Conditions / Privacy
        // Policy up to the current default text on databases still
        // holding an older DEFAULT - empty, the short "will be
        // published here" placeholder, or a previously shipped
        // default version (matched by SHA-256 fingerprint). Text
        // an admin has written never matches, so it's never touched.
        //
        // When changing a default in config/legalDocuments.js, add
        // the fingerprint of the version being replaced here.
        const legalDefaults = [
            {
                key: "terms_and_conditions",
                placeholder: "Our full Terms & Conditions will be published here by the Gamzzones team. Please contact Support if you have questions in the meantime.",
                previousVersionHashes: [
                    // v1 - full-length version, before withdrawal fees
                    "7f0d4fc8a97c827081a398ad26cc344598eef867de62453c9868f5981bd34513",
                    // v2 - full-length version with withdrawal-fee clauses
                    "08703668e4fd12bf599a6a482098a571514b5a84531e60f44b9f2530faa46986",
                ],
            },
            {
                key: "privacy_policy",
                placeholder: "Our full Privacy Policy will be published here by the Gamzzones team. Please contact Support if you have questions in the meantime.",
                previousVersionHashes: [
                    // v1 - full-length version
                    "a5abc3d3c4b197cb9ce0af53fdee94253fe7bed88d90d3b8a8d6aa23efc59ccc",
                ],
            },
        ];

        for (const { key, placeholder, previousVersionHashes } of legalDefaults) {
            const fullText = defaultSettings.find(
                (setting) =>
                    setting.category === "legal" &&
                    setting.key === key
            )?.value;

            if (!fullText) {
                continue;
            }

            const current = await Setting.findOne({
                category: "legal",
                key,
            }).select("value");

            if (!current || current.value === fullText) {
                continue;
            }

            const currentValue =
                typeof current.value === "string"
                    ? current.value
                    : "";

            const isOldDefault =
                current.value === null ||
                currentValue.trim() === "" ||
                currentValue === placeholder ||
                previousVersionHashes.includes(
                    crypto
                        .createHash("sha256")
                        .update(currentValue)
                        .digest("hex")
                );

            if (isOldDefault) {
                await Setting.updateOne(
                    { _id: current._id },
                    { $set: { value: fullText } }
                );
            }
        }

        console.log("Settings seeded successfully.");
    } catch (error) {
        console.error(
            "Settings seeding failed:",
            error.message
        );

        throw error;
    }
};

module.exports = seedSettings;