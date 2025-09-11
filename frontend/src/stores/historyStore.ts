import { create } from 'zustand';

interface HistoryStore {
  startingDate: Date | null;
  endingDate: Date | null;
  currencyExchange: boolean;
  incomingTransfer: boolean;
  outgoingTransfer: boolean;
  withdrawal: boolean;
  deposit: boolean;
  allTransaction: boolean;
  showModal: boolean;
  dateValidityError: string;

  setStartingDate: (startingDate: Date | null) => void;
  setEndingDate: (endingDate: Date | null) => void;
  setCurrencyExchange: (currencyExchange: boolean) => void;
  setIncomingTransfer: (incomingTransfer: boolean) => void;
  setOutgoingTransfer: (outgoingTransfer: boolean) => void;
  setWithdrawal: (withdrawal: boolean) => void;
  setDeposit: (deposit: boolean) => void;
  setAllTransaction: (allTransaction: boolean) => void;
  setShowModal: (showModal: boolean) => void;
  setDateValidityError: (dateValidityError: string) => void;

  reset: () => void;
}

const useHistoryStore = create<HistoryStore>((set) => ({
  startingDate: null,
  endingDate: null,
  currencyExchange: false,
  incomingTransfer: false,
  outgoingTransfer: false,
  withdrawal: false,
  deposit: false,
  allTransaction: true,
  showModal: false,
  dateValidityError: '',

  setStartingDate: (startingDate: Date | null) => set({ startingDate }),
  setEndingDate: (endingDate: Date | null) => set({ endingDate }),
  setCurrencyExchange: (currencyExchange) => set({ currencyExchange }),
  setIncomingTransfer: (incomingTransfer) => set({ incomingTransfer }),
  setOutgoingTransfer: (outgoingTransfer) => set({ outgoingTransfer }),
  setWithdrawal: (withdrawal) => set({ withdrawal }),
  setDeposit: (deposit) => set({ deposit }),
  setAllTransaction: (allTransaction) => set({ allTransaction }),
  setShowModal: (showModal) => set({ showModal }),
  setDateValidityError: (dateValidityError) => set({ dateValidityError }),

  reset: () =>
    set({
      startingDate: null,
      endingDate: null,
      currencyExchange: false,
      incomingTransfer: false,
      outgoingTransfer: false,
      withdrawal: false,
      deposit: false,
      allTransaction: true
    }),
}));

export default useHistoryStore;
