const generateReferralCode = () => {
  const random = Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase();

  return `REF${random}`;
};

module.exports = generateReferralCode;
