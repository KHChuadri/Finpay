import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Header from '@/components/transaction/Header';
import Currencies from '@/components/transaction/Currencies';
import { useNavigate } from 'react-router-dom';
import { useTransactionStore, type Currency } from '@/stores/transactionStore';

const RequestAmount = () => {
  const navigate = useNavigate();

  const { requestAmount, requestCurrency, isValidAmountPage,
    setRequestAmount, setRequestCurrency, setNextPageIfValid,
    transactionNote, setTransactionNote } = useTransactionStore();
  const [openCurrencyOptions, setOpenCurrencyOptions] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const selectCurrency = (currencyChosen: Currency) => {
    setRequestCurrency(currencyChosen)
    setOpenCurrencyOptions(false);
  }

  const handleNextPage = () => {
    if (isValidAmountPage()) {
      setNextPageIfValid();
      navigate('/request/details');
    }
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d{0,2}$/.test(value) || value === '') {
      setRequestAmount(parseFloat(value));
    }
  }

  // Checking for valid amount before continue request
  useEffect(() => {
    if (requestAmount > 0) {
      setIsValid(true);
    } else {
      setIsValid(false);
    }
  }, [requestAmount])

  return (
    <div className='flex flex-col w-full h-screen'>
      <Layout>
        <div className='flex flex-col flex-grow items-center justify-center w-full h-full'>
          <div className='w-1/2 lg:w-1/3 bg-card flex flex-col rounded-xl'>
            <Header />

            <div className='flex flex-col w-full p-6 gap-2'>
              <div>
                <p data-testid='you-request' className='text-sm font-medium'>You request</p>
                <div className='flex items-center border-b border-input pb-2'>
                  <Currencies currCurrency={requestCurrency} isOpen={openCurrencyOptions} setIsOpen={setOpenCurrencyOptions} handleSelectCurrency={selectCurrency} />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={requestAmount}
                    onChange={(e) => handleAmountChange(e)}
                    placeholder="0.00"
                    className="w-full text-3xl font-bold text-foreground bg-transparent outline-none"
                    data-testid="amount-req-input"
                  />
                </div>
              </div>

              <div className='flex flex-col gap-1.5'>
                <p className='text-sm font-medium'>Notes</p>
                <input
                  type="text"
                  data-testid="request-reason"
                  value={transactionNote}
                  onChange={(e) => setTransactionNote(e.target.value)}
                  placeholder='Enter request note here'
                  className='outline-none w-full text-medium border-b-1 pb-1 border-input'
                />
              </div>

              <button
                onClick={() => handleNextPage()}
                data-testid='amount-continue-button'
                className={`w-full py-2 font-bold rounded-xl transition cursor-pointer mt-3 ${isValid ? 'bg-primary text-primary-foreground hover:opacity-90' : 'bg-muted text-muted-foreground cursor-not-allowed'
                  }`}
              >
                Continue
              </button>
            </div>

          </div>
        </div>
      </Layout>
    </div>
  )
}

export default RequestAmount;