const mongoose = require("mongoose");

const Payout =
    require("../models/Payout");

const Bet =
    require("../models/Bet");

const Transaction =
    require("../models/Transaction");

const GameRound =
    require("../models/GameRound");

const walletService =
    require("./walletService");

const PayoutRefund =
    require("../models/PayoutRefund");

const settingsService =
    require("./settingsService");

const notificationService =
    require("./notificationService");

const { createAuditLog } =
    require("./auditLogService");


const DEFAULT_PAYOUT_MULTIPLIER = 2;

const DEFAULT_BONUS_CONVERSION_RATE = 30;

// Total attempts (including the first) before an automatic
// payout is escalated to "manual_review" for admin attention.
const MAX_AUTO_PAYOUT_ATTEMPTS = 3;


/*
|--------------------------------------------------------------------------
| CREDIT A WIN, POOL-AWARE
|--------------------------------------------------------------------------
|
| real  -> unchanged: full amount to wallet.balance.
| test  -> full amount stays in wallet.testBalance.
| bonus -> split: bonus_conversion_rate% of the winnings
|          convert to real (withdrawable) balance, the
|          remainder stays in wallet.bonusBalance
|          (bet-only, never withdrawable). Both legs are
|          credited atomically in one Mongo transaction so
|          a mid-split failure can't leave a partial credit.
|--------------------------------------------------------------------------
*/

const creditPayoutByMode = async (
    bet,
    payoutAmount,
    roundNumber,
    payoutId
) => {

    if (
        bet.walletMode ===
        "test"
    ) {

        return walletService.creditPool(
            bet.user,
            payoutAmount,
            "win",
            `Color Prediction Win - Round ${roundNumber}`,
            "testBalance",
            { payoutId }
        );

    }


    /*
     * "real" mode bets that were partially funded from
     * bonusBalance (see betService.computeBonusSplit - up to
     * 30% of the bet amount). The bonus portion simply RETURNS
     * to bonusBalance (never converted to real money, no
     * multiplier applied - it's the user's own stake coming
     * back). The real-money portion is what the payout
     * multiplier actually applies to. computePayoutAmount()
     * (below) already builds `payoutAmount` as
     * bet.bonusAmount + bet.realAmount * multiplier, so the
     * real leg here is just payoutAmount - bonusAmount. Both
     * legs are credited atomically in one Mongo transaction.
     */

    const bonusAmount =
        Number(
            bet.bonusAmount || 0
        );

    if (
        bet.walletMode ===
        "real" &&
        bonusAmount > 0
    ) {

        const realPayout =
            Math.round(
                (payoutAmount - bonusAmount) *
                100
            ) / 100;


        const session =
            await mongoose.startSession();


        try {

            session.startTransaction();


            const bonusResult =
                await walletService.creditPool(
                    bet.user,
                    bonusAmount,
                    "win",
                    `Color Prediction - Bonus stake returned - Round ${roundNumber}`,
                    "bonusBalance",
                    { payoutId, session }
                );


            const realResult =
                realPayout > 0
                    ? await walletService.credit(
                        bet.user,
                        realPayout,
                        "win",
                        `Color Prediction Win (real-money portion) - Round ${roundNumber}`,
                        { payoutId, session }
                    )
                    : null;


            await session.commitTransaction();


            return realResult || bonusResult;

        } catch (error) {

            await session.abortTransaction();

            throw error;

        } finally {

            await session.endSession();

        }

    }


    if (
        bet.walletMode ===
        "bonus"
    ) {

        const conversionRate =
            Number(
                await settingsService.getValue(
                    "user",
                    "bonus_conversion_rate",
                    DEFAULT_BONUS_CONVERSION_RATE
                )
            ) ||
            DEFAULT_BONUS_CONVERSION_RATE;


        const realPart =
            Math.round(
                payoutAmount *
                (conversionRate / 100) *
                100
            ) / 100;


        const bonusPart =
            Math.round(
                (payoutAmount - realPart) *
                100
            ) / 100;


        const session =
            await mongoose.startSession();


        try {

            session.startTransaction();


            const realResult =
                realPart > 0
                    ? await walletService.credit(
                        bet.user,
                        realPart,
                        "win",
                        `Color Prediction Win (${conversionRate}% bonus conversion) - Round ${roundNumber}`,
                        { payoutId, session }
                    )
                    : null;


            const bonusResult =
                bonusPart > 0
                    ? await walletService.creditPool(
                        bet.user,
                        bonusPart,
                        "win",
                        `Color Prediction Win (bonus retained) - Round ${roundNumber}`,
                        "bonusBalance",
                        { payoutId, session }
                    )
                    : null;


            await session.commitTransaction();


            return realResult || bonusResult;

        } catch (error) {

            await session.abortTransaction();

            throw error;

        } finally {

            await session.endSession();

        }

    }


    /*
     * "real" (default / backward compatible)
     */

    return walletService.credit(
        bet.user,
        payoutAmount,
        "win",
        `Color Prediction Win - Round ${roundNumber}`,
        { payoutId }
    );

};


