import { useNavigate } from 'react-router-dom';
import { UserIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Layout from '../Layout'
import useAuthStore from '@/stores/authStore';
import RecipientInfo from './RecipientInfo';
import { useTransactionStore } from '@/stores/transactionStore';

interface SavedUsers {
  email: string;
  firstName: string;
  lastName: string;
}

const SavedRecipient = () => {
  const [savedUsers, setSavedUsers] = useState<SavedUsers[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { userId } = useAuthStore();
  const { transactionType, setRecipientEmail } = useTransactionStore();

  const navigate = useNavigate();

  const handleOnClick = (userEmail: string) => {
    setRecipientEmail(userEmail);
    if (transactionType === 'request') {
      navigate('/request/recipient');
    } else {
      navigate('/transfer/recipient');
    }
  }

  useEffect(() => {
    const getSavedUsers = async () => {
      try {
        const response = await axios({
          method: 'GET',
          url: `http://localhost:3000/transaction/save-recipient/${userId}`
        });
        setSavedUsers(response.data.recipients);
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          const msg = err.response?.data?.errorMsg || 'Something went wrong while fetching request list';
          console.error(msg || 'Something went wrong while fetching request list');
        } else {
          console.error('Failed to load request list');
        }
      }
    };

    getSavedUsers();
  }, []);

  const headerButtons = (
    <div className="gap-4 md:flex items-center">
      <button
        onClick={() => navigate('/')}
        className="bg-[#C6412A] text-white px-6 py-2 rounded-lg hover:bg-[#A8321E] transition"
      >
        Back
      </button>
    </div>
  );

  const filteredUsers = savedUsers.filter((user) =>
    `${user.email}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col w-full min-h-screen">
      <Layout headerRight={headerButtons}>
        <div className="flex flex-grow justify-center items-start p-4">
          <div className="flex flex-col w-full min-h-screen max-w-2xl bg-white rounded-2xl p-6 gap-4 shadow-lg">
            <h2 className='text-2xl font-semibold text-gray-800'>Search saved recipients</h2>
            <div className="relative">

              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-gray-500" />
              </div>

              <input
                type="email"
                placeholder="Search users by email"
                className="w-full pl-10 px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-[#C6412A] focus:border-[#C6412A]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex flex-col w-full h-full gap-4 overflow-y-auto max-h-[70vh]">
              {filteredUsers.length === 0 ? (
                <p className='text-gray-600'>No saved user found.</p>
              ) : (
                filteredUsers.map((user, index) => {
                  return (
                    <RecipientInfo
                      key={index}
                      email={user.email}
                      firstName={user.firstName}
                      lastName={user.lastName}
                      onClick={() => handleOnClick(user.email)}
                    />
                  )
                })
              )}
            </div>
          </div>
        </div>
      </Layout>
    </div>
  )
}

export default SavedRecipient;