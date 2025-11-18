'use client';

import { useState, useMemo } from 'react';
import { formatEther } from 'viem';
import { useAllMarkets } from '@/hooks/usePredictMarket';
import { useReadContracts } from 'wagmi';
import { CONTRACTS, PREDICT_MARKET_ABI } from '@/contracts';
import { formatBNB } from '@/utils/formatters';
import { useBnbPrice, formatBnbToUsd } from '@/hooks/useBnbPrice';

interface LeaderboardEntry {
  address: string;
  totalProfit: bigint;
  totalVolume: bigint;
  totalBets: number;
  winRate: number;
  rank: number;
}

interface Bet {
  bettor: string;
  marketId: bigint;
  amount: bigint;
  isYes: boolean;
  timestamp: bigint;
  claimed: boolean;
}

interface LeaderboardProps {
  onUserClick?: (address: string) => void;
}

export default function Leaderboard({ onUserClick }: LeaderboardProps = {}) {
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | 'all'>('all');
  const { data: allMarkets } = useAllMarkets();
  const { price: bnbPrice } = useBnbPrice();

  // Fetch all bets from all markets (both active and resolved)
  const contracts = (allMarkets || []).map((market: any) => {
    const marketId = market?.id ?? market?.[0];
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

  // Process leaderboard data
  const leaderboard = useMemo(() => {
    if (!allMarketBets || !allMarkets) return [];

    const now = Date.now();
    const timeframeMs = timeframe === '24h' ? 24 * 60 * 60 * 1000 : timeframe === '7d' ? 7 * 24 * 60 * 60 * 1000 : Infinity;

    // Aggregate all bets by user
    const userStats = new Map<string, { totalProfit: bigint; totalVolume: bigint; bets: number; wins: number }>();

    allMarketBets.forEach((result, marketIndex) => {
      const bets = result.result as Bet[] | undefined;
      if (!bets || !Array.isArray(bets)) return;

      const market: any = allMarkets[marketIndex];
      const isResolved = market?.resolved ?? false;
      const outcome = market?.outcome ?? false;
      const totalYesAmount = market?.totalYesAmount ?? BigInt(0);
      const totalNoAmount = market?.totalNoAmount ?? BigInt(0);

      bets.forEach((bet: Bet) => {
        const betTime = Number(bet.timestamp) * 1000;

        // Filter by timeframe
        if (now - betTime > timeframeMs) return;

        const address = bet.bettor;
        const current = userStats.get(address) || { totalProfit: BigInt(0), totalVolume: BigInt(0), bets: 0, wins: 0 };

        current.totalVolume += bet.amount;
        current.bets += 1;

        // Calculate profit for resolved markets
        if (isResolved) {
          const isWinner = (bet.isYes && outcome) || (!bet.isYes && !outcome);

          if (isWinner) {
            current.wins += 1;

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

        userStats.set(address, current);
      });
    });

    // Convert to leaderboard entries and sort by profit
    const entries: LeaderboardEntry[] = Array.from(userStats.entries())
      .map(([address, stats]) => ({
        address,
        totalProfit: stats.totalProfit,
        totalVolume: stats.totalVolume,
        totalBets: stats.bets,
        winRate: stats.bets > 0 ? (stats.wins / stats.bets) * 100 : 0,
        rank: 0,
      }))
      .sort((a, b) => {
        // Sort by total profit (descending)
        if (a.totalProfit > b.totalProfit) return -1;
        if (a.totalProfit < b.totalProfit) return 1;
        return 0;
      })
      .slice(0, 10); // Top 10

    // Assign ranks
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return entries;
  }, [allMarketBets, allMarkets, timeframe]);

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '💎';
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="h-screen pt-5 bg-gradient-to-br from-purple-900 via-pink-900 to-orange-900 overflow-hidden relative">
      {/* Animated background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15),transparent_50%)] animate-pulse" />
      <div className="absolute inset-0 bg-noise opacity-20" />

      <div className="relative z-10 h-full flex flex-col pt-24 pb-6 px-6 overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-7xl mb-4 animate-bounce">🏆</div>
          <h1 className="text-6xl font-black bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent drop-shadow-2xl mb-2">
            LEADERBOARD
          </h1>
          <p className="text-2xl font-black text-white/80">TOP DEGENS 🔥</p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex gap-3 justify-center mb-6">
          {(['24h', '7d', 'all'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-6 py-3 rounded-full font-black text-lg transition-all ${
                timeframe === tf
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white scale-110 shadow-lg shadow-yellow-500/50'
                  : 'bg-black/30 text-white/60 border-2 border-white/10 hover:border-yellow-500/50'
              }`}
            >
              {tf === '24h' ? '24H' : tf === '7d' ? '7D' : 'ALL TIME'}
            </button>
          ))}
        </div>

        {/* Leaderboard List */}
        <div className="space-y-3">
          {leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👻</div>
              <p className="text-xl font-bold text-white/60">No bettors yet!</p>
              <p className="text-sm text-white/40 mt-2">Be the first to make predictions 🚀</p>
            </div>
          ) : (
            leaderboard.map((entry, index) => (
            <div
              key={entry.address}
              onClick={() => onUserClick?.(entry.address)}
              className={`relative bg-black/40 backdrop-blur-md border-4 rounded-3xl p-5 transition-all hover:scale-105 cursor-pointer ${
                entry.rank === 1
                  ? 'border-yellow-500/50 shadow-xl shadow-yellow-500/30 hover:shadow-yellow-500/50'
                  : entry.rank === 2
                  ? 'border-gray-400/50 shadow-xl shadow-gray-400/30 hover:shadow-gray-400/50'
                  : entry.rank === 3
                  ? 'border-orange-600/50 shadow-xl shadow-orange-600/30 hover:shadow-orange-600/50'
                  : 'border-white/10 hover:border-white/30'
              }`}
            >
              {/* Rank Badge */}
              <div className="absolute -top-3 -left-3 w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center border-4 border-black shadow-lg">
                <span className="text-2xl font-black text-white">{entry.rank}</span>
              </div>

              <div className="flex items-center gap-4 ml-6">
                {/* Emoji */}
                <div className="text-5xl">{getRankEmoji(entry.rank)}</div>

                {/* User Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-black text-xl text-white font-mono">
                      {formatAddress(entry.address)}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1">
                        <span className="text-white/60 font-bold">Profit:</span>
                        <span className={`font-black ${
                          entry.totalProfit > 0
                            ? 'text-green-400'
                            : entry.totalProfit < 0
                            ? 'text-red-400'
                            : 'text-yellow-400'
                        }`}>
                          {entry.totalProfit > 0 ? '+' : ''}{formatBNB(entry.totalProfit)} BNB
                        </span>
                      </div>
                      <div className={`text-xs font-bold ${
                        entry.totalProfit > 0
                          ? 'text-green-400/70'
                          : entry.totalProfit < 0
                          ? 'text-red-400/70'
                          : 'text-yellow-400/70'
                      }`}>
                        {entry.totalProfit > 0 ? '≈+' : '≈'}{formatBnbToUsd(formatEther(entry.totalProfit), bnbPrice)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-white/60 font-bold">Bets:</span>
                      <span className="font-black text-white">{entry.totalBets}</span>
                    </div>
                  </div>
                </div>

                {/* Win Rate Badge */}
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl px-4 py-2 border-2 border-white/20">
                  <div className="text-xs font-bold text-white/70">WIN RATE</div>
                  <div className="text-2xl font-black text-white">{entry.winRate.toFixed(2)}%</div>
                </div>
              </div>

              {/* Achievement Badges for Top 3 */}
              {entry.rank <= 3 && (
                <div className="mt-3 pt-3 border-t-2 border-white/10">
                  <div className="flex gap-2 justify-center">
                    {entry.rank === 1 && (
                      <>
                        <span className="bg-yellow-500/20 border-2 border-yellow-500/50 rounded-full px-3 py-1 text-xs font-black text-yellow-300">
                          👑 KING
                        </span>
                        <span className="bg-purple-500/20 border-2 border-purple-500/50 rounded-full px-3 py-1 text-xs font-black text-purple-300">
                          🚀 LEGEND
                        </span>
                      </>
                    )}
                    {entry.rank === 2 && (
                      <span className="bg-blue-500/20 border-2 border-blue-500/50 rounded-full px-3 py-1 text-xs font-black text-blue-300">
                        💪 STRONG
                      </span>
                    )}
                    {entry.rank === 3 && (
                      <span className="bg-orange-500/20 border-2 border-orange-500/50 rounded-full px-3 py-1 text-xs font-black text-orange-300">
                        🔥 HOT
                      </span>
                    )}
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
