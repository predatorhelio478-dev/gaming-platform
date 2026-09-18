const Setting = require("../models/Setting");


// ==========================================================
// SETTINGS CACHE
// ==========================================================

let settingsCache = null;

let cacheLoadedAt = null;


// Cache kitne milliseconds valid rahega
const CACHE_TTL = 60 * 1000;


// ==========================================================
// LOAD SETTINGS FROM DATABASE
// ==========================================================

const loadSettings = async () => {

    const settings =
        await Setting.find({
            isActive: true,
        })
            .select(
                "category key value type isPublic isSensitive isActive"
            )
            .lean();


    const cache = {};


    for (const setting of settings) {

        if (
            !cache[setting.category]
        ) {

            cache[setting.category] = {};

        }


        cache[setting.category][
            setting.key
        ] = setting;

    }


    settingsCache = cache;

    cacheLoadedAt = Date.now();


    return settingsCache;
};


// ==========================================================
// CHECK CACHE
// ==========================================================

const isCacheValid = () => {

    if (
        !settingsCache ||
        !cacheLoadedAt
    ) {
        return false;
    }


    return (
        Date.now() - cacheLoadedAt
        < CACHE_TTL
    );
};


// ==========================================================
// GET ALL SETTINGS
// ==========================================================

const getAll = async () => {

    if (isCacheValid()) {

        return settingsCache;

    }


    return await loadSettings();
};


// ==========================================================
// GET SINGLE SETTING
// ==========================================================

const get = async (
    category,
    key
) => {

    const settings =
        await getAll();


    return (
        settings?.[
        category
        ]?.[
        key
        ] || null
    );
};


// ==========================================================
// GET VALUE
// ==========================================================

const getValue = async (
    category,
    key,
    defaultValue = null
) => {

    const setting =
        await get(
            category,
            key
        );


    if (!setting) {

        return defaultValue;

    }


    return setting.value;

};


// ==========================================================
// INVALIDATE CACHE
// ==========================================================

const invalidate = () => {

    settingsCache = null;

    cacheLoadedAt = null;

};


// ==========================================================
// FORCE REFRESH
// ==========================================================

const refresh = async () => {

    invalidate();

    return await loadSettings();

};


// ==========================================================
// EXPORT
// ==========================================================

module.exports = {
    loadSettings,
    getAll,
    get,
    getValue,
    invalidate,
    refresh,
};