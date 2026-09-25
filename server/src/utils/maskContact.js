/*
 * ==========================================
 * CONTACT MASKING
 * ==========================================
 *
 * Single reusable place for turning a full email/phone into a
 * partially-hidden display value (e.g. for "OTP sent to..."
 * messages and the profile page). Never used to decide identity
 * or matching - only for what gets shown/logged to the user.
 */

const maskEmail = (email) => {

    const value = String(email || "").trim();

    const atIndex = value.indexOf("@");

    if (atIndex <= 0) {

        return value ? "***" : "";

    }

    const localPart = value.slice(0, atIndex);
    const domainPart = value.slice(atIndex);

    const visible =
        localPart.length <= 2
            ? localPart.slice(0, 1)
            : localPart.slice(0, 3);

    return `${visible}${"*".repeat(Math.max(3, localPart.length - visible.length))}${domainPart}`;

};

const maskPhone = (phone) => {

    const digits = String(phone || "").trim();

    if (digits.length <= 4) {

        return digits ? "*".repeat(digits.length) : "";

    }

    const start = digits.slice(0, 2);
    const end = digits.slice(-2);
    const middleLength = digits.length - start.length - end.length;

    return `${start}${"*".repeat(Math.max(0, middleLength))}${end}`;

};

module.exports = {
    maskEmail,
    maskPhone,
};
