"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDuration = formatDuration;
exports.addMinutes = addMinutes;
exports.addHours = addHours;
exports.addDays = addDays;
exports.isExpired = isExpired;
exports.getTimestamp = getTimestamp;
exports.parseCronExpression = parseCronExpression;
function formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    }
    else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    }
    else {
        return `${seconds}s`;
    }
}
function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60 * 1000);
}
function addHours(date, hours) {
    return new Date(date.getTime() + hours * 60 * 60 * 1000);
}
function addDays(date, days) {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}
function isExpired(expirationDate) {
    return expirationDate.getTime() < Date.now();
}
function getTimestamp() {
    return new Date().toISOString();
}
function parseCronExpression(expression) {
    const parts = expression.split(' ');
    return parts.length >= 5 && parts.length <= 6;
}
//# sourceMappingURL=time.js.map