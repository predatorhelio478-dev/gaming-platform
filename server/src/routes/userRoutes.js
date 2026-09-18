const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");

const {
    updateProfileValidators,
    emailChangeValidators,
    mobileChangeValidators,
    changePasswordValidators,
} = require("../validators/requestValidators");

const {
    updateMyProfile,
    requestEmailChange,
    requestMobileChange,
    changeMyPassword,
} = require("../controllers/userController");

router.use(auth);

router.patch("/me", updateProfileValidators, updateMyProfile);
router.post("/me/email/change", emailChangeValidators, requestEmailChange);
router.post("/me/mobile/change", mobileChangeValidators, requestMobileChange);
router.post("/me/password", changePasswordValidators, changeMyPassword);

module.exports = router;
