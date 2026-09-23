const { Server } = require("socket.io");

const { isOriginAllowed } = require("../config/allowedOrigins");

let io = null;


/*
 * ==========================================
 * INITIALIZE SOCKET
 * ==========================================
 */

const initializeSocket = (server) => {

    io = new Server(server, {
        cors: {
            // Resolved per-connection against the same allowlist
            // REST CORS uses (see config/allowedOrigins.js) so
            // the two can never diverge, and an admin-updated
            // Settings -> General -> Frontend URL takes effect
            // immediately with no restart.
            origin: async (origin, callback) => {

                try {

                    const allowed = await isOriginAllowed(origin);

                    callback(null, allowed ? origin : false);

                } catch (error) {

                    callback(null, false);

                }

            },

            methods: [
                "GET",
                "POST",
            ],

            credentials: true,
        },
    });


    /*
     * ======================================
     * GAME SOCKET HANDLER
     * ======================================
     */

    const registerGameSocket =
        require("./gameSocket");

    const registerNotificationSocket =
        require("./notificationSocket");


    /*
     * ======================================
     * CONNECTION
     * ======================================
     */

    io.on(
        "connection",
        (socket) => {

            console.log(
                "Socket Connected:",
                socket.id
            );


            /*
             * Register game-specific
             * socket events
             */

            registerGameSocket(
                io,
                socket
            );

            registerNotificationSocket(
                io,
                socket
            );


            /*
             * Disconnect
             */

            socket.on(
                "disconnect",
                () => {

                    console.log(
                        "Socket Disconnected:",
                        socket.id
                    );

                }
            );

        }
    );


    console.log(
        "Socket.IO Initialized"
    );


    return io;

};


/*
 * ==========================================
 * GET IO
 * ==========================================
 */

const getIO = () => {

    if (!io) {

        throw new Error(
            "Socket.IO has not been initialized"
        );

    }


    return io;

};


module.exports = {

    initializeSocket,

    getIO,

};