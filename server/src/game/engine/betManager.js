const betService = require("../../services/betService");

/**
 * Place a bet for the current game round.
 *
 * @param {String} userId
 * @param {String} color
 * @param {Number} amount
 * @returns {Object}
 */
const placeBet = async (userId, color, amount) => {
    try {

        const bet = await betService.placeBet(
            userId,
            color,
            amount
        );

        return bet;

    } catch (error) {

        console.error(
            "Bet Manager Error:",
            error.message
        );

        throw error;
    }
};

module.exports = {
    placeBet,
};