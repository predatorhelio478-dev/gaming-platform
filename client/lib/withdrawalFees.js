// ======================================================
// WITHDRAWAL FEE RULES (display only)
// ======================================================
//
// Turns the public payment settings into human-readable fee
// tiers for the Withdrawal and Legal & Help pages. Display
// only - the fee actually charged is always calculated by the
// server (services/withdrawalFeeService.js), and the withdrawal
// form shows the server's own quote before confirming.
//
// Fallbacks mirror the server's seeded defaults, used only if a
// setting is missing.

const DEFAULTS = {
    withdrawal_fee_enabled: true,
    withdrawal_fee_daily_cumulative: true,
    withdrawal_fee_tier1_max: 1000,
    withdrawal_fee_tier2_max: 5000,
    withdrawal_fee_tier3_max: 10000,
    withdrawal_fee_tier1_percent: 0,
    withdrawal_fee_tier2_percent: 1,
    withdrawal_fee_tier3_percent: 1.5,
    withdrawal_fee_tier4_percent: 2,
};

const pick = (payment, key) =>
    payment?.[key] !== undefined && payment?.[key] !== null
        ? payment[key]
        : DEFAULTS[key];

export const formatInr = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

// payment = the `payment` category of the public settings.
export const getWithdrawalFeeRules = (payment) => {

    const enabled =
        pick(payment, "withdrawal_fee_enabled") === true;

    const dailyCumulative =
        pick(payment, "withdrawal_fee_daily_cumulative") === true;

    const [max1, max2, max3] = [1, 2, 3].map(
        (tier) => Number(pick(payment, `withdrawal_fee_tier${tier}_max`))
    );

    const [pct1, pct2, pct3, pct4] = [1, 2, 3, 4].map(
        (tier) => Number(pick(payment, `withdrawal_fee_tier${tier}_percent`))
    );

    return {
        enabled,
        dailyCumulative,
        tiers: [
            { label: `Up to ${formatInr(max1)}`, percent: pct1 },
            { label: `Above ${formatInr(max1)} up to ${formatInr(max2)}`, percent: pct2 },
            { label: `Above ${formatInr(max2)} up to ${formatInr(max3)}`, percent: pct3 },
            { label: `Above ${formatInr(max3)}`, percent: pct4 },
        ],
        basisText: dailyCumulative
            ? "The fee tier is based on your total withdrawals for the day (including the new withdrawal), and the tier's percentage is applied to the new withdrawal amount."
            : "The fee tier is based on the amount of each withdrawal.",
        deductionText: "The fee is deducted from the amount paid out, so you receive the withdrawal amount minus the fee. Rejected or failed withdrawals are refunded in full with no fee.",
    };

};
