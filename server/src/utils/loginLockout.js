/*
 * ==========================================
 * PROGRESSIVE LOGIN LOCKOUT
 * ==========================================
 *
 * Account-level (not just IP-level) brute-force defense,
 * shared by both User and Admin login. Independent of and
 * additive to the existing IP-based express-rate-limit
 * (authLimiter) - that one caps raw request volume per IP
 * regardless of which account is targeted; this one escalates
 * a SPECIFIC account's lockout the more it gets attacked,
 * which authLimiter alone can't do since it resets on a fixed
 * window and doesn't distinguish 5 failed attempts against one
 * account from 5 failed attempts spread across five.
 *
 * Schedule: attempts are grouped in blocks of 5. The first 4
 * failures in a block are free (typos happen, no lockout) - the
 * 5th failure in the block triggers that block's lockout. Once
 * the lockout expires, the next block of 5 failures escalates to
 * the NEXT tier. Tiers keep growing every 5 failures rather than
 * capping at a fixed ceiling, up to a 30-minute maximum so a
 * sustained attack (or a locked-out legitimate user) never waits
 * longer than that for any single window.
 *
 *   failures 1-4    -> no lockout
 *   failure 5       -> 30s
 *   failures 6-9    -> still within the 30s window
 *   failure 10      -> 1 min
 *   failure 15      -> 2 min
 *   failure 20      -> 5 min
 *   failure 25      -> 10 min
 *   failure 30      -> 20 min
 *   failure 35+     -> 30 min (cap)
 *
 * A single successful login resets the counter to zero.
 */

const LOCKOUT_GROUP_SIZE = 5;

const LOCKOUT_SCHEDULE_SECONDS = [30, 60, 120, 300, 600, 1200, 1800];

const formatDuration = (totalSeconds) => {

    if (totalSeconds < 60) {
        return `${totalSeconds}s`;
    }

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;

};


// ==========================================================
// THROWS if the account is currently locked out. Call this
// BEFORE checking the password - a lockout blocks every
// attempt during its window, even a correct password.
// ==========================================================

const assertNotLockedOut = (doc) => {

    if (
        doc.lockoutUntil &&
        doc.lockoutUntil.getTime() > Date.now()
    ) {

        const retryAfterSeconds =
            Math.ceil(
                (doc.lockoutUntil.getTime() - Date.now()) / 1000
            );

        const error = new Error(
            `Too many failed attempts. Try again in ${formatDuration(retryAfterSeconds)}.`
        );

        error.statusCode = 429;
        error.retryAfterSeconds = retryAfterSeconds;

        throw error;

    }

};


// ==========================================================
// Call on a WRONG password. Increments the failure counter
// and, every 5th consecutive failure, sets a new lockout
// window at the next tier. Returns the new retryAfterSeconds
// when this attempt just triggered a lockout (undefined on
// any of the 4 free failures within a block).
// ==========================================================

const recordFailedAttempt = async (doc) => {

    doc.failedLoginAttempts =
        (doc.failedLoginAttempts || 0) + 1;

    let retryAfterSeconds;

    if (doc.failedLoginAttempts % LOCKOUT_GROUP_SIZE === 0) {

        const tierIndex =
            (doc.failedLoginAttempts / LOCKOUT_GROUP_SIZE) - 1;

        const seconds =
            LOCKOUT_SCHEDULE_SECONDS[
                Math.min(tierIndex, LOCKOUT_SCHEDULE_SECONDS.length - 1)
            ];

        doc.lockoutUntil =
            new Date(Date.now() + seconds * 1000);

        retryAfterSeconds = seconds;

    }

    await doc.save();

    return { retryAfterSeconds };

};


// ==========================================================
// Call on a SUCCESSFUL login to clear the counter/lockout.
// ==========================================================

const resetLockout = async (doc) => {

    if (doc.failedLoginAttempts || doc.lockoutUntil) {

        doc.failedLoginAttempts = 0;
        doc.lockoutUntil = null;

        await doc.save();

    }

};


module.exports = {
    LOCKOUT_SCHEDULE_SECONDS,
    formatDuration,
    assertNotLockedOut,
    recordFailedAttempt,
    resetLockout,
};
