import axios from 'axios';
import validator from 'validator';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTransactionStore } from '@/stores/transactionStore';
import useAuthStore from '@/stores/authStore';
import Layout from '../Layout';
import Header from './Header';
import { ClipLoader } from 'react-spinners';
import Notice from '../Notice';
import { API_URL } from '@/constants/API_URL';

const Recipient = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { recipientEmail, setRecipientEmail, setRecipient, setNextPageIfValid,
    transactionType, setTransactionType } = useTransactionStore();
  const { userId } = useAuthStore();
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [goNextPage, setGoNextPage] = useState(false);
  const isVerified = useAuthStore((state) => state.isVerified);
  const isLocked = useAuthStore((state) => state.isLocked);

  // If this is false, then it means that transaction type is request
  useEffect(() => {
    if (location.pathname.startsWith('/transfer')) {
      setTransactionType('transfer');
    } else {
      setTransactionType('request');
    }
  }, [recipientEmail]);

  const handleTransferToSelf = async () => {
    await handleNextPage('SELF');
  }

  const handleNextPage = async (emailOverride?: string) => {
    const emailToUse = emailOverride ?? recipientEmail;

    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/find/recipients/${emailToUse}/${userId}`);
      setLoading(false);

      // If transaction is a transfer transaction
      if (transactionType == 'transfer') {
        navigate('/transfer/amount');
      } else {
        navigate('/request/amount');
      }

      setRecipient(response.data);
      setRecipientEmail(response.data.email);
      setNextPageIfValid();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.errorMsg || 'An unexpected error occured during handling next page';
        setErrorMsg(msg || 'An unexpected error occurred');
      } else {
        setErrorMsg('An unexpected error occurred');
      }
    }
    setLoading(false);
  };

  const validateEmail = () => {
    if (validator.isEmail(recipientEmail)) {
      setGoNextPage(true);
    } else {
      setGoNextPage(false);
      setRecipient({ email: '', walletInfo: [] });
    }
  }

  // If recipient email changes, reset recipientEmail
  useEffect(() => {
    validateEmail();
  }, [recipientEmail]);

  return (
    <div className='flex flex-col w-full h-screen'>
      <Layout>
        <div className='flex flex-col flex-grow items-center justify-center w-full h-full'>
          <div className='w-2/3 lg:w-1/3 bg-white flex flex-col rounded-xl'>
            <Header />

            <div className='flex flex-col gap-10 rounded-lg px-10 py-6 mt-3'>
              {!loading ? (
                <>
                  <div className='flex flex-col gap-5 h-full'>
                    {errorMsg.length != 0 && <p className='text-red-500'>{errorMsg}</p>}

                    <Notice />

                    {transactionType == 'transfer' ? (
                      <h2 className='text-black text-xl font-semibold'>Who are you sending money to?</h2>
                    ) : (
                      <h2 className='text-black text-xl font-semibold'>Who are you requesting money from?</h2>
                    )}

                    <input
                      type="email"
                      data-testid="email-request-input"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      onKeyUp={() => validateEmail()}
                      onKeyDown={() => validateEmail()}
                      className='border-b-2 border-gray-700 p-2 w-full focus:outline-none'
                      placeholder='Email'
                    />
                  </div>

                  <button
                    disabled={!goNextPage || !isVerified || isLocked}
                    data-testid='first-continue-btn'
                    onClick={() => handleNextPage()}
                    className={`w-full py-3 text-white font-bold rounded-xl transition ${goNextPage && isVerified && !isLocked
                      ? 'bg-[#C6412A] hover:bg-[#A8321E] cursor-pointer'
                      : 'bg-gray-400 cursor-not-allowed'
                      }`}
                  >
                    Continue
                  </button>

                  <div className='flex flex-col gap-2'>
                    {transactionType === 'transfer' && (
                      <button
                        disabled={!isVerified || isLocked}
                        className={`text-lg font-semibold duration-200 relative w-fit
                          ${(isVerified && !isLocked) ?
                            'text-blue-600 hover:text-blue-800 hover:cursor-pointer' :
                            `text-gray-400 cursor-not-allowed`
                          }`}
                        onClick={() => handleTransferToSelf()}
                      >
                        Send to yourself
                        <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300'></span>
                      </button>
                    )}

                    <button
                      disabled={!isVerified || isLocked}
                      className={`text-lg font-semibold duration-200 relative w-fit
                        ${(isVerified && !isLocked) ?
                          'text-blue-600 hover:text-blue-800 hover:cursor-pointer' :
                          `text-gray-400 cursor-not-allowed`
                        }`}
                      onClick={() => navigate('search')}
                    >
                      Search saved recipients
                      <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300'></span>
                    </button>
                  </div>
                </>
              ) : (
                <div className='flex flex-col items-center justify-center h-full w-full'>
                  <ClipLoader
                    size={50}
                    color="black"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </div>
  )
}

export default Recipient;