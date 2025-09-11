import { MagnifyingGlassIcon, UserIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTimes } from 'react-icons/fa';

interface AdminMainPageProps {
  activeTab: string
}

interface User {
  firstName: string;
  lastName: string;
  userId: string;
  accountStatus: 'verified' | 'unverified' | 'locked';
  isVerified: boolean;
  isLocked: boolean;
  email: string;
  KYCimg: string;
  updatedAt: string;
};

const AdminMainPage = ({ activeTab }: AdminMainPageProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchUsers = async (pageNumber = 1) => {
    try {
      const response = await axios.get("http://localhost:3000/admin/users", {
        params: {
          page: pageNumber,
          limit: 20,
        },
      });
      setUsersList(response.data.users);
      setTotalPages(response.data.totalPages);
      setPage(response.data.currentPage);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  useEffect(() => {
    fetchUsers(page);
  }, [page]);

  const handleAdminVerify = async (userId: string, verify: boolean) => {
    try {
      await axios.put(`http://localhost:3000/admin/verify/${userId}`, {
        isVerified: verify,
      });

      // Slight delay for backend to update pages
      setTimeout(() => {
        fetchUsers(page);
      }, 200);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.errorMessage || 'An unexpected error occured during verification';
        setErrorMessage(msg || 'An unexpected error occurred');
      } else {
        setErrorMessage('An unexpected error occurred');
      }
    }
  }

  const handleAdminBlock = async (userId: string, block: boolean) => {
    try {
      await axios.put(`http://localhost:3000/admin/block/${userId}`, {
        isLocked: block,
      });

      // Slight delay for backend to update pages
      setTimeout(() => {
        fetchUsers(page);
      }, 200);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.errorMessage || 'An unexpected error occured during blocking';
        setErrorMessage(msg || 'An unexpected error occurred');
      } else {
        setErrorMessage('An unexpected error occurred');
      }
    }
  };

  return (
    <div className="flex-1 p-6 overflow-x-hidden">
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
        {/* Error Message */}
        {errorMessage && (
          <div className="flex max-w-md w-full px-4 py-3 fixed top-8 left-1/2 transform -translate-x-1/2 bg-red-200 border-2 border-red-400 text-red-700 rounded z-50">
            <p className="break-words w-full pr-8">{errorMessage}</p>
            <button
              onClick={() => setErrorMessage(null)}
              className="absolute top-4 right-4 text-red-700 hover:text-red-900"
            >
              <FaTimes />
            </button>
          </div>
        )}

          {/* Header */}
          <h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">
            {activeTab === 'all' && 'All User Accounts'}
            {activeTab === 'verified' && 'Verified User Accounts'}
            {activeTab === 'unverified' && 'Unverified User Accounts'}
            {activeTab === 'locked' && 'Blocked User Accounts'}
          </h1>

          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Search users..."
              className="w-full md:w-64 pl-10 pr-4 py-2 border border-gray-400 rounded-lg focus:ring-[#C6412A] focus:border-[#C6412A]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 tracking-wider">NAME</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 tracking-wider">USER ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 tracking-wider">STATUS</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 tracking-wider">EMAIL</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 tracking-wider">IMAGE</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 tracking-wider">LAST LOGIN</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 tracking-wider">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300">
              {usersList
                .filter(user => {
                  const matchesSearch =
                    user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    user.userId.toLowerCase().includes(searchQuery.toLowerCase());

                  const matchesTab =
                    activeTab === 'all' ||
                    (activeTab === 'verified' && user.isVerified === true) ||
                    (activeTab === 'unverified' && user.isVerified === false) ||
                    (activeTab === 'locked' && user.isLocked);

                  return matchesSearch && matchesTab;
                })
                .map((user) => (
                  <tr key={user.userId}>
                    {/* Name Row */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-200">
                          <UserIcon className="h-6 w-6 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                        </div>
                      </div>
                    </td>

                    {/* User ID Row */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.userId || '-'}
                    </td>

                    {/* Status Row */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p
                        className={`px-2 inline-flex text-xs font-semibold leading-5 rounded-full ${user.isLocked
                          ? 'bg-red-100 text-red-800'
                          : user.isVerified
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                          }`}
                      >
                        {user.isLocked ? 'Locked' : user.isVerified ? 'Verified' : 'Unverified'}
                      </p>
                    </td>

                    {/* Email Row */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.email || '-'}
                    </td>

                    {/* Image Row */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.KYCimg && (
                        <a
                          href={user.KYCimg}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cursor-pointer"
                        >
                          <img
                            src={user.KYCimg}
                            alt="KYC"
                            className="w-16 h-16 object-cover rounded border border-gray-300 shadow-sm hover:border-[#C6412A] transition-colors"
                          />
                        </a>
                      )}
                    </td>

                    {/* Last Login Row */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.updatedAt ? new Date(user.updatedAt).toLocaleString() : 'Never accessed'}
                    </td>

                    {/* Actions Row */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-row gap-2">
                        {/* Verify/Unverify Button */}
                        {user.isVerified ? (
                          <button
                            className="text-yellow-500 hover:text-yellow-700 cursor-pointer"
                            onClick={() => handleAdminVerify(user.userId, false)}
                          >
                            Unverify
                          </button>
                        ) : (
                          <button
                            className="text-green-600 hover:text-green-800 cursor-pointer"
                            onClick={() => handleAdminVerify(user.userId, true)}
                          >
                            Verify
                          </button>
                        )}

                        {/* Lock/Unlock Button */}
                        {user.isLocked ? (
                          <button
                            className="text-orange-600 hover:text-orange-800 cursor-pointer"
                            onClick={() => handleAdminBlock(user.userId, false)}
                          >
                            Unblock
                          </button>
                        ) : (
                          <button
                            className="text-red-600 hover:text-red-800 cursor-pointer"
                            onClick={() => handleAdminBlock(user.userId, true)}
                          >
                            Block
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          <div className="mt-4 flex justify-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
            >
              Prev
            </button>
            <span className="px-4 py-2">{`Page ${page} of ${totalPages}`}</span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminMainPage;