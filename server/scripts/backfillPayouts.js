require("dotenv").config();

const mongoose = require("mongoose");

const Bet = require("../src/models/Bet");
const Payout = require("../src/models/Payout");
const Transaction = require("../src/models/Transaction");
const GameRound = require("../src/models/GameRound");

const MONGO_URI =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI;

const PAYOUT_MULTIPLIER = 2;


async function backfillPayouts() {

    console.log(
        "=========================================="
    );

    console.log(
        "PAYOUT BACKFILL STARTED"
    );

    console.log(
        "=========================================="
    );


    if (!MONGO_URI) {

        throw new Error(
            "MONGO_URI / MONGODB_URI is not configured."
        );

    }


    /*
    |--------------------------------------------------------------------------
    | CONNECT DATABASE
    |--------------------------------------------------------------------------
    */

    await mongoose.connect(
        MONGO_URI
    );


    console.log(
        "MongoDB connected."
    );


    /*
    |--------------------------------------------------------------------------
    | FIND HISTORICAL WINNING BETS
    |--------------------------------------------------------------------------
    |
    | Only won bets.
    |
    | We DO NOT process pending bets here.
    |
    */

    const winningBets =
        await Bet.find({
            result: "won",
            payout: {
                $gt: 0,
            },
        })
            .populate(
                "round",
                "roundNumber result status"
            )
            .lean();


    console.log(
        `Found ${winningBets.length} historical winning bets.`
    );


    let created = 0;

    let skipped = 0;

    let transactionLinked = 0;

    let transactionNotFound = 0;

    let errors = 0;


    /*
    |--------------------------------------------------------------------------
    | PROCESS EACH BET
    |--------------------------------------------------------------------------
    */

    for (
        const bet of winningBets
    ) {

        try {

            /*
            |--------------------------------------------------------------------------
            | DUPLICATE CHECK
            |--------------------------------------------------------------------------
            */

            const existingPayout =
                await Payout.findOne({
                    bet: bet._id,
                });


            if (existingPayout) {

                skipped++;

                continue;

            }


            /*
            |--------------------------------------------------------------------------
            | ROUND
            |--------------------------------------------------------------------------
            */

            const round =
                bet.round;


            if (!round) {

                console.warn(
                    `Skipping bet ${bet._id}: round not found.`
                );

                errors++;

                continue;

            }


            /*
            |--------------------------------------------------------------------------
            | WINNING COLOR
            |--------------------------------------------------------------------------
            */

            const winningColor =
                round.result ||
                bet.color;


            /*
            |--------------------------------------------------------------------------
            | PAYOUT AMOUNT
            |--------------------------------------------------------------------------
            |
            | Prefer actual stored bet.payout.
            |
            | We DO NOT recalculate and overwrite
            | historical payout.
            |
            */

            const payoutAmount =
                Number(
                    bet.payout || 0
                );


            if (
                payoutAmount <= 0
            ) {

                console.warn(
                    `Skipping bet ${bet._id}: invalid payout amount.`
                );

                skipped++;

                continue;

            }


            /*
            |--------------------------------------------------------------------------
            | FIND EXISTING WIN TRANSACTION
            |--------------------------------------------------------------------------
            |
            | IMPORTANT:
            |
            | We are only linking the historical
            | transaction.
            |
            | NO wallet credit is performed.
            |
            */

            const transaction =
                await Transaction.findOne({

                    user:
                        bet.user,

                    type:
                        "win",

                    amount:
                        payoutAmount,

                })
                    .sort({
                        createdAt: -1,
                    })
                    .lean();


            /*
            |--------------------------------------------------------------------------
            | CREATE HISTORICAL PAYOUT
            |--------------------------------------------------------------------------
            */

            const payout =
                await Payout.create({

                    user:
                        bet.user,

                    bet:
                        bet._id,

                    round:
                        bet.round,

                    betAmount:
                        Number(
                            bet.amount || 0
                        ),

                    winningColor:
                        winningColor,

                    payoutAmount:
                        payoutAmount,

                    status:
                        "paid",

                    transactionId:
                        transaction?.transactionId ||
                        null,

                    failureReason:
                        "",

                    processedAt:
                        transaction?.createdAt ||
                        bet.updatedAt ||
                        bet.createdAt ||
                        new Date(),

                    retryCount:
                        0,

                    remark:
                        "Historical payout imported from existing winning bet.",

                });


            created++;


            if (transaction) {

                transactionLinked++;

            } else {

                transactionNotFound++;

                console.warn(
                    `No matching win transaction found for bet ${bet._id}.`
                );

            }


            console.log(
                `Created payout ${payout._id} for bet ${bet._id}`
            );


        } catch (error) {

            /*
            |--------------------------------------------------------------------------
            | DUPLICATE KEY
            |--------------------------------------------------------------------------
            */

            if (
                error?.code ===
                11000
            ) {

                skipped++;

                continue;

            }


            errors++;


            console.error(
                `Failed processing bet ${bet._id}:`,
                error.message
            );

        }

    }


    /*
    |--------------------------------------------------------------------------
    | SUMMARY
    |--------------------------------------------------------------------------
    */

    console.log("");
    console.log(
        "=========================================="
    );

    console.log(
        "PAYOUT BACKFILL COMPLETED"
    );

    console.log(
        "=========================================="
    );

    console.log(
        `Winning bets found       : ${winningBets.length}`
    );

    console.log(
        `Payouts created          : ${created}`
    );

    console.log(
        `Already existed/skipped  : ${skipped}`
    );

    console.log(
        `Transactions linked      : ${transactionLinked}`
    );

    console.log(
        `Transactions not found  : ${transactionNotFound}`
    );

    console.log(
        `Errors                   : ${errors}`
    );

    console.log(
        "=========================================="
    );


    await mongoose.disconnect();


    console.log(
        "MongoDB disconnected."
    );

}


/*
|--------------------------------------------------------------------------
| RUN
|--------------------------------------------------------------------------
*/

backfillPayouts()
    .then(() => {

        process.exit(0);

    })
    .catch(async (error) => {

        console.error(
            "PAYOUT BACKFILL FAILED:",
            error
        );


        try {

            await mongoose.disconnect();

        } catch (_) { }


        process.exit(1);

    });