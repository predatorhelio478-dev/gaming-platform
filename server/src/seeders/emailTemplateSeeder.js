const EmailTemplate = require("../models/EmailTemplate");
const defaultEmailTemplates = require("../config/defaultEmailTemplates");

const seedEmailTemplates = async () => {
    try {
        for (const template of defaultEmailTemplates) {
            await EmailTemplate.findOneAndUpdate(
                { key: template.key },
                { $setOnInsert: template },
                { upsert: true, new: true }
            );
        }

        console.log("Email templates seeded successfully.");
    } catch (error) {
        console.error("Email template seeding failed:", error.message);
        throw error;
    }
};

module.exports = seedEmailTemplates;
