import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage.tsx';
import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';
import Dashboard from './pages/Dashboard.tsx';
import History from './pages/History.tsx';
import TransferAmount from './components/transaction/TransferAmount.tsx';
import Recipient from './components/transaction/Recipient.tsx';
import RequestAmount from './components/transaction/RequestAmount.tsx';
import Pay from './components/transaction/Pay.tsx';
import Request from './components/transaction/Request.tsx';
import ForgotPassword from './pages/ForgotPassword.tsx';
import ResetPassword from './pages/ResetPassword.tsx';
import ProtectedRoute from './ProtectedRoute.tsx';
import AdminPage from './pages/AdminPage.tsx';
import MultiWallet from './pages/MultiWallet.tsx';
import ProfilePage from './pages/ProfilePage.tsx';
import SplitBill from './pages/SplitBill.tsx';
import ManageGroup from './pages/ManageGroup.tsx';
import GroupPage from './pages/GroupPage.tsx';
import GroupInvite from './pages/GroupInvite.tsx';
import CreateGroup from './pages/CreateGroup.tsx';
import Notification from './pages/Notification.tsx';
import CurrencyWalletPage from './pages/CurrencyWalletPage';
import GroupHistory from './pages/GroupHistory.tsx';
import RequestListPage from './pages/RequestListPage.tsx';
import Deposit from './components/transaction/Deposit.tsx';
import Withdraw from './components/transaction/Withdraw.tsx';
import GroupTopUp from './components/SplitBill/GroupTopUp.tsx';
import CurrencyConversionPage from './pages/CurrencyConversionPage.tsx';
import SavedRecipient from './components/transaction/SavedRecipient.tsx';
import ViewScheduledPayments from './pages/ViewScheduledPayments.tsx';
import ChallengesList from './pages/ChallengesList.tsx';
import AdminLogin from './components/admin/AdminLogin.tsx';
import GroupPay from './components/SplitBill/GroupPay.tsx';
import GroupRecipient from './components/SplitBill/GroupRecipient.tsx';
import GroupWithdraw from './components/SplitBill/GroupWithdraw.tsx';

const Router = () => {
  return (
    <>
      <Routes>
        <Route path='/' element={<ProtectedRoute auth><LandingPage /></ProtectedRoute>} />
        <Route path='/admin/login' element={<ProtectedRoute auth><AdminLogin /></ProtectedRoute>} />
        <Route path='login' element={<ProtectedRoute auth><Login /></ProtectedRoute>} />
        <Route path='register' element={<ProtectedRoute auth><Register /></ProtectedRoute>} />
        <Route path='dashboard' element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path='groups' element={<SplitBill />} />
        <Route path='groups/list' element={<ManageGroup />} />
        <Route path='groups/:groupId/invite' element={<GroupInvite />} />
        <Route path='groups/list/create' element={<CreateGroup />} />
        <Route path='notification' element={<Notification />} />
        <Route path="/groups/:groupId" element={<GroupPage />} />
        <Route path="/groups/topup/:groupId/pay" element={<GroupPay />} />
        <Route path="/groups/topup/:groupId/recipient" element={<GroupRecipient />} />
        <Route path="/groups/topup/:groupId/amount" element={<GroupTopUp />} />
        <Route path="/groups/withdraw/:groupId/pay" element={<GroupPay />} />
        <Route path="/groups/withdraw/:groupId/recipient" element={<GroupRecipient />} />
        <Route path="/groups/withdraw/:groupId/amount" element={<GroupWithdraw />} />
        <Route path="/groups/:groupId/history" element={<GroupHistory />} />
        <Route path='history' element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/deposit" element={<ProtectedRoute><Deposit /></ProtectedRoute>} />
        <Route path="/withdraw" element={<ProtectedRoute><Withdraw /></ProtectedRoute>} />
        <Route path='transfer/recipient' element={<ProtectedRoute><Recipient /></ProtectedRoute>} />
        <Route path='transfer/amount' element={<ProtectedRoute><TransferAmount /></ProtectedRoute>} />
        <Route path='transfer/pay' element={<ProtectedRoute><Pay /></ProtectedRoute>} />
        <Route path='transfer/recipient/search' element={<SavedRecipient />} />
        <Route path='request/recipient' element={<ProtectedRoute><Recipient /></ProtectedRoute>} />
        <Route path='request/amount' element={<ProtectedRoute><RequestAmount /></ProtectedRoute>} />
        <Route path='request/details' element={<ProtectedRoute><Request /></ProtectedRoute>} />
        <Route path='request/list' element={<ProtectedRoute><RequestListPage /></ProtectedRoute>} />
        <Route path='request/recipient/search' element={<SavedRecipient />} />
        <Route path='forgotpassword' element={<ForgotPassword />} />
        <Route path='reset-password/:token' element={<ResetPassword />} />
        <Route path='admin' element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        <Route path='multi-wallet' element={<MultiWallet />} />
        <Route path='profile' element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path='currencywallet/:currencyCode' element={<ProtectedRoute><CurrencyWalletPage /></ProtectedRoute>} />
        <Route path='/conversion' element={<ProtectedRoute><CurrencyConversionPage /></ProtectedRoute>} />
        <Route path='view/scheduledPayments' element={<ProtectedRoute><ViewScheduledPayments /></ProtectedRoute>} />
        <Route path='view/challenges' element={<ProtectedRoute><ChallengesList /></ProtectedRoute>} />
      </Routes>
    </>
  )
}

export default Router;
