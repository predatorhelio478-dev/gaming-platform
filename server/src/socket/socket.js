const { Server } = require("socket.io");

const { getClientUrl } = require("../config/clientUrl");

let io = null;


/*
 * ==========================================
 * INITIALIZE SOCKET
 * ==========================================
 */

const initializeSocket = (server) => {

    io = new Server(server, {
        cors: {
            // Resolved per-connection (not once at boot) so an
            // admin-updated Settings -> General -> Frontend URL
            // takes effect immediately, with no restart.
            origin: async (origin, callback) => {

                try {

                    const clientUrl = await getClientUrl();

                    callback(null, clientUrl);

                } catch (error) {

                    callback(
                        null,
                        process.env.CLIENT_URL ||
                        "http://localhost:3000"
                    );

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