/*
|--------------------------------------------------------------------------
| COMPUTE TOTAL PAYOUT AMOUNT FOR A WINNING BET
|--------------------------------------------------------------------------
|
| "real" mode bets with a bonusAmount (30%-cap blended bets):
| total credited = bonusAmount (returned as-is) + realAmount *
| multiplier. When bonusAmount is 0 (plain real bet, or a bet
| placed before this split existed), this is identical to the
| original bet.amount * multiplier - fully backward compatible.
| "test"/legacy "bonus" mode bets are unaffected: bet.amount *
| multiplier, same as always.
|--------------------------------------------------------------------------
*/

const computePayoutAmount = (
    bet,
    payoutMultiplier
) => {

    const bonusAmount =
        Number(
            bet.bonusAmount || 0
        );

    if (
        bet.walletMode ===
        "real" &&
        bonusAmount > 0
    ) {

        const realAmount =
            bet.realAmount != null
                ? Number(bet.realAmount)
                : Math.max(
                    Number(bet.amount) - bonusAmount,
                    0
                );

        return (
            Math.round(
                (bonusAmount +
                    realAmount * payoutMultiplier) *
                100
            ) / 100
        );

    }

    return (
        Number(bet.amount) *
        payoutMultiplier
    );

};


/*
|--------------------------------------------------------------------------
| PAYOUT SERVICE
|--------------------------------------------------------------------------
*/

class PayoutService {


    /*
    |--------------------------------------------------------------------------
    | PROCESS COMPLETE ROUND
    |--------------------------------------------------------------------------
    */

