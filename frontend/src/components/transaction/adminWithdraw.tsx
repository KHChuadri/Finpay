import { UserIcon } from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import axios from "axios";
import { FaTimes } from "react-icons/fa";

interface TransactionItem {
  itemid: string;
  name: string;
  transactionId: string;
  currency: string;
  amount: number;
  userId: string;
}

const AdminWithdraw = () => {
  const [page, setPage] = useState(1);
  const [requestList, setRequestList] = useState<TransactionItem[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchRequest = async (pageNumber = 1) => {
    try {
      const response = await axios.get("http://localhost:3000/admin/requests", {
        params: {
          page: pageNumber,
          limit: 20,
        },
      });
      setRequestList(response.data.requests);
      setTotalPages(response.data.totalPages);
      setPage(response.data.currentPage);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const handleWithdraw = async (transactionId: string) => {
    try {
      await axios.get(`http://localhost:3000/bankintegration/doTransaction/${transactionId}`);
      setTimeout(() => {
        fetchRequest(page);
      }, 200);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  useEffect(() => {
    fetchRequest(page);
  }, [page]);

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
            Withdraw Request
          </h1>
        </div>
        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 tracking-wider">
                  NAME
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 tracking-wider">
                  USER ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 tracking-wider">
                  CURRENCY
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 tracking-wider">
                  AMOUNT
                </th>
                <th className="px-12 py-3 text-mid text-xs font-medium text-gray-600 tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300">
              {requestList && requestList.map((request) => (
                <tr key={request.transactionId}>
                  {/* Name Row */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-200">
                        <UserIcon className="h-6 w-6 text-gray-500" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {request.name}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* User ID Row */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {request.userId || "-"}
                  </td>

                  {/* Currency Row */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {request.currency}
                  </td>

                  {/* Amount Row */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {request.amount.toLocaleString()}
                  </td>

                  {/* Actions Row */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center justify-center h-full">
                      <button 
                      className="text-green-500 hover:text-green-700 cursor-pointer"
                      onClick={() => handleWithdraw(request.transactionId)}
                      >
                        Approve
                      </button>
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
};

export default AdminWithdraw;
