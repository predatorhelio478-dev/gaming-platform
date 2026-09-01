const walletService = require("../services/walletService");

exports.getWallet = async (req, res) => {
    try {
        const wallet = await walletService.getWallet(req.user.id);

        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: "Wallet not found",
            });
        }

        res.json({
            success: true,
            wallet,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};