    async processRoundPayout(
        roundId,
        winningColor
    ) {

        const bets =
            await Bet.find({
                round:
                    roundId,

                result:
                    "pending",
            });


        let totalPayout =
            0;

        let winningBets =
            0;

        let losingBets =
            0;

        let failedPayouts =
            0;

        let pendingPayouts =
            0;


        /*
         * Get round once.
         */

        const round =
            await GameRound.findById(
                roundId
            );


        const roundNumber =
            round?.roundNumber ||
            roundId;


        const payoutMultiplier =
            Number(
                await settingsService.getValue(
                    "game",
                    "payout_multiplier",
                    DEFAULT_PAYOUT_MULTIPLIER
                )
            ) ||
            DEFAULT_PAYOUT_MULTIPLIER;


        /*
         * ==========================================
         * PROCESS EACH BET
         * ==========================================
         */

        for (
            const bet
            of bets
        ) {


            /*
             * ==========================================
             * LOSING BET
             * ==========================================
             */

            if (
                bet.color !==
                winningColor
            ) {

                bet.result =
                    "lost";

                bet.payout =
                    0;

                await bet.save();

                losingBets++;

                continue;

            }


            /*
             * ==========================================
             * WINNING BET
             * ==========================================
             */

            const payoutAmount =
                computePayoutAmount(
                    bet,
                    payoutMultiplier
                );


            /*
             * ==========================================
             * FIND EXISTING PAYOUT
             * ==========================================
             */

            let payout =
                await Payout.findOne({
                    bet:
                        bet._id,
                });


            /*
             * ==========================================
             * ALREADY PAID
             * ==========================================
             */

            if (
                payout &&
                payout.status ===
                "paid"
            ) {

                /*
                 * Synchronize bet.
                 */

                if (
                    bet.result !==
                    "won" ||
                    Number(
                        bet.payout ||
                        0
                    ) !==
                    payoutAmount
                ) {

                    bet.result =
                        "won";

                    bet.payout =
                        payoutAmount;

                    await bet.save();

                }


                totalPayout +=
                    payoutAmount;

                winningBets++;

                continue;

            }


            /*
             * ==========================================
             * MANUAL REVIEW
             * ==========================================
             */

            if (
                payout &&
                payout.status ===
                "manual_review"
            ) {

                pendingPayouts++;

                continue;

            }


            /*
             * ==========================================
             * CANCELLED / REVERSED
             * ==========================================
             */

            if (
                payout &&
                (
                    payout.status ===
                    "cancelled" ||

                    payout.status ===
                    "reversed"
                )
            ) {

                failedPayouts++;

                continue;

            }


            /*
             * ==========================================
             * CREATE PAYOUT
             * ==========================================
             */

            if (!payout) {

                try {

                    payout =
                        await Payout.create({

                            user:
                                bet.user,

                            bet:
                                bet._id,

                            round:
                                roundId,

                            betAmount:
                                Number(
                                    bet.amount
                                ),

                            winningColor:
                                winningColor,

                            payoutAmount:
                                payoutAmount,

                            walletMode:
                                bet.walletMode ||
                                "real",

                            status:
                                "pending",

                            failureReason:
                                "",

                            retryCount:
                                0,

                            remark:
                                "Color prediction payout",

                        });

                } catch (
                error
                ) {

                    /*
                     * Another process may have
                     * created the payout.
                     */

                    if (
                        error?.code ===
                        11000
                    ) {

                        payout =
                            await Payout.findOne({
                                bet:
                                    bet._id,
                            });

                    } else {

                        throw error;

                    }

                }

            }


            if (!payout) {

                failedPayouts++;

                continue;

            }


            /*
             * ==========================================
             * CHECK EXISTING WIN TRANSACTION
             * ==========================================
             *
             * A payout may have multiple lifecycle
             * transactions:
             *
             * win
             * payout_reverse
             * refund
             * payout_restore
             *
             * Therefore we ONLY check the original
             * win transaction here.
             *
             * ==========================================
             */

            const existingTransaction =
                await Transaction.findOne({

                    payout:
                        payout._id,

                    type:
                        "win",

                });


            if (
                existingTransaction
            ) {

                /*
                 * Wallet credit already happened.
                 *
                 * Synchronize payout and bet.
                 */

                bet.result =
                    "won";

                bet.payout =
                    payoutAmount;

                await bet.save();


                payout.status =
                    "paid";

                payout.transactionId =
                    existingTransaction
                        .transactionId;

                payout.processedAt =
                    payout.processedAt ||
                    existingTransaction
                        .createdAt ||
                    new Date();

                payout.failureReason =
                    "";

                payout.remark =
                    "Payout already credited; transaction synchronized.";

                await payout.save();


                totalPayout +=
                    payoutAmount;

                winningBets++;

                continue;

            }


            /*
             * ==========================================
             * PROCESSING - AUTOMATIC RETRY (up to
             * MAX_AUTO_PAYOUT_ATTEMPTS total attempts)
             * ==========================================
             *
             * Each attempt is immediate (no delay) since this
             * runs once per round settlement, not on a hot
             * path - a transient DB/network blip is expected
             * to clear within milliseconds. Between attempts,
             * the win Transaction is re-checked so a "failure"
             * caused only by a slow/ambiguous response (the
             * credit actually landed) is detected and treated
             * as success rather than retried again.
             * ==========================================
             */

            let walletResult =
                null;

            let lastError =
                null;

            let attemptsMade =
                0;


            for (
                let attempt = 1;
                attempt <= MAX_AUTO_PAYOUT_ATTEMPTS;
                attempt++
            ) {

                attemptsMade =
                    attempt;

                payout.status =
                    "processing";

                payout.retryCount =
                    attempt - 1;

                payout.failureReason =
                    "";

                await payout.save();


                try {

                    /*
                     * ==========================================
                     * CREDIT WALLET (pool matching bet.walletMode)
                     * ==========================================
                     *
                     * real  -> full amount to real balance (unchanged).
                     * test  -> full amount stays in the test ledger.
                     * bonus -> split: bonus_conversion_rate% converts
                     *          to real (withdrawable) balance, the
                     *          remainder stays as bonus balance
                     *          (bet-only). Both legs are credited
                     *          atomically in one Mongo transaction.
                     */

                    walletResult =
                        await creditPayoutByMode(
                            bet,
                            payoutAmount,
                            roundNumber,
                            payout._id
                        );

                    lastError =
                        null;

                    break;


                } catch (
                error
                ) {

                    lastError =
                        error;


                    /*
                     * ==========================================
                     * CHECK WIN TRANSACTION AGAIN
                     * ==========================================
                     *
                     * The credit may have actually succeeded
                     * even though this attempt threw (e.g. a
                     * timeout on the response, not the write).
                     * ==========================================
                     */

                    const transactionAfterError =
                        await Transaction.findOne({

                            payout:
                                payout._id,

                            type:
                                "win",

                        });


                    if (
                        transactionAfterError
                    ) {

                        walletResult = {
                            transactionId:
                                transactionAfterError
                                    .transactionId,
                        };

                        lastError =
                            null;

                        break;

                    }


                    console.error(
                        `PAYOUT ATTEMPT ${attempt}/${MAX_AUTO_PAYOUT_ATTEMPTS} FAILED`,
                        {
                            payoutId:
                                payout._id,

                            betId:
                                bet._id,

                            userId:
                                bet.user,

                            amount:
                                payoutAmount,

                            error:
                                error?.message,
                        }
                    );

                }

            }


            if (!lastError) {

                /*
                 * ==========================================
                 * SUCCESS (on attempt 1, 2 or 3)
                 * ==========================================
                 */

                bet.result =
                    "won";

                bet.payout =
                    payoutAmount;

                await bet.save();


                payout.status =
                    "paid";

                payout.transactionId =
                    walletResult?.transactionId ||
                    walletResult?.transaction
                        ?.transactionId ||
                    null;

                payout.processedAt =
                    new Date();

                payout.failureReason =
                    "";

                payout.retryCount =
                    attemptsMade - 1;

                payout.remark =
                    attemptsMade > 1
                        ? `Payout credited successfully after ${attemptsMade} attempt(s).`
                        : "Payout credited successfully.";

                await payout.save();

                notificationService
                    .notify(
                        bet.user,
                        "bet_won",
                        "You won!",
                        `Your bet on ${winningColor} won! ₹${payoutAmount} has been credited.`,
                        { payoutId: String(payout._id), betId: String(bet._id), roundNumber }
                    )
                    .catch(() => {});


                totalPayout +=
                    payoutAmount;

                winningBets++;


            } else {

                /*
                 * ==========================================
                 * ALL ATTEMPTS EXHAUSTED - REQUIRES ATTENTION
                 * ==========================================
                 *
                 * Escalated to the project's existing
                 * "manual_review" status (not "failed") so it
                 * surfaces in the admin Payout Attention view
                 * and is never silently lost. The bet itself
                 * stays "pending" (not "lost") so it is never
                 * mistaken for a loss while payout is still
                 * outstanding.
                 * ==========================================
                 */

                payout.status =
                    "manual_review";

                payout.failureReason =
                    lastError?.message ||
                    "Wallet credit failed.";

                payout.retryCount =
                    MAX_AUTO_PAYOUT_ATTEMPTS;

                payout.remark =
                    `Automatic payout failed after ${MAX_AUTO_PAYOUT_ATTEMPTS} attempts - requires manual attention.`;

                await payout.save();


                pendingPayouts++;


                console.error(
                    "PAYOUT REQUIRES ATTENTION (all automatic attempts failed)",
                    {
                        payoutId:
                            payout._id,

                        betId:
                            bet._id,

                        userId:
                            bet.user,

                        amount:
                            payoutAmount,

                        attempts:
                            MAX_AUTO_PAYOUT_ATTEMPTS,

                        error:
                            lastError?.message,
                    }
                );


                createAuditLog({
                    actorType: "system",
                    action: "payout.requires_attention",
                    module: "payouts",
                    key: String(payout._id),
                    metadata: {
                        roundId: String(roundId),
                        roundNumber,
                        userId: String(bet.user),
                        betId: String(bet._id),
                        payoutAmount,
                        attempts: MAX_AUTO_PAYOUT_ATTEMPTS,
                        failureReason: payout.failureReason,
                    },
                }).catch(() => {});


                notificationService
                    .notifyAdmins(
                        "payout_requires_attention",
                        "Payout requires attention",
                        `Payout of ₹${payoutAmount} for round ${roundNumber} failed after ${MAX_AUTO_PAYOUT_ATTEMPTS} attempts and needs manual review.`,
                        { payoutId: String(payout._id), betId: String(bet._id), roundNumber }
                    )
                    .catch(() => {});

            }

        }


        /*
         * ==========================================
         * RESULT
         * ==========================================
         */

        return {

            totalBets:
                bets.length,

            winningBets,

            losingBets,

            failedPayouts,

            pendingPayouts,

            totalPayout,

        };

    }


