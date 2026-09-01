const adminBetService =
    require("../services/adminBetService");


// ==========================================
// GET ADMIN BETS
// ==========================================

const getBets = async (
    req,
    res
) => {

    try {

        const {
            page = 1,
            limit = 20,
            search = "",
            color = "all",
            result = "all",
        } = req.query;


        const data =
            await adminBetService.getBets({
                page,
                limit,
                search,
                color,
                result,
            });


        return res.status(200).json({

            success: true,

            ...data,

        });

    } catch (error) {

        console.error(
            "Admin Get Bets Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to fetch bets.",

        });

    }

};


// ==========================================
// EXPORT
// ==========================================

module.exports = {
    getBets,
};