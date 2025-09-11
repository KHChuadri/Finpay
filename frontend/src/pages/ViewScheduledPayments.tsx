import { useEffect, useState } from "react";
import HeaderButtons from "@/components/dashboard/HeaderButtons";
import Layout from "@/components/Layout";
import HistoryFilterModal from "@/components/modal/HistoryFilterModal";
import useAuthStore from "@/stores/authStore";
import useHistoryStore from "@/stores/historyStore";
import { FaFilter, FaSearch } from "react-icons/fa";
import { MdCancel } from "react-icons/md";
import axios from "axios";
import { API_URL } from "@/constants/API_URL";

interface ScheduledPayment {
  _id: string;
  debtorId: string;
  debtorEmail: string;
  creditorId: string;
  creditorEmail: string;
  amountSrc: number;
  amountDest: number;
  currencySrc: string;
  currencyDest: string;
  scheduledDate: string;
  description?: string;
}

const ViewScheduledPayments = () => {
  const userId = useAuthStore.getState().userId;
  const [search, setSearch] = useState("");
  const [scheduledPaymentData, setScheduledPaymentData] = useState<
    ScheduledPayment[]
  >([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [cancellingPayments, setCancellingPayments] = useState<Set<string>>(new Set());
  const {
    setShowModal,
    showModal,
    incomingTransfer,
    outgoingTransfer,
    allTransaction,
    startingDate,
    endingDate,
  } = useHistoryStore();

  // Format currency function
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    const now = new Date();

    const formattedDate = date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const dateOnly = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const timeDiff = dateOnly.getTime() - nowOnly.getTime();
    const daysUntil = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    let state = "";
    if (daysUntil === 0) state = "Today";
    else if (daysUntil === 1) state = "Tomorrow";
    else if (daysUntil > 1) state = `In ${daysUntil} days`;
    else state = "Overdue";

    return `${formattedDate} · ${state}`;
  };

  const formatTime = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const getScheduledPayments = async (pageNumber = 1) => {
    try {
      const response = await axios.get(
        `${API_URL}/getScheduledPayments/${userId}`,
        {
          params: {
            page: pageNumber,
            limit: 20,
          },
        }
      );

      setScheduledPaymentData(response.data.scheduledPayment);
      setTotalPages(response.data.totalPages);
      setPage(response.data.currentPage);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.errorMsg || "Something went wrong";
        console.error("Finding user email error:", msg);
      } else {
        console.error("An unexpected error occurred");
      }
    }
  };

  const handleCancelPayment = async (paymentId: string) => {
    setCancellingPayments(prev => new Set(prev).add(paymentId));

    try {
      const response = await axios.delete(
        `${API_URL}/schedule/payment/${paymentId}?userId=${userId}`
      );

      if (response.data.success) {
        setScheduledPaymentData(prev => 
          prev.filter(payment => payment._id !== paymentId)
        );
        
        // Refresh the list to update pagination
        await getScheduledPayments(page);
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.errorMsg || "Failed to cancel payment";
        console.error("Cancel payment error:", msg);
        alert(msg); // You might want to use a toast notification instead
      } else {
        console.error("An unexpected error occurred");
        alert("Failed to cancel payment");
      }
    } finally {
      // Remove from cancelling set
      setCancellingPayments(prev => {
        const newSet = new Set(prev);
        newSet.delete(paymentId);
        return newSet;
      });
    }
  };

  // Filter scheduled payments based on search and filters
  const filteredData = scheduledPaymentData.filter((payment) => {
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      const matchesEmail = 
        payment.debtorEmail.toLowerCase().includes(searchLower) ||
        payment.creditorEmail.toLowerCase().includes(searchLower);
      if (!matchesEmail) return false;
    }

    // Date filters
    if (startingDate) {
      const paymentDate = new Date(payment.scheduledDate);
      const startDate = new Date(startingDate);
      if (paymentDate < startDate) return false;
    }

    if (endingDate) {
      const paymentDate = new Date(payment.scheduledDate);
      const endDate = new Date(endingDate);
      if (paymentDate > endDate) return false;
    }

    // Transaction type filters
    if (!allTransaction) {
      const isIncoming = payment.creditorId === userId;
      const isOutgoing = payment.debtorId === userId;
      
      if (incomingTransfer && !isIncoming) return false;
      if (outgoingTransfer && !isOutgoing) return false;
    }

    return true;
  });

  useEffect(() => {
    getScheduledPayments(page);
  }, [page]);

  return (
    <Layout headerRight={<HeaderButtons />}>
      <div className='flex flex-col w-full items-center'>
        {/* Header section */}
        <div className='flex flex-col md:flex-row justify-between items-start md:items-center ml-5 mr-5 w-full p-4 gap-3'>
          <h1 className='text-black font-bold text-4xl'>Scheduled Payments</h1>

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
                <div className="text-6xl mb-4">⏰</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No scheduled payments found</h3>
                <p className="text-gray-600 mb-4">
                  {search || startingDate || endingDate || !allTransaction
                    ? "Try adjusting your filters or search term"
                    : "You don't have any scheduled payments yet"}
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
              return filteredData.map((payment) => {
                const currentDate = new Date(payment.scheduledDate).toDateString();
                const showDate = currentDate !== lastDate;
                lastDate = currentDate;

                const isIncoming = payment.creditorId === userId;
                const amountColor = isIncoming ? 'text-green-600' : 'text-red-600';
                const amountSign = isIncoming ? '+' : '-';
                const isCancelling = cancellingPayments.has(payment._id);

                return (
                  <div key={payment._id} className='w-full'>
                    {showDate && (
                      <div className='font-bold text-black w-full border-b-2 border-b-black/20 mb-4 pb-2'>
                        {formatDate(payment.scheduledDate)}
                      </div>
                    )}

                    <div className='w-full p-4 bg-white/50 rounded-xl shadow-sm mb-3 hover:shadow-md transition-shadow'>
                      <div className='flex justify-between items-center gap-2'>
                        <div className={`w-12 h-12 mr-3 rounded-full flex items-center justify-center font-bold text-xl ${isIncoming ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'}`}>
                          {isIncoming ? '↓' : '↑'}
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div className='font-bold text-black truncate'>
                            {isIncoming ? `Scheduled to receive from` : `Scheduled to send to`}
                          </div>
                          <div className='text-gray-800 truncate'>
                            {isIncoming ? payment.debtorEmail : payment.creditorEmail}
                          </div>
                        </div>
                        <div className='flex flex-col items-end gap-2'>
                          <div className={`font-bold ${amountColor}`}>
                            {`${amountSign} ${formatCurrency(payment.amountDest, payment.currencyDest)}`}
                          </div>
                          <div className='text-gray-700 text-sm'>
                            {formatTime(payment.scheduledDate)}
                          </div>
                          <button
                            onClick={() => handleCancelPayment(payment._id)}
                            disabled={isCancelling}
                            className='flex items-center gap-1 px-3 py-1 text-sm bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                          >
                            <MdCancel className='w-4 h-4' />
                            {isCancelling ? 'Cancelling...' : 'Cancel'}
                          </button>
                        </div>
                      </div>
                      {payment.description && (
                        <div className="mt-2 pt-2 border-t-2 border-black/20 text-gray-800">
                          Description: {payment.description}
                        </div>
                      )}
                    </div>
                  </div>
                );
              });
            })()
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className='flex justify-center items-center gap-2 p-4'>
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className='px-4 py-2 bg-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors'
            >
              Previous
            </button>
            <span className='px-4 py-2 bg-[#FFA296] text-white rounded-full'>
              {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className='px-4 py-2 bg-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors'
            >
              Next
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ViewScheduledPayments;