import { useState, useEffect } from "react";
import { FaSearch, FaFilter } from "react-icons/fa";
import HeaderButtons from "@/components/dashboard/HeaderButtons";
import Layout from "@/components/Layout";
import HistoryFilterModal from "@/components/modal/HistoryFilterModal";
import useHistoryStore from "@/stores/historyStore";
import axios from "axios";
import { useParams } from "react-router-dom";

interface Transaction {
  _id: string;
  amountDest: number;
  currencyDest: string;
  fromAccount: string;
  toAccount: string;
  fromAccountEmail: string;
  toAccountEmail: string;
  fromAccountId: string;
  toAccountId: string;
  description: string;
  transactionDate: string;
}

const GroupHistory = () => {
  const { groupId } = useParams();
  const [search, setSearch] = useState('');
  const [historyData, setHistoryData] = useState<Transaction[]>([]);
  const [filteredData, setFilteredData] = useState<Transaction[]>([]);
  const {
    setShowModal,
    showModal,
    currencyExchange,
    incomingTransfer,
    outgoingTransfer,
    allTransaction,
    startingDate,
    endingDate,
  } = useHistoryStore();

  const getHistory = async () => {
    try {
      const response = await axios.get('http://localhost:3000/group/transaction/history', {
        params: { groupId }
      });
      setHistoryData(response.data.reverse());
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.errorMsg || 'Something went wrong';
        console.error('Finding user email error:', msg);
      } else {
        console.error('An unexpected error occurred');
      }
    }
  };

  const applyFilters = () => {
    let result = historyData;

    // Filter by date range
    if (startingDate || endingDate) {
      result = result.filter(item => {
        const currDate = new Date(item.transactionDate);
        if (startingDate && currDate <= startingDate) return false;
        if (endingDate && currDate >= endingDate) return false;
        return true;
      });
    }

    // Filter by transaction type
    if (!allTransaction) {
      result = result.filter(item => {
        if (incomingTransfer && item.toAccountId === groupId) return true;
        if (outgoingTransfer && item.toAccountId !== groupId) return true;
        if (currencyExchange && item.toAccountId === groupId && item.fromAccountId === groupId) return true;
        return false;
      });
    }

    // Filter by search term
    if (search) {
      result = result.filter(item => {
        if (item.toAccountId === groupId) {
          return item.fromAccountEmail.toLowerCase().includes(search.toLowerCase());
        } else {
          return item.toAccountEmail.toLowerCase().includes(search.toLowerCase());
        }
      });
    }

    setFilteredData(result);
  };

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    const now = new Date();

    const formattedDate = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const timeDiff = nowOnly.getTime() - dateOnly.getTime();
    const daysAgo = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    let state = '';
    if (daysAgo === 0) state = 'Today';
    else if (daysAgo === 1) state = 'Yesterday';
    else state = `${daysAgo} days ago`;

    return `${formattedDate} · ${state}`;
  };

  const formatTime = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatCurrency = (amount: number, currencyCode: string) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  useEffect(() => {
    getHistory();
  }, []);

  useEffect(() => {
    if (historyData.length > 0) {
      applyFilters();
    }
  }, [historyData, search, currencyExchange, incomingTransfer, outgoingTransfer, allTransaction, startingDate, endingDate]);

  return (
    <Layout headerRight={<HeaderButtons />}>
      <div className='flex flex-col w-full items-center'>
        {/* Header section */}
        <div className='flex flex-col md:flex-row justify-between items-start md:items-center ml-5 mr-5 w-full p-4 gap-3'>
          <h1 className='text-black font-bold text-4xl'>Transaction History</h1>

          <div className='flex flex-col sm:flex-row w-full md:w-auto gap-4 items-stretch'>
            <div className='relative flex-grow max-w-md'>
              <div className='absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500'>
                <FaSearch className='w-4 h-4' />
              </div>
              <input
                type='text'
                placeholder='Search by email'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='w-full pl-12 pr-4 py-2 bg-white/60 rounded-full 
                   focus:outline-none focus:ring-2 focus:ring-[#FFA294] transition-all duration-200'
              />
            </div>

            <button
              onClick={() => setShowModal(true)}
              className='flex flex-row bg-white rounded-full pl-6 pr-6 py-2 items-center justify-center 
                gap-2 font-bold hover:bg-gray-100 transition-colors shadow-md cursor-pointer'
            >
              <FaFilter />
              <p>Filters</p>
            </button>
          </div>
        </div>

        {/* Show filter modal */}
        {showModal && <HistoryFilterModal />}

        <div className='flex flex-col ml-5 mr-5 w-full p-4 gap-2 overflow-y-auto flex-grow justify-center items-center h-full'>
          {filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="bg-white/60 p-8 rounded-2xl shadow-sm max-w-md w-full text-center">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No transactions found</h3>
                <p className="text-gray-600 mb-4">
                  {search || startingDate || endingDate || !allTransaction
                    ? "Try adjusting your filters or search term"
                    : "You don't have any transactions yet"}
                </p>
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="px-4 py-2 bg-[#FFA296] text-white rounded-full hover:bg-[#E58F81] transition-colors"
                  >
                    Clear search
                  </button>
                )}
              </div>
            </div>
          ) : (
            (() => {
              let lastDate = '';
              return filteredData.map((item) => {
                const currentDate = new Date(item.transactionDate).toDateString();
                const showDate = currentDate !== lastDate;
                lastDate = currentDate;

                const isIncoming = item.toAccountId === groupId;
                const amountColor = isIncoming ? 'text-green-600' : 'text-red-600';
                const amountSign = isIncoming ? '+' : '-';

                return (
                  <div key={item._id} className='w-full'>
                    {showDate && (
                      <div className='font-bold text-black w-full border-b-2 border-b-black/20 mb-4 pb-2'>
                        {formatDate(item.transactionDate)}
                      </div>
                    )}

                    <div className='w-full p-4 bg-white/50 rounded-xl shadow-sm mb-3 hover:shadow-md transition-shadow'>
                      <div className='flex justify-between items-center gap-2'>
                        <div className={`w-12 h-12 mr-3 rounded-full flex items-center justify-center font-bold text-xl ${isIncoming ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'}`}>
                          {isIncoming ? '↓' : '↑'}
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div className='font-bold text-black truncate'>
                            {isIncoming ? `Received from` : `Sent to`}
                          </div>
                          <div className='text-gray-800 truncate'>
                            {isIncoming ? item.fromAccountEmail : item.toAccountEmail}
                          </div>
                        </div>
                        <div className='flex flex-col items-end'>
                          <div className={`font-bold ${amountColor}`}>
                            {`${amountSign} ${formatCurrency(item.amountDest, item.currencyDest)}`}
                          </div>
                          <div className='text-gray-700 text-sm'>
                            {formatTime(item.transactionDate)}
                          </div>
                        </div>
                      </div>
                      {item.description && (
                        item.fromAccountEmail === item.toAccountEmail
                          ? (
                            <div className="mt-2 pt-2 border-t-2 border-black/20 text-gray-800">
                              Description: Self Transfer
                            </div>
                          )
                          : (
                            <div className="mt-2 pt-2 border-t-2 border-black/20 text-gray-800">
                              Description: {item.description}
                            </div>
                          )
                      )}
                    </div>
                  </div>
                );
              });
            })()
          )}
        </div>
      </div>
    </Layout>
  );
};

export default GroupHistory;