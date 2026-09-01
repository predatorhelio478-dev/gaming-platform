let countdown = 30;

let timer = null;

let isPaused = false;

let finishCallback = null;


// ==========================================
// START TIMER
// ==========================================

const startTimer = (onFinish) => {

    /*
     * Clear previous timer
     */

    if (timer) {

        clearInterval(timer);

        timer = null;

    }


    countdown = 30;

    isPaused = false;

    finishCallback = onFinish;


    timer = setInterval(() => {

        if (isPaused) {
            return;
        }


        countdown--;


        console.log(
            `Remaining : ${countdown}`
        );


        /*
         * Send timer to players
         */

        try {

            const {
                getIO,
            } = require("../../socket/socket");


            const io = getIO();


            /*
             * Player room
             */

            io.to(
                "color_prediction"
            ).emit(
                "timer",
                {
                    remainingSeconds:
                        countdown,
                }
            );


            /*
             * Admin room
             */

            io.to(
                "admin_game_monitor"
            ).emit(
                "timer",
                {
                    remainingSeconds:
                        countdown,
                }
            );

        } catch (error) {

            /*
             * Socket should never
             * stop the game.
             */

        }


        /*
         * Timer finished
         */

        if (countdown <= 0) {

            clearInterval(timer);

            timer = null;

            isPaused = false;


            const callback =
                finishCallback;


            finishCallback = null;


            if (callback) {

                callback();

            }

        }

    }, 1000);

};


// ==========================================
// PAUSE TIMER
// ==========================================

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


        const io = getIO();


        io.to(
            "color_prediction"
        ).emit(
            "game_status",
            {
                status: "paused",
                remainingSeconds:
                    countdown,
            }
        );


        io.to(
            "admin_game_monitor"
        ).emit(
            "game_status",
            {
                status: "paused",
                remainingSeconds:
                    countdown,
            }
        );

    } catch (error) {

        console.error(
            "Pause Socket Error:",
            error.message
        );

    }


    return true;

};


// ==========================================
// RESUME TIMER
// ==========================================

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

        const io = getIO();


        io.to(
            "color_prediction"
        ).emit(
            "game_status",
            {
                status: "running",

                remainingSeconds:
                    countdown,
            }
        );


        io.to(
            "admin_game_monitor"
        ).emit(
            "game_status",
            {
                status: "running",

                remainingSeconds:
                    countdown,
            }
        );

    } catch (error) {

        console.error(
            "Resume Socket Error:",
            error.message
        );

    }


    return true;

};


// ==========================================
// STOP TIMER
// ==========================================

const stopTimer = () => {

    if (timer) {

        clearInterval(timer);

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


        const io = getIO();


        io.to(
            "color_prediction"
        ).emit(
            "game_status",
            {
                status: "stopped",
                remainingSeconds:
                    countdown,
            }
        );


        io.to(
            "admin_game_monitor"
        ).emit(
            "game_status",
            {
                status: "stopped",
                remainingSeconds:
                    countdown,
            }
        );

    } catch (error) {

        console.error(
            "Stop Socket Error:",
            error.message
        );

    }


    return true;

};


// ==========================================
// GET COUNTDOWN
// ==========================================

const getCountdown = () => {

    return countdown;

};


// ==========================================
// CHECK PAUSED
// ==========================================

const getPaused = () => {

    return isPaused;

};


// ==========================================
// CHECK RUNNING
// ==========================================

const isRunning = () => {

    return Boolean(timer);

};


module.exports = {

    startTimer,

    pauseTimer,

    resumeTimer,

    stopTimer,

    getCountdown,

    getPaused,

    isRunning,

};