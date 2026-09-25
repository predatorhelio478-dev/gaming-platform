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