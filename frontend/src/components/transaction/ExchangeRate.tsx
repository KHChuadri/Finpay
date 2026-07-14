import { useTransactionStore } from "@/stores/transactionStore";
import { ClipLoader } from "react-spinners";

interface ExchangeRateProps {
  rate: number,
  hasExchanged: boolean
}

const ExchangeRate = ({ rate, hasExchanged }: ExchangeRateProps) => {
  const { currencyFrom, currencyTo } = useTransactionStore();
  return (
    <div className="text-sm text-right bg-muted rounded-full px-2 py-0.5 mt-2 max-w-max font-sans">
      <p>1 {currencyFrom?.code ?? 'AUD'} = {hasExchanged ? (
        `${Number(rate).toLocaleString(currencyTo?.localeString, {
            minimumFractionDigits: 8,
            maximumFractionDigits: 8
          })} ${currencyTo?.code ?? 'IDR'}`) : (
        <ClipLoader
          color='black'
          size={10}
          aria-label="Loading Spinner"
          data-testid="loader"
        />
      )
      }</p>
    </div>
  )
}

export default ExchangeRate;