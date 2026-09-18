const betService = require("../services/betService");


/*
 * ==========================================
 * PLACE BET
 * ==========================================
 */

const placeBet = async (req, res) => {

    try {

        /*
         * User ID comes from authentication
         * middleware.
         */

        const userId =
            req.user?.id ||
            req.user?._id;


        if (!userId) {

            return res.status(401).json({

                success: false,

                message: "Unauthorized",

            });

        }


        /*
         * Get bet data from request body.
         */

        const {
            color,
            amount,
            mode,
        } = req.body;


        /*
         * Basic validation.
         */

        if (!color) {

            return res.status(400).json({

                success: false,

                message: "Color is required",

            });

        }


        if (
            amount === undefined ||
            amount === null ||
            amount === ""
        ) {

            return res.status(400).json({

                success: false,

                message: "Bet amount is required",

            });

        }


        /*
         * Place bet through service.
         */

        const bet =
            await betService.placeBet(
                userId,
                color,
                Number(amount),
                mode || "real"
            );


        /*
         * Success response.
         */

        return res.status(201).json({

            success: true,

            message: "Bet placed successfully",

            bet,

        });

    } catch (error) {

        console.error(
            "Place Bet Controller Error:",
            error.message
        );


        return res.status(400).json({

            success: false,

            message: error.message,

        });

    }

};


/*
 * ==========================================
 * INCREASE BET
 * ==========================================
 */

const increaseBet = async (req, res) => {

    try {

        const userId =
            req.user?.id ||
            req.user?._id;


        if (!userId) {

            return res.status(401).json({

                success: false,

                message: "Unauthorized",

            });

        }


        const {
            color,
            amount,
        } = req.body;


        if (!color) {

            return res.status(400).json({

                success: false,

                message: "Color is required",

            });

        }


        if (
            amount === undefined ||
            amount === null ||
            amount === ""
        ) {

            return res.status(400).json({

                success: false,

                message: "Increase amount is required",

            });

        }


        const bet =
            await betService.increaseBet(
                userId,
                color,
                Number(amount)
            );


        return res.status(200).json({

            success: true,

            message: "Bet increased successfully",

            bet,

        });

    } catch (error) {

        console.error(
            "Increase Bet Controller Error:",
            error.message
        );


        return res.status(400).json({

            success: false,

            message: error.message,

        });

    }

};


/*
 * ==========================================
 * GET MY BET HISTORY
 * ==========================================
 */

const getMyBets = async (req, res) => {

    try {

        /*
         * Get authenticated user.
         */

        const userId =
            req.user?.id ||
            req.user?._id;


        if (!userId) {

            return res.status(401).json({

                success: false,

                message: "Unauthorized",

            });

        }


        /*
         * Optional page/limit/filters.
         *
         * Example:
         * /api/bets/history?page=1&limit=20&color=red&result=won&search=90123&dateFrom=2026-01-01&dateTo=2026-01-31
         */

        const { page, limit, color, result: resultFilter, search, dateFrom, dateTo } = req.query;

        const result =
            await betService.getUserBets(
                userId,
                { page, limit, color, result: resultFilter, search, dateFrom, dateTo }
            );


        return res.status(200).json({

            success: true,

            count: result.bets.length,

            bets: result.bets,

            total: result.total,

            page: result.page,

            totalPages: result.totalPages,

        });

    } catch (error) {

        console.error(
            "Bet History Controller Error:",
            error.message
        );


        return res.status(500).json({

            success: false,

            message: "Unable to fetch bet history",

        });

    }

};


module.exports = {

    placeBet,

    increaseBet,

    getMyBets,

};