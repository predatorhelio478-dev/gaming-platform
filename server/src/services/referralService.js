const User =
    require("../models/User");

const walletService =
    require("./walletService");

const settingsService =
    require("./settingsService");

const { createAuditLog } =
    require("./auditLogService");

const notificationService =
    require("./notificationService");


const DEFAULT_REFERRAL_BONUS_AMOUNT = 200;


/*
 * ==========================================
 * QUALIFY REFERRAL
 * ==========================================
 *
 * Called the first time a referred user places a REAL-mode
 * bet (a stronger signal of genuine engagement than mere
 * registration). Awards the referrer's bonus balance exactly
 * once per referred user via an atomic, race-safe flag flip
 * on the REFERRED user (referralQualified), mirroring the
 * test-welcome-balance grant pattern in authController.
 *
 * Must never throw in a way that breaks bet placement -
 * callers should treat this as best-effort and non-blocking.
 */

const qualifyReferral = async (userId) => {

    try {

        const user =
            await User.findById(userId)
                .select("referredBy referralQualified");

        if (
            !user ||
            !user.referredBy ||
            user.referralQualified
        ) {

            return;

        }


        // ======================================================
        // REFERRALS GLOBALLY ENABLED?
        // ======================================================
        //
        // Was previously decorative (admin could toggle it,
        // nothing read it). Checked BEFORE the one-time
        // qualification flip below so a genuine qualifying bet
        // placed while referrals are disabled isn't "used up" -
        // if the admin re-enables later, that bet can still
        // qualify on its next natural trigger.

        const referralEnabled =
            await settingsService.getValue(
                "user",
                "referral_enabled",
                true
            );

        if (referralEnabled !== true) {

            return;

        }


        // ======================================================
        // ATOMIC ONE-TIME FLIP
        // ======================================================

        const wonQualification =
            await User.findOneAndUpdate(
                {
                    _id: userId,
                    referralQualified: false,
                },
                {
                    $set: {
                        referralQualified: true,
                    },
                }
            );

        if (!wonQualification) {

            return;

        }


        // ======================================================
        // AWARD REFERRER'S BONUS
        // ======================================================

        const bonusAmount =
            Number(
                await settingsService.getValue(
                    "user",
                    "referral_bonus_amount",
                    DEFAULT_REFERRAL_BONUS_AMOUNT
                )
            ) || DEFAULT_REFERRAL_BONUS_AMOUNT;

        if (bonusAmount <= 0) {

            return;

        }

        await walletService.creditPool(
            user.referredBy,
            bonusAmount,
            "bonus",
            `Referral bonus - referred user ${userId}`,
            "bonusBalance"
        );

        await createAuditLog({
            actorType: "system",
            action: "referral.bonus_awarded",
            module: "referrals",
            key: String(user.referredBy),
            newValue: bonusAmount,
            metadata: {
                referredUserId: String(userId),
            },
        });

        notificationService
            .notify(
                user.referredBy,
                "referral",
                "Referral bonus earned",
                `You earned a ₹${bonusAmount} bonus because a friend you referred placed their first real-money bet.`,
                { referredUserId: String(userId) }
            )
            .catch(() => {});

    } catch (error) {

        console.error(
            "Referral Qualification Error:",
            error.message
        );

    }

};


module.exports = {
    qualifyReferral,
};
