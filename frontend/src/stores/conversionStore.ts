import { create } from "zustand";
import type { Currency } from "./transactionStore";

interface ConversionState {
  srcCurrency: Currency;
  destCurrency: Currency;
  setSrcCurrency: (currency: Currency) => void;
  setDestCurrency: (currency: Currency) => void;
}

export const useConversionStore = create<ConversionState>()((set) => ({
  srcCurrency:  { code: 'AUD', countryCode: 'AU', label: 'Australian Dollar', flag: '🇦🇺', localeString: 'en-AU' },
  destCurrency: { code: 'IDR', countryCode: 'ID', label: 'Indonesian Rupiah', flag: '🇮🇩', localeString: 'id-ID' },
  setSrcCurrency: (currency) => set({ srcCurrency: currency }),
  setDestCurrency: (currency) => set({ destCurrency: currency}),
}));