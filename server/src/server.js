require("dotenv").config();

const http = require("http");

const app = require("./app");

const connectDB =
    require("./config/db");

const gameEngine =
    require("./game/engine/gameEngine");

const {
    initializeSocket,
} = require("./socket/socket");


/*
 * ==========================================
 * HTTP SERVER
 * ==========================================
 */

const server =
    http.createServer(app);


/*
 * ==========================================
 * DATABASE
 * ==========================================
 */

connectDB();


/*
 * ==========================================
 * SOCKET.IO
 * ==========================================
 */

initializeSocket(
    server
);


/*
 * ==========================================
 * GAME ENGINE
 * ==========================================
 */

gameEngine.startGameEngine();


/*
 * ==========================================
 * SERVER
 * ==========================================
 */

const PORT =
    process.env.PORT || 5000;


server.listen(
    PORT,
    () => {

        console.log(
            `Server running on ${PORT}`
        );

    }
);