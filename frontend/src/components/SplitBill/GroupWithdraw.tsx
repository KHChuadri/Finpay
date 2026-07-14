import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ClipLoader } from "react-spinners";
import Header from "@/components/transaction/Header";
import Currencies from "@/components/transaction/Currencies";
import Layout from "@/components/Layout";
import type { Currency } from "@/stores/transactionStore";
import { useGroupTransactionStore } from "@/stores/groupTransactionStore";
import { API_URL } from "@/constants/API_URL";
import { Button } from "@/components/ui/Button";

const GroupWithdraw = () => {
  const navigate = useNavigate();
  const {
    serviceFee,
    currencyFrom,
    sourceCurrencyAmount,
    currencyTo,
    destCurrencyAmount,
    rawDestCurrencyAmount,
    isValidRecipientGroupPage,
    isValidAmountGroupPage,
    setRawSourceCurrencyAmount,
    setServiceFee,
    setSourceCurrencyAmount,
    setCurrencyTo,
    setRawDestCurrencyAmount,
    setDestCurrencyAmount,
    setNextPageIfValid,
  } = useGroupTransactionStore();
  const { groupId } = useParams();
  const [exchangeRate, setExchangeRate] = useState(0);
  const [hasExchanged, setHasExchanged] = useState(false);
  const [openCurrencyTo, setOpenCurrencyTo] = useState(false);

  const handleDestCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      
      if (/^\d*\.?\d{0,2}$/.test(value) || value === '') {
        setServiceFee(0.05);
  
        setRawDestCurrencyAmount(parseFloat(value));
        setDestCurrencyAmount(parseFloat(value));
  
        const rawParsed = parseFloat(value);
        const parsed = parseFloat(value) * (1 + serviceFee);
  
        const rawConvertedAmount = (rawParsed / exchangeRate).toFixed(2);
        const convertedAmount = (parsed / exchangeRate).toFixed(2);
  
        setRawSourceCurrencyAmount(isNaN(rawParsed) ? 0 : parseFloat(rawConvertedAmount));
        setSourceCurrencyAmount(isNaN(parsed) ? 0 : parseFloat(convertedAmount))
      }
    };

  useEffect(() => {
    if (!isValidRecipientGroupPage()) {
      navigate(`/groups/${groupId}/`);
    }
  }, [isValidRecipientGroupPage, navigate]);

  const handleNextPage = () => {
    if (isValidAmountGroupPage()) {
      setNextPageIfValid();
      navigate(`/groups/withdraw/${groupId}/pay`);
    }
  };

  const selectCurrencyTo = (currency: Currency) => {
    setCurrencyTo(currency);
    setOpenCurrencyTo(false);
  };

  const isValid = sourceCurrencyAmount > 0 && destCurrencyAmount > 0;

  const {
    data: exchangeRateData,
    isLoading: isRateLoading,
    error: exchangeRateError,
  } = useQuery({
    queryKey: ["exchangeRate", currencyFrom?.code, currencyTo?.code],
    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/exchangerate/${currencyFrom?.code ?? "AUD"}/${
          currencyTo?.code ?? "IDR"
        }`
      );
      return response.data.rate;
    },
    enabled: !!currencyFrom?.code && !!currencyTo?.code,
    staleTime: 1000 * 60,
  });

  useEffect(() => {
      if (!exchangeRateData ) return;
  
      setExchangeRate(exchangeRateData);
  
      const parsed = rawDestCurrencyAmount * (1 + serviceFee);
      const rawConvertedAmount = rawDestCurrencyAmount / exchangeRateData;
      const convertedAmount = parsed / exchangeRateData;
  
      setRawSourceCurrencyAmount(isNaN(rawConvertedAmount) ? 0 : parseFloat(rawConvertedAmount.toFixed(2)));
      setSourceCurrencyAmount(isNaN(convertedAmount) ? 0 : parseFloat(convertedAmount.toFixed(2)));
      setHasExchanged(true);
    }, [rawDestCurrencyAmount, exchangeRateData]);
  
  return (
    <div className="flex flex-col w-full h-screen">
      <Layout>
        <div className="flex flex-col flex-grow items-center justify-center w-full h-full">
          <div className="w-1/2 lg:w-1/3 bg-card border border-border flex flex-col rounded-xl">
            <Header />

            <div className="flex flex-col px-6 py-4 font-sans gap-6">
              {/* You Send */}
              <div className="text-sm text-right bg-muted rounded-full px-2 py-0.5 mt-2 max-w-max font-sans">
                <p>
                  1 {currencyFrom?.code ?? "AUD"} ={" "}
                  {hasExchanged ? (
                    `${exchangeRate.toLocaleString(
                      currencyTo?.localeString
                    )} ${currencyTo?.code ?? "IDR"}`
                  ) : (
                    <ClipLoader
                      color="black"
                      size={10}
                      aria-label="Loading Spinner"
                      data-testid="loader"
                    />
                  )}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Recepient Get Exactly
                </label>
                <div className="flex items-center border-b border-input pb-2">
                  <Currencies
                    currCurrency={currencyTo}
                    isOpen={openCurrencyTo}
                    setIsOpen={setOpenCurrencyTo}
                    handleSelectCurrency={selectCurrencyTo}
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={rawDestCurrencyAmount}
                    onChange={handleDestCurrencyChange}
                    placeholder="0.00"
                    className="w-full text-3xl font-bold text-foreground bg-transparent outline-none"
                  />
                </div>
              </div>

              {/* Recipient Gets */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  You Pay
                </label>
                <div className="flex items-center border-b border-input pb-2 gap-2">
                  {currencyFrom.code}
                  <div className="text-3xl font-bold text-foreground">
                    {isRateLoading && (
                      <ClipLoader
                        color="black"
                        size={10}
                        aria-label="Loading Spinner"
                      />
                    )}
                    {!isRateLoading &&
                      exchangeRateData &&
                      sourceCurrencyAmount >= 0 && (
                        <p>
                          {sourceCurrencyAmount.toLocaleString(
                            currencyFrom?.localeString
                          )}
                        </p>
                      )}
                    {exchangeRateError && (
                      <p className="text-destructive text-sm">
                        Failed to fetch exchange rate.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Button
                disabled={!isValid}
                onClick={handleNextPage}
                className="w-full py-3 font-bold rounded-xl"
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    </div>
  );
};

export default GroupWithdraw;
