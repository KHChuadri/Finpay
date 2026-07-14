import { useState, useMemo } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import ReactCountryFlag from 'react-country-flag';
import { useTransactionStore } from '@/stores/transactionStore';
import useAuthStore from '@/stores/authStore';
import type { UserWalletInfo } from "@/pages/Dashboard";
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface AddCurrencyModalProps {
  onClose: () => void;
  onAddCurrency: (newCurrency: UserWalletInfo) => void;
}

const AddCurrencyModal = ({ onClose, onAddCurrency }: AddCurrencyModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null);
  const currencyList = useTransactionStore((c) => c.currencies);

  const filteredCurrencies = useMemo(() => {
    return currencyList.filter(currency =>
      currency.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      currency.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      currency.countryCode.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, currencyList]);

  const handleAddCurrency = () => {
    if (!selectedCurrency) return;

    const currency = currencyList.find(curr => curr.code === selectedCurrency);
    if (currency) {
      onAddCurrency({
        userId: useAuthStore.getState().userId || "",
        countryCode: currency.countryCode,
        currencyName: currency.label,
        walletCurrency: currency.code,
        walletBalance: 0
      });
    }
  };

  return (
    <div data-testid="add-currency-dialog" className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs z-50">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="relative flex items-center justify-center p-4 border-b border-border shadow-xs">
          <h2 className="text-2xl font-bold text-foreground text-center w-full">
            Add a balance
          </h2>
          <button
            onClick={onClose}
            aria-label="add-currency-close"
            className="absolute right-6 text-muted-foreground hover:text-foreground transition-colors duration-300 cursor-pointer"
          >
            <FiX size={26} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6">
          <div className="relative">
            <div className="absolute flex items-center inset-y-0 left-0 pl-3 pointer-events-none">
              <FiSearch className="text-muted-foreground" />
            </div>
            <Input
              type="text"
              placeholder="Search currencies..."
              data-testid="currency-filter"
              className="pl-10 pr-4 py-3"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Currency List */}
        <div className="max-h-[400px] overflow-y-auto">
          {filteredCurrencies.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No currencies found
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filteredCurrencies.map((currency) => (
                <li key={currency.code}>
                  <button
                    onClick={() => setSelectedCurrency(currency.code)}
                    aria-label="select-specific-currency"
                    className={`flex items-center w-full px-6 py-4 hover:bg-primary/10 transition-colors cursor-pointer ${selectedCurrency === currency.code ? 'bg-primary/10' : ''
                      }`}
                  >
                    <ReactCountryFlag
                      countryCode={currency.countryCode}
                      svg
                      style={{
                        width: '2em',
                        height: '1.5em',
                        marginRight: '1em',
                        borderRadius: '2px',
                        boxShadow: '0 0 0 1px rgba(0,0,0,0.1)'
                      }}
                    />
                    <div className="text-left">
                      <p className="font-medium text-foreground">{currency.label}</p>
                      <p className="text-sm text-muted-foreground">{currency.code}</p>
                    </div>
                    {selectedCurrency === currency.code && (
                      <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary-foreground"></div>
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border shadow-xs">
          {/* Add balance button */}
          <Button
            onClick={handleAddCurrency}
            disabled={!selectedCurrency}
            aria-label="add-specific-currency"
            className="w-full py-3"
          >
            Add balance
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddCurrencyModal;