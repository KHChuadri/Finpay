import { useState, useMemo } from 'react';
import { Search, X, Check } from 'lucide-react';
import ReactCountryFlag from 'react-country-flag';
import { useTransactionStore } from '@/stores/transactionStore';
import useAuthStore from '@/stores/authStore';
import type { UserWalletInfo } from "@/pages/Dashboard";
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

interface AddCurrencyModalProps {
  onClose: () => void;
  onAddCurrency: (newCurrency: UserWalletInfo) => void;
}

const POPULAR_CODES = ['USD', 'EUR', 'GBP', 'AUD', 'JPY', 'SGD'];

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

  const popularCurrencies = useMemo(
    () => filteredCurrencies.filter((currency) => POPULAR_CODES.includes(currency.code)),
    [filteredCurrencies]
  );

  const otherCurrencies = useMemo(
    () => filteredCurrencies.filter((currency) => !POPULAR_CODES.includes(currency.code)),
    [filteredCurrencies]
  );

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

  const renderCurrencyRow = (currency: (typeof currencyList)[number]) => {
    const isSelected = selectedCurrency === currency.code;
    return (
      <li key={currency.code}>
        <button
          onClick={() => setSelectedCurrency(currency.code)}
          aria-label="select-specific-currency"
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-[10px] transition-colors cursor-pointer border border-transparent',
            isSelected ? 'bg-green-tint border-green-tint-border' : 'hover:bg-hover'
          )}
        >
          <ReactCountryFlag
            countryCode={currency.countryCode}
            svg
            style={{ width: '1.5em', height: '1.1em', borderRadius: '2px' }}
          />
          <div className="text-left flex-1 min-w-0">
            <p className="text-foreground text-sm truncate">{currency.label}</p>
            <p className="num text-muted-foreground text-xs">{currency.code}</p>
          </div>
          <div
            className={cn(
              'h-4 w-4 shrink-0 rounded-full border flex items-center justify-center',
              isSelected ? 'bg-primary border-primary' : 'border-border-strong'
            )}
          >
            {isSelected && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
          </div>
        </button>
      </li>
    );
  };

  return (
    <div
      data-testid="add-currency-dialog"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(6,7,9,.5)] backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-[#17181C] border border-border-strong rounded-[16px] shadow-[0_30px_70px_-25px_rgba(0,0,0,.8)] w-[388px] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Sticky header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-strong">
          <h2 className="text-[16px] font-semibold text-foreground">Add a balance</h2>
          <button
            onClick={onClose}
            aria-label="add-currency-close"
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-4">
          <Input
            type="text"
            placeholder="Search currency or country…"
            data-testid="currency-filter"
            icon={<Search className="w-4 h-4" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Scroll body */}
        <div className="max-h-[400px] overflow-y-auto px-2 pb-2">
          {filteredCurrencies.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              No currencies found
            </div>
          ) : (
            <>
              {popularCurrencies.length > 0 && (
                <>
                  <p className="text-[10px] text-subtle font-mono tracking-wider px-3 py-1 uppercase">
                    Popular
                  </p>
                  <ul>{popularCurrencies.map(renderCurrencyRow)}</ul>
                </>
              )}
              {otherCurrencies.length > 0 && (
                <>
                  <p className="text-[10px] text-subtle font-mono tracking-wider px-3 py-1 uppercase">
                    All currencies
                  </p>
                  <ul>{otherCurrencies.map(renderCurrencyRow)}</ul>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border-strong">
          <Button
            onClick={handleAddCurrency}
            disabled={!selectedCurrency}
            aria-label="add-specific-currency"
            className="w-full"
          >
            {selectedCurrency ? `Add ${selectedCurrency} wallet` : 'Add wallet'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddCurrencyModal;
