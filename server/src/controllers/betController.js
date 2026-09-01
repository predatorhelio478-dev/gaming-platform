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
                Number(amount)
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
         * Optional limit.
         *
         * Example:
         * /api/bets/history?limit=20
         */

        const limit =
            Number(req.query.limit) || 20;


        /*
         * Prevent excessively large requests.
         */

        const safeLimit =
            Math.min(Math.max(limit, 1), 100);


        /*
         * Get user's bets.
         */

        const bets =
            await betService.getUserBets(
                userId,
                safeLimit
            );


        return res.status(200).json({

            success: true,

            count: bets.length,

            bets,

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

    getMyBets,

};