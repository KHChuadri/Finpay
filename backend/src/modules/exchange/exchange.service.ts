import HTTPError from "http-errors";
import type { ExchangeRateResult, ExchangeServiceDeps } from "./exchange.types";

export const createExchangeService = (deps: ExchangeServiceDeps) => {
  const { fetchCurrencyRates } = deps;

  /** Mirrors legacy exchangeRate: both currencies depend on USD. */
  const getRate = async (
    source: string,
    destination: string
  ): Promise<ExchangeRateResult> => {
    const rateInfo = await fetchCurrencyRates();

    if (rateInfo[source] == undefined) {
      throw HTTPError(
        404,
        `Currency exchange from ${source} is not yet supported`
      );
    }

    if (rateInfo[destination] == undefined) {
      throw HTTPError(
        404,
        `Currency exchange to ${destination} is not yet supported`
      );
    }

    const sourceCurrency = parseFloat(String(rateInfo[source]));
    const destCurrency = parseFloat(String(rateInfo[destination]));
    const rate = destCurrency / sourceCurrency;

    return { rate: rate };
  };

  return { getRate };
};
