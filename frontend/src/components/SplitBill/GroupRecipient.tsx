import axios from 'axios';
import validator from 'validator';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '@/stores/authStore';
import Layout from '../Layout';
import Header from '../transaction/Header';
import { ClipLoader } from 'react-spinners';
import { FiAlertCircle } from 'react-icons/fi';
import { TriangleAlert } from 'lucide-react';
import { useGroupTransactionStore } from '@/stores/groupTransactionStore';
import { API_URL } from '@/constants/API_URL';
import { Button } from '@/components/ui/Button';

const GroupRecipient = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { recipientEmail, setRecipientEmail, setRecipient, setNextPageIfValid,
    transactionType, setTransactionType, groupId, groupName, isValidRecipientGroupPage} = useGroupTransactionStore();
  const { userId } = useAuthStore();
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [goNextPage, setGoNextPage] = useState(false);
  const isVerified = useAuthStore((state) => state.isVerified);
  const isLocked = useAuthStore((state) => state.isLocked);

  // If this is false, then it means that transaction type is request
  useEffect(() => {
    if (location.pathname.includes('/topup')) {
      setGoNextPage(true);
      setTransactionType('TopUp');
    } else {
      setTransactionType('Withdraw');
    }
  },[location.pathname]);

  const handleNextPage = async () => {
    try {
    setLoading(true);
    if (transactionType === 'TopUp' && isValidRecipientGroupPage()) {
        navigate(`/groups/topup/${groupId}/amount`);
        setNextPageIfValid();
        setLoading(false);
        return;
    }
    const response = await axios.get(`${API_URL}/find/recipients/${recipientEmail}/${userId}`);
    setLoading(false);

    setRecipient(response.data);
    navigate(`/groups/withdraw/${groupId}/amount`);
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
    if (validator.isEmail(recipientEmail) || transactionType === "TopUp") {
      setGoNextPage(true);
    } else {
      setGoNextPage(false);
      setRecipient({ email: '', walletInfo: [] })
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
          <div className='w-2/3 lg:w-1/3 bg-card border border-border flex flex-col rounded-xl'>
            <Header />

            <div className='flex flex-col gap-10 rounded-lg px-10 py-6 mt-3'>
              {!loading ? (
                <>
                  <div className='flex flex-col gap-5 h-full'>
                    {errorMsg.length != 0 && <p className='text-destructive'>{errorMsg}</p>}

                    {/* Unverified Notification */}
                    {!isVerified && !isLocked && (
                      <div className="bg-warning/10 border-l-4 border-warning p-4">
                        <div className="flex md:flex-row flex-col items-center gap-2">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <FiAlertCircle className="h-5 w-5 text-warning" />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm text-warning">
                                Your account is not verified yet. Verify now to gain access to all features.
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => navigate('/profile')}
                            className="ml-3 bg-warning hover:opacity-90 text-warning-foreground px-4 py-1 rounded-md text-sm font-medium transition cursor-pointer"
                          >
                            Verify Now
                          </button>
                        </div>
                      </div>
                    )}
                    {/* Locked Notification */}
                    {isLocked && (
                      <div className="bg-destructive/10 border-l-4 border-destructive p-4">
                        <div className="flex flex-row items-center">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <TriangleAlert className="h-5 w-5 text-destructive" />
                            </div>

                            <div className="ml-4">
                              <p className="text-sm text-destructive">
                                Your account is locked. You won&apos;t be able to access this feature. Please contact support for assistance.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {transactionType == 'Withdraw' ? (
                      <h2 className='text-foreground text-xl font-semibold'>Who are you paying to?</h2>
                    ) : ( <div className="flex flex-col justify-center items-center text-center gap-6 h-full">
                      <h2 className='text-foreground text-xl font-semibold'>You Are Currently Making A Top Up To Group {groupName}</h2>
                      </div>
                    )}
                {transactionType == 'Withdraw' &&
                    (<input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      onKeyUp={() => validateEmail()}
                      onKeyDown={() => validateEmail()}
                      className='border-b-2 border-input p-2 w-full focus:outline-none'
                      placeholder='Email'
                    />)}
                  </div>

                  <Button
                    disabled={!goNextPage || !isVerified || isLocked}
                    onClick={() => handleNextPage()}
                    className="w-full py-3 font-bold rounded-xl"
                  >
                    Continue
                  </Button>

                 
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

export default GroupRecipient;