import ConfirmationModal from '@/components/modal/ConfirmationModal';

export const Default = () => (
  <ConfirmationModal
    message="Closing your balance withdraws all funds and cannot be undone."
    confirmText="Close balance"
    onConfirm={() => {}}
    onCancel={() => {}}
  />
);
