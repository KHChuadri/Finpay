import { create } from 'zustand';

export interface Currency {
  code: string;
  countryCode: string;
  label: string;
  flag: string;
  localeString: string;
}

interface RecipientType {
  email: string;
  walletInfo: string[];
}

interface TransactionState {
  transactionType: string | null;
  currencies: Currency[];
  currentPage: number;
  currencyFrom: Currency;
  rawSourceCurrencyAmount: number
  sourceCurrencyAmount: number;
  currencyTo: Currency;
  rawDestCurrencyAmount: number,
  destCurrencyAmount: number;
  serviceFee: number

  // This is only for request process
  requestAmount: number;
  requestCurrency: Currency | null;
  transactionNote: string;

  // Recipient are shared for both transaction, request and transfer
  recipient: RecipientType;
  recipientEmail: string;

  setTransactionType: (transactionType: string) => void;

  setCurrencyFrom: (currency: Currency) => void;
  setRawSourceCurrencyAmount: (amount: number) => void;
  setSourceCurrencyAmount: (amount: number) => void;
  setCurrencyTo: (currency: Currency) => void;
  setRawDestCurrencyAmount: (amount: number) => void;
  setDestCurrencyAmount: (amount: number) => void;
  setServiceFee: (amount: number) => void;

  setRequestAmount: (amount: number) => void;
  setRequestCurrency: (currency: Currency) => void;
  setTransactionNote: (note: string) => void;

  setRecipient: (recipient: RecipientType) => void;
  setCurrentPage: (page: number) => void;
  setRecipientEmail: (email: string) => void;
  isValidAmountPage: () => boolean;
  isValidRecipientPage: () => boolean;
  setNextPageIfValid: () => void;

  resetRequest: () => void;
  resetTransfer: () => void;
}

