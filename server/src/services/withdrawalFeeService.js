const mongoose =
    require("mongoose");

const WithdrawalRequest =
    require("../models/WithdrawalRequest");

const settingsService =
    require("./settingsService");


// ==========================================================
// WITHDRAWAL FEE SERVICE
// ==========================================================
//
// The ONE place a withdrawal fee is calculated. Used both by
// the fee-preview endpoint (what the user sees before
// confirming) and by withdrawalService.createWithdrawalRequest
// (what is actually charged), so the two can never disagree.
// A fee value sent by the client is never used as the fee.
//
// Every value comes from admin settings (Settings -> Payment);
// the DEFAULTS below are only a fallback when a setting row is
// missing/unreadable, and match the seeded defaults.
//
// Tiers (upper bounds are INCLUSIVE):
//   basis <= tier1_max                 -> tier1_percent
//   tier1_max < basis <= tier2_max     -> tier2_percent
//   tier2_max < basis <= tier3_max     -> tier3_percent
//   basis > tier3_max                  -> tier4_percent
//
// "basis" is the amount used to pick the tier:
//   - daily rule ON  -> the user's total withdrawals for the
//     current calendar day (site timezone) INCLUDING this one
//   - daily rule OFF -> this withdrawal's amount alone
// The chosen tier's percentage is then applied to THIS
// withdrawal's amount only.
//
// "Today's withdrawals" = this user's requests created since
// local midnight that are pending or approved. Rejected /
// failed requests were fully refunded, so they don't count.
//
// Money flow: the full requested amount is held and debited
// exactly as before; the fee is simply not paid out
// (payout = amount - fee). Nothing is ever debited twice, and
// a rejected/failed withdrawal refunds the full amount, so no
// fee is taken on it.
// ==========================================================

const FEE_SETTING_KEYS = [
    "withdrawal_fee_enabled",
    "withdrawal_fee_daily_cumulative",
    "withdrawal_fee_tier1_max",
    "withdrawal_fee_tier2_max",
    "withdrawal_fee_tier3_max",
    "withdrawal_fee_tier1_percent",
    "withdrawal_fee_tier2_percent",
    "withdrawal_fee_tier3_percent",
    "withdrawal_fee_tier4_percent",
];

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

const DEFAULT_TIMEZONE = "Asia/Kolkata";

// Statuses that count toward "withdrawn today".
const COUNTED_STATUSES = ["pending", "approved"];

const roundMoney = (value) =>
    Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const toNumber = (value, fallback) => {

    const number = Number(value);

    return Number.isFinite(number) ? number : fallback;

};


// ==========================================================
// CONFIG
// ==========================================================

const getFeeConfig = async () => {

    let values = {};

    try {

        values =
            await settingsService.getValues(
                "payment",
                FEE_SETTING_KEYS
            );

    } catch {

        values = {};

    }

    const pick = (key) =>
        values?.[key] !== undefined && values?.[key] !== null
            ? values[key]
            : DEFAULTS[key];

    return {
        enabled: pick("withdrawal_fee_enabled") === true,
        dailyCumulative: pick("withdrawal_fee_daily_cumulative") === true,
        tiers: [
            {
                max: toNumber(pick("withdrawal_fee_tier1_max"), DEFAULTS.withdrawal_fee_tier1_max),
                percent: toNumber(pick("withdrawal_fee_tier1_percent"), DEFAULTS.withdrawal_fee_tier1_percent),
            },
            {
                max: toNumber(pick("withdrawal_fee_tier2_max"), DEFAULTS.withdrawal_fee_tier2_max),
                percent: toNumber(pick("withdrawal_fee_tier2_percent"), DEFAULTS.withdrawal_fee_tier2_percent),
            },
            {
                max: toNumber(pick("withdrawal_fee_tier3_max"), DEFAULTS.withdrawal_fee_tier3_max),
                percent: toNumber(pick("withdrawal_fee_tier3_percent"), DEFAULTS.withdrawal_fee_tier3_percent),
            },
            {
                max: null, // above tier 3
                percent: toNumber(pick("withdrawal_fee_tier4_percent"), DEFAULTS.withdrawal_fee_tier4_percent),
            },
        ],
    };

};


// ==========================================================
// START OF "TODAY" IN THE SITE TIMEZONE
// ==========================================================

