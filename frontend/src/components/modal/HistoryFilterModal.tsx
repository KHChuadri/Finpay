import useHistoryStore from "@/stores/historyStore";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const HistoryFilterModal = () => {
  // Get current filter values from store
  const {
    currencyExchange: currentCurrencyExchange,
    incomingTransfer: currentIncomingTransfer,
    outgoingTransfer: currentOutgoingTransfer,
    deposit: currentDeposit,
    withdrawal: currentWithdrawal,
    allTransaction: currentAllTransaction,
    endingDate: currentEndingDate,
    startingDate: currentStartingDate,
    setCurrencyExchange,
    setIncomingTransfer,
    setOutgoingTransfer,
    setDeposit,
    setWithdrawal,
    setAllTransaction,
    setEndingDate,
    setStartingDate,
    setShowModal,
    dateValidityError,
    setDateValidityError,
  } = useHistoryStore();

  // Local state for temporary filter values
  const [tempFilters, setTempFilters] = useState({
    currencyExchange: currentCurrencyExchange,
    incomingTransfer: currentIncomingTransfer,
    outgoingTransfer: currentOutgoingTransfer,
    deposit: currentDeposit,
    withdrawal: currentWithdrawal,
    allTransaction: currentAllTransaction,
    endingDate: currentEndingDate,
    startingDate: currentStartingDate,
  });

  const checkDateValidity = () => {
    if (tempFilters.startingDate && tempFilters.endingDate) {
      if (tempFilters.startingDate > tempFilters.endingDate) {
        setDateValidityError('Starting date must be before the ending date.');
      } else {
        setDateValidityError('');
      }
    }
  };

  useEffect(() => {
    checkDateValidity();
  }, [tempFilters.startingDate, tempFilters.endingDate]);

  const handleApplyFilters = () => {
    if (dateValidityError) return;

    // Apply all temporary filters to the store
    setCurrencyExchange(tempFilters.currencyExchange);
    setIncomingTransfer(tempFilters.incomingTransfer);
    setOutgoingTransfer(tempFilters.outgoingTransfer);
    setDeposit(tempFilters.deposit);
    setWithdrawal(tempFilters.withdrawal);
    setAllTransaction(tempFilters.allTransaction);
    setStartingDate(tempFilters.startingDate);
    setEndingDate(tempFilters.endingDate);

    setShowModal(false);
  };

  const handleResetAll = () => {
    setTempFilters({
      currencyExchange: false,
      incomingTransfer: false,
      outgoingTransfer: false,
      deposit: false,
      withdrawal: false,
      allTransaction: false,
      endingDate: null,
      startingDate: null,
    });
  };

  const toggleFilter = (filterName: keyof typeof tempFilters) => {
    setTempFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName],
      // If toggling "All Transactions", uncheck other filters
      ...(filterName === 'allTransaction' && {
        currencyExchange: false,
        incomingTransfer: false,
        outgoingTransfer: false,
        deposit: false,
        withdrawal: false,
      }),
      // If toggling any other filter, uncheck "All Transactions"
      ...(filterName !== 'allTransaction' && {
        allTransaction: false,
      }),
    }));
  };

  return (
    <div
      className='fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/30 z-50'
      data-testid="history-filter-modal"
    >
      <div className='glass rounded-xl w-11/12 sm:w-5/6 md:w-2/3 lg:w-1/2 xl:w-1/3 max-w-2xl p-6 mx-4'>
        {/* Header */}
        <div className='flex justify-between items-center mb-4'>
          <h1 className='font-bold text-2xl text-foreground'>Filters</h1>
          <button
            onClick={() => setShowModal(false)}
            className='text-muted-foreground hover:text-foreground transition-colors cursor-pointer'
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {dateValidityError && (
          <div className='mb-4 p-2 bg-destructive/10 text-destructive rounded-lg text-sm'>
            {dateValidityError}
          </div>
        )}

        {/* Date Filter Section */}
        <div className='mb-6'>
          <h2 className='font-semibold text-lg text-foreground mb-3 pb-2 border-b border-border'>
            Date Range
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label htmlFor="start-date" className='block text-sm font-medium text-muted-foreground mb-1'>
                From:
              </label>
              <Input
                id="start-date"
                type='date'
                value={tempFilters.startingDate ? tempFilters.startingDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setTempFilters(prev => ({
                  ...prev,
                  startingDate: e.target.value ? new Date(e.target.value) : null
                }))}
                className='cursor-pointer'
              />
            </div>
            <div>
              <label htmlFor="end-date" className='block text-sm font-medium text-muted-foreground mb-1'>
                To:
              </label>
              <Input
                id="end-date"
                type='date'
                value={tempFilters.endingDate ? tempFilters.endingDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setTempFilters(prev => ({
                  ...prev,
                  endingDate: e.target.value ? new Date(e.target.value) : null
                }))}
                className='cursor-pointer'
              />
            </div>
          </div>
        </div>

        {/* Transaction Type Section */}
        <div className='mb-6'>
          <h2 className='font-semibold text-lg text-foreground mb-3 pb-2 border-b border-border'>
            Transaction Types
          </h2>
          <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
            {[
              { label: "All Transactions", key: "allTransaction", state: tempFilters.allTransaction },
              { label: "Currency Exchange", key: "currencyExchange", state: tempFilters.currencyExchange },
              { label: "Incoming Transfer", key: "incomingTransfer", state: tempFilters.incomingTransfer },
              { label: "Outgoing Transfer", key: "outgoingTransfer", state: tempFilters.outgoingTransfer },
              { label: "Deposit", key: "deposit", state: tempFilters.deposit },
              { label: "Withdrawal", key: "withdrawal", state: tempFilters.withdrawal },
            ].map(({ label, key, state }) => (
              <button
                key={key}
                onClick={() => toggleFilter(key as keyof typeof tempFilters)}
                className={`p-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer
                  ${state
                    ? 'bg-primary hover:opacity-90 text-primary-foreground shadow-md'
                    : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}
                `}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex gap-3 mt-6'>
          <button
            onClick={handleResetAll}
            className='flex-1 w-full border-2 border-primary text-center p-2 text-primary rounded-xl font-bold hover:opacity-80 cursor-pointer'
          >
            Reset All
          </button>
          <Button
            onClick={handleApplyFilters}
            disabled={!!dateValidityError}
            className="flex-1 w-full py-2"
            data-testid="apply-filters-button"
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HistoryFilterModal;