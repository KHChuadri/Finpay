import ErrorModal from '@/components/admin/ErrorModal';

export const Default = () => (
  <ErrorModal message="We couldn't verify the admin challenge. Please try again." onClose={() => {}} />
);
