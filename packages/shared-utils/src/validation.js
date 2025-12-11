"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidEmail = isValidEmail;
exports.isValidUUID = isValidUUID;
exports.isValidUrl = isValidUrl;
exports.sanitizeString = sanitizeString;
exports.validateRequired = validateRequired;
exports.validateStringLength = validateStringLength;
exports.validateEnum = validateEnum;
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
function isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
}
function sanitizeString(input) {
    return input.trim().replace(/[<>]/g, '');
}
function validateRequired(value, fieldName) {
    if (value === null || value === undefined) {
        throw new Error(`${fieldName} is required`);
    }
    return value;
}
function validateStringLength(value, fieldName, min, max) {
    if (min !== undefined && value.length < min) {
        throw new Error(`${fieldName} must be at least ${min} characters`);
    }
    if (max !== undefined && value.length > max) {
        throw new Error(`${fieldName} must be at most ${max} characters`);
    }
}
function validateEnum(value, enumObj, fieldName) {
    const validValues = Object.values(enumObj);
    if (!validValues.includes(value)) {
        throw new Error(`${fieldName} must be one of: ${validValues.join(', ')}`);
    }
    return value;
}
//# sourceMappingURL=validation.js.map