    /*
    |--------------------------------------------------------------------------
    | RETRY FAILED PAYOUT
    |--------------------------------------------------------------------------
    */

    async retryPayout(
        payoutId,
        adminId = null
    ) {

        const payout =
            await Payout.findById(
                payoutId
            );


        if (!payout) {

            throw new Error(
                "Payout not found."
            );

        }


        /*
         * Already paid.
         */

        if (
            payout.status ===
            "paid"
        ) {

            return {

                success:
                    true,

                alreadyPaid:
                    true,

                payout,

                message:
                    "Payout is already paid.",

            };

        }


        /*
         * Cancelled / reversed.
         */

        if (
            payout.status ===
            "cancelled" ||

            payout.status ===
            "reversed"
        ) {

            throw new Error(
                `Payout cannot be retried while status is ${payout.status}.`
            );

        }


        /*
         * ==========================================
         * IDEMPOTENCY CHECK
         * ==========================================
         *
         * Only original win transaction should
         * make this payout paid.
         *
         * Reverse/refund/restore transactions
         * must not be treated as payout credit.
         *
         * ==========================================
         */

        const existingTransaction =
            await Transaction.findOne({

                payout:
                    payout._id,

                type:
                    "win",

            });


        if (
            existingTransaction
        ) {

            payout.status =
                "paid";

            payout.transactionId =
                existingTransaction
                    .transactionId;

            payout.processedAt =
                payout.processedAt ||
                existingTransaction
                    .createdAt ||
                new Date();

            payout.failureReason =
                "";

            payout.remark =
                "Existing payout win transaction found; marked as paid.";

            await payout.save();


            return {

                success:
                    true,

                alreadyPaid:
                    true,

                payout,

                transactionId:
                    existingTransaction
                        .transactionId,

            };

        }


        /*
         * ==========================================
         * FIND BET
         * ==========================================
         */

        const bet =
            await Bet.findById(
                payout.bet
            );


        if (!bet) {

            throw new Error(
                "Original bet not found."
            );

        }


        /*
         * ==========================================
         * VALIDATE BET
         * ==========================================
         */

        if (
            bet.result !==
            "won"
        ) {

            throw new Error(
                "Original bet is not marked as won."
            );

        }


        /*
         * ==========================================
         * VALIDATE AMOUNT
         * ==========================================
         */

        const payoutAmount =
            Number(
                payout.payoutAmount
            );


        if (
            !Number.isFinite(
                payoutAmount
            ) ||
            payoutAmount <= 0
        ) {

            throw new Error(
                "Invalid payout amount."
            );

        }


        /*
         * ==========================================
         * GET ROUND
         * ==========================================
         */

        const round =
            await GameRound.findById(
                payout.round
            );


        const roundNumber =
            round?.roundNumber ||
            payout.round;


        /*
         * ==========================================
         * PROCESSING
         * ==========================================
         */

        payout.status =
            "processing";

        payout.failureReason =
            "";

        payout.retryCount =
            Number(
                payout.retryCount ||
                0
            ) + 1;

        await payout.save();


        try {

            /*
             * ==========================================
             * CREDIT WALLET (pool-aware, same helper the
             * primary settlement path uses - keeps "real"
             * mode bets with a bonus split correctly
             * crediting bonus back to bonusBalance instead
             * of putting the whole amount into real balance)
             * ==========================================
             */

            const walletResult =
                await creditPayoutByMode(

                    bet,

                    payoutAmount,

                    roundNumber,

                    payout._id

                );


            /*
             * ==========================================
             * MARK PAID
             * ==========================================
             */

            payout.status =
                "paid";

            payout.transactionId =
                walletResult?.transactionId ||
                walletResult?.transaction
                    ?.transactionId ||
                null;

            payout.processedAt =
                new Date();

            payout.failureReason =
                "";

            payout.remark =
                adminId
                    ? `Payout successfully retried by admin ${adminId}.`
                    : "Payout successfully retried.";

            await payout.save();


            return {

                success:
                    true,

                payout,

                transactionId:
                    payout.transactionId,

            };


        } catch (
        error
        ) {

            /*
             * ==========================================
             * CHECK IF CREDIT ACTUALLY HAPPENED
             * ==========================================
             */

            const transactionAfterError =
                await Transaction.findOne({

                    payout:
                        payout._id,

                    type:
                        "win",

                });


            if (
                transactionAfterError
            ) {

                payout.status =
                    "paid";

                payout.transactionId =
                    transactionAfterError
                        .transactionId;

                payout.processedAt =
                    payout.processedAt ||
                    transactionAfterError
                        .createdAt ||
                    new Date();

                payout.failureReason =
                    "";

                payout.remark =
                    "Payout transaction already exists; retry synchronized.";

                await payout.save();


                return {

                    success:
                        true,

                    alreadyPaid:
                        true,

                    payout,

                    transactionId:
                        transactionAfterError
                            .transactionId,

                };

            }


            /*
             * ==========================================
             * RETRY FAILED
             * ==========================================
             */

            payout.status =
                "failed";

            payout.failureReason =
                error?.message ||
                "Wallet credit failed.";

            payout.remark =
                adminId
                    ? `Payout retry failed by admin ${adminId}.`
                    : "Payout retry failed.";

            await payout.save();


            throw error;

        }

    }


