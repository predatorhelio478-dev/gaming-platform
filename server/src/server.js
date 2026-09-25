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

const emailService =
    require("./services/emailService");


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

gameEngine.startGameEngine()
    .catch((error) => {

        console.error(
            "Game Engine Startup Error:",
            error.message
        );

    });


/*
 * ==========================================
 * EMAIL (SMTP) - non-blocking startup check
 * ==========================================
 *
 * Never delays or fails server startup - just gives an
 * immediate, clear signal in the logs about which of the
 * three real states email is in, instead of only finding out
 * on the first OTP/notification send.
 */

console.log(
    `[server] NODE_ENV="${process.env.NODE_ENV || "(not set)"}" - dev console fallback for unsent emails is ${
        process.env.NODE_ENV === "production" ? "DISABLED" : "ENABLED"
    }. Set NODE_ENV=production on the host (Render/Hostinger env vars) if this is a live deployment.`
);

emailService.verifySmtpConnection()
    .then((result) => {

        if (result.ok) {

            console.log(
                "[emailService] SMTP connection verified - real emails will be sent."
            );

        } else if (result.reason?.startsWith("SMTP not configured")) {

            console.warn(
                `[emailService] ${result.reason} - OTP/notification emails will use the dev-only console fallback.`
            );

        } else {

            console.error(
                "[emailService] SMTP is configured but the connection/authentication check failed:",
                result.reason
            );

        }

    })
    .catch(() => {});


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