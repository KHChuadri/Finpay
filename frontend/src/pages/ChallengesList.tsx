import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import HeaderButtons from '../components/dashboard/HeaderButtons';
import { Search, Trophy, Calendar, Coins, Play, CheckCircle2, Clock } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import axios from 'axios';
import { API_URL } from '@/constants/API_URL';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface Challenge {
  _id: string;
  title: string;
  description: string;
  exp: number;
  startDate: string;
  endDate: string;
  category: 'pay' | 'receive' | 'save';
  progress: number;
  amountToGoal: number;
}

interface UserChallengeProgress {
  _id: string;
  userId: string;
  challengeId: string;
  progress: number;
  completed: boolean;
  lastCheckedDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface ChallengeWithProgress extends Challenge {
  userProgress?: UserChallengeProgress;
  currentProgress: number;
  isCompleted: boolean;
  hasStarted: boolean;
}

// Updated API response interface to match what the backend likely returns
interface ChallengeResponse {
  _id: string;
  title: string;
  description: string;
  exp: number;
  startDate: string;
  endDate: string;
  category: 'pay' | 'receive' | 'save';
  progress: number;
  amountToGoal: number;
  userProgress?: UserChallengeProgress[];
}

const ChallengesList = () => {
  const userId = useAuthStore.getState().userId;
  const [search, setSearch] = useState('');
  const [challenges, setChallenges] = useState<ChallengeResponse[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeSection, setActiveSection] = useState<'available' | 'inProgress' | 'completed'>('available');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchChallenges = async () => {
    try {
      const response = await axios.get(`${API_URL}/challenges/${userId}`);
      
      if (response.data.success) {
        setChallenges(response.data.challenge);
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.errorMsg || 'Transaction Failed';
        setErrorMsg(msg);
      } else {
        setErrorMsg('An unexpected error occurred')
      }
   } 
  }

  useEffect(() => {
    fetchChallenges();
  }, []); // Added userId as dependency

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'pay':
        return '💳';
      case 'receive':
        return '💰';
      case 'save':
        return '🏦';
      default:
        return '🎯';
    }
  };

  const calculateProgress = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };

  const isExpired = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

  // Combine challenges with their progress data - FIXED
  const challengesWithProgress: ChallengeWithProgress[] = challenges.map(challenge => {
    // Fixed: Look for userProgress within the challenge object or array
    const userProgress = Array.isArray(challenge.userProgress) 
      ? challenge.userProgress.find(up => up.challengeId === challenge._id)
      : challenge.userProgress;
    
    const currentProgress = userProgress ? userProgress.progress : 0;
    const isCompleted = userProgress ? userProgress.completed : false;
    const hasStarted = !!userProgress;

    return {
      ...challenge,
      userProgress,
      currentProgress,
      isCompleted,
      hasStarted
    };
  });

  // Filter challenges
  const filteredChallenges = challengesWithProgress.filter(challenge => {
    const matchesSearch = (challenge.title?.toLowerCase() || '').includes(search.toLowerCase()) ||
                         (challenge.description?.toLowerCase() || '').includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || challenge.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Separate challenges into sections
  const availableChallenges = filteredChallenges.filter(c => 
    !c.hasStarted && !isExpired(c.endDate)
  );
  
  const inProgressChallenges = filteredChallenges.filter(c => 
    c.hasStarted && !c.isCompleted && !isExpired(c.endDate)
  );
  
  const completedChallenges = filteredChallenges.filter(c => 
    c.isCompleted
  );

  const expiredChallenges = filteredChallenges.filter(c => 
    isExpired(c.endDate) && !c.isCompleted
  );

  const getSectionChallenges = () => {
    switch (activeSection) {
      case 'available':
        return availableChallenges;
      case 'inProgress':
        return inProgressChallenges;
      case 'completed':
        return [...completedChallenges, ...expiredChallenges];
      default:
        return availableChallenges;
    }
  };

  const getSectionEmptyMessage = () => {
    switch (activeSection) {
      case 'available':
        return {
          emoji: '🎯',
          title: 'No available challenges',
          message: 'All challenges have been started or expired'
        };
      case 'inProgress':
        return {
          emoji: '⏳',
          title: 'No challenges in progress',
          message: 'Start a challenge to see it here'
        };
      case 'completed':
        return {
          emoji: '🏆',
          title: 'No completed challenges',
          message: 'Complete challenges to earn EXP and see them here'
        };
      default:
        return {
          emoji: '🎯',
          title: 'No challenges found',
          message: 'Try adjusting your filters'
        };
    }
  };

  const renderChallenge = (challenge: ChallengeWithProgress) => {
    const progress = calculateProgress(challenge.currentProgress, challenge.amountToGoal);
    const expired = isExpired(challenge.endDate);
    
    return (
      <Card key={challenge._id} emphasis={challenge.isCompleted} className='w-full mb-3'>
        {/* Header with title, category, and status */}
        <div className='flex justify-between items-start mb-4'>
          <div className='flex items-center gap-3'>
            <div className='text-2xl'>{getCategoryIcon(challenge.category)}</div>
            <div>
              <h3 className='font-bold text-lg text-foreground'>{challenge.title}</h3>
              <div className='flex items-center gap-2 mt-1'>
                <Pill>{challenge.category}</Pill>
                {challenge.userProgress?.lastCheckedDate && (
                  <span className='text-xs text-muted-foreground'>
                    Last updated: {formatDate(challenge.userProgress.lastCheckedDate)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className='flex flex-col items-end gap-1'>
            {challenge.isCompleted && (
              <div className='inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-positive/15 text-positive'>
                <Trophy className='w-4 h-4 text-primary' />
                COMPLETED
              </div>
            )}
            {expired && !challenge.isCompleted && (
              <div className='inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-destructive/15 text-destructive'>EXPIRED</div>
            )}
            {challenge.hasStarted && !challenge.isCompleted && !expired && (
              <div className='inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-warning/15 text-warning'>
                <Clock className='w-4 h-4 text-warning' />
                IN PROGRESS
              </div>
            )}
            {!challenge.hasStarted && !expired && (
              <div className='inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground'>
                <Play className='w-4 h-4' />
                AVAILABLE
              </div>
            )}
            <div className='flex items-center gap-1 text-subtle font-mono tabular-nums font-bold'>
              <Coins className='w-4 h-4 text-primary' />
              {challenge.exp} EXP
            </div>
          </div>
        </div>

        {/* Description */}
        <p className='text-muted-foreground mb-4'>{challenge.description}</p>

        {/* Progress Section - only show if started */}
        {challenge.hasStarted && (
          <div className='mb-4'>
            <div className='flex justify-between items-center mb-2'>
              <span className='text-sm text-muted-foreground'>Progress</span>
              <span className='text-sm font-bold font-mono tabular-nums text-foreground'>
                {formatCurrency(challenge.currentProgress)} / {formatCurrency(challenge.amountToGoal)}
              </span>
            </div>

            <ProgressBar value={challenge.currentProgress} max={challenge.amountToGoal} />

            <div className='flex justify-between items-center mt-1'>
              <span className='text-xs text-muted-foreground'>{progress.toFixed(1)}% complete</span>
              {!challenge.isCompleted && !expired && (
                <span className='text-xs font-mono tabular-nums text-muted-foreground'>
                  {formatCurrency(challenge.amountToGoal - challenge.currentProgress)} remaining
                </span>
              )}
            </div>
          </div>
        )}

        {/* Goal amount for available challenges */}
        {!challenge.hasStarted && (
          <div className='mb-4 p-3 bg-muted rounded-lg'>
            <div className='text-sm text-muted-foreground mb-1'>Goal Amount</div>
            <div className='text-lg font-bold font-mono tabular-nums text-foreground'>{formatCurrency(challenge.amountToGoal)}</div>
          </div>
        )}

        {/* Dates */}
        <div className='flex items-center justify-between text-sm text-muted-foreground'>
          <div className='flex items-center gap-1'>
            <Calendar className='w-3 h-3' />
            <span>{formatDate(challenge.startDate)} - {formatDate(challenge.endDate)}</span>
          </div>

          {!expired && !challenge.isCompleted && (
            <div className='text-xs'>
              {Math.ceil((new Date(challenge.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
            </div>
          )}
        </div>
      </Card>
    );
  };

  // Show error message if there's an error
  if (errorMsg) {
    return (
      <Layout headerRight={<HeaderButtons />}>
        <div className='flex flex-col w-full items-center justify-center h-full'>
          <Card className="border-destructive max-w-md w-full text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-destructive mb-2">Error Loading Challenges</h3>
            <p className="text-destructive mb-4">{errorMsg}</p>
            <Button
              onClick={() => {
                setErrorMsg('');
                fetchChallenges();
              }}
            >
              Try Again
            </Button>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout headerRight={<HeaderButtons />}>
      <div className='flex flex-col w-full items-center'>
        {/* Header section */}
        <div className='flex flex-col md:flex-row justify-between items-start md:items-center ml-5 mr-5 w-full p-4 gap-3'>
          <h1 className='text-foreground font-bold text-4xl'>Challenges</h1>

          <div className='flex flex-col sm:flex-row w-full md:w-auto gap-4 items-stretch'>
            <div className='relative flex-grow max-w-md'>
              <div className='absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground'>
                <Search className='w-4 h-4' />
              </div>
              <input
                type='text'
                placeholder='Search challenges'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='w-full pl-12 pr-4 py-2 glass rounded-full text-foreground
                   focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200'
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className='px-4 py-2 glass rounded-full text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200'
            >
              <option value="all">All Categories</option>
              <option value="pay">Pay</option>
              <option value="receive">Receive</option>
              <option value="save">Save</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className='flex flex-row gap-4 ml-5 mr-5 w-full p-4 mb-4'>
          <Card className='flex-1'>
            <div className='text-2xl font-bold text-primary'>{availableChallenges.length}</div>
            <div className='text-sm text-muted-foreground'>Available</div>
          </Card>
          <Card className='flex-1'>
            <div className='text-2xl font-bold text-primary'>{inProgressChallenges.length}</div>
            <div className='text-sm text-muted-foreground'>In Progress</div>
          </Card>
          <Card className='flex-1'>
            <div className='text-2xl font-bold text-primary'>{completedChallenges.length}</div>
            <div className='text-sm text-muted-foreground'>Completed</div>
          </Card>
        </div>

        {/* Section Tabs */}
        <div className='flex flex-row gap-2 ml-5 mr-5 w-full p-4 mb-4'>
          <Button
            variant={activeSection === 'available' ? 'primary' : 'ghost'}
            onClick={() => setActiveSection('available')}
            className='flex-1 py-3'
          >
            <div className='flex items-center justify-center gap-2'>
              <Play className='w-4 h-4' />
              Available ({availableChallenges.length})
            </div>
          </Button>

          <Button
            variant={activeSection === 'inProgress' ? 'primary' : 'ghost'}
            onClick={() => setActiveSection('inProgress')}
            className='flex-1 py-3'
          >
            <div className='flex items-center justify-center gap-2'>
              <Clock className='w-4 h-4 text-warning' />
              In Progress ({inProgressChallenges.length})
            </div>
          </Button>

          <Button
            variant={activeSection === 'completed' ? 'primary' : 'ghost'}
            onClick={() => setActiveSection('completed')}
            className='flex-1 py-3'
          >
            <div className='flex items-center justify-center gap-2'>
              <CheckCircle2 className='w-4 h-4 text-positive' />
              Completed ({completedChallenges.length + expiredChallenges.length})
            </div>
          </Button>
        </div>

        {/* Challenges List */}
        <div className='flex flex-col ml-5 mr-5 w-full p-4 gap-2 overflow-y-auto flex-grow'>
          {getSectionChallenges().length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Card className="p-8 max-w-md w-full text-center">
                <div className="text-6xl mb-4">{getSectionEmptyMessage().emoji}</div>
                <h3 className="text-xl font-bold text-foreground mb-2">{getSectionEmptyMessage().title}</h3>
                <p className="text-muted-foreground mb-4">{getSectionEmptyMessage().message}</p>
                {search && (
                  <Button onClick={() => setSearch('')}>
                    Clear search
                  </Button>
                )}
              </Card>
            </div>
          ) : (
            getSectionChallenges().map(renderChallenge)
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ChallengesList;