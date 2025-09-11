import HTTPError from "http-errors";
// Maybe need to check for edge cases such as SGD as source or destination

/**
 * <Get Exchange Rate For Source and Destination>
 * 
 * @param {string} source 
 * @param {string} destination 
 * @returns {rate: number} 
 */
export const exchangeRate = async (source: string, destination: string) => {
  const APP_ID = process.env.EXCHANGERATE_KEY;

  const currencyInformationObj = await fetch(
    `https://openexchangerates.org/api/latest.json?app_id=${APP_ID}&base=USD`
  );
  const info = await currencyInformationObj.json();

  // Both currency depend on USD
  const rateInfo = info.rates;

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

  const sourceCurrency = parseFloat(rateInfo[source]);
  const destCurrency = parseFloat(rateInfo[destination]);
  const rate = destCurrency / sourceCurrency;

  return { rate: rate };
};
