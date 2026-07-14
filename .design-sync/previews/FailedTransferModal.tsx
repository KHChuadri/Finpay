import FailedTransferModal from '@/components/modal/FailedTransferModal';

// Uses useNavigate — the DsRouter provider (cfg.provider) supplies the router.
export const Default = () => (
  <FailedTransferModal errorMsg="The recipient's bank declined the transfer. No funds were moved." />
);
