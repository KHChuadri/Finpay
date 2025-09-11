import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import HeaderButtons from '../components/dashboard/HeaderButtons';
import { FaSearch, FaTrophy, FaCalendarAlt, FaCoins, FaPlay, FaCheckCircle, FaClock } from 'react-icons/fa';
import useAuthStore from '../stores/authStore';
import axios from 'axios';
import useDarkModeStore from '../stores/darkModeStore';
import { API_URL } from '@/constants/API_URL';

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
  const { darkMode } = useDarkModeStore();

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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'pay':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'receive':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'save':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-yellow-500';
    if (progress >= 50) return 'bg-orange-500';
    return 'bg-red-500';
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
      <div key={challenge._id} className='w-full'>
        <div className={`w-full p-6 rounded-xl shadow-sm mb-3 hover:shadow-md transition-all duration-200 ${
          challenge.isCompleted ? 'bg-green-50 border-l-4 border-green-500' : 
          expired ? 'bg-gray-50 border-l-4 border-gray-400' : 
          challenge.hasStarted ? 'bg-blue-50 border-l-4 border-blue-500' :
          'bg-white/60 hover:bg-white/80'
        }`}>
          
          {/* Header with title, category, and status */}
          <div className='flex justify-between items-start mb-4'>
            <div className='flex items-center gap-3'>
              <div className='text-2xl'>{getCategoryIcon(challenge.category)}</div>
              <div>
                <h3 className='font-bold text-lg text-black'>{challenge.title}</h3>
                <div className='flex items-center gap-2 mt-1'>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(challenge.category)}`}>
                    {challenge.category}
                  </span>
                  {challenge.userProgress?.lastCheckedDate && (
                    <span className='text-xs text-gray-500'>
                      Last updated: {formatDate(challenge.userProgress.lastCheckedDate)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className='flex flex-col items-end gap-1'>
              {challenge.isCompleted && (
                <div className='flex items-center gap-1 text-green-600 font-bold text-sm'>
                  <FaTrophy className='w-4 h-4' />
                  COMPLETED
                </div>
              )}
              {expired && !challenge.isCompleted && (
                <div className='text-gray-500 font-bold text-sm'>EXPIRED</div>
              )}
              {challenge.hasStarted && !challenge.isCompleted && !expired && (
                <div className='flex items-center gap-1 text-blue-600 font-bold text-sm'>
                  <FaClock className='w-4 h-4' />
                  IN PROGRESS
                </div>
              )}
              {!challenge.hasStarted && !expired && (
                <div className='flex items-center gap-1 text-gray-600 font-bold text-sm'>
                  <FaPlay className='w-4 h-4' />
                  AVAILABLE
                </div>
              )}
              <div className='flex items-center gap-1 text-orange-600 font-bold'>
                <FaCoins className='w-4 h-4' />
                {challenge.exp} EXP
              </div>
            </div>
          </div>

          {/* Description */}
          <p className='text-gray-700 mb-4'>{challenge.description}</p>

          {/* Progress Section - only show if started */}
          {challenge.hasStarted && (
            <div className='mb-4'>
              <div className='flex justify-between items-center mb-2'>
                <span className='text-sm text-gray-600'>Progress</span>
                <span className='text-sm font-bold text-gray-700'>
                  {formatCurrency(challenge.currentProgress)} / {formatCurrency(challenge.amountToGoal)}
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className='w-full bg-gray-200 rounded-full h-3 overflow-hidden'>
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${getProgressColor(progress)}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              
              <div className='flex justify-between items-center mt-1'>
                <span className='text-xs text-gray-500'>{progress.toFixed(1)}% complete</span>
                {!challenge.isCompleted && !expired && (
                  <span className='text-xs text-gray-500'>
                    {formatCurrency(challenge.amountToGoal - challenge.currentProgress)} remaining
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Goal amount for available challenges */}
          {!challenge.hasStarted && (
            <div className='mb-4 p-3 bg-gray-50 rounded-lg'>
              <div className='text-sm text-gray-600 mb-1'>Goal Amount</div>
              <div className='text-lg font-bold text-gray-800'>{formatCurrency(challenge.amountToGoal)}</div>
            </div>
          )}

          {/* Dates */}
          <div className='flex items-center justify-between text-sm text-gray-600'>
            <div className='flex items-center gap-1'>
              <FaCalendarAlt className='w-3 h-3' />
              <span>{formatDate(challenge.startDate)} - {formatDate(challenge.endDate)}</span>
            </div>
            
            {!expired && !challenge.isCompleted && (
              <div className='text-xs'>
                {Math.ceil((new Date(challenge.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Show error message if there's an error
  if (errorMsg) {
    return (
      <Layout headerRight={<HeaderButtons />}>
        <div className='flex flex-col w-full items-center justify-center h-full'>
          <div className="bg-red-50 border border-red-200 p-6 rounded-xl max-w-md w-full text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-red-800 mb-2">Error Loading Challenges</h3>
            <p className="text-red-600 mb-4">{errorMsg}</p>
            <button
              onClick={() => {
                setErrorMsg('');
                fetchChallenges();
              }}
              className="px-4 py-2 bg-[#C6412A] hover:bg-[#A8321E] text-white rounded-full transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout headerRight={<HeaderButtons />}>
      <div className='flex flex-col w-full items-center'>
        {/* Header section */}
        <div className='flex flex-col md:flex-row justify-between items-start md:items-center ml-5 mr-5 w-full p-4 gap-3'>
          <h1 className={`${darkMode ? 'text-white' : ''} font-bold text-4xl`}>Challenges</h1>

          <div className='flex flex-col sm:flex-row w-full md:w-auto gap-4 items-stretch'>
            <div className='relative flex-grow max-w-md'>
              <div className='absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500'>
                <FaSearch className='w-4 h-4' />
              </div>
              <input
                type='text'
                placeholder='Search challenges'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='w-full pl-12 pr-4 py-2 bg-white/60 rounded-full 
                   focus:outline-none focus:ring-2 focus:ring-[#FFA294] transition-all duration-200'
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className='px-4 py-2 bg-white/60 rounded-full focus:outline-none focus:ring-2 focus:ring-[#FFA294] transition-all duration-200'
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
          <div className='flex-1 bg-white/60 rounded-xl p-4 shadow-sm'>
            <div className='text-2xl font-bold text-blue-600'>{availableChallenges.length}</div>
            <div className='text-sm text-gray-600'>Available</div>
          </div>
          <div className='flex-1 bg-white/60 rounded-xl p-4 shadow-sm'>
            <div className='text-2xl font-bold text-orange-600'>{inProgressChallenges.length}</div>
            <div className='text-sm text-gray-600'>In Progress</div>
          </div>
          <div className='flex-1 bg-white/60 rounded-xl p-4 shadow-sm'>
            <div className='text-2xl font-bold text-green-600'>{completedChallenges.length}</div>
            <div className='text-sm text-gray-600'>Completed</div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className='flex flex-row gap-2 ml-5 mr-5 w-full p-4 mb-4'>
          <button
            onClick={() => setActiveSection('available')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
              activeSection === 'available' 
                ? 'bg-[#C6412A] hover:bg-[#A8321E] text-white shadow-md' 
                : 'bg-white/60 text-gray-700 hover:bg-white/80'
            }`}
          >
            <div className='flex items-center justify-center gap-2'>
              <FaPlay className='w-4 h-4' />
              Available ({availableChallenges.length})
            </div>
          </button>
          
          <button
            onClick={() => setActiveSection('inProgress')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
              activeSection === 'inProgress' 
                ? 'bg-[#C6412A] hover:bg-[#A8321E] text-white shadow-md' 
                : 'bg-white/60 text-gray-700 hover:bg-white/80'
            }`}
          >
            <div className='flex items-center justify-center gap-2'>
              <FaClock className='w-4 h-4' />
              In Progress ({inProgressChallenges.length})
            </div>
          </button>
          
          <button
            onClick={() => setActiveSection('completed')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
              activeSection === 'completed' 
                ? 'bg-[#C6412A] hover:bg-[#A8321E] text-white shadow-md' 
                : 'bg-white/60 text-gray-700 hover:bg-white/80'
            }`}
          >
            <div className='flex items-center justify-center gap-2'>
              <FaCheckCircle className='w-4 h-4' />
              Completed ({completedChallenges.length + expiredChallenges.length})
            </div>
          </button>
        </div>

        {/* Challenges List */}
        <div className='flex flex-col ml-5 mr-5 w-full p-4 gap-2 overflow-y-auto flex-grow'>
          {getSectionChallenges().length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="bg-white/60 p-8 rounded-2xl shadow-sm max-w-md w-full text-center">
                <div className="text-6xl mb-4">{getSectionEmptyMessage().emoji}</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{getSectionEmptyMessage().title}</h3>
                <p className="text-gray-600 mb-4">{getSectionEmptyMessage().message}</p>
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="px-4 py-2 bg-[#C6412A] text-white rounded-full hover:bg-[#A8321E] transition-colors"
                  >
                    Clear search
                  </button>
                )}
              </div>
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