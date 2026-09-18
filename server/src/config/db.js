const mongoose = require("mongoose");
const seedSettings = require("../seeders/settingsSeeder");
const seedEmailTemplates = require("../seeders/emailTemplateSeeder");
const seedFaq = require("../seeders/faqSeeder");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        await seedSettings();
        await seedEmailTemplates();
        await seedFaq();

        console.log("MongoDB Connected");
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

module.exports = connectDB;