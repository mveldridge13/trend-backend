"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DAYS_OF_WEEK = exports.TIME_PERIODS = void 0;
exports.formatHour = formatHour;
exports.isWeekend = isWeekend;
exports.getTimePeriod = getTimePeriod;
exports.TIME_PERIODS = {
    MORNING: { name: "Morning", start: 6, end: 12, hours: "6:00 AM - 12:00 PM" },
    AFTERNOON: {
        name: "Afternoon",
        start: 12,
        end: 18,
        hours: "12:00 PM - 6:00 PM",
    },
    EVENING: { name: "Evening", start: 18, end: 22, hours: "6:00 PM - 10:00 PM" },
    NIGHT: { name: "Night", start: 22, end: 6, hours: "10:00 PM - 6:00 AM" },
};
exports.DAYS_OF_WEEK = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
];
function formatHour(hour) {
    if (hour === 0)
        return "12:00 AM";
    if (hour === 12)
        return "12:00 PM";
    if (hour < 12)
        return `${hour}:00 AM`;
    return `${hour - 12}:00 PM`;
}
function isWeekend(dayIndex) {
    return dayIndex === 0 || dayIndex === 6;
}
function getTimePeriod(hour) {
    if (hour >= 6 && hour < 12)
        return "MORNING";
    if (hour >= 12 && hour < 18)
        return "AFTERNOON";
    if (hour >= 18 && hour < 22)
        return "EVENING";
    return "NIGHT";
}
//# sourceMappingURL=day-time-patterns.dto.js.map