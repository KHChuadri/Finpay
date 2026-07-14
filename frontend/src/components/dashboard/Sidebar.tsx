import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Home, Wallet, ArrowLeftRight, Inbox, Users, Search, MoreVertical, ChevronsUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Kbd } from '@/components/ui/Kbd';
import { Pill } from '@/components/ui/Pill';
import useAuthStore from '@/stores/authStore';
import { API_URL } from '@/constants/API_URL';

interface SidebarWallet {
  walletCurrency: string;
  walletBalance: number;
}

const navItems = [
  { label: 'Home', icon: Home, route: '/dashboard' },
  { label: 'Wallets', icon: Wallet, route: '/dashboard' },
  { label: 'Transactions', icon: ArrowLeftRight, route: '/history' },
  { label: 'Requests', icon: Inbox, route: '/request/list', count: 3 },
  { label: 'Groups', icon: Users, route: '/groups' },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const userId = useAuthStore((state) => state.userId);
  const token = useAuthStore((state) => state.token);
  const email = useAuthStore((state) => state.email);
  const isVerified = useAuthStore((state) => state.isVerified);
  const [wallets, setWallets] = useState<SidebarWallet[]>([]);

  // ponytail: independent fetch; hoist to a store if it becomes a perf issue
  useEffect(() => {
    if (!userId || !token) return;
    axios
      .get(`${API_URL}/wallet/${userId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setWallets(res.data.wallets ?? []))
      .catch(() => setWallets([]));
  }, [userId, token]);

  const initials = email ? email.slice(0, 2).toUpperCase() : 'JD';
  const displayName = email ?? 'User';

  return (
    <aside className="flex w-[236px] shrink-0 flex-col border-r border-border bg-panel">
      <button
        type="button"
        data-testid="finpay-header-logo"
        onClick={() => navigate('/dashboard')}
        className="flex cursor-pointer items-center gap-2 px-4 py-4"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-primary text-sm font-semibold text-primary-foreground">
          F
        </span>
        <span className="text-sm font-semibold">Finpay</span>
        <ChevronsUpDown className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
      </button>

      <div className="px-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="w-full justify-between"
          onClick={() => {}}
        >
          <span className="flex items-center gap-2 text-muted-foreground">
            <Search className="h-3.5 w-3.5" />
            Search
          </span>
          <Kbd>⌘K</Kbd>
        </Button>
      </div>

      <nav className="mt-4 flex flex-col gap-0.5 px-3">
        {navItems.map(({ label, icon: Icon, route, count }) => {
          const active = pathname === route;
          return (
            <button
              key={label}
              type="button"
              onClick={() => navigate(route)}
              className={cn(
                'flex items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-[13px] font-medium',
                active ? 'bg-card2 text-foreground' : 'text-muted-foreground hover:bg-hover',
              )}
            >
              <Icon className={cn('h-4 w-4', active ? 'text-primary' : 'text-muted-foreground')} />
              <span className="flex-1 text-left">{label}</span>
              {count !== undefined && <Pill tone="neutral">{count}</Pill>}
            </button>
          );
        })}
      </nav>

      <div className="mt-5 px-3">
        <p className="px-2.5 text-[10px] font-mono tracking-wider text-subtle">WALLETS</p>
        <div className="mt-1.5 flex flex-col gap-1">
          {wallets.slice(0, 3).map((wallet) => (
            <div key={wallet.walletCurrency} className="flex items-center gap-2 rounded-[8px] px-2.5 py-1.5 text-[13px]">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-card2 text-[9px] font-mono text-muted-foreground">
                {wallet.walletCurrency.slice(0, 2).toUpperCase()}
              </span>
              <span className="num flex-1 text-muted-foreground">{wallet.walletCurrency}</span>
              <span className="num text-foreground">{wallet.walletBalance.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2 border-t border-border px-3 py-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-card2 to-hover text-[11px] font-semibold text-foreground">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-foreground">{displayName}</p>
          {isVerified && (
            <Pill tone="positive" dot className="mt-0.5">
              Verified
            </Pill>
          )}
        </div>
        <button type="button" className="shrink-0 rounded-[6px] p-1 text-muted-foreground hover:bg-hover">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