    /*
    |--------------------------------------------------------------------------
    | MARK MANUAL REVIEW
    |--------------------------------------------------------------------------
    */

    async markManualReview(
        payoutId,
        reason = "",
        adminId = null
    ) {

        const payout =
            await Payout.findById(
                payoutId
            );


        if (!payout) {

            throw new Error(
                "Payout not found."
            );

        }


        if (
            payout.status ===
            "paid"
        ) {

            throw new Error(
                "Paid payout cannot be moved to manual review."
            );

        }


        if (
            payout.status ===
            "cancelled" ||

            payout.status ===
            "reversed"
        ) {

            throw new Error(
                `Payout cannot be moved to manual review while status is ${payout.status}.`
            );

        }


        payout.status =
            "manual_review";

        payout.failureReason =
            reason ||
            "Marked for manual review.";

        payout.remark =
            adminId
                ? `Marked for manual review by admin ${adminId}.`
                : "Marked for manual review.";

        await payout.save();


        return payout;

    }


    /*
    |--------------------------------------------------------------------------
    | REVERSE PAID PAYOUT
    |--------------------------------------------------------------------------
    */

    async reversePayout(
        payoutId,
        reason = "",
        adminId = null
    ) {

        /*
         * ==========================================
         * VALIDATE REASON
         * ==========================================
         */

        const reversalReason =
            String(
                reason ||
                ""
            ).trim();


        if (!reversalReason) {

            throw new Error(
                "Reverse reason is required."
            );

        }


        /*
         * ==========================================
         * START MONGODB TRANSACTION
         * ==========================================
         */

        const session =
            await mongoose.startSession();


        try {

            session.startTransaction();


            /*
             * ==========================================
             * FIND PAYOUT INSIDE TRANSACTION
             * ==========================================
             */

            const payout =
                await Payout.findById(
                    payoutId
                ).session(
                    session
                );


            if (!payout) {

                throw new Error(
                    "Payout not found."
                );

            }


            /*
             * ==========================================
             * ONLY PAID PAYOUT
             * ==========================================
             */

            if (
                payout.status !==
                "paid"
            ) {

                throw new Error(
                    `Only paid payouts can be reversed. Current status: ${payout.status}.`
                );

            }


            /*
             * ==========================================
             * VALIDATE PAYOUT AMOUNT
             * ==========================================
             */

            const payoutAmount =
                Number(
                    payout.payoutAmount
                );


            if (
                !Number.isFinite(
                    payoutAmount
                ) ||
                payoutAmount <= 0
            ) {

                throw new Error(
                    "Invalid payout amount."
                );

            }


            /*
             * ==========================================
             * CHECK EXISTING REVERSAL
             * ==========================================
             */

            const existingReversal =
                await Transaction.findOne({

                    payout:
                        payout._id,

                    type:
                        "payout_reverse",

                    remark: {
                        $regex:
                            "^Payout Reversal",

                        $options:
                            "i",
                    },

                }).session(
                    session
                );


            if (
                existingReversal
            ) {

                /*
                 * Synchronize payout.
                 */

                payout.status =
                    "reversed";

                payout.processedAt =
                    payout.processedAt ||
                    existingReversal
                        .createdAt ||
                    new Date();

                payout.failureReason =
                    "";

                payout.remark =
                    "Payout was already reversed.";

                await payout.save({
                    session,
                });


                await session.commitTransaction();


                return {

                    success:
                        true,

                    alreadyReversed:
                        true,

                    payout,

                    transactionId:
                        existingReversal
                            .transactionId,

                };

            }


            /*
             * ==========================================
             * REVERSE WALLET
             * ==========================================
             */

            const walletResult =
                await walletService.reversePayout(

                    payout.user,

                    payoutAmount,

                    payout._id,

                    `Payout Reversal - ${reversalReason}`,

                    {
                        session,
                    }

                );


            /*
             * ==========================================
             * MARK PAYOUT REVERSED
             * ==========================================
             */

            payout.status =
                "reversed";

            payout.failureReason =
                "";

            payout.processedAt =
                new Date();

            payout.remark =
                adminId
                    ? `Payout reversed by admin ${adminId}. Reason: ${reversalReason}`
                    : `Payout reversed. Reason: ${reversalReason}`;

            await payout.save({
                session,
            });


            /*
             * ==========================================
             * COMMIT
             * ==========================================
             */

            await session.commitTransaction();


            return {

                success:
                    true,

                alreadyReversed:
                    false,

                payout,

                transactionId:
                    walletResult?.transactionId ||
                    walletResult?.transaction
                        ?.transactionId ||
                    null,

            };


        } catch (
        error
        ) {

            /*
             * ==========================================
             * ROLLBACK
             * ==========================================
             */

            if (
                session.inTransaction()
            ) {

                await session.abortTransaction();

            }


            throw error;


        } finally {

            await session.endSession();

        }

    }


