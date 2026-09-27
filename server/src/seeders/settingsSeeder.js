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