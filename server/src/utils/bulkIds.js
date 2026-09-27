const mongoose = require("mongoose");

// Max accounts one bulk request may touch - matches the largest
// admin list page size, and keeps a single request bounded.
const MAX_BULK_IDS = 100;

/*
 * Validates the `ids` array of a bulk request. Returns
 * { ids, invalid }: `ids` are the unique, well-formed ObjectId
 * strings to process; `invalid` lists entries rejected up
 * front (reported back per-id as failures, never silently
 * dropped). Throws (400) only when the payload itself is
 * unusable.
 */
const parseBulkIds = (rawIds) => {

    if (!Array.isArray(rawIds) || rawIds.length === 0) {

        const error = new Error("Select at least one account.");
        error.statusCode = 400;
        throw error;

    }

    if (rawIds.length > MAX_BULK_IDS) {

        const error = new Error(`You can delete at most ${MAX_BULK_IDS} accounts at once.`);
        error.statusCode = 400;
        throw error;

    }

    const ids = [];
    const invalid = [];
    const seen = new Set();

    for (const raw of rawIds) {

        const id = typeof raw === "string" ? raw.trim() : "";

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {

            invalid.push({ id: String(raw), reason: "Invalid ID." });
            continue;

        }

        if (!seen.has(id)) {

            seen.add(id);
            ids.push(id);

        }

    }

    return { ids, invalid };

};

/*
 * Runs `deleteOne(id)` for every id, one at a time (each
 * single delete keeps its own atomic guarantees), collecting
 * per-id outcomes. A failure never stops the rest - partial
 * success is reported, not rolled back.
 */
const runBulk = async (ids, deleteOne) => {

    const deleted = [];
    const failed = [];

    for (const id of ids) {

        try {

            deleted.push({ id, ...(await deleteOne(id)) });

        } catch (error) {

            failed.push({ id, reason: error.message || "Unable to delete." });

        }

    }

    return { deleted, failed };

};

// 200 when at least one account was deleted (partial or full
// success), 400 when nothing was - either way with per-id detail.
const sendBulkResult = (res, { deleted, failed }, noun) => {

    const message =
        failed.length === 0
            ? `Deleted ${deleted.length} ${noun}${deleted.length === 1 ? "" : "s"}.`
            : deleted.length === 0
                ? `No ${noun}s were deleted.`
                : `Deleted ${deleted.length} ${noun}${deleted.length === 1 ? "" : "s"}; ${failed.length} could not be deleted.`;

    return res.status(deleted.length > 0 ? 200 : 400).json({
        success: failed.length === 0,
        partial: deleted.length > 0 && failed.length > 0,
        message,
        deleted,
        failed,
    });

};

module.exports = {
    MAX_BULK_IDS,
    parseBulkIds,
    runBulk,
    sendBulkResult,
};
