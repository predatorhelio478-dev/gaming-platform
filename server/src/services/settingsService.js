const mongoose =
    require("mongoose");

const Setting =
    require("../models/Setting");

const settingsCache =
    require("./settingsCache");

const {
    validateCategory,
    validateSettingsPayload,
    getValueType,
    validateBusinessRules,
} = require("../validators/settingsValidator");

const {
    createAuditLog,
} = require("./auditLogService");


// ==========================================================
// DEEP VALUE COMPARISON
// ==========================================================
//
// Used before writing a setting so a Save/Reset that doesn't
// actually change a value never produces an audit log entry.
// Handles strings, numbers, booleans, null, arrays, and
// (nested) plain objects.
// ==========================================================

const valuesAreEqual = (
    a,
    b
) => {

    if (a === b) {

        return true;

    }


    if (
        a === null ||
        b === null ||
        a === undefined ||
        b === undefined
    ) {

        return a === b;

    }


    if (
        Array.isArray(a) ||
        Array.isArray(b)
    ) {

        if (
            !Array.isArray(a) ||
            !Array.isArray(b) ||
            a.length !== b.length
        ) {

            return false;

        }


        return a.every(
            (item, index) =>
                valuesAreEqual(
                    item,
                    b[index]
                )
        );

    }


    if (
        typeof a === "object" &&
        typeof b === "object"
    ) {

        const aKeys =
            Object.keys(a).sort();

        const bKeys =
            Object.keys(b).sort();


        if (
            aKeys.length !==
            bKeys.length
        ) {

            return false;

        }


        return aKeys.every(
            (key, index) =>
                key === bKeys[index] &&
                valuesAreEqual(
                    a[key],
                    b[key]
                )
        );

    }


    return false;

};


// ==========================================================
// GET ALL SETTINGS
// ==========================================================

const getAllSettings = async () => {

    const settings =
        await settingsCache.getAll();


    const result = [];


    for (
        const category in settings
    ) {

        for (
            const key in settings[category]
        ) {

            result.push(
                settings[category][key]
            );

        }

    }


    return result;

};


// ==========================================================
// GET SETTINGS BY CATEGORY
// ==========================================================

const getSettingsByCategory = async (
    category
) => {

    category =
        category
            .trim()
            .toLowerCase();


    const categoryError =
        validateCategory(category);


    if (categoryError) {

        throw new Error(
            categoryError
        );

    }


    const settings =
        await settingsCache.getAll();


    const categorySettings =
        settings?.[category] || {};


    return Object.values(
        categorySettings
    );

};


// ==========================================================
// GET SINGLE SETTING
// ==========================================================

const getSetting = async (
    category,
    key
) => {

    category =
        category
            .trim()
            .toLowerCase();


    key =
        key
            .trim()
            .toLowerCase();


    const categoryError =
        validateCategory(category);


    if (categoryError) {

        throw new Error(
            categoryError
        );

    }


    return await settingsCache.get(
        category,
        key
    );

};


// ==========================================================
// GET SINGLE SETTING VALUE
// ==========================================================
//
// Example:
//
// const minimumBet =
//     await settingsService.getValue(
//         "game",
//         "minimum_bet",
//         10
//     );
//
// ==========================================================

const getValue = async (
    category,
    key,
    defaultValue = null
) => {

    category =
        category
            .trim()
            .toLowerCase();


    key =
        key
            .trim()
            .toLowerCase();


    const categoryError =
        validateCategory(category);


    if (categoryError) {

        throw new Error(
            categoryError
        );

    }


    return await settingsCache.getValue(
        category,
        key,
        defaultValue
    );

};


// ==========================================================
// GET MULTIPLE SETTING VALUES
// ==========================================================
//
// Example:
//
// const settings =
//     await settingsService.getValues(
//         "game",
//         [
//             "minimum_bet",
//             "maximum_bet"
//         ]
//     );
//
// ==========================================================

const getValues = async (
    category,
    keys = []
) => {

    category =
        category
            .trim()
            .toLowerCase();


    const categoryError =
        validateCategory(category);


    if (categoryError) {

        throw new Error(
            categoryError
        );

    }


    if (!Array.isArray(keys)) {

        throw new Error(
            "Keys must be an array."
        );

    }


    const normalizedKeys =
        keys.map(
            (key) => {

                if (
                    typeof key !==
                    "string"
                ) {

                    throw new Error(
                        "Setting keys must be strings."
                    );

                }


                return key
                    .trim()
                    .toLowerCase();

            }
        );


    const settings =
        await settingsCache.getAll();


    const categorySettings =
        settings?.[category] || {};


    const result = {};


    // ======================================================
    // RETURN ALL VALUES
    // ======================================================

    if (
        normalizedKeys.length === 0
    ) {

        for (
            const key in categorySettings
        ) {

            result[key] =
                categorySettings[key]
                    .value;

        }


        return result;

    }


    // ======================================================
    // RETURN REQUESTED VALUES
    // ======================================================

    for (
        const key
        of normalizedKeys
    ) {

        result[key] =
            categorySettings[key]
                ?.value ??
            null;

    }


    return result;

};


