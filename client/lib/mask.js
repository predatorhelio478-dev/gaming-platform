// Mirrors server/src/utils/maskContact.js - used only for
// display; the backend independently returns its own masked
// value in OTP responses, this is for anywhere else the client
// already holds the full value (e.g. prefilling the profile page).

export function maskEmail(email) {
    const value = String(email || "").trim();
    const atIndex = value.indexOf("@");

    if (atIndex <= 0) {
        return value ? "***" : "";
    }

    const localPart = value.slice(0, atIndex);
    const domainPart = value.slice(atIndex);
    const visible = localPart.length <= 2 ? localPart.slice(0, 1) : localPart.slice(0, 3);

    return `${visible}${"*".repeat(Math.max(3, localPart.length - visible.length))}${domainPart}`;
}

export function maskPhone(phone) {
    const digits = String(phone || "").trim();

    if (digits.length <= 4) {
        return digits ? "*".repeat(digits.length) : "";
    }

    const start = digits.slice(0, 2);
    const end = digits.slice(-2);
    const middleLength = digits.length - start.length - end.length;

    return `${start}${"*".repeat(Math.max(0, middleLength))}${end}`;
}
