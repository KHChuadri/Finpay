import { useEffect, useState } from 'react';
import { PiHandWithdraw } from "react-icons/pi";
import Layout from '../components/Layout';
import { useNavigate } from 'react-router-dom';
import AdminMainPage from '@/components/admin/AdminMainPage';
import { LockClosedIcon, ShieldCheckIcon, UserIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { MdAddTask } from "react-icons/md";
import AdminChallengePage from '@/components/admin/AdminChallengePage';
import AdminWithdraw from '@/components/transaction/adminWithdraw';
import axios from 'axios';
import useAuthStore from '@/stores/authStore';
import { API_URL } from "../constants/API_URL"

const AdminPage = () => {
  const navigate = useNavigate();
  const userId = useAuthStore.getState().userId;
  const { resetAuth } = useAuthStore();
  const [userManagementDropdown, setUserManagementDropdown] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [challengeManagementDropdown, setChallengeManagementDropdown] = useState(true);
  const [requestManagementDropdown, setRequestManagementDropdown] = useState(true);
  const [activeUserTab, setActiveUserTab] = useState<'all' | 'verified' | 'unverified' | 'locked' | null>();
  const [activeChallengeTab, setActiveChallengeTab] = useState<'create' | null>();
  const [activeRequestTab, setActiveRequestTab] = useState<'withdraw' | null>();

  const getUserIsAdmin = async () => {
    try {
      const response = await axios.get(`${API_URL}/isAdmin/${userId}`);
      
      if (!(response.data.success && response.data.isAdmin)) {
        navigate('/');
      } 
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const msg =
          error.response?.data?.errorMsg || "An error occurred during login";
        setErrorMsg(msg);
      } else {
        setErrorMsg("An unexpected error occurred");
      }
      return false;
    }
  }

  useEffect(() => {
    getUserIsAdmin()
  }, []);

  const handleAdminLogout = () => {
    resetAuth();
    navigate('/');
  }

  const headerButtons = (
    <div className="gap-4 md:flex items-center">
      <button
        onClick={() => handleAdminLogout()}
        className="bg-[#C6412A] text-white px-6 py-2 rounded-lg hover:bg-[#A8321E] transition"
      >
        Log out
      </button>
    </div>
  );

  const handleNavigateToChallenge = (challengeTab: 'create' | null) => {
    setActiveUserTab(null);
    setActiveRequestTab(null);
    setActiveChallengeTab(challengeTab);
  }

  const handleNavigateToRequest = (withdrawTab: 'withdraw' | null) => {
    setActiveUserTab(null);
    setActiveChallengeTab(null);
    setActiveRequestTab(withdrawTab);
  }

  const handleNavigateToUser = (userTab: 'all' | 'verified' | 'unverified' | 'locked' | null) => {
    setActiveChallengeTab(null);
    setActiveRequestTab(null);
    setActiveUserTab(userTab);
  }

  return (
    <Layout headerRight={headerButtons}>
      {errorMsg && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          {errorMsg}
        </div>
      )}
      <div className="flex flex-col md:flex-row min-h-screen bg-gray-100 w-full">
        <div className="w-full md:w-64 bg-white shadow-lg p-4">
          <h1 className="text-2xl font-semibold text-gray-800 mb-4">Administrator Page</h1>

          {/* User Management Dropdown Toggle */}
          <button className="mb-4 rounded hover:bg-gray-100 w-full" onClick={() => setUserManagementDropdown(!userManagementDropdown)}>
            <div className="flex items-center justify-between cursor-pointer px-4 py-3">
              <h2 className="text-lg font-semibold text-gray-800">User Management</h2>

              {userManagementDropdown ? (
                <ChevronUpIcon className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-gray-600" />
              )}
            </div>
          </button>

          {/* User Management Dropdown Menu */}
          {userManagementDropdown && (
            <nav className="space-y-2">
              <button
                onClick={() => handleNavigateToUser('all')}
                className={`flex items-center w-full px-4 py-2 text-left rounded-lg transition ${activeUserTab === 'all' ? 'bg-[#C6412A] text-white' : 'text-gray-800 hover:bg-gray-100'}`}
              >
                <UserIcon className="w-5 h-5 mr-3" />
                All Users
              </button>

              <button
                onClick={() => handleNavigateToUser('verified')}
                className={`flex items-center w-full px-4 py-2 text-left rounded-lg transition ${activeUserTab === 'verified' ? 'bg-[#C6412A] text-white' : 'text-gray-800 hover:bg-gray-100'}`}
              >
                <ShieldCheckIcon className="w-5 h-5 mr-3" />
                Verified Users
              </button>

              <button
                onClick={() => handleNavigateToUser('unverified')}
                className={`flex items-center w-full px-4 py-2 text-left rounded-lg transition ${activeUserTab === 'unverified' ? 'bg-[#C6412A] text-white' : 'text-gray-800 hover:bg-gray-100'}`}
              >
                <UserIcon className="w-5 h-5 mr-3" />
                Unverified Users
              </button>

              <button
                onClick={() => handleNavigateToUser('locked')}
                className={`flex items-center w-full px-4 py-2 text-left rounded-lg transition ${activeUserTab === 'locked' ? 'bg-[#C6412A] text-white' : 'text-gray-800 hover:bg-gray-100'}`}
              >
                <LockClosedIcon className="w-5 h-5 mr-3" />
                Blocked Users
              </button>
            </nav>
          )}

          {/* Challenge Management Dropdown Toggle */}
          <button className="mb-4 rounded hover:bg-gray-100 w-full" onClick={() => setChallengeManagementDropdown(!challengeManagementDropdown)}>
            <div className="flex items-center justify-between cursor-pointer px-4 py-3">
              <h2 className="text-lg font-semibold text-gray-800">Challenge</h2>

              {challengeManagementDropdown ? (
                <ChevronUpIcon className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-gray-600" />
              )}
            </div>
          </button>

          {/* Challenge Management Dropdown Menu */}
          {challengeManagementDropdown && (
            <nav className="space-y-2">
              <button
                onClick={() => handleNavigateToChallenge('create')}
                className={`cursor-pointer flex items-center w-full px-4 py-2 text-left rounded-lg transition ${activeChallengeTab === 'create' ? 'bg-[#C6412A] text-white' : 'text-gray-800 hover:bg-gray-100'}`}
              >
                <MdAddTask className="w-5 h-5 mr-3" />
                Create challenge
              </button>
            </nav>
          )}
        {/* Withdraw Request Dropdown Toggle */}
          <button className="mb-4 rounded hover:bg-gray-100 w-full" onClick={() => setRequestManagementDropdown(!requestManagementDropdown)}>
            <div className="flex items-center justify-between cursor-pointer px-4 py-3">
              <h2 className="text-lg font-semibold text-gray-800">Request</h2>

              {requestManagementDropdown ? (
                <ChevronUpIcon className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-gray-600" />
              )}
            </div>
          </button>

          {/* Challenge Management Dropdown Menu */}
          {requestManagementDropdown && (
            <nav className="space-y-2">
              <button
                onClick={() => handleNavigateToRequest('withdraw')}
                className={`cursor-pointer flex items-center w-full px-4 py-2 text-left rounded-lg transition ${activeRequestTab === 'withdraw' ? 'bg-[#C6412A] text-white' : 'text-gray-800 hover:bg-gray-100'}`}
              >
                <PiHandWithdraw className="w-5 h-5 mr-3" />
                Withdraw Request
              </button>
            </nav>
          )}
        </div>

        {activeUserTab && <><AdminMainPage activeTab={activeUserTab} /></>}
        {activeRequestTab && <><AdminWithdraw /></>}
        {activeChallengeTab && <><AdminChallengePage /></>}

      </div>
    </Layout>
  )
}

export default AdminPage;