// ==========================================================
// GET PUBLIC SETTINGS
// ==========================================================
//
// Only:
//
// isActive === true
// isPublic === true
// isSensitive === false
//
// will be returned.
//
// ==========================================================

const getPublicSettings = async () => {

    const settings =
        await settingsCache.getAll();


    const publicSettings = {};


    for (
        const category in settings
    ) {

        for (
            const key in settings[category]
        ) {

            const setting =
                settings[category][key];


            // ==============================================
            // SECURITY CHECK
            // ==============================================

            if (
                setting.isActive !== true ||
                setting.isPublic !== true ||
                setting.isSensitive === true
            ) {

                continue;

            }


            if (
                !publicSettings[category]
            ) {

                publicSettings[category] = {};

            }


            publicSettings[category][key] =
                setting.value;

        }

    }


    return publicSettings;

};


// ==========================================================
// GET LEGAL CONTENT LAST-UPDATED TIMESTAMP
// ==========================================================
//
// Purely additive helper for the public Legal & Help page's
// "Last updated" display - the most recent updatedAt among
// the admin-editable legal text settings. Returns null if
// none of them have ever been saved (fresh install).
// ==========================================================

const getLegalLastUpdated = async () => {

    const legalSettings =
        await Setting.find({
            category: "legal",
            key: {
                $in: [
                    "terms_and_conditions",
                    "privacy_policy",
                    "responsible_gaming",
                ],
            },
            isActive: true,
        })
            .select("updatedAt")
            .lean();

    if (
        !legalSettings ||
        legalSettings.length === 0
    ) {

        return null;

    }

    const latest =
        legalSettings.reduce(
            (max, setting) =>
                setting.updatedAt > max
                    ? setting.updatedAt
                    : max,
            legalSettings[0].updatedAt
        );

    return latest;

};


// ==========================================================
// UPDATE SETTINGS
// ==========================================================

const updateSettings = async (
    category,
    settings,
    adminId,
    auditContext = {}
) => {

    category =
        category
            .trim()
            .toLowerCase();


    // ======================================================
    // CATEGORY VALIDATION
    // ======================================================

    const categoryError =
        validateCategory(category);


    if (categoryError) {

        throw new Error(
            categoryError
        );

    }


    // ======================================================
    // PAYLOAD VALIDATION
    // ======================================================

    const payloadError =
        validateSettingsPayload(
            settings
        );


    if (payloadError) {

        throw new Error(
            payloadError
        );

    }


    // ======================================================
    // NORMALIZE
    // ======================================================

    const normalizedSettings =
        settings.map(
            (item) => ({

                key:
                    item.key
                        .trim()
                        .toLowerCase(),

                value:
                    item.value,

            })
        );


    // ======================================================
    // BUSINESS RULE VALIDATION
    // ======================================================

    const businessError =
        validateBusinessRules(
            category,
            normalizedSettings
        );


    if (businessError) {

        throw new Error(
            businessError
        );

    }


    // ======================================================
    // START TRANSACTION
    // ======================================================

    const session =
        await mongoose.startSession();


    try {

        session.startTransaction();


        // ==================================================
        // FETCH SETTINGS
        // ==================================================

        const existingSettings =
            await Setting
                .find({
                    category,
                    key: {
                        $in:
                            normalizedSettings.map(
                                (item) =>
                                    item.key
                            ),
                    },
                })
                .session(session);


        // ==================================================
        // CHECK MISSING SETTINGS
        // ==================================================

        const existingKeys =
            new Set(
                existingSettings.map(
                    (setting) =>
                        setting.key
                )
            );


        const missingSetting =
            normalizedSettings.find(
                (item) =>
                    !existingKeys.has(
                        item.key
                    )
            );


        if (missingSetting) {

            throw new Error(
                `Setting '${missingSetting.key}' not found.`
            );

        }


        // ==================================================
        // MAP
        // ==================================================

        const settingMap =
            new Map(
                existingSettings.map(
                    (setting) => [
                        setting.key,
                        setting,
                    ]
                )
            );


        // ==================================================
        // PRE-VALIDATE EVERYTHING
        // ==================================================

        for (
            const item
            of normalizedSettings
        ) {

            const setting =
                settingMap.get(
                    item.key
                );


            // ----------------------------------------------
            // SENSITIVE SETTING
            // ----------------------------------------------

            if (
                setting.isSensitive
            ) {

                throw new Error(
                    `Sensitive setting '${item.key}' cannot be updated through this endpoint.`
                );

            }


            // ----------------------------------------------
            // TYPE
            // ----------------------------------------------

            const actualType =
                getValueType(
                    item.value
                );


            if (
                setting.type !==
                actualType
            ) {

                throw new Error(
                    `Invalid value type for '${item.key}'. Expected ${setting.type}.`
                );

            }

        }


        // ==================================================
        // UPDATE (ONLY SETTINGS THAT ACTUALLY CHANGED)
        // ==================================================

        const updatedSettings = [];

        const changedKeys = [];

        const unchangedKeys = [];


        for (
            const item
            of normalizedSettings
        ) {

            const setting =
                settingMap.get(
                    item.key
                );


            const oldValue =
                setting.value;


            // ----------------------------------------------
            // NO-OP: value is unchanged, don't write or audit
            // ----------------------------------------------

            if (
                valuesAreEqual(
                    oldValue,
                    item.value
                )
            ) {

                unchangedKeys.push(
                    item.key
                );

                continue;

            }


            setting.value =
                item.value;


            setting.updatedBy =
                adminId;


            await setting.save({
                session,
            });


            updatedSettings.push(
                setting.toObject()
            );

            changedKeys.push(
                item.key
            );


            // ==================================================
            // AUDIT LOG
            // ==================================================

            await createAuditLog({

                actorType:
                    "admin",

                actorId:
                    adminId,

                action:
                    "settings.update",

                module:
                    "settings",

                category,

                key:
                    item.key,

                oldValue,

                newValue:
                    item.value,

                ipAddress:
                    auditContext.ipAddress ||
                    null,

                userAgent:
                    auditContext.userAgent ||
                    null,

                session,

            });

        }


        // ==================================================
        // COMMIT
        // ==================================================

        await session.commitTransaction();


        // ==================================================
        // INVALIDATE CACHE
        // ==================================================

        if (
            changedKeys.length > 0
        ) {

            settingsCache.invalidate();

        }


        return {

            settings:
                updatedSettings,

            changed:
                changedKeys,

            unchanged:
                unchangedKeys,

        };


    } catch (error) {

        // ==================================================
        // ROLLBACK
        // ==================================================

        if (
            session.inTransaction()
        ) {

            await session.abortTransaction();

        }


        throw error;


    } finally {

        await session.endSession();

    }

};


