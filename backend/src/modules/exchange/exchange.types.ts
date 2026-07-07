export interface ExchangeRateResult {
  rate: number;
}

/** Currency code -> rate relative to USD, as returned by the FX provider. */
export interface CurrencyRates {
  [currency: string]: number;
}

export interface ExchangeServiceDeps {
  fetchCurrencyRates: () => Promise<CurrencyRates>;
}
