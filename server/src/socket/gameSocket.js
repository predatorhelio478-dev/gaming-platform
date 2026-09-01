const gameEngine =
    require("../game/engine/gameEngine");


/*
 * ==========================================
 * REGISTER GAME SOCKET
 * ==========================================
 */

const registerGameSocket = (
    io,
    socket
) => {

    /*
 * ==========================================
 * ADMIN GAME MONITOR
 * ==========================================
 */

    socket.on("join_admin_game_monitor", () => {

        socket.join("admin_game_monitor");

        console.log(
            `Admin ${socket.id} joined game monitor`
        );


        /*
         * Send current game state immediately
         */

        try {

            const gameStatus =
                gameEngine.getGameStatus();

            socket.emit(
                "admin_game_state",
                {
                    status:
                        gameStatus.status,

                    running:
                        gameStatus.running,

                    paused:
                        gameStatus.paused,

                    stopped:
                        gameStatus.stopped,

                    emergencyStopped:
                        gameStatus.emergencyStopped,

                    round:
                        gameStatus.round,

                    remainingSeconds:
                        gameStatus.remainingSeconds,
                }
            );

        } catch (error) {

            console.error(
                "Admin Game State Error:",
                error.message
            );

        }

    });

    /*
     * ======================================
     * JOIN COLOR PREDICTION
     * ======================================
     */

    socket.on(
        "join_color_game",
        () => {

            socket.join(
                "color_prediction"
            );


            const round =
                gameEngine.getCurrentRound();


            const remainingSeconds =
                gameEngine.getTimer();


            const gameStatus =
                gameEngine.getGameStatus();


            socket.emit(
                "game_state",
                {
                    round:
                        gameStatus.round,

                    remainingSeconds:
                        gameStatus.remainingSeconds,

                    status:
                        gameStatus.status,

                    paused:
                        gameStatus.paused,

                    stopped:
                        gameStatus.stopped,

                    running:
                        gameStatus.running,

                    emergencyStopped:
                        gameStatus.emergencyStopped,
                }
            );


            console.log(
                `User ${socket.id} joined Color Prediction`
            );

        }
    );


    /*
     * ======================================
     * LEAVE COLOR PREDICTION
     * ======================================
     */

    socket.on(
        "leave_color_game",
        () => {

            socket.leave(
                "color_prediction"
            );


            console.log(
                `User ${socket.id} left Color Prediction`
            );

        }
    );

};


module.exports =
    registerGameSocket;