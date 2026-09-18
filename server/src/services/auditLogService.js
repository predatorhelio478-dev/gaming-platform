const AuditLog =
    require("../models/AuditLog");


// ==========================================================
// CREATE AUDIT LOG
// ==========================================================

const createAuditLog = async ({
    actorType = "system",

    actorId = null,

    actorModel = null,

    action,

    module,

    category = null,

    key = null,

    oldValue = null,

    newValue = null,

    ipAddress = null,

    userAgent = null,

    metadata = {},

    session = null,
}) => {

    // ======================================================
    // VALIDATION
    // ======================================================

    if (!action) {
        throw new Error(
            "Audit log action is required."
        );
    }

    if (!module) {
        throw new Error(
            "Audit log module is required."
        );
    }


    // ======================================================
    // ACTOR MODEL
    // ======================================================

    let resolvedActorModel =
        actorModel;

    if (!resolvedActorModel) {

        if (
            actorType ===
            "admin"
        ) {
            resolvedActorModel =
                "Admin";
        }

        if (
            actorType ===
            "user"
        ) {
            resolvedActorModel =
                "User";
        }

    }


    // ======================================================
    // LOG DATA
    // ======================================================

    const logData = {

        actorType,

        actorModel:
            resolvedActorModel,

        actorId,

        action:
            String(action)
                .trim()
                .toLowerCase(),

        module:
            String(module)
                .trim()
                .toLowerCase(),

        category:
            category
                ? String(category)
                    .trim()
                    .toLowerCase()
                : null,

        key:
            key
                ? String(key)
                    .trim()
                    .toLowerCase()
                : null,

        oldValue,

        newValue,

        ipAddress,

        userAgent,

        metadata,
    };


    // ======================================================
    // TRANSACTION
    // ======================================================

    if (session) {

        const logs =
            await AuditLog.create(
                [logData],
                {
                    session,
                }
            );

        return logs[0];
    }


    // ======================================================
    // NORMAL CREATE
    // ======================================================

    return AuditLog.create(
        logData
    );
};


// ==========================================================
// EXPORT
// ==========================================================

module.exports = {
    createAuditLog,
};