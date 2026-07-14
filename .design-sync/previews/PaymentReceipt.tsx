// PaymentReceipt reads the transaction + scheduled-payment stores. Seed the
// BUNDLE's store instances (window.FinpayUI.*) — a preview-local import is a
// different store instance the bundled component never reads.
import PaymentReceipt from '@/components/transaction/PaymentReceipt';

const g = (globalThis as unknown as { FinpayUI: Record<string, { setState: (s: unknown) => void }> }).FinpayUI;
g.useTransactionStore.setState({
  rawSourceCurrencyAmount: 1000,
  serviceFee: 5,
  currencyFrom: { code: 'AUD', countryCode: 'AU', label: 'Australian Dollar', flag: '🇦🇺', localeString: 'en-AU' },
  currencyTo: { code: 'IDR', countryCode: 'ID', label: 'Indonesian Rupiah', flag: '🇮🇩', localeString: 'id-ID' },
  destCurrencyAmount: 10281030,
  recipient: { email: 'jordan@finpay.com', walletInfo: [] },
});
g.scheduledPaymentStore.setState({ scheduleStatus: 'Sends Now' });

export const Default = () => <PaymentReceipt />;
