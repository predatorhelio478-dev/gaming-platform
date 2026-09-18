const mongoose =
    require("mongoose");

const AuditLog =
    require("../models/AuditLog");


// ==========================================================
// GET AUDIT LOGS
// ==========================================================

const getAuditLogs = async (
    req,
    res
) => {

    try {

        // ==================================================
        // PAGINATION
        // ==================================================

        let page =
            Number(req.query.page) || 1;

        let limit =
            Number(req.query.limit) || 20;


        page =
            Math.max(
                1,
                Math.floor(page)
            );

        limit =
            Math.min(
                100,
                Math.max(
                    1,
                    Math.floor(limit)
                )
            );


        const skip =
            (page - 1) *
            limit;


        // ==================================================
        // QUERY PARAMS
        // ==================================================

        const search =
            String(
                req.query.search ||
                ""
            ).trim();


        const module =
            String(
                req.query.module ||
                ""
            ).trim().toLowerCase();


        const action =
            String(
                req.query.action ||
                ""
            ).trim().toLowerCase();


        const actorType =
            String(
                req.query.actorType ||
                ""
            ).trim().toLowerCase();


        const category =
            String(
                req.query.category ||
                ""
            ).trim().toLowerCase();


        const key =
            String(
                req.query.key ||
                ""
            ).trim().toLowerCase();


        const dateFrom =
            String(
                req.query.dateFrom ||
                ""
            ).trim();


        const dateTo =
            String(
                req.query.dateTo ||
                ""
            ).trim();


        // ==================================================
        // FILTER
        // ==================================================

        const filter = {};


        // --------------------------------------------------
        // SEARCH
        // --------------------------------------------------

        if (search) {

            const escapedSearch =
                escapeRegex(search);

            filter.$or = [

                {
                    action: {
                        $regex:
                            escapedSearch,
                        $options:
                            "i",
                    },
                },

                {
                    module: {
                        $regex:
                            escapedSearch,
                        $options:
                            "i",
                    },
                },

                {
                    category: {
                        $regex:
                            escapedSearch,
                        $options:
                            "i",
                    },
                },

                {
                    key: {
                        $regex:
                            escapedSearch,
                        $options:
                            "i",
                    },
                },

                {
                    ipAddress: {
                        $regex:
                            escapedSearch,
                        $options:
                            "i",
                    },
                },
            ];
        }


        // --------------------------------------------------
        // MODULE
        // --------------------------------------------------

        if (module) {

            filter.module =
                module;
        }


        // --------------------------------------------------
        // ACTION
        // --------------------------------------------------

        if (action) {

            filter.action =
                action;
        }


        // --------------------------------------------------
        // ACTOR TYPE
        // --------------------------------------------------

        if (actorType) {

            const allowedActorTypes = [
                "admin",
                "user",
                "system",
            ];

            if (
                !allowedActorTypes.includes(
                    actorType
                )
            ) {

                return res.status(
                    400
                ).json({
                    success: false,
                    message:
                        "Invalid actor type.",
                });
            }

            filter.actorType =
                actorType;
        }


        // --------------------------------------------------
        // CATEGORY
        // --------------------------------------------------

        if (category) {

            filter.category =
                category;
        }


        // --------------------------------------------------
        // KEY
        // --------------------------------------------------

        if (key) {

            filter.key =
                key;
        }


        // ==================================================
        // DATE FROM
        // ==================================================

        if (dateFrom) {

            const fromDate =
                new Date(
                    `${dateFrom}T00:00:00.000Z`
                );


            if (
                Number.isNaN(
                    fromDate.getTime()
                )
            ) {

                return res.status(
                    400
                ).json({
                    success: false,
                    message:
                        "Invalid dateFrom.",
                });
            }


            filter.createdAt = {
                $gte:
                    fromDate,
            };
        }


        // ==================================================
        // DATE TO
        // ==================================================

        if (dateTo) {

            const toDate =
                new Date(
                    `${dateTo}T23:59:59.999Z`
                );


            if (
                Number.isNaN(
                    toDate.getTime()
                )
            ) {

                return res.status(
                    400
                ).json({
                    success: false,
                    message:
                        "Invalid dateTo.",
                });
            }


            if (
                filter.createdAt
            ) {

                filter.createdAt.$lte =
                    toDate;

            } else {

                filter.createdAt = {
                    $lte:
                        toDate,
                };
            }
        }


        // ==================================================
        // DATE RANGE VALIDATION
        // ==================================================

        if (
            filter.createdAt?.$gte &&
            filter.createdAt?.$lte &&
            filter.createdAt.$gte >
            filter.createdAt.$lte
        ) {

            return res.status(
                400
            ).json({
                success: false,
                message:
                    "dateFrom cannot be greater than dateTo.",
            });
        }


        // ==================================================
        // COUNT
        // ==================================================

        const total =
            await AuditLog.countDocuments(
                filter
            );


        // ==================================================
        // FETCH
        // ==================================================

        const logs =
            await AuditLog
                .find(filter)
                .sort({
                    createdAt: -1,
                })
                .skip(skip)
                .limit(limit)
                .lean();


        // ==================================================
        // PAGINATION
        // ==================================================

        const totalPages =
            Math.max(
                1,
                Math.ceil(
                    total / limit
                )
            );


        // ==================================================
        // RESPONSE
        // ==================================================

        return res.status(
            200
        ).json({

            success: true,

            logs,

            pagination: {

                page,

                limit,

                total,

                totalPages,

                hasNextPage:
                    page <
                    totalPages,

                hasPreviousPage:
                    page > 1,

            },

        });

    } catch (error) {

        console.error(
            "Get Audit Logs Error:",
            error
        );

        return res.status(
            500
        ).json({
            success: false,
            message:
                "Failed to load audit logs.",
        });
    }
};


// ==========================================================
// GET SINGLE AUDIT LOG
// ==========================================================

const getAuditLogById = async (
    req,
    res
) => {

    try {

        const {
            id,
        } = req.params;


        if (
            !mongoose.Types.ObjectId.isValid(
                id
            )
        ) {

            return res.status(
                400
            ).json({
                success: false,
                message:
                    "Invalid audit log ID.",
            });
        }


        const log =
            await AuditLog
                .findById(id)
                .lean();


        if (!log) {

            return res.status(
                404
            ).json({
                success: false,
                message:
                    "Audit log not found.",
            });
        }


        return res.status(
            200
        ).json({
            success: true,
            log,
        });

    } catch (error) {

        console.error(
            "Get Audit Log Error:",
            error
        );

        return res.status(
            500
        ).json({
            success: false,
            message:
                "Failed to load audit log.",
        });
    }
};


// ==========================================================
// REGEX ESCAPE
// ==========================================================

const escapeRegex = (
    value
) => {

    return value.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );
};


// ==========================================================
// EXPORT
// ==========================================================

module.exports = {
    getAuditLogs,
    getAuditLogById,
};