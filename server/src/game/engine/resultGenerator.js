const crypto = require("crypto");

const COLORS = ["red", "green", "blue"];


/*
 * ==========================================
 * RESULT GENERATOR (bet-total-weighted, house-favorable)
 * ==========================================
 *
 * The winning color is always the one with the LOWEST total
 * bet amount for the round - this is a deliberate, documented
 * house rule (minimizes payout), not a random game. Ties are
 * broken by a random pick restricted to ONLY the tied colors:
 *
 *   - One color strictly lowest -> that color wins outright.
 *   - Two colors tied for lowest -> random pick between those two.
 *   - All three colors tied (including all-zero, i.e. nobody
 *     bet) -> random pick among all three.
 *
 * Takes the color totals as a plain input object rather than
 * querying the database itself, so the selection logic stays
 * pure/testable and the caller (gameEngine) remains the single
 * place responsible for reading bet data and persisting the
 * result - nothing here ever accepts client/frontend input.
 *
 * The lowest-bet rule is controlled by the admin setting
 * game.lowest_bet_wins (passed in by gameEngine). When it is
 * OFF, the winner is a uniformly random color that ignores the
 * bet totals entirely.
 * ==========================================
 */

const generateResult = (
    colorTotals = {},
    { lowestBetWins = true } = {}
) => {

    const totals = {
        red: Number(colorTotals.red) || 0,
        green: Number(colorTotals.green) || 0,
        blue: Number(colorTotals.blue) || 0,
    };


    if (!lowestBetWins) {

        return {
            result: COLORS[crypto.randomInt(COLORS.length)],
            colorTotals: totals,
            lowestAmount: null,
            tiedColors: [],
            mode: "random",
        };

    }

    const lowestAmount =
        Math.min(
            totals.red,
            totals.green,
            totals.blue
        );

    const tiedColors =
        COLORS.filter(
            (color) => totals[color] === lowestAmount
        );

    const result =
        tiedColors.length === 1
            ? tiedColors[0]
            : tiedColors[
                Math.floor(
                    Math.random() * tiedColors.length
                )
            ];

    return {
        result,
        colorTotals: totals,
        lowestAmount,
        tiedColors,
        mode: "lowest_bet",
    };

};

module.exports = generateResult;