// ==========================================================
// RESET CATEGORY SETTINGS
// ==========================================================

const resetSettings = async (
    category,
    defaultSettings,
    adminId,
    auditContext = {}
) => {

    category =
        category
            .trim()
            .toLowerCase();


    // ======================================================
    // CATEGORY
    // ======================================================

    const categoryError =
        validateCategory(category);


    if (categoryError) {

        throw new Error(
            categoryError
        );

    }


    // ======================================================
    // DEFAULT SETTINGS
    // ======================================================

    const categoryDefaults =
        defaultSettings.filter(
            (setting) =>
                setting.category ===
                category
        );


    if (
        categoryDefaults.length === 0
    ) {

        throw new Error(
            `No default settings found for '${category}'.`
        );

    }


    // ======================================================
    // START TRANSACTION
    // ======================================================

    const session =
        await mongoose.startSession();


    try {

        session.startTransaction();


        const resetSettingsResult = [];

        const changedKeys = [];

        const unchangedKeys = [];


        // ==================================================
        // RESET EACH SETTING
        // ==================================================

        for (
            const defaultSetting
            of categoryDefaults
        ) {

            const setting =
                await Setting.findOne({

                    category,

                    key:
                        defaultSetting.key,

                    isActive: true,

                }).session(session);


            if (!setting) {

                continue;

            }


            // ----------------------------------------------
            // SENSITIVE SETTINGS
            // ----------------------------------------------

            if (
                setting.isSensitive
            ) {

                continue;

            }


            const oldValue =
                setting.value;


            // ----------------------------------------------
            // NO-OP: already at default, don't write or audit
            // ----------------------------------------------

            if (
                valuesAreEqual(
                    oldValue,
                    defaultSetting.value
                )
            ) {

                unchangedKeys.push(
                    setting.key
                );

                continue;

            }


            setting.value =
                defaultSetting.value;


            setting.updatedBy =
                adminId;


            await setting.save({
                session,
            });


            resetSettingsResult.push(
                setting.toObject()
            );

            changedKeys.push(
                setting.key
            );


            // ==================================================
            // AUDIT
            // ==================================================

            await createAuditLog({

                actorType:
                    "admin",

                actorId:
                    adminId,

                action:
                    "settings.reset",

                module:
                    "settings",

                category,

                key:
                    setting.key,

                oldValue,

                newValue:
                    defaultSetting.value,

                ipAddress:
                    auditContext.ipAddress ||
                    null,

                userAgent:
                    auditContext.userAgent ||
                    null,

                session,

            });

        }


        // ==================================================
        // COMMIT
        // ==================================================

        await session.commitTransaction();


        // ==================================================
        // INVALIDATE CACHE
        // ==================================================

        if (
            changedKeys.length > 0
        ) {

            settingsCache.invalidate();

        }


        return {

            settings:
                resetSettingsResult,

            changed:
                changedKeys,

            unchanged:
                unchangedKeys,

        };


    } catch (error) {

        // ==================================================
        // ROLLBACK
        // ==================================================

        if (
            session.inTransaction()
        ) {

            await session.abortTransaction();

        }


        throw error;

    } finally {

        await session.endSession();

    }

};


// ==========================================================
// EXPORT
// ==========================================================

module.exports = {

    getAllSettings,

    getSettingsByCategory,

    getSetting,

    getValue,

    getValues,

    getPublicSettings,

    getLegalLastUpdated,

    updateSettings,

    resetSettings,

};