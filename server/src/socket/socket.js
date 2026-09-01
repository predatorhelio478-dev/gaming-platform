const { Server } = require("socket.io");

let io = null;


/*
 * ==========================================
 * INITIALIZE SOCKET
 * ==========================================
 */

const initializeSocket = (server) => {

    io = new Server(server, {
        cors: {
            origin:
                process.env.CLIENT_URL ||
                "http://localhost:3000",

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