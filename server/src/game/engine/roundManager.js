const GameRound =
    require("../../models/GameRound");

const settingsService =
    require("../../services/settingsService");


// ==========================================================
// CREATE NEW ROUND
// ==========================================================

const createRound = async () => {

    // ======================================================
    // CLOSE OLD ACTIVE ROUNDS
    // ======================================================

    await GameRound.updateMany(

        {
            status: {
                $nin: [
                    "completed",
                    "void",
                ],
            },
        },

        {
            $set: {
                status: "completed",
            },
        }

    );


    // ======================================================
    // GET LAST ROUND
    // ======================================================

    const lastRound =
        await GameRound
            .findOne()
            .sort({
                roundNumber: -1,
            });


    const roundNumber =
        lastRound
            ? lastRound.roundNumber + 1
            : 1001;


    // ======================================================
    // GET ROUND DURATION FROM SETTINGS
    // ======================================================

    const configuredDuration =
        await settingsService.getValue(
            "game",
            "round_duration",
            60
        );


    const roundDuration =
        Number(
            configuredDuration
        );


    // ======================================================
    // VALIDATE ROUND DURATION
    // ======================================================

    if (
        !Number.isFinite(
            roundDuration
        ) ||
        roundDuration <= 0
    ) {

        throw new Error(
            "Invalid game round duration configured."
        );

    }


    // ======================================================
    // ROUND TIME
    // ======================================================

    const startTime =
        new Date();


    const endTime =
        new Date(
            startTime.getTime() +
            (
                roundDuration *
                1000
            )
        );


    // ======================================================
    // CREATE ROUND
    // ======================================================

    const round =
        await GameRound.create({

            roundNumber,

            startTime,

            endTime,

            status:
                "betting",

        });


    return round;

};


// ==========================================================
// EXPORT
// ==========================================================

module.exports =
    createRound;