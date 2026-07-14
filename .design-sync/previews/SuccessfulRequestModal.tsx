import SuccessfulRequestModal from '@/components/modal/SuccessfulRequestModal';

// Uses useNavigate — DsRouter provider supplies the router.
export const Default = () => (
  <SuccessfulRequestModal amount="$120.00" email="jordan@finpay.com" onClose={() => {}} />
);
