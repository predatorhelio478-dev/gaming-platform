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
 * Schedule: the 1st failed attempt is never locked out (typos
 * happen) - starting from the 2nd consecutive failure, each
 * further failure escalates to the next tier below. The lockout
 * duration is capped at 60 seconds (1 minute) - it still
 * escalates with repeated failures (security intact, a bot can
 * never brute-force faster than one guess per lockout tier), it
 * just never makes a legitimate user wait longer than 60s for
 * any single wait. Once the schedule is exhausted, it stays at
 * the last (60s) tier rather than growing further.
 *
 *   2nd failure  -> 15s
 *   3rd failure  -> 30s
 *   4th failure  -> 45s
 *   5th+ failure -> 60s
 *
 * A single successful login resets the counter to zero.
 */

const LOCKOUT_SCHEDULE_SECONDS = [15, 30, 45, 60];

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
// and, from the 2nd consecutive failure onward, sets/extends
// the escalating lockout window. Returns the new
// retryAfterSeconds when this attempt just triggered a
// lockout (undefined on the still-free 1st failure).
// ==========================================================

const recordFailedAttempt = async (doc) => {

    doc.failedLoginAttempts =
        (doc.failedLoginAttempts || 0) + 1;

    const scheduleIndex =
        doc.failedLoginAttempts - 2;

    let retryAfterSeconds;

    if (scheduleIndex >= 0) {

        const seconds =
            LOCKOUT_SCHEDULE_SECONDS[
                Math.min(scheduleIndex, LOCKOUT_SCHEDULE_SECONDS.length - 1)
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
