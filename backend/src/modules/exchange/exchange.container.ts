// Composition root for the exchange slice: wires the real FX rate fetcher.
import { createExchangeService } from "./exchange.service";
import type { CurrencyRates } from "./exchange.types";

const fetchCurrencyRates = async (): Promise<CurrencyRates> => {
  const APP_ID = process.env.EXCHANGERATE_KEY;

  const currencyInformationObj = await fetch(
    `https://openexchangerates.org/api/latest.json?app_id=${APP_ID}&base=USD`
  );
  const info = await currencyInformationObj.json();

  // Both currencies depend on USD
  return info.rates;
};

export const exchangeService = createExchangeService({ fetchCurrencyRates });
