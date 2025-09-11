import axios from 'axios';
import Layout from '@/components/Layout';
import Header from '@/components/transaction/Header';
import { useTransactionStore } from '@/stores/transactionStore';
import useAuthStore from '@/stores/authStore';
import { useState } from 'react';
import SuccessfulRequestModal from '../modal/SuccessfulRequestModal';
import FailedRequestModal from '../modal/FailedRequestModal';

const Request = () => {
  const {
    recipient,
    requestAmount,
    requestCurrency,
    resetRequest,
    transactionNote
  } = useTransactionStore();

  const { userId } = useAuthStore();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFailedModal, setShowFailedModal] = useState(false);

  const currDate: Date = new Date();

  const amountShown = requestAmount.toLocaleString(requestCurrency?.localeString, {
    style: 'currency',
    currency: requestCurrency?.code
  });

  const handleRequest = async () => {
    const requestData = {
      email: recipient.email,
      senderId: userId,
      amount: requestAmount,
      currency: requestCurrency?.code,
      notes: transactionNote
    }

    try {
      await axios.post('http://localhost:3000/transaction/send-request', requestData);

      setShowSuccessModal(true);
    } catch (err: unknown) {
      setShowFailedModal(true);

      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.errorMsg || 'An unexpected error occured during handling request';
        console.error(msg || 'An unexpected error occurred');
      } else {
        console.error('An unexpected error occurred');
      }
    }
  }

  return (
    <div className='flex flex-col w-full h-screen'>
      <Layout>
        <div className='flex flex-col flex-grow items-center justify-center w-full h-full'>
          <div className='w-11/12 md:w-1/2 lg:w-1/3 bg-white flex flex-col rounded-xl shadow-md'>
            <Header />

            <div className='flex flex-col p-6 gap-6'>
              <h2 data-testid='request-details' className='text-black font-bold text-2xl'>Request Details</h2>

              <div className='flex flex-col gap-4'>
                <div data-testid='requested-amount' className='flex justify-between w-full'>
                  <p>You requested</p>
                  <p>{amountShown}</p>
                </div>

                <div data-testid='target-recipient' className='flex justify-between w-full'>
                  <p>To</p>
                  <p>{recipient.email}</p>
                </div>

                {transactionNote && (
                  <div data-testid='recipient-note' className='flex flex-col gap-1'>
                    <p className='text-sm text-gray-500'>Note:</p>
                    <p className='p-2 bg-gray-100 rounded-lg'>{transactionNote}</p>
                  </div>
                )}

                <hr className='border-2' />

                <div data-testid='date-of-request' className='flex justify-between w-full'>
                  <p>Requested on</p>
                  <p>{currDate.toLocaleDateString('en-AU')}</p>
                </div>
              </div>

              <button
                onClick={handleRequest}
                data-testid='request-confirmation'
                className='w-full py-3 text-white font-bold rounded-xl transition cursor-pointer bg-[#C6412A] hover:bg-[#A8321E]'
              >
                Request
              </button>

              {showSuccessModal && (
                <SuccessfulRequestModal
                  amount={amountShown}
                  email={recipient.email}
                  onClose={() => {
                    setShowSuccessModal(false);
                    resetRequest();
                  }}
                />
              )}

              {showFailedModal && (
                <FailedRequestModal
                  onClose={() => {
                    setShowFailedModal(false);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </Layout>
    </div>
  );
};

export default Request;