const settingsService =
    require("./settingsService");


// ==========================================================
// VERIFICATION POLICY
// ==========================================================
//
// Single source of truth for "which verifications are
// currently required" (Settings -> User ->
// email_verification_required / mobile_verification_required).
// Used by the withdrawal gate and the admin Users stats so the
// two can never disagree. Toggling a setting only changes what
// is REQUIRED - a user's stored emailVerified/mobileVerified is
// never touched here.
// ==========================================================

const getVerificationRequirements = async () => {

    const values =
        await settingsService.getValues(
            "user",
            [
                "email_verification_required",
                "mobile_verification_required",
            ]
        );

    return {
        email: values.email_verification_required === true,
        mobile: values.mobile_verification_required === true,
    };

};

// Channels this user still needs to verify under the given
// requirements, e.g. [] | ["email"] | ["email", "mobile"].
const getMissingVerifications = (user, requirements) => {

    return [
        requirements.email && !user?.emailVerified && "email",
        requirements.mobile && !user?.mobileVerified && "mobile",
    ].filter(Boolean);

};

// Mongo filters matching users who do / don't satisfy every
// currently-required verification. With nothing required,
// every user satisfies it (and none fail it).
const buildVerifiedFilter = (requirements) => {

    return {
        ...(requirements.email ? { emailVerified: true } : {}),
        ...(requirements.mobile ? { mobileVerified: true } : {}),
    };

};

const buildUnverifiedFilter = (requirements) => {

    const conditions = [
        requirements.email && { emailVerified: { $ne: true } },
        requirements.mobile && { mobileVerified: { $ne: true } },
    ].filter(Boolean);

    return conditions.length > 0
        ? { $or: conditions }
        : { _id: { $exists: false } };

};


module.exports = {
    getVerificationRequirements,
    getMissingVerifications,
    buildVerifiedFilter,
    buildUnverifiedFilter,
};
