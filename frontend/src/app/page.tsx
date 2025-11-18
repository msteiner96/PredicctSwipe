'use client';

import { useState, useEffect, useMemo } from 'react';
import MarketCard from '@/components/features/MarketCard';
import Leaderboard from '@/components/features/Leaderboard';
import UserProfile from '@/components/features/UserProfile';
import TopBar from '@/components/layouts/TopBar';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useActiveMarkets, usePlaceBet, useAllUserBets } from '@/hooks/usePredictMarket';
import { formatEther, parseEther } from 'viem';

type View = 'swipe' | 'leaderboard' | 'profile';

export default function Home() {
  const { isConnected, address } = useAccount();
  const [currentView, setCurrentView] = useState<View>('swipe');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const [betAmount, setBetAmount] = useState('0.005'); // Default bet amount (~$5 at current BNB prices)
  const [selectedUserAddress, setSelectedUserAddress] = useState<string | undefined>(undefined);

  // Fetch all active markets
  const { data: activeMarkets, marketIds, isLoading: marketsLoading } = useActiveMarkets();

  // Fetch user's bet history to filter out markets they've participated in
  const { marketIds: userMarketIds, refetch: refetchUserBets } = useAllUserBets(address);

  // Place bet hook
  const { placeBet, isPending, isConfirming, isSuccess } = usePlaceBet();

  // Transform markets to UI format and filter out participated ones
  const availableMarkets = useMemo(() => {
    if (!activeMarkets || activeMarkets.length === 0) return [];

    // Create a set of market IDs the user has participated in for fast lookup
    const participatedMarketIds = new Set(userMarketIds.map(id => Number(id)));

    const filteredMarkets = activeMarkets
      .filter((market: any) => {
        if (!market) return false;
        const marketId = Number(market.id);
        return !participatedMarketIds.has(marketId);
      })
      .map((market: any) => {
        let metadata = {};
        try {
          metadata = JSON.parse(market.metadata || '{}');
        } catch (e) {
          // Ignore parsing errors
        }

        return {
          id: Number(market.id),
          question: market.question || 'Unknown Question',
          category: market.category || 'General',
          endTime: Number(market.endTime) * 1000,
          totalYesAmount: parseFloat(formatEther(market.totalYesAmount || BigInt(0))),
          totalNoAmount: parseFloat(formatEther(market.totalNoAmount || BigInt(0))),
          metadata: {
            ...metadata,
            image: `/markets/${(market.category || 'general').toLowerCase()}.png`,
          },
        };
      });

    // Shuffle the markets for variety
    const shuffled = [...filteredMarkets];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }, [activeMarkets, userMarketIds]);

  // Move to next card when bet is confirmed
  useEffect(() => {
    if (isSuccess) {
      // Refetch user bets to update the participated markets list
      refetchUserBets();

      setTimeout(() => {
        setCurrentIndex((prev) => {
          // Wrap around to the beginning if at the end
          const nextIndex = prev + 1;
          if (nextIndex >= availableMarkets.length) {
            return 0;
          }
          return nextIndex;
        });
        setDirection(null);
      }, 500);
    }
  }, [isSuccess, refetchUserBets, availableMarkets.length]);

  const handleSwipe = async (marketId: number, isYes: boolean, amount: string) => {
    // Don't allow another bet while one is pending
    if (isPending || isConfirming) {
      return;
    }

    setDirection(isYes ? 'right' : 'left');

    // Place bet on blockchain
    try {
      await placeBet(marketId, isYes, parseEther(amount));
    } catch (error) {
      console.error('Failed to place bet:', error);
      // Reset direction on error
      setDirection(null);
      return;
    }
  };

  const handleSkip = () => {
    setCurrentIndex((prev) => {
      // Wrap around to the beginning if at the end
      if (prev + 1 >= availableMarkets.length) {
        return 0;
      }
      return prev + 1;
    });
  };

  const currentMarket = availableMarkets[currentIndex];
  const nextMarket = availableMarkets[currentIndex + 1];

  // Handle view switching - must be before early returns
  if (isConnected && currentView === 'leaderboard') {
    return (
      <>
        <TopBar currentView={currentView} onViewChange={setCurrentView} />
        <Leaderboard
          onUserClick={(userAddress) => {
            setSelectedUserAddress(userAddress);
            setCurrentView('profile');
          }}
        />
      </>
    );
  }

  if (isConnected && currentView === 'profile') {
    return (
      <>
        <TopBar currentView={currentView} onViewChange={(view) => {
          setCurrentView(view);
          // Clear selected user when going back to own profile
          if (view === 'profile') {
            setSelectedUserAddress(undefined);
          }
        }} />
        <UserProfile
          userAddress={selectedUserAddress}
          onBackToOwnProfile={() => setSelectedUserAddress(undefined)}
        />
      </>
    );
  }

  if (!isConnected) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-pink-900 to-orange-900 overflow-hidden relative p-4">
        {/* Animated background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15),transparent_50%)] animate-pulse" />
        <div className="absolute inset-0 bg-noise opacity-20" />

        <div className="relative z-10 text-center space-y-8 max-w-lg">

          {/* Title */}
          <div className="space-y-3">
            <img
              src="/logo.png"
              alt="PredictPro Logo"
              width={450}
              height={450}
              className="mx-auto animate-spin-slow"
            />
            <p className="text-3xl md:text-4xl font-black text-white drop-shadow-lg">
              SWIPE. BET. WIN. 🚀
            </p>
          </div>

          {/* Connect Button */}
          <div className="flex flex-col space-y-4 items-center py-6">
            <div className="transform hover:scale-105 transition-transform">
              <ConnectButton />
            </div>
            <p className="text-xl font-bold text-white/80">Connect to start making 💰</p>
          </div>

          {/* Feature cards - meme style */}
          <div className="grid grid-cols-3 gap-3 mt-8">
            <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-3xl p-5 border-4 border-white/30 shadow-2xl transform hover:scale-105 transition-all">
              <div className="text-5xl mb-3 animate-bounce">💰</div>
              <div className="text-sm font-black text-white drop-shadow">HUGE WINS</div>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-pink-500 rounded-3xl p-5 border-4 border-white/30 shadow-2xl transform hover:scale-105 transition-all">
              <div className="text-5xl mb-3 animate-pulse">🔥</div>
              <div className="text-sm font-black text-white drop-shadow">SO HOT</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-blue-500 rounded-3xl p-5 border-4 border-white/30 shadow-2xl transform hover:scale-105 transition-all">
              <div className="text-5xl mb-3">⚡</div>
              <div className="text-sm font-black text-white drop-shadow">INSTANT</div>
            </div>
          </div>

          {/* Hype text */}
          <div className="mt-8 space-y-2">
            <p className="text-2xl font-black text-white/90">📈 Predict The Future</p>
            <p className="text-2xl font-black text-white/90">💎 Diamond Hands Only</p>
            <p className="text-2xl font-black text-white/90">🌙 TO THE MOON!</p>
          </div>
        </div>
      </div>
    );
  }


  // Show loading only when actually loading data
  if (marketsLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-pink-900 to-orange-900 overflow-hidden relative p-4">
        {/* Animated background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15),transparent_50%)] animate-pulse" />
        <div className="absolute inset-0 bg-noise opacity-20" />

        <div className="relative z-10 text-center space-y-8">
          <div className="text-9xl animate-bounce">🚀</div>
          <div className="space-y-3">
            <h2 className="text-5xl md:text-6xl font-black text-white drop-shadow-2xl">LOADING...</h2>
            <p className="text-3xl font-black bg-gradient-to-r from-yellow-400 to-red-500 bg-clip-text text-transparent">
              FETCHING HOT MARKETS 🔥
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 mt-8">
            <div className="w-6 h-6 bg-yellow-400 rounded-full animate-pulse shadow-lg shadow-yellow-400/50" />
            <div className="w-6 h-6 bg-orange-400 rounded-full animate-pulse delay-100 shadow-lg shadow-orange-400/50" />
            <div className="w-6 h-6 bg-red-400 rounded-full animate-pulse delay-200 shadow-lg shadow-red-400/50" />
          </div>
          <p className="text-xl font-bold text-white/70 mt-8">Get ready to make bank 💰💰💰</p>
        </div>
      </div>
    );
  }

  // Show "all caught up" if user has seen all markets
  if (!marketsLoading && availableMarkets.length === 0) {
    return (
      <>
        <TopBar currentView={currentView} onViewChange={setCurrentView} />
        <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 overflow-hidden relative p-4 pt-24">
          {/* Animated background */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15),transparent_50%)] animate-pulse" />
          <div className="absolute inset-0 bg-noise opacity-20" />

          <div className="relative z-10 text-center space-y-8 max-w-lg">
            <div className="text-9xl animate-bounce mb-4">🎉</div>
            <div className="space-y-3">
              <h2 className="text-5xl md:text-6xl font-black text-white drop-shadow-2xl">ALL CAUGHT UP!</h2>
              <p className="text-2xl font-black bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                YOU'VE SEEN ALL MARKETS 💎
              </p>
            </div>
            <p className="text-xl font-bold text-white/80 mt-6">
              Check your profile to track your bets or browse the leaderboard! 🚀
            </p>
            <div className="flex flex-col gap-4 mt-8">
              <button
                onClick={() => setCurrentView('profile')}
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-xl font-black rounded-full shadow-2xl hover:scale-105 transition-transform relative group overflow-hidden"
              >
                <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-0 group-hover:opacity-100" />
                <span className="relative">VIEW MY PROFILE 👤</span>
              </button>
              <button
                onClick={() => setCurrentView('leaderboard')}
                className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-600 text-white text-xl font-black rounded-full shadow-2xl hover:scale-105 transition-transform relative group overflow-hidden"
              >
                <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-0 group-hover:opacity-100" />
                <span className="relative">VIEW LEADERBOARD 🏆</span>
              </button>
              <button
                onClick={() => {
                  setCurrentIndex(0);
                }}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xl font-black rounded-full shadow-2xl hover:scale-105 transition-transform relative group overflow-hidden"
              >
                <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-0 group-hover:opacity-100" />
                <span className="relative">CHECK FOR NEW MARKETS 🔄</span>
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (currentIndex >= availableMarkets.length) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 overflow-hidden relative p-4">
        {/* Animated background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15),transparent_50%)] animate-pulse" />
        <div className="absolute inset-0 bg-noise opacity-20" />

        <div className="relative z-10 text-center space-y-8 max-w-lg">
          <div className="text-9xl animate-bounce mb-4">🎉</div>
          <div className="space-y-3">
            <h2 className="text-5xl md:text-6xl font-black text-white drop-shadow-2xl">ALL CAUGHT UP!</h2>
            <p className="text-3xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              YOU'VE SEEN EVERYTHING! 👀
            </p>
          </div>
          <div className="bg-black/30 backdrop-blur-md border-4 border-green-500/50 rounded-3xl p-6">
            <p className="text-xl font-bold text-white/90">No more markets right now</p>
            <p className="text-sm text-white/60 mt-2">Check back soon for fresh predictions 🔥</p>
          </div>
          <button
            onClick={() => setCurrentIndex(0)}
            className="group relative px-12 py-5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full font-black text-2xl text-white shadow-2xl transform hover:scale-110 active:scale-95 transition-all border-4 border-white/30"
          >
            <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-0 group-hover:opacity-100" />
            <span className="relative">START OVER! 🔄</span>
          </button>
          <p className="text-lg font-bold text-white/70">Swipe again for the gains 💪</p>
        </div>
      </div>
    );
  }

  // Default: Swipe view (currentView === 'swipe')
  return (
    <div className="h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-orange-900 overflow-hidden relative">
      {/* Animated background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)] animate-pulse" />
      <div className="absolute inset-0 bg-noise opacity-20" />

      <TopBar currentView={currentView} onViewChange={setCurrentView} />

      <div className="relative h-full">
        {/* Current Card */}
        {currentMarket && (
          <MarketCard
            key={currentMarket.id}
            market={currentMarket}
            onSwipe={handleSwipe}
            onSkip={handleSkip}
            direction={direction}
            isTop={true}
            betAmount={betAmount}
            onBetAmountChange={setBetAmount}
          />
        )}

        {/* Next Card (preview) - hide during transaction */}
        {nextMarket && !isPending && !isConfirming && (
          <MarketCard
            key={nextMarket.id}
            market={nextMarket}
            onSwipe={() => {}}
            onSkip={() => {}}
            direction={null}
            isTop={false}
            betAmount={betAmount}
            onBetAmountChange={setBetAmount}
          />
        )}

        {/* Transaction Loading Overlay */}
        {(isPending || isConfirming) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl">
            {/* Animated background effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)] animate-pulse" />
            <div className="absolute inset-0 bg-noise opacity-20" />

            <div className="relative z-10 text-center space-y-8 p-8 max-w-lg">
              {isPending && (
                <>
                  <div className="text-9xl animate-bounce drop-shadow-2xl">🎯</div>
                  <div className="space-y-3">
                    <h2 className="text-6xl font-black bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent drop-shadow-lg">
                      SIGN IT!
                    </h2>
                    <p className="text-3xl font-black text-white drop-shadow">Check Your Wallet 💎</p>
                  </div>
                  <div className="bg-black/40 backdrop-blur-md border-4 border-yellow-500/50 rounded-3xl p-6">
                    <p className="text-lg font-bold text-yellow-400">Waiting for signature...</p>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 bg-yellow-400 rounded-full animate-pulse shadow-lg shadow-yellow-400/50" />
                    <div className="w-5 h-5 bg-orange-400 rounded-full animate-pulse delay-100 shadow-lg shadow-orange-400/50" />
                    <div className="w-5 h-5 bg-red-400 rounded-full animate-pulse delay-200 shadow-lg shadow-red-400/50" />
                  </div>
                </>
              )}
              {isConfirming && (
                <>
                  <div className="relative">
                    <div className="text-9xl animate-spin">⏳</div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-32 h-32 border-8 border-yellow-400 border-t-transparent rounded-full animate-spin shadow-2xl" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-6xl font-black bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent drop-shadow-lg">
                      PROCESSING...
                    </h2>
                    <p className="text-3xl font-black text-white drop-shadow">Your Bet Is Going Live! 🚀</p>
                  </div>
                  <div className="bg-black/40 backdrop-blur-md border-4 border-green-500/50 rounded-3xl p-6">
                    <p className="text-lg font-bold text-green-400">Wait for blockchain confirmation...</p>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50" />
                    <div className="w-5 h-5 bg-emerald-400 rounded-full animate-pulse delay-100 shadow-lg shadow-emerald-400/50" />
                    <div className="w-5 h-5 bg-teal-400 rounded-full animate-pulse delay-200 shadow-lg shadow-teal-400/50" />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Success Overlay */}
        {isSuccess && direction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl">
            {/* Animated background with fireworks effect */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_50%)] animate-pulse" />
            <div className="absolute inset-0">
              <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-yellow-400/20 rounded-full blur-3xl animate-ping" />
              <div className="absolute top-1/3 right-1/4 w-40 h-40 bg-green-400/20 rounded-full blur-3xl animate-ping delay-100" />
              <div className="absolute bottom-1/3 left-1/3 w-36 h-36 bg-orange-400/20 rounded-full blur-3xl animate-ping delay-200" />
            </div>

            <div className="relative z-10 text-center space-y-8 p-8 max-w-lg">
              <div className="text-9xl animate-bounce drop-shadow-2xl">
                {direction === 'right' ? '🚀' : '💎'}
              </div>
              <div className="space-y-4">
                <h2 className="text-7xl md:text-8xl font-black bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent drop-shadow-2xl animate-pulse">
                  LFG!!!
                </h2>
                <p className="text-4xl md:text-5xl font-black text-white drop-shadow-lg">
                  BET PLACED!
                </p>
              </div>
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-md border-4 border-green-500/50 rounded-3xl p-6">
                <p className="text-2xl font-black text-white">
                  {direction === 'right' ? 'TO THE MOON! 🌙' : 'DIAMOND HANDS! 💪'}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-xl font-bold text-white/80">
                <span className="animate-bounce">🔥</span>
                <span>GET READY FOR THE GAINS</span>
                <span className="animate-bounce delay-100">🔥</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
