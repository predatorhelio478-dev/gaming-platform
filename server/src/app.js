const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

const app = express();

app.use(helmet());

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));

app.use(express.json());

app.use(cookieParser());

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Gaming Platform API Running"
    });
});

module.exports = app;