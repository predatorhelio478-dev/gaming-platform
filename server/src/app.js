const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/authRoutes");
const walletRoutes = require("./routes/walletRoutes");
const gameRoutes = require("./routes/gameRoutes");
const betRoutes = require("./routes/betRoutes");
const adminGameRoutes = require("./routes/adminGameRoutes");
const adminAuthRoutes = require("./routes/adminAuthRoutes");
const adminRoundRoutes = require("./routes/adminRoundRoutes");
const adminBetRoutes = require("./routes/adminBetRoutes");
const adminPayoutRoutes = require("./routes/adminPayoutRoutes");
const adminUserRoutes = require("./routes/adminUserRoutes");
const adminWalletRoutes = require("./routes/adminWalletRoutes");

const app = express();

app.use(helmet());

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/game", gameRoutes);
app.use("/api/bets", betRoutes);
app.use("/api/admin/game", adminGameRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin/rounds", adminRoundRoutes);
app.use("/api/admin/bets", adminBetRoutes);
app.use("/api/admin/payouts", adminPayoutRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/wallet", adminWalletRoutes);

app.use(cookieParser());

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Gaming Platform API Running"
    });
});

module.exports = app;