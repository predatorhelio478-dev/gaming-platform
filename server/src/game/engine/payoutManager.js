const payoutService = require("../../services/payoutService");

const processPayout = async (
    roundId,
    winningColor
) => {

    try {

        const result =
            await payoutService.processRoundPayout(
                roundId,
                winningColor
            );

        return result;

    } catch (error) {

        console.error(
            "Payout Manager Error:",
            error.message
        );

        throw error;
    }
};


module.exports = {
    processPayout,
};