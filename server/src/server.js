require("dotenv").config();

const http = require("http");

const app = require("./app");

const connectDB = require("./config/db");

const server = http.createServer(app);

connectDB();

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});