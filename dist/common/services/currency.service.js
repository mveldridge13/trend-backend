"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrencyService = void 0;
const common_1 = require("@nestjs/common");
let CurrencyService = class CurrencyService {
    constructor() {
        this.currencyMap = new Map([
            ['AU', { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', decimalPlaces: 2 }],
            ['PH', { code: 'PHP', symbol: '₱', name: 'Philippine Peso', decimalPlaces: 2 }],
            ['US', { code: 'USD', symbol: '$', name: 'US Dollar', decimalPlaces: 2 }],
            ['GB', { code: 'GBP', symbol: '£', name: 'British Pound', decimalPlaces: 2 }],
            ['CA', { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', decimalPlaces: 2 }],
            ['JP', { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimalPlaces: 0 }],
            ['CN', { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', decimalPlaces: 2 }],
            ['IN', { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimalPlaces: 2 }],
            ['SG', { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', decimalPlaces: 2 }],
            ['NZ', { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', decimalPlaces: 2 }],
            ['TH', { code: 'THB', symbol: '฿', name: 'Thai Baht', decimalPlaces: 2 }],
            ['MY', { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', decimalPlaces: 2 }],
            ['ID', { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', decimalPlaces: 0 }],
            ['VN', { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', decimalPlaces: 0 }],
            ['KR', { code: 'KRW', symbol: '₩', name: 'South Korean Won', decimalPlaces: 0 }],
            ['HK', { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', decimalPlaces: 2 }],
            ['TW', { code: 'TWD', symbol: 'NT$', name: 'Taiwan Dollar', decimalPlaces: 2 }],
            ['BR', { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', decimalPlaces: 2 }],
            ['MX', { code: 'MXN', symbol: '$', name: 'Mexican Peso', decimalPlaces: 2 }],
            ['AR', { code: 'ARS', symbol: '$', name: 'Argentine Peso', decimalPlaces: 2 }],
            ['CL', { code: 'CLP', symbol: '$', name: 'Chilean Peso', decimalPlaces: 0 }],
            ['CO', { code: 'COP', symbol: '$', name: 'Colombian Peso', decimalPlaces: 2 }],
            ['PE', { code: 'PEN', symbol: 'S/', name: 'Peruvian Sol', decimalPlaces: 2 }],
            ['ZA', { code: 'ZAR', symbol: 'R', name: 'South African Rand', decimalPlaces: 2 }],
            ['EG', { code: 'EGP', symbol: '£', name: 'Egyptian Pound', decimalPlaces: 2 }],
            ['NG', { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', decimalPlaces: 2 }],
            ['KE', { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', decimalPlaces: 2 }],
            ['GH', { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi', decimalPlaces: 2 }],
            ['AE', { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', decimalPlaces: 2 }],
            ['SA', { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal', decimalPlaces: 2 }],
            ['TR', { code: 'TRY', symbol: '₺', name: 'Turkish Lira', decimalPlaces: 2 }],
            ['RU', { code: 'RUB', symbol: '₽', name: 'Russian Ruble', decimalPlaces: 2 }],
            ['PL', { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', decimalPlaces: 2 }],
            ['CZ', { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna', decimalPlaces: 2 }],
            ['HU', { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint', decimalPlaces: 0 }],
            ['RO', { code: 'RON', symbol: 'lei', name: 'Romanian Leu', decimalPlaces: 2 }],
            ['BG', { code: 'BGN', symbol: 'лв', name: 'Bulgarian Lev', decimalPlaces: 2 }],
            ['HR', { code: 'HRK', symbol: 'kn', name: 'Croatian Kuna', decimalPlaces: 2 }],
            ['RS', { code: 'RSD', symbol: 'дин', name: 'Serbian Dinar', decimalPlaces: 2 }],
            ['BA', { code: 'BAM', symbol: 'KM', name: 'Bosnia-Herzegovina Mark', decimalPlaces: 2 }],
            ['MK', { code: 'MKD', symbol: 'ден', name: 'Macedonian Denar', decimalPlaces: 2 }],
            ['AL', { code: 'ALL', symbol: 'L', name: 'Albanian Lek', decimalPlaces: 2 }],
            ['IS', { code: 'ISK', symbol: 'kr', name: 'Icelandic Krona', decimalPlaces: 0 }],
            ['NO', { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', decimalPlaces: 2 }],
            ['SE', { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', decimalPlaces: 2 }],
            ['DK', { code: 'DKK', symbol: 'kr', name: 'Danish Krone', decimalPlaces: 2 }],
            ['FI', { code: 'EUR', symbol: '€', name: 'Euro', decimalPlaces: 2 }],
            ['DE', { code: 'EUR', symbol: '€', name: 'Euro', decimalPlaces: 2 }],
            ['FR', { code: 'EUR', symbol: '€', name: 'Euro', decimalPlaces: 2 }],
            ['ES', { code: 'EUR', symbol: '€', name: 'Euro', decimalPlaces: 2 }],
            ['IT', { code: 'EUR', symbol: '€', name: 'Euro', decimalPlaces: 2 }],
            ['PT', { code: 'EUR', symbol: '€', name: 'Euro', decimalPlaces: 2 }],
            ['NL', { code: 'EUR', symbol: '€', name: 'Euro', decimalPlaces: 2 }],
            ['BE', { code: 'EUR', symbol: '€', name: 'Euro', decimalPlaces: 2 }],
            ['AT', { code: 'EUR', symbol: '€', name: 'Euro', decimalPlaces: 2 }],
            ['IE', { code: 'EUR', symbol: '€', name: 'Euro', decimalPlaces: 2 }],
            ['GR', { code: 'EUR', symbol: '€', name: 'Euro', decimalPlaces: 2 }],
            ['CY', { code: 'EUR', symbol: '€', name: 'Euro', decimalPlaces: 2 }],
            ['MT', { code: 'EUR', symbol: '€', name: 'Euro', decimalPlaces: 2 }],
            ['LU', { code: 'EUR', symbol: '€', name: 'Euro', decimalPlaces: 2 }],
            ['CH', { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc', decimalPlaces: 2 }],
            ['IL', { code: 'ILS', symbol: '₪', name: 'Israeli Shekel', decimalPlaces: 2 }],
        ]);
        this.timezoneToCountryMap = new Map([
            ['Australia/Sydney', 'AU'],
            ['Australia/Melbourne', 'AU'],
            ['Australia/Brisbane', 'AU'],
            ['Australia/Perth', 'AU'],
            ['Australia/Adelaide', 'AU'],
            ['Asia/Manila', 'PH'],
            ['America/New_York', 'US'],
            ['America/Los_Angeles', 'US'],
            ['America/Chicago', 'US'],
            ['America/Denver', 'US'],
            ['America/Phoenix', 'US'],
            ['America/Anchorage', 'US'],
            ['Pacific/Honolulu', 'US'],
            ['Europe/London', 'GB'],
            ['America/Toronto', 'CA'],
            ['America/Vancouver', 'CA'],
            ['America/Montreal', 'CA'],
            ['America/Calgary', 'CA'],
            ['Asia/Tokyo', 'JP'],
            ['Asia/Shanghai', 'CN'],
            ['Asia/Kolkata', 'IN'],
            ['Asia/Singapore', 'SG'],
            ['Pacific/Auckland', 'NZ'],
            ['Asia/Bangkok', 'TH'],
            ['Asia/Kuala_Lumpur', 'MY'],
            ['Asia/Jakarta', 'ID'],
            ['Asia/Ho_Chi_Minh', 'VN'],
            ['Asia/Seoul', 'KR'],
            ['Asia/Hong_Kong', 'HK'],
            ['Asia/Taipei', 'TW'],
            ['America/Sao_Paulo', 'BR'],
            ['America/Mexico_City', 'MX'],
            ['America/Buenos_Aires', 'AR'],
            ['America/Santiago', 'CL'],
            ['America/Bogota', 'CO'],
            ['America/Lima', 'PE'],
            ['Africa/Johannesburg', 'ZA'],
            ['Africa/Cairo', 'EG'],
            ['Africa/Lagos', 'NG'],
            ['Africa/Nairobi', 'KE'],
            ['Africa/Accra', 'GH'],
            ['Asia/Dubai', 'AE'],
            ['Asia/Riyadh', 'SA'],
            ['Europe/Istanbul', 'TR'],
            ['Europe/Moscow', 'RU'],
            ['Europe/Warsaw', 'PL'],
            ['Europe/Prague', 'CZ'],
            ['Europe/Budapest', 'HU'],
            ['Europe/Bucharest', 'RO'],
            ['Europe/Sofia', 'BG'],
            ['Europe/Zagreb', 'HR'],
            ['Europe/Belgrade', 'RS'],
            ['Europe/Sarajevo', 'BA'],
            ['Europe/Skopje', 'MK'],
            ['Europe/Tirane', 'AL'],
            ['Atlantic/Reykjavik', 'IS'],
            ['Europe/Oslo', 'NO'],
            ['Europe/Stockholm', 'SE'],
            ['Europe/Copenhagen', 'DK'],
            ['Europe/Helsinki', 'FI'],
            ['Europe/Berlin', 'DE'],
            ['Europe/Paris', 'FR'],
            ['Europe/Madrid', 'ES'],
            ['Europe/Rome', 'IT'],
            ['Europe/Lisbon', 'PT'],
            ['Europe/Amsterdam', 'NL'],
            ['Europe/Brussels', 'BE'],
            ['Europe/Vienna', 'AT'],
            ['Europe/Dublin', 'IE'],
            ['Europe/Athens', 'GR'],
            ['Asia/Nicosia', 'CY'],
            ['Europe/Malta', 'MT'],
            ['Europe/Luxembourg', 'LU'],
            ['Europe/Zurich', 'CH'],
            ['Asia/Jerusalem', 'IL'],
        ]);
    }
    getCurrencyFromTimezone(timezone) {
        const countryCode = this.timezoneToCountryMap.get(timezone);
        if (!countryCode) {
            return this.getDefaultCurrency();
        }
        const currency = this.currencyMap.get(countryCode);
        return currency || this.getDefaultCurrency();
    }
    getCurrencyFromCountryCode(countryCode) {
        const currency = this.currencyMap.get(countryCode.toUpperCase());
        return currency || this.getDefaultCurrency();
    }
    getCurrencyInfo(currencyCode) {
        for (const currency of this.currencyMap.values()) {
            if (currency.code === currencyCode.toUpperCase()) {
                return currency;
            }
        }
        return null;
    }
    isValidCurrency(currencyCode) {
        return this.getCurrencyInfo(currencyCode) !== null;
    }
    getAllSupportedCurrencies() {
        const uniqueCurrencies = new Map();
        for (const currency of this.currencyMap.values()) {
            if (!uniqueCurrencies.has(currency.code)) {
                uniqueCurrencies.set(currency.code, currency);
            }
        }
        return Array.from(uniqueCurrencies.values()).sort((a, b) => a.code.localeCompare(b.code));
    }
    formatCurrency(amount, currencyInfo) {
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyInfo.code,
            minimumFractionDigits: currencyInfo.decimalPlaces,
            maximumFractionDigits: currencyInfo.decimalPlaces,
        });
        return formatter.format(amount);
    }
    getDefaultCurrency() {
        return { code: 'USD', symbol: '$', name: 'US Dollar', decimalPlaces: 2 };
    }
    detectCurrencyFromUser(userTimezone, countryCode) {
        if (countryCode) {
            return this.getCurrencyFromCountryCode(countryCode);
        }
        if (userTimezone) {
            return this.getCurrencyFromTimezone(userTimezone);
        }
        return this.getDefaultCurrency();
    }
};
exports.CurrencyService = CurrencyService;
exports.CurrencyService = CurrencyService = __decorate([
    (0, common_1.Injectable)()
], CurrencyService);
//# sourceMappingURL=currency.service.js.map