    /*
    |--------------------------------------------------------------------------
    | REFUND PAYOUT
    |--------------------------------------------------------------------------
    */

    async refundPayout(
        payoutId,
        amount,
        reason = "",
        adminId = null
    ) {

        /*
         * ==========================================
         * VALIDATE REASON
         * ==========================================
         */

        const refundReason =
            String(
                reason ||
                ""
            ).trim();


        if (!refundReason) {

            throw new Error(
                "Refund reason is required."
            );

        }


        /*
         * ==========================================
         * VALIDATE AMOUNT
         * ==========================================
         */

        const refundAmount =
            Number(
                amount
            );


        if (
            !Number.isFinite(
                refundAmount
            ) ||
            refundAmount <= 0
        ) {

            throw new Error(
                "Invalid refund amount."
            );

        }


        /*
         * ==========================================
         * START TRANSACTION
         * ==========================================
         */

        const session =
            await mongoose.startSession();


        try {

            session.startTransaction();


            /*
             * ==========================================
             * FIND PAYOUT
             * ==========================================
             */

            const payout =
                await Payout.findById(
                    payoutId
                ).session(
                    session
                );


            if (!payout) {

                throw new Error(
                    "Payout not found."
                );

            }


            /*
             * ==========================================
             * ONLY PAID PAYOUT
             * ==========================================
             */

            if (
                payout.status !==
                "paid"
            ) {

                throw new Error(
                    `Only paid payouts can be refunded. Current status: ${payout.status}.`
                );

            }


            /*
             * ==========================================
             * ORIGINAL PAYOUT AMOUNT
             * ==========================================
             */

            const originalAmount =
                Number(
                    payout.payoutAmount
                );


            if (
                !Number.isFinite(
                    originalAmount
                ) ||
                originalAmount <= 0
            ) {

                throw new Error(
                    "Invalid original payout amount."
                );

            }


            /*
             * ==========================================
             * CALCULATE PREVIOUS REFUNDS
             * ==========================================
             */

            const refundSummary =
                await PayoutRefund.aggregate([

                    {
                        $match: {

                            payout:
                                payout._id,

                            status:
                                "completed",

                        },
                    },

                    {
                        $group: {

                            _id:
                                null,

                            totalRefunded: {
                                $sum:
                                    "$amount",
                            },

                        },
                    },

                ]).session(
                    session
                );


            const alreadyRefunded =
                Number(
                    refundSummary?.[0]
                        ?.totalRefunded ||
                    0
                );


            const remainingRefundable =
                Math.max(

                    originalAmount -
                    alreadyRefunded,

                    0

                );


            /*
             * ==========================================
             * ALREADY FULLY REFUNDED
             * ==========================================
             */

            if (
                remainingRefundable <=
                0
            ) {

                await session.commitTransaction();


                return {

                    success:
                        true,

                    alreadyRefunded:
                        true,

                    fullyRefunded:
                        true,

                    payout,

                    refundedAmount:
                        alreadyRefunded,

                    remainingRefundable:
                        0,

                };

            }


            /*
             * ==========================================
             * OVER REFUND PROTECTION
             * ==========================================
             */

            if (
                refundAmount >
                remainingRefundable
            ) {

                throw new Error(
                    `Refund amount exceeds the remaining refundable amount of ₹${remainingRefundable}.`
                );

            }


            /*
             * ==========================================
             * CREATE REFUND RECORD
             * ==========================================
             */

            const refundResult =
                await PayoutRefund.create(
                    [
                        {

                            payout:
                                payout._id,

                            user:
                                payout.user,

                            amount:
                                refundAmount,

                            reason:
                                refundReason,

                            status:
                                "processing",

                            admin:
                                adminId ||
                                null,

                            remark:
                                `Refund initiated by admin${adminId
                                    ? ` ${adminId}`
                                    : ""
                                }.`,
                        },
                    ],
                    {
                        session,
                    }
                );


            const refund =
                refundResult[0];


            /*
             * ==========================================
             * REFUND WALLET
             * ==========================================
             */

            let walletResult;


            try {

                walletResult =
                    await walletService.refundPayout(

                        payout.user,

                        refundAmount,

                        payout._id,

                        refund._id,

                        `Payout Refund - ${refundReason}`,

                        {
                            session,
                        }

                    );


            } catch (
            error
            ) {

                /*
                 * Refund and wallet operation are inside
                 * the same MongoDB transaction.
                 *
                 * Throwing here will rollback the
                 * refund record as well.
                 */

                throw error;

            }


            /*
             * ==========================================
             * MARK REFUND COMPLETED
             * ==========================================
             */

            refund.status =
                "completed";

            refund.transactionId =
                walletResult?.transactionId ||
                walletResult?.transaction
                    ?.transactionId ||
                null;

            refund.remark =
                `Refund completed by admin${adminId
                    ? ` ${adminId}`
                    : ""
                }. Reason: ${refundReason}`;

            await refund.save({
                session,
            });


            /*
             * ==========================================
             * CALCULATE REMAINING
             * ==========================================
             */

            const newRefundedAmount =
                alreadyRefunded +
                refundAmount;


            const newRemainingRefundable =
                Math.max(

                    originalAmount -
                    newRefundedAmount,

                    0

                );


            /*
             * ==========================================
             * UPDATE PAYOUT REMARK
             * ==========================================
             */

            payout.remark =
                adminId
                    ? `Refund of ₹${refundAmount} processed by admin ${adminId}. Remaining refundable: ₹${newRemainingRefundable}.`
                    : `Refund of ₹${refundAmount} processed. Remaining refundable: ₹${newRemainingRefundable}.`;


            await payout.save({
                session,
            });


            /*
             * ==========================================
             * COMMIT
             * ==========================================
             */

            await session.commitTransaction();


            return {

                success:
                    true,

                alreadyRefunded:
                    false,

                fullyRefunded:
                    newRemainingRefundable <=
                    0,

                payout,

                refund,

                transactionId:
                    refund.transactionId,

                refundAmount,

                originalAmount,

                alreadyRefunded,

                remainingRefundable:
                    newRemainingRefundable,

            };


        } catch (
        error
        ) {

            /*
             * ==========================================
             * ROLLBACK
             * ==========================================
             */

            if (
                session.inTransaction()
            ) {

                await session.abortTransaction();

            }


            throw error;


        } finally {

            await session.endSession();

        }

    }


