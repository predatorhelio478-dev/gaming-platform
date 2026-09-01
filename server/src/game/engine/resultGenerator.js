const COLORS = ["red", "green", "blue"];

const generateResult = () => {
    const randomIndex = Math.floor(Math.random() * COLORS.length);

    return COLORS[randomIndex];
};

module.exports = generateResult;