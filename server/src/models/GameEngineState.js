const mongoose = require("mongoose");

/*
 * Durable game-engine flags that must survive a server
 * restart. A single document per game (_id = game key). Only
 * the admin pause lives here - Maintenance Mode is already a
 * persisted setting, and each round's own freeze time is on
 * GameRound.frozenAt.
 */
const gameEngineStateSchema = new mongoose.Schema(
    {
        _id: {
            type: String,
        },

        adminPaused: {
            type: Boolean,
            default: false,
        },

        pausedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model(
    "GameEngineState",
    gameEngineStateSchema
);
