'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { useAllUserBets, useAllMarkets, useClaimWinnings } from '@/hooks/usePredictMarket';
import { useReadContracts } from 'wagmi';
import { CONTRACTS, PREDICT_MARKET_ABI } from '@/contracts';
import { formatBNB } from '@/utils/formatters';
import { useBnbPrice, formatBnbToUsd } from '@/hooks/useBnbPrice';

interface Bet {
  bettor: string;
  marketId: bigint;
  amount: bigint;
  isYes: boolean;
  timestamp: bigint;
  claimed: boolean;
}

interface UserBet {
  marketId: number;
  question: string;
  category: string;
  prediction: 'YES' | 'NO';
  amount: bigint;
  timestamp: number;
  endTime?: number;
  currentOdds: number;
  potentialPayout: bigint;
  status: 'active' | 'won' | 'lost' | 'pending';
  betIndex: number;
  claimed: boolean;
}

interface UserStats {
  totalBets: number;
  totalVolume: bigint;
  activeBets: number;
  wins: number;
  losses: number;
  winRate: number;
  profit: bigint;
  rank: number;
}

interface UserProfileProps {
  userAddress?: string;
  onBackToOwnProfile?: () => void;
}

export default function UserProfile({ userAddress, onBackToOwnProfile }: UserProfileProps = {}) {
  const { address: connectedAddress } = useAccount();
  const address = userAddress || connectedAddress;
  const isOwnProfile = !userAddress || userAddress === connectedAddress;
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const { price: bnbPrice } = useBnbPrice();

  // Fetch user's bets and markets (including resolved ones)
  const { data: userBetsData, marketIds, isLoading: betsLoading, refetch } = useAllUserBets(address);
  const { data: allMarkets } = useAllMarkets();

  // Fetch all bets from all markets to calculate rank
  const contracts = (allMarkets || []).map((market: any) => {
    const marketId = market?.id;
    return {
      address: CONTRACTS.PREDICT_MARKET,
      abi: PREDICT_MARKET_ABI,
      functionName: 'getMarketBets' as const,
      args: [marketId],
      chainId: 97,
    };
  });

  const { data: allMarketBets } = useReadContracts({
    contracts,
    query: {
      enabled: contracts.length > 0,
    }
  });

  // Claim winnings hook (only for own profile)
  const { claimWinnings, isPending: isClaimPending, isSuccess: isClaimSuccess } = useClaimWinnings();

  // Refetch bets after successful claim
  useEffect(() => {
    if (isClaimSuccess) {
      refetch();
    }
  }, [isClaimSuccess, refetch]);

  // Calculate user's rank from all market data
  const userRank = useMemo(() => {
    if (!allMarketBets || !allMarkets || !address) return 0;

    // Aggregate all bets by user (same logic as Leaderboard)
    const userStats = new Map<string, { totalProfit: bigint }>();

    allMarketBets.forEach((result, marketIndex) => {
      const bets = result.result as Bet[] | undefined;
      if (!bets || !Array.isArray(bets)) return;

      const market: any = allMarkets[marketIndex];
      const isResolved = market?.resolved ?? false;
      const outcome = market?.outcome ?? false;
      const totalYesAmount = market?.totalYesAmount ?? BigInt(0);
      const totalNoAmount = market?.totalNoAmount ?? BigInt(0);

      bets.forEach((bet: Bet) => {
        const userAddress = bet.bettor;
        const current = userStats.get(userAddress) || { totalProfit: BigInt(0) };

        // Calculate profit for resolved markets
        if (isResolved) {
          const isWinner = (bet.isYes && outcome) || (!bet.isYes && !outcome);

          if (isWinner) {
            // Calculate payout using parimutuel formula
            const winningPool = bet.isYes ? totalYesAmount : totalNoAmount;
            const losingPool = bet.isYes ? totalNoAmount : totalYesAmount;

            if (winningPool > 0) {
              // Platform fee is 2%
              const netLosingPool = (losingPool * BigInt(98)) / BigInt(100);
              const share = (bet.amount * netLosingPool) / winningPool;
              const payout = bet.amount + share;

              // Profit = payout - bet amount
              current.totalProfit += (payout - bet.amount);
            }
          } else {
            // Lost bet = negative profit
            current.totalProfit -= bet.amount;
          }
        }

        userStats.set(userAddress, current);
      });
    });

    // Convert to array and sort by profit
    const sortedUsers = Array.from(userStats.entries())
      .sort(([, a], [, b]) => {
        if (a.totalProfit > b.totalProfit) return -1;
        if (a.totalProfit < b.totalProfit) return 1;
        return 0;
      });

    // Find user's rank
    const userIndex = sortedUsers.findIndex(([addr]) => addr.toLowerCase() === address.toLowerCase());
    return userIndex >= 0 ? userIndex + 1 : 0;
  }, [allMarketBets, allMarkets, address]);

  // Process user bets and calculate stats
  const { userBets, stats } = useMemo(() => {
    if (!userBetsData || !allMarkets || userBetsData.length === 0 || allMarkets.length === 0) {
      return {
        userBets: [],
        stats: {
          totalBets: 0,
          totalVolume: BigInt(0),
          activeBets: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
          profit: BigInt(0),
          rank: userRank,
        }
      };
    }

    // Flatten all bets with their indices
    const allBets: Array<Bet & { betIndex: number }> = [];
    userBetsData.forEach((betsArray) => {
      if (Array.isArray(betsArray)) {
        (betsArray as Bet[]).forEach((bet, index) => {
          allBets.push({ ...bet, betIndex: index });
        });
      }
    });

    // Calculate stats
    let totalVolume = BigInt(0);
    let activeBets = 0;
    let wins = 0;
    let losses = 0;
    let totalProfit = BigInt(0);

    const PLATFORM_FEE = BigInt(200); // 2% (200 basis points)
    const BASIS_POINTS = BigInt(10000);

    const formattedBets: UserBet[] = allBets.map((bet) => {
      const market = allMarkets.find((m: any) => {
        const marketId = m.id ?? m[0];
        return Number(marketId) === Number(bet.marketId);
      });

      const marketData = market ? {
        id: market.id,
        question: market.question,
        category: market.category,
        endTime: market.endTime,
        resolutionTime: market.resolutionTime,
        totalYesAmount: market.totalYesAmount,
        totalNoAmount: market.totalNoAmount,
        resolved: market.resolved ?? false,
        outcome: market.outcome ?? false,
      } : null;

      totalVolume += bet.amount;

      // Check if market is resolved
      const isResolved = marketData?.resolved === true;
      const isWinner = isResolved && ((bet.isYes && marketData?.outcome === true) || (!bet.isYes && marketData?.outcome === false));

      if (isResolved) {
        if (isWinner) wins++;
        else losses++;
      } else {
        activeBets++;
      }

      // Calculate potential payout using parimutuel formula
      const totalYes = marketData?.totalYesAmount || BigInt(0);
      const totalNo = marketData?.totalNoAmount || BigInt(0);
      const winningPool = bet.isYes ? totalYes : totalNo;
      const losingPool = bet.isYes ? totalNo : totalYes;

      let potentialPayout = bet.amount; // Default: just get your money back
      let odds = 1.0;

      if (losingPool > BigInt(0) && winningPool > BigInt(0)) {
        // Calculate net losing pool after platform fee (2%)
        const netLosingPool = (losingPool * BigInt(98)) / BigInt(100);

        // Calculate user's share - use proper order to avoid truncation
        const share = (bet.amount * netLosingPool) / winningPool;
        potentialPayout = bet.amount + share;
        odds = Number(potentialPayout) / Number(bet.amount);
      }

      // Track profit for won bets
      if (isWinner && !bet.claimed) {
        totalProfit += potentialPayout - bet.amount;
      }

      return {
        marketId: Number(bet.marketId),
        question: marketData?.question || 'Unknown Market',
        category: marketData?.category || 'General',
        prediction: bet.isYes ? 'YES' : 'NO',
        amount: bet.amount,
        timestamp: Number(bet.timestamp) * 1000,
        endTime: marketData?.endTime ? Number(marketData.endTime) * 1000 : undefined,
        currentOdds: odds,
        potentialPayout,
        status: isResolved ? (isWinner ? 'won' : 'lost') : 'active',
        betIndex: bet.betIndex,
        claimed: bet.claimed,
      };
    });

    const totalBets = allBets.length;
    const winRate = totalBets > 0 ? (wins / totalBets) * 100 : 0;

    return {
      userBets: formattedBets,
      stats: {
        totalBets,
        totalVolume,
        activeBets,
        wins,
        losses,
        winRate,
        profit: totalProfit,
        rank: userRank,
      }
    };
  }, [userBetsData, allMarkets, userRank]);

  const getCategoryGradient = (category: string) => {
    const gradients: { [key: string]: string } = {
      Price: 'from-yellow-500 to-orange-500',
      DeFi: 'from-blue-500 to-purple-500',
      Security: 'from-green-500 to-emerald-500',
      Network: 'from-purple-500 to-indigo-500',
      Events: 'from-pink-500 to-red-500',
    };
    return gradients[category] || 'from-gray-500 to-gray-600';
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const formatTimeUntil = (endTime: number) => {
    const now = Date.now();
    const diff = endTime - now;

    if (diff <= 0) return 'Ended';

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `Ends in ${days}d ${hours % 24}h`;
    if (hours > 0) return `Ends in ${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `Ends in ${minutes}m`;
    return `Ends in ${seconds}s`;
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleClaimWinnings = async (marketId: number, betIndex: number) => {
    try {
      await claimWinnings(marketId, betIndex);
    } catch (error) {
      console.error('Error claiming winnings:', error);
    }
  };

  const profitIsPositive = stats.profit >= BigInt(0);

  return (
    <div className="h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-orange-900 overflow-hidden relative">
      {/* Animated background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15),transparent_50%)] animate-pulse" />
      <div className="absolute inset-0 bg-noise opacity-20" />

      <div className="relative z-10 h-full flex flex-col pt-24 pb-6 overflow-y-auto">
        {/* Header */}
        <div className="px-6 pt-2 pb-4 text-center">
          <div className="text-7xl mb-4">💎</div>
          {!isOwnProfile && onBackToOwnProfile && (
            <button
              onClick={onBackToOwnProfile}
              className="mb-4 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-black rounded-full transition-all shadow-lg hover:scale-105"
            >
              ← BACK TO MY PROFILE
            </button>
          )}
          <h1 className="text-4xl font-black text-white mb-2">
            {isOwnProfile ? 'YOUR PROFILE' : 'USER PROFILE'}
          </h1>
          <p className="text-lg font-bold text-white/70 font-mono">
            {address ? formatAddress(address) : '0x...'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="px-6 mb-4">
          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* Rank Card */}
            <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-3xl p-4 border-4 border-white/30 shadow-xl">
              <div className="text-3xl mb-1">🏆</div>
              <div className="text-sm font-bold text-white/80">RANK</div>
              <div className="text-3xl font-black text-white">#{stats.rank}</div>
            </div>

            {/* Win Rate Card */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-4 border-4 border-white/30 shadow-xl">
              <div className="text-3xl mb-1">🎯</div>
              <div className="text-sm font-bold text-white/80">WIN RATE</div>
              <div className="text-3xl font-black text-white">{stats.winRate.toFixed(2)}%</div>
            </div>
          </div>

          {/* Volume Card */}
          <div className="bg-black/40 backdrop-blur-md border-4 border-white/10 rounded-3xl p-5 mb-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white/60 mb-1">TOTAL VOLUME</div>
                <div className="text-3xl font-black bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  {formatBNB(stats.totalVolume)} BNB
                </div>
                <div className="text-sm font-bold text-yellow-400/70 mt-1">
                  ≈{formatBnbToUsd(formatEther(stats.totalVolume), bnbPrice)}
                </div>
              </div>
              <div className="text-5xl">💰</div>
            </div>
          </div>

          {/* Profit/Loss Card */}
          <div className={`bg-gradient-to-br ${profitIsPositive ? 'from-green-500/20 to-emerald-500/20 border-green-500/50' : 'from-red-500/20 to-orange-500/20 border-red-500/50'} backdrop-blur-md border-4 rounded-3xl p-5 mb-3`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white/60 mb-1">
                  {profitIsPositive ? 'TOTAL PROFIT' : 'TOTAL LOSS'}
                </div>
                <div className={`text-3xl font-black ${profitIsPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {profitIsPositive ? '+' : ''}{formatBNB(stats.profit)} BNB
                </div>
                <div className={`text-sm font-bold mt-1 ${profitIsPositive ? 'text-green-400/70' : 'text-red-400/70'}`}>
                  {profitIsPositive ? '≈+' : '≈'}{formatBnbToUsd(formatEther(stats.profit), bnbPrice)}
                </div>
              </div>
              <div className="text-5xl">{profitIsPositive ? '📈' : '📉'}</div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-black/30 backdrop-blur-md border-2 border-white/10 rounded-2xl p-3 text-center">
              <div className="text-2xl font-black text-white">{stats.totalBets}</div>
              <div className="text-xs font-bold text-white/60">TOTAL BETS</div>
            </div>
            <div className="bg-black/30 backdrop-blur-md border-2 border-green-500/30 rounded-2xl p-3 text-center">
              <div className="text-2xl font-black text-green-400">{stats.wins}</div>
              <div className="text-xs font-bold text-white/60">WINS</div>
            </div>
            <div className="bg-black/30 backdrop-blur-md border-2 border-red-500/30 rounded-2xl p-3 text-center">
              <div className="text-2xl font-black text-red-400">{stats.losses}</div>
              <div className="text-xs font-bold text-white/60">LOSSES</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 mb-4">
          <div className="flex gap-2 bg-black/40 backdrop-blur-md border-2 border-white/10 rounded-2xl p-1">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${
                activeTab === 'active'
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                  : 'text-white/60'
              }`}
            >
              ACTIVE ({stats.activeBets})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                  : 'text-white/60'
              }`}
            >
              HISTORY
            </button>
          </div>
        </div>

        {/* Bets List */}
        <div className="px-6 space-y-3">
          {userBets.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🤷</div>
              <p className="text-xl font-bold text-white/60">No bets yet!</p>
              <p className="text-sm text-white/40">Start swiping to make predictions 🚀</p>
            </div>
          ) : (
            userBets
              .filter((bet) => activeTab === 'active' ? bet.status === 'active' : bet.status !== 'active')
              .map((bet) => (
              <div
                key={`${bet.marketId}-${bet.betIndex}`}
                className="bg-black/40 backdrop-blur-md border-2 border-white/10 rounded-3xl p-4 hover:border-white/30 transition-all"
              >
                {/* Category Badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`bg-gradient-to-r ${getCategoryGradient(bet.category)} rounded-full px-3 py-1 text-xs font-black text-white`}>
                    {bet.category.toUpperCase()}
                  </span>
                  <span className="text-xs font-bold text-white/50">
                    {formatTimeAgo(bet.timestamp)}
                  </span>
                </div>

                {/* Question */}
                <h3 className="text-lg font-black text-white mb-3 leading-tight">
                  {bet.question}
                </h3>

                {/* Bet Info */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-black ${bet.prediction === 'YES' ? 'text-green-400' : 'text-red-400'}`}>
                      {bet.prediction === 'YES' ? 'YESS!' : 'NOPE!'}
                    </span>
                    <div>
                      <span className="text-xl font-black text-yellow-400">
                        {formatBNB(bet.amount)} BNB
                      </span>
                      <div className="text-xs font-bold text-yellow-400/70">
                        ≈{formatBnbToUsd(formatEther(bet.amount), bnbPrice)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* End Time for Active Bets / Resolution info for Resolved */}
                {bet.status === 'active' && bet.endTime && (
                  <div className="bg-blue-500/10 border-2 border-blue-500/30 rounded-2xl p-2 mb-2">
                    <div className="text-xs font-bold text-blue-300 text-center">
                      ⏰ {formatTimeUntil(bet.endTime)}
                    </div>
                  </div>
                )}

                {/* Status Badge for History */}
                {bet.status !== 'active' && (
                  <div className={`${bet.status === 'won' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'} border-2 rounded-2xl p-2 mb-2`}>
                    <div className={`text-xs font-bold text-center ${bet.status === 'won' ? 'text-green-300' : 'text-red-300'}`}>
                      {bet.status === 'won' ? '✅ WON - MARKET RESOLVED' : '❌ LOST - MARKET RESOLVED'}
                    </div>
                  </div>
                )}

                {/* Potential Return / Payout */}
                <div className={`bg-gradient-to-r ${bet.status === 'won' ? 'from-green-500/20 to-emerald-500/20 border-green-500/50' : 'from-green-500/10 to-emerald-500/10 border-green-500/30'} border-2 rounded-2xl p-3 mb-2`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white/70">
                      {bet.status === 'won' ? 'PAYOUT' : 'POTENTIAL WIN'}
                    </span>
                    <div className="text-right">
                      <span className="text-xl font-black text-green-400">
                        {formatBNB(bet.potentialPayout)} BNB
                      </span>
                      <div className="text-xs font-bold text-green-400/70">
                        ≈{formatBnbToUsd(formatEther(bet.potentialPayout), bnbPrice)}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-white/50 mt-1">
                    {bet.currentOdds.toFixed(2)}x odds · +{formatBNB(bet.potentialPayout - bet.amount)} BNB (≈{formatBnbToUsd(formatEther(bet.potentialPayout - bet.amount), bnbPrice)}) profit
                  </div>
                </div>

                {/* Claim Button for Won Bets (only for own profile) */}
                {isOwnProfile && bet.status === 'won' && !bet.claimed && (
                  <button
                    onClick={() => handleClaimWinnings(bet.marketId, bet.betIndex)}
                    disabled={isClaimPending}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-black py-4 px-4 rounded-2xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed animate-pulse"
                  >
                    {isClaimPending ? '⏳ CLAIMING...' : '💰 CLAIM YOUR WINNINGS NOW!'}
                  </button>
                )}

                {/* Already Claimed Badge */}
                {bet.status === 'won' && bet.claimed && (
                  <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30 rounded-2xl p-3">
                    <div className="text-sm font-bold text-purple-300 text-center">
                      ✨ Winnings Claimed
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
