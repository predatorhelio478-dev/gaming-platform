const faqService = require("../services/faqService");


const getPublicFaq = async (req, res) => {

    try {

        const categories = await faqService.getPublicFaq();

        return res.status(200).json({ success: true, data: categories });

    } catch (error) {

        console.error("Public FAQ Error:", error);

        return res.status(500).json({ success: false, message: "Unable to fetch FAQ." });

    }

};


module.exports = { getPublicFaq };
