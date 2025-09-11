import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useTransactionStore } from '@/stores/transactionStore';
import type { Currency } from '@/stores/transactionStore';

interface CurrenciesProps {
  currCurrency: Currency | null,
  isOpen: boolean,
  setIsOpen: (open: boolean) => void;
  handleSelectCurrency: (currency: Currency) => void;
}

const Currencies = ({ currCurrency, isOpen, setIsOpen, handleSelectCurrency }: CurrenciesProps) => {
  const { currencies } = useTransactionStore();

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center bg-gray-100 rounded-full px-3 py-1 mr-3 text-sm font-medium cursor-pointer">
          {currCurrency?.flag ?? '🇦🇺'} <span className="ml-1">{currCurrency?.code ?? 'AUD'}</span> <span className="ml-1">▼</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <Command>
          <CommandInput placeholder='Search country' />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {currencies.map((currency) => (
                <CommandItem
                  key={currency.code}
                  onSelect={() => handleSelectCurrency(currency)}
                >
                  {currency.flag} {currency.code} – {currency.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default Currencies;