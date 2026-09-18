let countdown = 0;

let timer = null;

let isPaused = false;

let finishCallback = null;


// ==========================================================
// SOCKET HELPER
// ==========================================================

const broadcastTimer = () => {

    try {

        const {
            getIO,
        } = require("../../socket/socket");


        const io =
            getIO();


        const timerData = {

            remainingSeconds:
                Math.max(
                    countdown,
                    0
                ),

        };


        // ==============================================
        // PLAYER ROOM
        // ==============================================

        io.to(
            "color_prediction"
        ).emit(
            "timer",
            timerData
        );


        // ==============================================
        // ADMIN ROOM
        // ==============================================

        io.to(
            "admin_game_monitor"
        ).emit(
            "timer",
            timerData
        );


    } catch (error) {

        /*
         * Socket failure must never
         * stop the timer.
         */

    }

};


// ==========================================================
// START TIMER
// ==========================================================

const startTimer = (
    durationSeconds,
    onFinish
) => {

    // ======================================================
    // VALIDATE DURATION
    // ======================================================

    const duration =
        Number(
            durationSeconds
        );


    if (
        !Number.isFinite(duration) ||
        duration <= 0
    ) {

        throw new Error(
            "Invalid timer duration."
        );

    }


    // ======================================================
    // CLEAR PREVIOUS TIMER
    // ======================================================

    if (timer) {

        clearInterval(timer);

        timer = null;

    }


    // ======================================================
    // INITIALIZE
    // ======================================================

    countdown =
        Math.ceil(
            duration
        );


    isPaused = false;

    finishCallback =
        onFinish;


    // Immediately broadcast initial value

    broadcastTimer();


    // ======================================================
    // START INTERVAL
    // ======================================================

    timer =
        setInterval(() => {

            // ==============================================
            // PAUSED
            // ==============================================

            if (isPaused) {

                return;

            }


            // ==============================================
            // DECREMENT
            // ==============================================

            countdown -= 1;


            countdown =
                Math.max(
                    countdown,
                    0
                );


            console.log(
                `Remaining : ${countdown}`
            );


            // ==============================================
            // BROADCAST
            // ==============================================

            broadcastTimer();


            // ==============================================
            // TIMER FINISHED
            // ==============================================

            if (
                countdown <= 0
            ) {

                clearInterval(
                    timer
                );

                timer = null;

                isPaused = false;


                const callback =
                    finishCallback;


                finishCallback =
                    null;


                if (callback) {

                    /*
                     * Support both async and
                     * normal callbacks.
                     */

                    Promise
                        .resolve(
                            callback()
                        )
                        .catch(
                            (error) => {

                                console.error(
                                    "Timer Finish Callback Error:",
                                    error.message
                                );

                            }
                        );

                }

            }

        }, 1000);


};


// ==========================================================
// PAUSE TIMER
// ==========================================================

const pauseTimer = () => {

    if (!timer) {

        return false;

    }


    isPaused = true;


    console.log(
        `Timer Paused at ${countdown}`
    );


    try {

        const {
            getIO,
        } = require("../../socket/socket");


        const io =
            getIO();


        const data = {

            status:
                "paused",

            remainingSeconds:
                countdown,

        };


        io.to(
            "color_prediction"
        ).emit(
            "game_status",
            data
        );


        io.to(
            "admin_game_monitor"
        ).emit(
            "game_status",
            data
        );


    } catch (error) {

        console.error(
            "Pause Socket Error:",
            error.message
        );

    }


    return true;

};


// ==========================================================
// RESUME TIMER
// ==========================================================

const resumeTimer = () => {

    if (!timer) {

        return false;

    }


    if (!isPaused) {

        return true;

    }


    isPaused = false;


    console.log(
        `Timer Resumed at ${countdown}`
    );


    try {

        const {
            getIO,
        } = require("../../socket/socket");


        const io =
            getIO();


        const data = {

            status:
                "running",

            remainingSeconds:
                countdown,

        };


        io.to(
            "color_prediction"
        ).emit(
            "game_status",
            data
        );


        io.to(
            "admin_game_monitor"
        ).emit(
            "game_status",
            data
        );


    } catch (error) {

        console.error(
            "Resume Socket Error:",
            error.message
        );

    }


    return true;

};


// ==========================================================
// STOP TIMER
// ==========================================================

const stopTimer = () => {

    if (timer) {

        clearInterval(
            timer
        );

        timer = null;

    }


    isPaused = false;

    finishCallback = null;


    console.log(
        "Timer Stopped"
    );


    try {

        const {
            getIO,
        } = require("../../socket/socket");


        const io =
            getIO();


        const data = {

            status:
                "stopped",

            remainingSeconds:
                countdown,

        };


        io.to(
            "color_prediction"
        ).emit(
            "game_status",
            data
        );


        io.to(
            "admin_game_monitor"
        ).emit(
            "game_status",
            data
        );


    } catch (error) {

        console.error(
            "Stop Socket Error:",
            error.message
        );

    }


    return true;

};


// ==========================================================
// GET COUNTDOWN
// ==========================================================

const getCountdown = () => {

    return countdown;

};


// ==========================================================
// GET PAUSED
// ==========================================================

const getPaused = () => {

    return isPaused;

};


// ==========================================================
// CHECK RUNNING
// ==========================================================

const isRunning = () => {

    return Boolean(
        timer
    );

};


// ==========================================================
// EXPORT
// ==========================================================

module.exports = {

    startTimer,

    pauseTimer,

    resumeTimer,

    stopTimer,

    getCountdown,

    getPaused,

    isRunning,

};