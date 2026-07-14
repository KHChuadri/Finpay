import ExchangeRate from '@/components/transaction/ExchangeRate';

export const Loaded = () => <ExchangeRate rate={10381.03} hasExchanged={true} />;
export const Loading = () => <ExchangeRate rate={0} hasExchanged={false} />;
