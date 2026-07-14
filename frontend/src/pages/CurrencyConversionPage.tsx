import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { ClipLoader } from "react-spinners";
import Currencies from '@/components/transaction/Currencies';
import Layout from '@/components/Layout';
import type { Currency } from '@/stores/transactionStore';
import { X } from 'lucide-react';
import { useConversionStore } from '@/stores/conversionStore';
import { API_URL } from '@/constants/API_URL';
import { Button } from '@/components/ui/Button';

const CurrencyConversionPage = () => {
  const navigate = useNavigate();
  const { srcCurrency, destCurrency, setSrcCurrency, setDestCurrency } = useConversionStore();
  const [ sourceCurrencyAmount, setSourceCurrencyAmount ] = useState(1);
  const [ destCurrencyAmount, setDestCurrencyAmount ] = useState(0);

  const [exchangeRate, setExchangeRate] = useState(0);
  const [hasExchanged, setHasExchanged] = useState(false);
  const [openCurrencyFrom, setOpenCurrencyFrom] = useState(false);
  const [openCurrencyTo, setOpenCurrencyTo] = useState(false);

  const handleSourceCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (/^\d*\.?\d{0,2}$/.test(value) || value === '') {
      const parsed = parseFloat(value);
      const convertedAmount = (parsed * exchangeRate).toFixed(2);

      setSourceCurrencyAmount(parsed)
      setDestCurrencyAmount(isNaN(parsed) ? 0 : parseFloat(convertedAmount))
    }
  };

  const selectCurrencyFrom = (currency: Currency) => {
    setSrcCurrency(currency);
    setOpenCurrencyFrom(false);
  }

  const selectCurrencyTo = (currency: Currency) => {
    setDestCurrency(currency);
    setOpenCurrencyTo(false);
  }

  const {
    data: exchangeRateData,
    isLoading: isRateLoading,
    error: exchangeRateError,
  } = useQuery({
    queryKey: ['exchangeRate', srcCurrency?.code, destCurrency?.code],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/${srcCurrency?.code ?? 'AUD'}/${destCurrency?.code ?? 'IDR'}`);
      return response.data.rate;
    },
    enabled: !!srcCurrency?.code && !!destCurrency?.code,
    staleTime: 1000 * 60,
  });

  useEffect(() => {
    if (!exchangeRateData) return;

    setExchangeRate(exchangeRateData);

    const convertedAmount = sourceCurrencyAmount * exchangeRateData;
    
    setDestCurrencyAmount(isNaN(convertedAmount) ? 0 : parseFloat(convertedAmount.toFixed(2)));
    setHasExchanged(true);
  }, [exchangeRateData]);

  return (
    <div className='flex flex-col w-full h-screen'>
      <Layout>
        <div className='flex flex-col flex-grow items-center justify-center w-full h-full'>
          <div className='relative w-1/2 lg:w-1/3 bg-card border border-border flex flex-col rounded-xl px-6 py-6 gap-2'>
            <h1 className='font-bold text-2xl font-sans py-2'>Convert Currency</h1>

            <X
              size={20}
              onClick={() => navigate('/dashboard')}
              className='absolute top-6 right-8 hover:fill-subtle cursor-pointer'
            />

            <div className="flex flex-col font-sans gap-5">
              <div className="text-sm text-right bg-muted rounded-full px-2 py-0.5 mt-2 max-w-max font-sans">
                <p className="font-mono tabular-nums">1 {srcCurrency?.code ?? 'AUD'} = {hasExchanged ? (
                  `${Number(exchangeRate).toLocaleString(destCurrency?.localeString, 
                    { minimumFractionDigits: 8,
                      maximumFractionDigits: 8
                    })} ${destCurrency?.code ?? 'IDR'}`) : (
                  <ClipLoader
                    color='black'
                    size={10}
                    aria-label="Loading Spinner"
                    data-testid="loader"
                  />
                )}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">From</label>
                <div className="flex items-center border-b border-input pb-2">
                  <Currencies currCurrency={srcCurrency} isOpen={openCurrencyFrom} setIsOpen={setOpenCurrencyFrom} handleSelectCurrency={selectCurrencyFrom} />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={sourceCurrencyAmount}
                    onChange={handleSourceCurrencyChange}
                    placeholder="0.00"
                    className="w-full text-3xl font-bold text-foreground bg-transparent outline-none font-mono tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">To</label>
                <div className="flex items-center border-b border-input pb-2">
                  <Currencies currCurrency={destCurrency} isOpen={openCurrencyTo} setIsOpen={setOpenCurrencyTo} handleSelectCurrency={selectCurrencyTo} />
                  <div className="text-3xl font-bold text-foreground">
                    {isRateLoading && (
                      <ClipLoader color='black' size={10} aria-label="Loading Spinner" />
                    )}
                    {!isRateLoading && exchangeRateData && sourceCurrencyAmount >= 0 && (
                      <p className="font-mono tabular-nums">{destCurrencyAmount.toLocaleString(destCurrency?.localeString)}</p>
                    )}
                    {exchangeRateError && (
                      <p className='text-destructive text-sm'>Failed to fetch exchange rate.</p>
                    )}
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="w-full"
              >
                Back
              </Button>

            </div>
          </div>
        </div>
      </Layout>
    </div>
  );
};

export default CurrencyConversionPage;
