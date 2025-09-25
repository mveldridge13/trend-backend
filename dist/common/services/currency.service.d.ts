export interface CurrencyInfo {
    code: string;
    symbol: string;
    name: string;
    decimalPlaces: number;
}
export declare class CurrencyService {
    private readonly currencyMap;
    private readonly timezoneToCountryMap;
    getCurrencyFromTimezone(timezone: string): CurrencyInfo;
    getCurrencyFromCountryCode(countryCode: string): CurrencyInfo;
    getCurrencyInfo(currencyCode: string): CurrencyInfo | null;
    isValidCurrency(currencyCode: string): boolean;
    getAllSupportedCurrencies(): CurrencyInfo[];
    formatCurrency(amount: number, currencyInfo: CurrencyInfo): string;
    private getDefaultCurrency;
    detectCurrencyFromUser(userTimezone?: string, countryCode?: string): CurrencyInfo;
}
