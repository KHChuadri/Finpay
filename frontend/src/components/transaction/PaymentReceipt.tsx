import { useTransactionStore } from "@/stores/transactionStore";
import useScheduledPaymentStore from "@/stores/scheduledPaymentStore";

const PaymentReceipt = () => {
  const { rawSourceCurrencyAmount, currencyFrom, currencyTo, destCurrencyAmount, recipient, serviceFee } = useTransactionStore();
  const { scheduleStatus } = useScheduledPaymentStore();

  const convertedAmount = rawSourceCurrencyAmount - serviceFee;
  const rate = convertedAmount > 0 ? destCurrencyAmount / convertedAmount : 0;

  return (
    <div className="bg-muted rounded-lg border p-6 w-full max-w-sm text-sm space-y-4">
      <h3 className="text-muted-foreground font-semibold">Transfer details</h3>
      <div className="flex justify-between">
        <span>You send exactly</span>
        <span className="font-bold">
          {rawSourceCurrencyAmount.toFixed(2)} {currencyFrom?.code}
        </span>
      </div>
      <div className="flex justify-between text-muted-foreground">
        <span>Total fees (included)</span>
        <span>{serviceFee} {currencyFrom?.code}</span>
      </div>
      <div className="flex justify-between">
        <span>Total amount we&apos;ll convert</span>
        <span>{convertedAmount.toFixed(2)} {currencyFrom?.code}</span>
      </div>
      <div className="flex justify-between">
        <span>Guaranteed rate (15 hours)</span>
        <span className="text-right">
          1 {currencyFrom?.code} = {rate.toLocaleString('id-ID', { maximumFractionDigits: 2 })} {currencyTo?.code}
        </span>
      </div>
      <div className="flex justify-between font-semibold">
        <span>Recipient gets</span>
        <span>
          {destCurrencyAmount.toLocaleString('id-ID')} {currencyTo?.code}
        </span>
      </div>
      <div className="flex justify-between text-muted-foreground">
        <span>Should arrive</span>
        {scheduleStatus === 'Sends Now' ? <span>in seconds</span> : <span>{scheduleStatus}</span>}
      </div>

      <h3 className="pt-4 text-muted-foreground font-semibold">Recipient details</h3>
      <div className="flex justify-between">
        <span>Account holder name</span>
        <span>{recipient.email}</span>
      </div>
      <div className="flex justify-between">
        <span>Account provider</span>
        <span>Finpay</span>
      </div>
    </div>
  )
}

export default PaymentReceipt;