const getTimezone = async () => {

    try {

        const timezone =
            await settingsService.getValue(
                "general",
                "timezone"
            );

        if (timezone) {

            // Throws RangeError for an invalid zone name.
            new Intl.DateTimeFormat("en-US", { timeZone: timezone });

            return timezone;

        }

    } catch {
        // fall through to default
    }

    return DEFAULT_TIMEZONE;

};

// Offset (ms) of `timeZone` from UTC at instant `date`.
const getZoneOffsetMs = (date, timeZone) => {

    const parts = Object.fromEntries(
        new Intl.DateTimeFormat("en-US", {
            timeZone,
            hourCycle: "h23",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        })
            .formatToParts(date)
            .map((part) => [part.type, part.value])
    );

    const asUtc = Date.UTC(
        Number(parts.year),
        Number(parts.month) - 1,
        Number(parts.day),
        Number(parts.hour),
        Number(parts.minute),
        Number(parts.second)
    );

    return asUtc - (date.getTime() - date.getMilliseconds());

};

const getStartOfToday = (timeZone, now = new Date()) => {

    const offset =
        getZoneOffsetMs(now, timeZone);

    // Wall-clock time in the zone, expressed as a UTC date.
    const local =
        new Date(now.getTime() + offset);

    const localMidnightAsUtc =
        Date.UTC(
            local.getUTCFullYear(),
            local.getUTCMonth(),
            local.getUTCDate()
        );

    // Re-check the offset at midnight itself (DST-safe).
    const midnightOffset =
        getZoneOffsetMs(
            new Date(localMidnightAsUtc - offset),
            timeZone
        );

    return new Date(localMidnightAsUtc - midnightOffset);

};


// ==========================================================
// USER'S WITHDRAWALS SO FAR TODAY
// ==========================================================

const getTodayWithdrawnTotal = async (userId, timeZone) => {

    const since =
        getStartOfToday(timeZone);

    const [row] =
        await WithdrawalRequest.aggregate([
            {
                $match: {
                    user: new mongoose.Types.ObjectId(String(userId)),
                    status: { $in: COUNTED_STATUSES },
                    createdAt: { $gte: since },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" },
                },
            },
        ]);

    return roundMoney(row?.total || 0);

};


// ==========================================================
// PURE CALCULATION (no I/O - unit-testable)
// ==========================================================

const computeFee = ({ amount, dailyTotalBefore = 0, config }) => {

    const numericAmount =
        roundMoney(amount);

    const withdrawnTodayBefore =
        roundMoney(dailyTotalBefore);

    if (!config.enabled) {

        return {
            enabled: false,
            dailyCumulative: config.dailyCumulative,
            amount: numericAmount,
            dailyTotalBefore: withdrawnTodayBefore,
            tierBasisAmount: numericAmount,
            tier: null,
            feePercent: 0,
            feeAmount: 0,
            netAmount: numericAmount,
        };

    }

    const tierBasisAmount =
        config.dailyCumulative
            ? roundMoney(withdrawnTodayBefore + numericAmount)
            : numericAmount;

    let tierIndex =
        config.tiers.findIndex(
            (tier) => tier.max !== null && tierBasisAmount <= tier.max
        );

    if (tierIndex === -1) {

        tierIndex = config.tiers.length - 1;

    }

    const feePercent =
        config.tiers[tierIndex].percent;

    const feeAmount =
        Math.min(
            roundMoney(numericAmount * feePercent / 100),
            numericAmount
        );

    return {
        enabled: true,
        dailyCumulative: config.dailyCumulative,
        amount: numericAmount,
        dailyTotalBefore: withdrawnTodayBefore,
        tierBasisAmount,
        tier: tierIndex + 1,
        feePercent,
        feeAmount,
        netAmount: roundMoney(numericAmount - feeAmount),
    };

};


// ==========================================================
// QUOTE FOR A USER (preview + actual charge)
// ==========================================================

const calculateWithdrawalFee = async (userId, amount) => {

    const config =
        await getFeeConfig();

    // Only query today's total when it can affect the result.
    const dailyTotalBefore =
        config.enabled && config.dailyCumulative
            ? await getTodayWithdrawnTotal(userId, await getTimezone())
            : 0;

    return computeFee({
        amount,
        dailyTotalBefore,
        config,
    });

};


module.exports = {
    FEE_SETTING_KEYS,
    DEFAULTS,
    getFeeConfig,
    getStartOfToday,
    getTodayWithdrawnTotal,
    computeFee,
    calculateWithdrawalFee,
    roundMoney,
};
