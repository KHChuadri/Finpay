import BankDetails from '@/components/profile/BankDetails';

export const Default = () => (
  <div className="w-[28rem]">
    <BankDetails
      bankDetails={{ bankName: 'Finpay Bank', depositId: 'DEP-8842190', userId: 'USR-4471' }}
      isEditing={false}
      onBankDetailChange={() => {}}
      onChangeBankDetails={() => {}}
    />
  </div>
);
