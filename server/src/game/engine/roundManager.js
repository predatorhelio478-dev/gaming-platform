const GameRound = require("../../models/GameRound");

const createRound = async () => {

    await GameRound.updateMany(
        {
            status: {
                $ne: "completed"
            }
        },
        {
            status: "completed"
        }
    );

    const lastRound = await GameRound
        .findOne()
        .sort({ roundNumber: -1 });

    const roundNumber = lastRound
        ? lastRound.roundNumber + 1
        : 1001;

    const startTime = new Date();

    const endTime = new Date(
        startTime.getTime() + 30000
    );

    return await GameRound.create({

        roundNumber,

        startTime,

        endTime,

        status: "betting"

    });

};

module.exports = createRound;