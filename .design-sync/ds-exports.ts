// Named-export barrel for design-sync. The feature components are all `export
// default`, which synth-entry `export *` drops — re-export them as named so
// they land on window.FinpayUI. Referenced via cfg.extraEntries.

// Router wrapper + stores exported from the bundle so previews share the
// bundle's react-router/zustand instances (a preview's own copy has a
// different context/store identity and can't reach the bundled components).
// DsRouter is the cfg.provider that wraps every preview; the stores let
// store-driven previews seed data via window.FinpayUI.<store>.setState.
export { MemoryRouter as DsRouter } from 'react-router-dom';
export { useTransactionStore } from '../frontend/src/stores/transactionStore';
export { default as scheduledPaymentStore } from '../frontend/src/stores/scheduledPaymentStore';
export { default as PaymentReceipt } from '../frontend/src/components/transaction/PaymentReceipt';
export { default as RecipientInfo } from '../frontend/src/components/transaction/RecipientInfo';
export { default as ExchangeRate } from '../frontend/src/components/transaction/ExchangeRate';
export { default as RequestMoney } from '../frontend/src/components/landing/RequestMoney';
export { default as SendMoney } from '../frontend/src/components/landing/SendMoney';
export { default as ErrorModal } from '../frontend/src/components/admin/ErrorModal';
export { default as SuccessModal } from '../frontend/src/components/admin/SuccessModal';
export { default as FlyoutLink } from '../frontend/src/components/dashboard/FlyoutLink';
export { default as ListGroup } from '../frontend/src/components/dashboard/ListGroup';
export { default as ManageMembers } from '../frontend/src/components/SplitBill/Members';
export { default as LeaveGroupModal } from '../frontend/src/components/SplitBill/LeaveGroupModal';
export { default as BankDetails } from '../frontend/src/components/profile/BankDetails';
export { default as PersonalDetails } from '../frontend/src/components/profile/PersonalDetails';
export { default as ConfirmationModal } from '../frontend/src/components/modal/ConfirmationModal';
export { default as SuccessfulTransferModal } from '../frontend/src/components/modal/SuccessfulTransferModal';
export { default as SuccessfulRequestModal } from '../frontend/src/components/modal/SuccessfulRequestModal';
export { default as SuccessfulTopupModal } from '../frontend/src/components/modal/SuccessfulTopupModal';
export { default as FailedTransferModal } from '../frontend/src/components/modal/FailedTransferModal';
export { default as FailedRequestModal } from '../frontend/src/components/modal/FailedRequestModal';
export { default as HistoryFilterModal } from '../frontend/src/components/modal/HistoryFilterModal';
