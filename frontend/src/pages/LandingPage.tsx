import { ArrowRightIcon, BoltIcon, ShieldCheckIcon, CurrencyDollarIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

import Layout from '../components/Layout';
import SendMoneyCard from '../components/landing/SendMoney';
import RequestMoneyCard from '../components/landing/RequestMoney';
import { Button } from '@/components/ui/Button';

const LandingPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('send'); // 'send money' or 'request money'
  const [transferCompleted, setTransferCompleted] = useState(false);

  const handleTransfer = () => {
    setTransferCompleted(true);
  };

  const headerButtons = (
    <div className="flex items-center gap-4">
      <Button variant="ghost" onClick={() => navigate('/login')}>Login</Button>

      <Button onClick={() => navigate('/register')}>Sign Up</Button>
    </div>
  );

  return (
    <Layout headerRight={headerButtons}>
      {/* Main Content */}
      <section className="container flex flex-col flex-grow md:flex-row md:gap-8 mx-auto px-6 py-16 md:py-24">
        {/* Landing Text */}
        <div className="flex flex-col justify-between md:w-1/2 mb-12 md:mb-0 min-h-[700px]">
          {/* Top Content */}
          <div>
            <h1 data-testid="exchange-smarter" className="text-4xl md:text-5xl font-bold text-foreground leading-tight mb-4">
              Exchange Smarter.<br />
              Transfer Faster.
            </h1>

            <p className="text-lg text-muted-foreground mb-4">
              The modern way to send money globally with real-time exchange rates and low fees.
              Join thousands of users who trust FinPay for their international transfers.
            </p>

            <div className="flex flex-col sm:flex-row">
              <Button
                className="flex items-center justify-center px-8 py-3"
                onClick={() => navigate('/register')}
              >
                Get Started <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Features Section */}
          <div className="bg-card border border-border p-4 rounded-xl flex flex-col gap-4 mt-8">
            <p data-testid="why-choose-finpay" className="text-2xl font-bold text-center text-foreground">
              Why Choose FinPay?
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-muted p-4 rounded-xl">
                <BoltIcon className="h-10 w-10 text-primary mb-2" />
                <h3 className="text-xl text-foreground font-semibold mb-2">Real-Time Transfers</h3>
                <p className="text-muted-foreground">Send money internationally in minutes, not days, with our PayTo integration.</p>
              </div>
              <div className="bg-muted p-4 rounded-xl">
                <CurrencyDollarIcon className="h-10 w-10 text-primary mb-2" />
                <h3 className="text-xl text-foreground font-semibold mb-2">Low, Transparent Fees</h3>
                <p className="text-muted-foreground">Always know what you&apos;ll pay with no hidden charges or bad exchange rates.</p>
              </div>
              <div className="bg-muted p-4 rounded-xl">
                <GlobeAltIcon className="h-10 w-10 text-primary mb-2" />
                <h3 className="text-xl text-foreground font-semibold mb-2">50+ Currencies</h3>
                <p className="text-muted-foreground">Hold, exchange, and send multiple currencies all in one account.</p>
              </div>
              <div className="bg-muted p-4 rounded-xl">
                <ShieldCheckIcon className="h-10 w-10 text-primary mb-2" />
                <h3 className="text-xl text-foreground font-semibold mb-2">Secure and Reliable</h3>
                <p className="text-muted-foreground">We take your safety seriously. Every transfer is backed by security controls.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card Container */}
        <div className="md:w-1/2">
          <div className="relative flex mb-4 rounded-full bg-muted shadow-md border border-border overflow-hidden">
            {/* Slider */}
            <div
              className={`absolute top-0 bottom-0 w-1/2 bg-card rounded-full transition-all duration-300 ease-in-out ${activeTab === 'send' ? 'left-0' : 'left-1/2'
                }`}
            />

            {/* Send Money Button */}
            <button
              onClick={() => {
                setActiveTab('send');
                setTransferCompleted(false);
              }}
              className={`flex-1 z-10 py-3 px-4 font-semibold rounded-full transition-colors duration-200 ${activeTab === 'send'
                ? 'text-primary font-semibold'
                : 'text-muted-foreground hover:bg-accent'
                }`}
            >
              Send Money
            </button>

            {/* Request Money Button */}
            <button
              onClick={() => {
                setActiveTab('request');
                setTransferCompleted(false);
              }}
              className={`flex-1 z-10 py-3 px-4 font-semibold rounded-full transition-colors duration-200 ${activeTab === 'request'
                ? 'text-primary font-semibold'
                : 'text-muted-foreground hover:bg-accent'
                }`}
            >
              Request Money
            </button>
          </div>

          <div className="bg-card border border-border p-6 rounded-xl">
            {activeTab === 'send' && <SendMoneyCard transferCompleted={transferCompleted} onTransfer={handleTransfer} />}
            {activeTab === 'request' && <RequestMoneyCard transferCompleted={transferCompleted} onTransfer={handleTransfer} />}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default LandingPage;
