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