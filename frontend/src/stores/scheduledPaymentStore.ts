import { create } from 'zustand';
import { Dayjs } from 'dayjs';

interface ScheduledPaymentStore {
  showScheduledPaymentModal: boolean;
  paymentDate: Dayjs | null;
  scheduleStatus: string;
  recurringStatus: string;
  resetSchedulePayment: boolean;
  weeklyRecurring: boolean;
  fortnitelyRecurring: boolean;
  monthlyRecurring: boolean;
  annuallyRecurring: boolean;

  setShowScheduledPaymentModal: (showScheduledPaymentModal: boolean) => void;
  setPaymentDate: (paymentDate: Dayjs) => void;
  setScheduleStatus: (scheduleStatus: string) => void;
  setRecurringStatus: (recurringStatus: string) => void;
  resetScheduledPayment: () => void;
  setWeeklyRecurring: (weeklyRecurring: boolean) => void;
  setFortnitelyRecurring: (fortnitelyRecurring: boolean) => void;
  setMonthlyRecurring: (monthlyRecurring: boolean) => void;
  setAnnuallyRecurring: (annuallyRecurring: boolean) => void;
}

const useScheduledPaymentStore = create<ScheduledPaymentStore>((set) => ({
  showScheduledPaymentModal: false,
  paymentDate: null,
  scheduleStatus: 'Send immediately',
  recurringStatus: 'Non-reccurring',
  resetSchedulePayment: false,
  weeklyRecurring: false,
  fortnitelyRecurring: false,
  monthlyRecurring: false,
  annuallyRecurring: false,

  setShowScheduledPaymentModal: (showScheduledPaymentModal) => set({ showScheduledPaymentModal }),
  setPaymentDate: (paymentDate) => {set({ paymentDate })},
  setScheduleStatus: (scheduleStatus) => set({ scheduleStatus }),
  setRecurringStatus: (recurringStatus) => set({ recurringStatus }),
  resetScheduledPayment: () =>
    set({
      resetSchedulePayment: false,
      showScheduledPaymentModal: false,
      paymentDate: null,
      scheduleStatus: 'Send immediately',
      recurringStatus: 'Non-reccurring',
      weeklyRecurring: false,
      fortnitelyRecurring: false,
      monthlyRecurring: false,
      annuallyRecurring: false,
    }),

  setWeeklyRecurring: (value) =>
    set({
      weeklyRecurring: value,
      fortnitelyRecurring: false,
      monthlyRecurring: false,
      annuallyRecurring: false,
      recurringStatus: 'Payment Repeats Weekly',
    }),

  setFortnitelyRecurring: (value) =>
    set({
      weeklyRecurring: false,
      fortnitelyRecurring: value,
      monthlyRecurring: false,
      annuallyRecurring: false,
      recurringStatus: 'Payment Repeats Fortnitely',
    }),

  setMonthlyRecurring: (value) =>
    set({
      weeklyRecurring: false,
      fortnitelyRecurring: false,
      monthlyRecurring: value,
      annuallyRecurring: false,
      recurringStatus: 'Payment Repeats Monthly',
    }),

  setAnnuallyRecurring: (value) =>
    set({
      weeklyRecurring: false,
      fortnitelyRecurring: false,
      monthlyRecurring: false,
      annuallyRecurring: value,
      recurringStatus: 'Payment Repeats Annually',
    }),
}));

export default useScheduledPaymentStore;