    /*
    |--------------------------------------------------------------------------
    | RESTORE REVERSED PAYOUT
    |--------------------------------------------------------------------------
    */

    async restorePayout(
        payoutId,
        reason = "",
        adminId = null
    ) {

        /*
         * ==========================================
         * VALIDATE REASON
         * ==========================================
         */

        const restoreReason =
            String(
                reason ||
                ""
            ).trim();


        if (!restoreReason) {

            throw new Error(
                "Restore reason is required."
            );

        }


        /*
         * ==========================================
         * START TRANSACTION
         * ==========================================
         */

        const session =
            await mongoose.startSession();


        try {

            session.startTransaction();


            /*
             * ==========================================
             * FIND PAYOUT
             * ==========================================
             */

            const payout =
                await Payout.findById(
                    payoutId
                ).session(
                    session
                );


            if (!payout) {

                throw new Error(
                    "Payout not found."
                );

            }


            /*
             * ==========================================
             * ONLY REVERSED PAYOUT
             * ==========================================
             */

            if (
                payout.status !==
                "reversed"
            ) {

                throw new Error(
                    `Only reversed payouts can be restored. Current status: ${payout.status}.`
                );

            }


            /*
             * ==========================================
             * CHECK EXISTING RESTORE
             * ==========================================
             */

            const existingRestore =
                await Transaction.findOne({

                    payout:
                        payout._id,

                    type:
                        "payout_restore",

                }).session(
                    session
                );


            if (
                existingRestore
            ) {

                payout.status =
                    "paid";

                payout.processedAt =
                    payout.processedAt ||
                    existingRestore
                        .createdAt ||
                    new Date();

                payout.failureReason =
                    "";

                payout.remark =
                    "Payout was already restored.";

                await payout.save({
                    session,
                });


                await session.commitTransaction();


                return {

                    success:
                        true,

                    alreadyRestored:
                        true,

                    payout,

                    transactionId:
                        existingRestore
                            .transactionId,

                };

            }


            /*
             * ==========================================
             * VALIDATE AMOUNT
             * ==========================================
             */

            const payoutAmount =
                Number(
                    payout.payoutAmount
                );


            if (
                !Number.isFinite(
                    payoutAmount
                ) ||
                payoutAmount <= 0
            ) {

                throw new Error(
                    "Invalid payout amount."
                );

            }


            /*
             * ==========================================
             * RESTORE WALLET
             * ==========================================
             */

            const walletResult =
                await walletService.restorePayout(

                    payout.user,

                    payoutAmount,

                    payout._id,

                    `Payout Restore - ${restoreReason}`,

                    {
                        session,
                    }

                );


            /*
             * ==========================================
             * MARK PAID
             * ==========================================
             */

            payout.status =
                "paid";

            payout.transactionId =
                walletResult?.transactionId ||
                walletResult?.transaction
                    ?.transactionId ||
                null;

            payout.processedAt =
                new Date();

            payout.failureReason =
                "";

            payout.remark =
                adminId
                    ? `Payout restored by admin ${adminId}. Reason: ${restoreReason}`
                    : `Payout restored. Reason: ${restoreReason}`;


            await payout.save({
                session,
            });


            /*
             * ==========================================
             * COMMIT
             * ==========================================
             */

            await session.commitTransaction();


            return {

                success:
                    true,

                alreadyRestored:
                    false,

                payout,

                transactionId:
                    walletResult?.transactionId ||
                    walletResult?.transaction
                        ?.transactionId ||
                    null,

            };


        } catch (
        error
        ) {

            /*
             * ==========================================
             * ROLLBACK
             * ==========================================
             */

            if (
                session.inTransaction()
            ) {

                await session.abortTransaction();

            }


            throw error;


        } finally {

            await session.endSession();

        }

    }


    /*
    |--------------------------------------------------------------------------
    | CANCEL PAYOUT
    |--------------------------------------------------------------------------
    */

    async cancelPayout(
        payoutId,
        reason = "",
        adminId = null
    ) {

        const payout =
            await Payout.findById(
                payoutId
            );


        if (!payout) {

            throw new Error(
                "Payout not found."
            );

        }


        /*
         * ==========================================
         * PAID PROTECTION
         * ==========================================
         */

        if (
            payout.status ===
            "paid"
        ) {

            throw new Error(
                "Paid payout cannot be cancelled."
            );

        }


        /*
         * ==========================================
         * REVERSED PROTECTION
         * ==========================================
         */

        if (
            payout.status ===
            "reversed"
        ) {

            throw new Error(
                "Reversed payout cannot be cancelled."
            );

        }


        /*
         * ==========================================
         * CANCEL
         * ==========================================
         */

        payout.status =
            "cancelled";

        payout.failureReason =
            reason ||
            "Payout cancelled.";

        payout.remark =
            adminId
                ? `Cancelled by admin ${adminId}.`
                : "Payout cancelled.";

        await payout.save();


        return payout;

    }

}


/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

module.exports =
    new PayoutService();