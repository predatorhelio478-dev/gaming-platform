/*
 * ==========================================
 * SANITIZE INPUT (NoSQL INJECTION GUARD)
 * ==========================================
 *
 * Recursively strips any object key that starts with "$"
 * or contains "." from req.body / req.params / req.query,
 * preventing MongoDB operator injection (e.g. sending
 * { "$gt": "" } as a password/email field).
 *
 * NOTE: Express 5 makes req.query a getter-only property,
 * so this mutates each object IN PLACE instead of using
 * a library (express-mongo-sanitize) that reassigns
 * req.query wholesale and crashes under Express 5.
 */

const sanitizeInPlace = (value) => {

    if (
        Array.isArray(value)
    ) {

        value.forEach(
            (item) => sanitizeInPlace(item)
        );

        return value;

    }


    if (
        value &&
        typeof value === "object"
    ) {

        for (
            const key
            of Object.keys(value)
        ) {

            if (
                key.startsWith("$") ||
                key.includes(".")
            ) {

                delete value[key];

                continue;

            }


            sanitizeInPlace(
                value[key]
            );

        }

    }


    return value;

};


const sanitizeInput = (req, res, next) => {

    if (req.body) {

        sanitizeInPlace(req.body);

    }


    if (req.params) {

        sanitizeInPlace(req.params);

    }


    if (req.query) {

        sanitizeInPlace(req.query);

    }


    next();

};


module.exports = sanitizeInput;