export const defaultCurrency = { code: 'AUD', countryCode: 'AU', label: 'Australian Dollar', flag: '🇦🇺', localeString: 'en-AU' };

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactionType: null,
  currencies: [
    { code: 'AED', countryCode: 'AE', label: 'United Arab Emirates Dirham', flag: '🇦🇪', localeString: 'ar-AE' },
    { code: 'ARS', countryCode: 'AR', label: 'Argentine Peso', flag: '🇦🇷', localeString: 'es-AR' },
    { code: 'AUD', countryCode: 'AU', label: 'Australian Dollar', flag: '🇦🇺', localeString: 'en-AU' },
    { code: 'BDT', countryCode: 'BD', label: 'Bangladeshi Taka', flag: '🇧🇩', localeString: 'bn-BD' },
    { code: 'BGN', countryCode: 'BG', label: 'Bulgarian Lev', flag: '🇧🇬', localeString: 'bg-BG' },
    { code: 'BHD', countryCode: 'BH', label: 'Bahraini Dinar', flag: '🇧🇭', localeString: 'ar-BH' },
    { code: 'BRL', countryCode: 'BR', label: 'Brazilian Real', flag: '🇧🇷', localeString: 'pt-BR' },
    { code: 'CAD', countryCode: 'CA', label: 'Canadian Dollar', flag: '🇨🇦', localeString: 'en-CA' },
    { code: 'CHF', countryCode: 'CH', label: 'Swiss Franc', flag: '🇨🇭', localeString: 'de-CH' },
    { code: 'CLP', countryCode: 'CL', label: 'Chilean Peso', flag: '🇨🇱', localeString: 'es-CL' },
    { code: 'CNY', countryCode: 'CN', label: 'Chinese Yuan', flag: '🇨🇳', localeString: 'zh-CN' },
    { code: 'COP', countryCode: 'CO', label: 'Colombian Peso', flag: '🇨🇴', localeString: 'es-CO' },
    { code: 'CZK', countryCode: 'CZ', label: 'Czech Republic Koruna', flag: '🇨🇿', localeString: 'cs-CZ' },
    { code: 'DKK', countryCode: 'DK', label: 'Danish Krone', flag: '🇩🇰', localeString: 'da-DK' },
    { code: 'EGP', countryCode: 'EG', label: 'Egyptian Pound', flag: '🇪🇬', localeString: 'ar-EG' },
    { code: 'EUR', countryCode: 'EU', label: 'Euro', flag: '🇪🇺', localeString: 'en-EU' },
    { code: 'GBP', countryCode: 'GB', label: 'British Pound Sterling', flag: '🇬🇧', localeString: 'en-GB' },
    { code: 'HKD', countryCode: 'HK', label: 'Hong Kong Dollar', flag: '🇭🇰', localeString: 'zh-HK' },
    { code: 'HUF', countryCode: 'HU', label: 'Hungarian Forint', flag: '🇭🇺', localeString: 'hu-HU' },
    { code: 'IDR', countryCode: 'ID', label: 'Indonesian Rupiah', flag: '🇮🇩', localeString: 'id-ID' },
    { code: 'ILS', countryCode: 'IL', label: 'Israeli New Sheqel', flag: '🇮🇱', localeString: 'he-IL' },
    { code: 'INR', countryCode: 'IN', label: 'Indian Rupee', flag: '🇮🇳', localeString: 'hi-IN' },
    { code: 'ISK', countryCode: 'IS', label: 'Icelandic Króna', flag: '🇮🇸', localeString: 'is-IS' },
    { code: 'JPY', countryCode: 'JP', label: 'Japanese Yen', flag: '🇯🇵', localeString: 'ja-JP' },
    { code: 'KRW', countryCode: 'KR', label: 'South Korean Won', flag: '🇰🇷', localeString: 'ko-KR' },
    { code: 'KWD', countryCode: 'KW', label: 'Kuwaiti Dinar', flag: '🇰🇼', localeString: 'ar-KW' },
    { code: 'LKR', countryCode: 'LK', label: 'Sri Lankan Rupee', flag: '🇱🇰', localeString: 'si-LK' },
    { code: 'MXN', countryCode: 'MX', label: 'Mexican Peso', flag: '🇲🇽', localeString: 'es-MX' },
    { code: 'MYR', countryCode: 'MY', label: 'Malaysian Ringgit', flag: '🇲🇾', localeString: 'ms-MY' },
    { code: 'NGN', countryCode: 'NG', label: 'Nigerian Naira', flag: '🇳🇬', localeString: 'en-NG' },
    { code: 'NOK', countryCode: 'NO', label: 'Norwegian Krone', flag: '🇳🇴', localeString: 'no-NO' },
    { code: 'NZD', countryCode: 'NZ', label: 'New Zealand Dollar', flag: '🇳🇿', localeString: 'en-NZ' },
    { code: 'OMR', countryCode: 'OM', label: 'Omani Rial', flag: '🇴🇲', localeString: 'ar-OM' },
    { code: 'PEN', countryCode: 'PE', label: 'Peruvian Nuevo Sol', flag: '🇵🇪', localeString: 'es-PE' },
    { code: 'PHP', countryCode: 'PH', label: 'Philippine Peso', flag: '🇵🇭', localeString: 'fil-PH' },
    { code: 'PKR', countryCode: 'PK', label: 'Pakistani Rupee', flag: '🇵🇰', localeString: 'ur-PK' },
    { code: 'PLN', countryCode: 'PL', label: 'Polish Zloty', flag: '🇵🇱', localeString: 'pl-PL' },
    { code: 'QAR', countryCode: 'QA', label: 'Qatari Rial', flag: '🇶🇦', localeString: 'ar-QA' },
    { code: 'RON', countryCode: 'RO', label: 'Romanian Leu', flag: '🇷🇴', localeString: 'ro-RO' },
    { code: 'RUB', countryCode: 'RU', label: 'Russian Ruble', flag: '🇷🇺', localeString: 'ru-RU' },
    { code: 'SAR', countryCode: 'SA', label: 'Saudi Riyal', flag: '🇸🇦', localeString: 'ar-SA' },
    { code: 'SEK', countryCode: 'SE', label: 'Swedish Krona', flag: '🇸🇪', localeString: 'sv-SE' },
    { code: 'SGD', countryCode: 'SG', label: 'Singapore Dollar', flag: '🇸🇬', localeString: 'en-SG' },
    { code: 'THB', countryCode: 'TH', label: 'Thai Baht', flag: '🇹🇭', localeString: 'th-TH' },
    { code: 'TRY', countryCode: 'TR', label: 'Turkish Lira', flag: '🇹🇷', localeString: 'tr-TR' },
    { code: 'TWD', countryCode: 'TW', label: 'New Taiwan Dollar', flag: '🇹🇼', localeString: 'zh-TW' },
    { code: 'UAH', countryCode: 'UA', label: 'Ukrainian Hryvnia', flag: '🇺🇦', localeString: 'uk-UA' },
    { code: 'USD', countryCode: 'US', label: 'United States Dollar', flag: '🇺🇸', localeString: 'en-US' },
    { code: 'VND', countryCode: 'VN', label: 'Vietnamese Dong', flag: '🇻🇳', localeString: 'vi-VN' },
    { code: 'ZAR', countryCode: 'ZA', label: 'South African Rand', flag: '🇿🇦', localeString: 'en-ZA' }
  ],

  currentPage: 1,
  currencyFrom: defaultCurrency,
  rawSourceCurrencyAmount: 0,
  sourceCurrencyAmount: 0,
  currencyTo: { code: 'IDR', countryCode: 'ID', label: 'Indonesian Rupiah', flag: '🇮🇩', localeString: 'id-ID' },
  rawDestCurrencyAmount: 0,
  destCurrencyAmount: 0,
  serviceFee: 0,

  requestAmount: 0,
  requestCurrency: defaultCurrency,
  transactionNote: '',

  recipient: { email: '', walletInfo: [] },
  recipientEmail: '',

  setTransactionType: (transaction) => set({ transactionType: transaction }),
  setTransactionNote: (note) => set({ transactionNote: note }),

  setCurrencyFrom: (currency) => set({ currencyFrom: currency }),
  setRawSourceCurrencyAmount: (amount) => set({ rawSourceCurrencyAmount: amount }),
  setSourceCurrencyAmount: (amount) => set({ sourceCurrencyAmount: amount }),
  setCurrencyTo: (currency) => set({ currencyTo: currency }),
  setRawDestCurrencyAmount: (amount) => set({ rawDestCurrencyAmount: amount}),
  setDestCurrencyAmount: (amount) => set({ destCurrencyAmount: amount }),
  setServiceFee: (amount) => set({ serviceFee: amount }),

  setRequestAmount: (amount) => set({ requestAmount: amount }),
  setRequestCurrency: (currency) => set({ requestCurrency: currency }),

  setRecipient: (recipient) => set({ recipient }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setRecipientEmail: (email) => set({ recipientEmail: email }),

  isValidAmountPage: () => {
    const { transactionType, requestAmount, sourceCurrencyAmount } = get();
    if (transactionType == 'transfer') {
      return sourceCurrencyAmount > 0;
    }
    return requestAmount > 0;
  },

  isValidRecipientPage: () => {
    const { recipient } = get();
    return recipient.email.length > 0 && recipient.walletInfo.length > 0;
  },

  setNextPageIfValid: () => {
    const { currentPage, setCurrentPage, isValidAmountPage, isValidRecipientPage } = get();
    const validators: Record<number, () => boolean> = {
      1: isValidRecipientPage,
      2: isValidAmountPage,
    };
    const isValid = validators[currentPage]?.();
    if (isValid) {
      setCurrentPage(currentPage + 1);
    }
  },

  resetRequest: () =>
    set({
      transactionType: null,
      requestAmount: 0,
      requestCurrency: defaultCurrency,
      transactionNote: '',
      recipient: { email: '', walletInfo: [] },
      recipientEmail: '',
    }),

  resetTransfer: () =>
    set({
      transactionType: null,
      currentPage: 1,
      currencyFrom: { code: 'AUD', countryCode: 'AU', label: 'Australian Dollar', flag: '🇦🇺', localeString: 'en-AU' },
      currencyTo: { code: 'IDR', countryCode: 'ID', label: 'Indonesian Rupiah', flag: '🇮🇩', localeString: 'id-ID' },
      rawSourceCurrencyAmount: 0,
      sourceCurrencyAmount: 0,
      rawDestCurrencyAmount: 0,
      destCurrencyAmount: 0,
      recipient: { email: '', walletInfo: [] },
      recipientEmail: '',
    })
}));