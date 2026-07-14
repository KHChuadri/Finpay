// Renders PaymentReceipt (reads the transaction store) and navigates on action.
// Seed the BUNDLE's stores via the global; DsRouter provider supplies the router.
import SuccessfulTransferModal from '@/components/modal/SuccessfulTransferModal';

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

export const Default = () => <SuccessfulTransferModal />;
