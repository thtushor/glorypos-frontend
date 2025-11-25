// utils/money.ts

/** Options for formatting a number as currency */
export interface MoneyOptions {
  locale?: string; // e.g., 'th-TH'
  currency?: string; // e.g., 'THB'
  decimals?: number; // number of decimal places
}

/** Fixed set of country keys */
export type CurrencyPresetKey =
  | "thailand"
  | "usa"
  | "eurozone"
  | "uk"
  | "japan"
  | "canada"
  | "australia"
  | "india"
  | "china"
  | "singapore";

/** Predefined currency presets for multiple countries */
export const CurrencyPresets: Record<
  CurrencyPresetKey,
  Required<MoneyOptions>
> = {
  thailand: { locale: "th-TH", currency: "THB", decimals: 2 },
  usa: { locale: "en-US", currency: "USD", decimals: 2 },
  eurozone: { locale: "de-DE", currency: "EUR", decimals: 2 }, // Germany
  uk: { locale: "en-GB", currency: "GBP", decimals: 2 },
  japan: { locale: "ja-JP", currency: "JPY", decimals: 0 },
  canada: { locale: "en-CA", currency: "CAD", decimals: 2 },
  australia: { locale: "en-AU", currency: "AUD", decimals: 2 },
  india: { locale: "en-IN", currency: "INR", decimals: 2 },
  china: { locale: "zh-CN", currency: "CNY", decimals: 2 },
  singapore: { locale: "en-SG", currency: "SGD", decimals: 2 },
};

/** Singleton class for formatting money */
class MoneyFormatter {
  private defaults: Required<MoneyOptions>;

  constructor(
    defaults: Required<MoneyOptions> = {
      locale: "th-TH",
      currency: "THB",
      decimals: 2,
    }
  ) {
    this.defaults = defaults;
  }

  /**
   * Format a number as currency
   * @param value - The numeric value to format
   * @param options - Optional overrides for locale, currency, decimals
   * @returns Formatted currency string
   */
  format(value: number, options: MoneyOptions = {}): string {
    if (typeof value !== "number") {
      throw new TypeError("Value must be a number");
    }

    const { locale, currency, decimals } = { ...this.defaults, ...options };

    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }

  /**
   * Update global defaults at runtime
   * @param newDefaults - Partial settings to override existing defaults
   */
  configure(newDefaults: MoneyOptions = {}): void {
    this.defaults = { ...this.defaults, ...newDefaults };
  }

  /**
   * Shortcut: directly call money(value) like a function
   */
  call(value: number, options: MoneyOptions = {}): string {
    return this.format(value, options);
  }
}

// Singleton instance
const money = new MoneyFormatter();

// Optional: make it callable like money(12345)
const callableMoney = money.call.bind(money);

// Export both singleton and callable version
export { money, callableMoney as moneyFn };
export default money;
