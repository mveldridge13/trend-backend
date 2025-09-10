"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateService = void 0;
const common_1 = require("@nestjs/common");
const tz_1 = require("@date-fns/tz");
const date_fns_1 = require("date-fns");
let DateService = class DateService {
    toUtc(dateString, userTimezone) {
        if (!dateString) {
            throw new Error('Date string is required');
        }
        const parsedDate = (0, date_fns_1.parseISO)(dateString);
        if (!(0, date_fns_1.isValid)(parsedDate)) {
            throw new Error('Invalid date string provided');
        }
        const tzDate = new tz_1.TZDate(parsedDate, userTimezone);
        return new Date(tzDate.getTime());
    }
    toUserTimezone(utcDate, userTimezone) {
        if (!utcDate) {
            throw new Error('UTC date is required');
        }
        return new tz_1.TZDate(utcDate, userTimezone);
    }
    formatInUserTimezone(utcDate, userTimezone, formatString = "yyyy-MM-dd'T'HH:mm:ss.SSSxxx") {
        const zonedDate = this.toUserTimezone(utcDate, userTimezone);
        return (0, date_fns_1.format)(zonedDate, formatString);
    }
    getNowInUserTimezone(userTimezone) {
        return this.toUserTimezone(new Date(), userTimezone);
    }
    getTodayInUserTimezone(userTimezone) {
        const nowInUserTz = this.getNowInUserTimezone(userTimezone);
        const startOfTodayInUserTz = (0, date_fns_1.startOfDay)(nowInUserTz);
        const tzDate = new tz_1.TZDate(startOfTodayInUserTz, userTimezone);
        return new Date(tzDate.getTime());
    }
    getDayBoundariesInUserTimezone(dateString, userTimezone) {
        const userDate = (0, date_fns_1.parseISO)(dateString);
        if (!(0, date_fns_1.isValid)(userDate)) {
            throw new Error('Invalid date string provided');
        }
        const startOfDayInUserTz = (0, date_fns_1.startOfDay)(userDate);
        const endOfDayInUserTz = (0, date_fns_1.endOfDay)(userDate);
        return {
            start: new Date(new tz_1.TZDate(startOfDayInUserTz, userTimezone).getTime()),
            end: new Date(new tz_1.TZDate(endOfDayInUserTz, userTimezone).getTime())
        };
    }
    getWeekBoundariesInUserTimezone(dateString, userTimezone) {
        const userDate = (0, date_fns_1.parseISO)(dateString);
        if (!(0, date_fns_1.isValid)(userDate)) {
            throw new Error('Invalid date string provided');
        }
        const startOfWeekInUserTz = (0, date_fns_1.startOfWeek)(userDate);
        const endOfWeekInUserTz = (0, date_fns_1.endOfWeek)(userDate);
        return {
            start: new Date(new tz_1.TZDate(startOfWeekInUserTz, userTimezone).getTime()),
            end: new Date(new tz_1.TZDate(endOfWeekInUserTz, userTimezone).getTime())
        };
    }
    getMonthBoundariesInUserTimezone(dateString, userTimezone) {
        const userDate = (0, date_fns_1.parseISO)(dateString);
        if (!(0, date_fns_1.isValid)(userDate)) {
            throw new Error('Invalid date string provided');
        }
        const startOfMonthInUserTz = (0, date_fns_1.startOfMonth)(userDate);
        const endOfMonthInUserTz = (0, date_fns_1.endOfMonth)(userDate);
        return {
            start: new Date(new tz_1.TZDate(startOfMonthInUserTz, userTimezone).getTime()),
            end: new Date(new tz_1.TZDate(endOfMonthInUserTz, userTimezone).getTime())
        };
    }
    convertDateRangeToUtc(startDateString, endDateString, userTimezone) {
        const startDate = (0, date_fns_1.parseISO)(startDateString);
        const endDate = (0, date_fns_1.parseISO)(endDateString);
        if (!(0, date_fns_1.isValid)(startDate) || !(0, date_fns_1.isValid)(endDate)) {
            throw new Error('Invalid date range provided');
        }
        const startOfStartDay = (0, date_fns_1.startOfDay)(startDate);
        const endOfEndDay = (0, date_fns_1.endOfDay)(endDate);
        return {
            start: new Date(new tz_1.TZDate(startOfStartDay, userTimezone).getTime()),
            end: new Date(new tz_1.TZDate(endOfEndDay, userTimezone).getTime())
        };
    }
    validateTransactionDate(dateString, userTimezone) {
        const transactionDate = (0, date_fns_1.parseISO)(dateString);
        if (!(0, date_fns_1.isValid)(transactionDate)) {
            throw new Error('Invalid transaction date');
        }
        const todayInUserTz = this.getTodayInUserTimezone(userTimezone);
        const transactionDateUtc = this.toUtc(dateString, userTimezone);
        if (transactionDateUtc > todayInUserTz) {
            throw new Error('Transaction date cannot be in the future');
        }
        const fiveYearsAgo = (0, date_fns_1.subDays)(todayInUserTz, 365 * 5);
        if (transactionDateUtc < fiveYearsAgo) {
            throw new Error('Transaction date cannot be older than 5 years');
        }
    }
    isToday(utcDate, userTimezone) {
        const dateInUserTz = this.toUserTimezone(utcDate, userTimezone);
        const todayInUserTz = this.getNowInUserTimezone(userTimezone);
        return (0, date_fns_1.format)(dateInUserTz, 'yyyy-MM-dd') ===
            (0, date_fns_1.format)(todayInUserTz, 'yyyy-MM-dd');
    }
    getRelativeDateRange(days, userTimezone) {
        const nowInUserTz = this.getNowInUserTimezone(userTimezone);
        const startDateInUserTz = (0, date_fns_1.subDays)((0, date_fns_1.startOfDay)(nowInUserTz), days - 1);
        const endDateInUserTz = (0, date_fns_1.endOfDay)(nowInUserTz);
        return {
            start: new Date(new tz_1.TZDate(startDateInUserTz, userTimezone).getTime()),
            end: new Date(new tz_1.TZDate(endDateInUserTz, userTimezone).getTime())
        };
    }
    isValidTimezone(timezone) {
        try {
            new tz_1.TZDate(new Date(), timezone);
            return true;
        }
        catch {
            return false;
        }
    }
    getValidTimezone(userTimezone) {
        if (!userTimezone || !this.isValidTimezone(userTimezone)) {
            return 'UTC';
        }
        return userTimezone;
    }
};
exports.DateService = DateService;
exports.DateService = DateService = __decorate([
    (0, common_1.Injectable)()
], DateService);
//# sourceMappingURL=date.service.js.map