import useScheduledPaymentStore from "@/stores/scheduledPaymentStore";
import { LocalizationProvider, MobileTimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import dayjs from "dayjs";
import { useState } from "react";
import { Button } from '@/components/ui/Button';

interface ScheduledPaymentModal {
  setSuccess: () => void;
}

const ScheduledPayment = ({setSuccess}: ScheduledPaymentModal) => {
  const {
    setShowScheduledPaymentModal,
    setPaymentDate,
    paymentDate,
    resetScheduledPayment,
    setScheduleStatus,
  } = useScheduledPaymentStore();

  const [errorMsg, setErrorMsg] = useState("");

  const handleUpdateScheduledPayment = async () => {
    if (paymentDate?.isBefore(dayjs())) {
      setErrorMsg(`To schedule payment, scheduled date must be later than right now.\n Received: ${dayjs(paymentDate)}`);
    } else {
      setScheduleStatus(`Will be sent at ${dayjs(paymentDate).format("MMMM D, YYYY h:mm A")}`);
      setSuccess();
      setShowScheduledPaymentModal(false);
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md p-6 mx-4">
        <div className="flex flex-col items-center gap-1">
          <div className="flex flex-col justify-between w-full">
            <h1 className="font-bold text-2xl">Schedule a payment</h1>
            {errorMsg && <p className="text-destructive">{errorMsg}</p>}
          </div>
          <div className="flex flex-col w-full items-left gap-2">
            <div className="w-full border-b border-border">
              <h2 className="font-bold text-xl">Date</h2>
            </div>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <div className="flex flex-col justify-center items-center align-center w-full mb-2">
                <DateCalendar value={paymentDate} onChange={(newValue) => newValue && setPaymentDate(newValue)}/>
                <MobileTimePicker value={paymentDate} onChange={(newValue) => newValue && setPaymentDate(newValue)} />
              </div>
            </LocalizationProvider>
            <div className="flex flex-col w-full items-left">
              <div className="w-full border-b border-border mb-4">
                <h2 className="font-bold text-xl">Type of Transaction</h2>
              </div>
            </div>

            <div className="flex flex-row gap-5">
              <button
                className="w-full mt-3 border border-primary hover:bg-primary hover:text-primary-foreground text-primary font-semibold py-3 rounded-md cursor-pointer"
                onClick={() => resetScheduledPayment()}
              >
                Reset
              </button>
              <Button
                className="w-full mt-3 py-3"
                onClick={() => handleUpdateScheduledPayment()}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduledPayment;
