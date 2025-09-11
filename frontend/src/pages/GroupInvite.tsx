import axios from 'axios';
import validator from 'validator';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAuthStore from '@/stores/authStore';
import Layout from '../components/Layout';

const GroupInvite = () => {
  const navigate = useNavigate();
  const [recipientEmail, setRecipientEmail] = useState('');
  const userId = useAuthStore((state) => state.userId);
  const [errorMsg, setErrorMsg] = useState('');
  const [valid, setValid] = useState(false);
  const { groupId } = useParams();
  const validateEmail = () => {
    // Reset recipientEmail when user enters a new email, hence this handle recipient state when user change a recipient email
    if (validator.isEmail(recipientEmail)) {
      setValid(true);
    } else {
      setValid(false);
    }
  };

  const handleInvite = async (recipient: string) => {
    try {
      const response = await axios.put(`http://localhost:3000/groups/invite/${groupId}/${recipient}/${userId}`)
      return response.data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.errorMsg || 'Something went wrong while inviting';
        setErrorMsg(msg || 'Something went wrong while inviting');
      } else {
        setErrorMsg('An unexpected error occurred');
      }
    }
  }

  const inviteMember = async () => {
    try {
      setValid(false);
      const response = await axios.get(`http://localhost:3000/find/invitee/${recipientEmail}/${userId}/${groupId}`);
      handleInvite(response.data);
      navigate(`/groups/${groupId}`);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.errorMsg || "Something went wrong while searching for recipient"
        setErrorMsg(msg || 'Something went wrong while searching for recipient');
      } else {
        setErrorMsg('An unexpected error occurred');
      }
    }
  };

  return (
    <div className='flex flex-col w-full h-screen'>
      <Layout>
        <div className='flex flex-col flex-grow items-center justify-center w-full h-full'>
          <div className='w-1/2 lg:w-1/3 bg-white flex flex-col rounded-xl'>
            <div className='flex flex-col gap-12 rounded-lg p-10'>
              <div className='flex flex-col gap-5 h-1/2'>
                {errorMsg && <p className='text-red-500'>{errorMsg}</p>}
                <h2 className='text-black text-xl font-semibold'>
                  Who are you inviting to the group?
                </h2>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => {
                    setRecipientEmail(e.target.value);
                    validateEmail();
                  }}
                  className='border-b-2 border-gray-700 p-2 w-full focus:outline-none'
                  placeholder='Email'
                />
              </div>

              <button
                disabled={!valid}
                onClick={inviteMember}
                className={`w-full py-3 text-white font-bold rounded-xl transition ${valid ? 'bg-[#C6412A] hover:bg-[#A8321E] cursor-pointer' : 'bg-gray-400 cursor-not-allowed'
                  }`}
              >
                Invite
              </button>


              <button
                className='text-lg font-bold text-blue-500 hover:underline cursor-pointer text-left'
                onClick={() => navigate('search')}
              >
                Search saved recipients
              </button>
            </div>
          </div>
        </div>
      </Layout>
    </div>
  );
};

export default GroupInvite;