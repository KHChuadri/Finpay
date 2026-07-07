import { exchangeService } from "./modules/exchange/exchange.container";

/**
 * <Get Exchange Rate For Source and Destination>
 *
 * @param {string} source
 * @param {string} destination
 * @returns {rate: number}
 */
export const exchangeRate = async (source: string, destination: string) => {
  return exchangeService.getRate(source, destination);
};
