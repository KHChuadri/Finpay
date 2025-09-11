import axios from 'axios';
import { useGroupTransactionStore } from '@/stores/groupTransactionStore';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { ClipLoader } from "react-spinners";
import Header from '@/components/transaction/Header';
import Currencies from '@/components/transaction/Currencies';
import Layout from '@/components/Layout';
import type { Currency } from '@/stores/transactionStore';
import useAuthStore from '@/stores/authStore';
import { API_URL } from '@/constants/API_URL';

const GroupTopUp = () => {
  const navigate = useNavigate();
  const { currencyFrom, rawSourceCurrencyAmount, sourceCurrencyAmount, currencyTo, destCurrencyAmount, rawDestCurrencyAmount,
    isValidRecipientGroupPage, isValidAmountGroupPage, setCurrencyFrom, setRawSourceCurrencyAmount,
    setServiceFee, setSourceCurrencyAmount,
    setRawDestCurrencyAmount, setDestCurrencyAmount, setNextPageIfValid } = useGroupTransactionStore();
  const { userId } = useAuthStore();
  const { groupId } = useParams();
  const [errorMsg, setErrorMsg] = useState('');
  const [exchangeRate, setExchangeRate] = useState(0);
  const [hasExchanged, setHasExchanged] = useState(false);
  const [openCurrencyFrom, setOpenCurrencyFrom] = useState(false);
  const [userRank, setUserRank] = useState<string | null>(null);

  const handleSourceCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (/^\d*\.?\d{0,2}$/.test(value) || value === '') {
      setServiceFee(0);

      setRawSourceCurrencyAmount(parseFloat(value));
      setSourceCurrencyAmount(parseFloat(value));

      const rawParsed = parseFloat(value);
      const parsed = parseFloat(value);

      const rawConvertedAmount = (rawParsed * exchangeRate).toFixed(2);
      const convertedAmount = (parsed * exchangeRate).toFixed(2);
      setRawDestCurrencyAmount(isNaN(rawParsed) ? 0 : parseFloat(rawConvertedAmount));
      setDestCurrencyAmount(isNaN(parsed) ? 0 : parseFloat(convertedAmount))
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
      navigate(`/groups/topup/${groupId}/pay`);
    }
  }

  const selectCurrencyFrom = (currency: Currency) => {
    setCurrencyFrom(currency);
    setOpenCurrencyFrom(false);
  }

  const isValid = sourceCurrencyAmount > 0 && destCurrencyAmount > 0;
  useEffect(() => {
    const getUserRank = async () => {
      try {
        const response = await axios.get(`${API_URL}/${userId}/rank`);
        setUserRank(response.data.rank);
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          const msg = err.response?.data?.errorMsg || 'An unexpected error occured trying to get exchange rate';
          setErrorMsg(msg || 'An unexpected error occurred');
        } else {
          setErrorMsg('An unexpected error occurred');
        }
      }
    }
    getUserRank();
  }, [currencyFrom, currencyTo, exchangeRate]);

  const {
    data: exchangeRateData,
    isLoading: isRateLoading,
    error: exchangeRateError,
  } = useQuery({
    queryKey: ['exchangeRate', currencyFrom?.code, currencyTo?.code],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/exchangerate/${currencyFrom?.code ?? 'AUD'}/${currencyTo?.code ?? 'IDR'}`);
      return response.data.rate;
    },
    enabled: !!currencyFrom?.code && !!currencyTo?.code,
    staleTime: 1000 * 60,
  });

  useEffect(() => {
    if (!exchangeRateData || !userRank) return;

    setExchangeRate(exchangeRateData);

    const parsed = rawSourceCurrencyAmount;
    const rawConvertedAmount = rawSourceCurrencyAmount * exchangeRateData;
    const convertedAmount = parsed * exchangeRateData;

    setRawDestCurrencyAmount(isNaN(rawConvertedAmount) ? 0 : parseFloat(rawConvertedAmount.toFixed(2)));
    setDestCurrencyAmount(isNaN(convertedAmount) ? 0 : parseFloat(convertedAmount.toFixed(2)));
    setHasExchanged(true);
  }, [rawSourceCurrencyAmount, exchangeRateData, userRank]);

  return (
    <div className='flex flex-col w-full h-screen'>
      <Layout>
        <div className='flex flex-col flex-grow items-center justify-center w-full h-full'>
          <div className='w-1/2 lg:w-1/3 bg-white flex flex-col rounded-xl'>
            <Header />

            {errorMsg.length != 0 && <p className='text-red-500 text-md'>{errorMsg}</p>}

            <div className="flex flex-col px-6 py-4 font-sans gap-6">
              {/* You Send */}
              <div className="text-sm text-right bg-gray-100 rounded-full px-2 py-0.5 mt-2 max-w-max font-sans">
              <p>1 {currencyFrom?.code ?? 'AUD'} = {hasExchanged ? (
                `${exchangeRate.toLocaleString(currencyTo?.localeString)} ${currencyTo?.code ?? 'IDR'}`) : (
            <ClipLoader
              color='black'
              size={10}
              aria-label="Loading Spinner"
              data-testid="loader"
            />
      )
      }</p>
    </div>
              <div>
                <label className="text-sm font-medium mb-2 block">You send exactly</label>
                <div className="flex items-center border-b border-gray-300 pb-2">
                  <Currencies currCurrency={currencyFrom} isOpen={openCurrencyFrom} setIsOpen={setOpenCurrencyFrom} handleSelectCurrency={selectCurrencyFrom} />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={rawSourceCurrencyAmount}
                    onChange={handleSourceCurrencyChange}
                    placeholder="0.00"
                    className="w-full text-3xl font-bold text-gray-700 bg-transparent outline-none"
                  />
                </div>
              </div>

              {/* Recipient Gets */}
              <div>
                <label className="text-sm font-medium mb-2 block">Recipient gets</label>
                <div className="flex items-center border-b border-gray-300 pb-2 gap-2">
                  {currencyTo.code}
                  <div className="text-3xl font-bold text-gray-700">
                    {isRateLoading && (
                      <ClipLoader color='black' size={10} aria-label="Loading Spinner" />
                    )}
                    {!isRateLoading && exchangeRateData && sourceCurrencyAmount >= 0 && (
                      <p>{rawDestCurrencyAmount.toLocaleString(currencyTo?.localeString)}</p>
                    )}
                    {exchangeRateError && (
                      <p className='text-red-500 text-sm'>Failed to fetch exchange rate.</p>
                    )}
                  </div>
                </div>
              </div>

              <button
                disabled={!isValid}
                onClick={() => handleNextPage()}
                className={`w-full py-3 text-white font-bold rounded-xl transition cursor-pointer ${isValid ? 'bg-[#C6412A] hover:bg-[#A8321E]' : 'bg-gray-300 cursor-not-allowed'
                  }`}
              >
                Continue
              </button>

            </div>
          </div>
        </div>
      </Layout>
    </div>
  );
};

export default GroupTopUp;
