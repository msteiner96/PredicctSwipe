'use client';

import { useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Clock, Flame, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useCalculatePotentialPayout, useGetCurrentOdds, useMarket } from '@/hooks/usePredictMarket';
import { parseEther, formatEther } from 'viem';
import { formatBNB } from '@/utils/formatters';
import { useBnbPrice, formatBnbToUsd } from '@/hooks/useBnbPrice';

interface Market {
  id: number;
  question: string;
  category: string;
  endTime: number;
  totalYesAmount: number;
  totalNoAmount: number;
  metadata: any;
}

interface MarketCardProps {
  market: Market;
  onSwipe: (marketId: number, isYes: boolean, amount: string) => void;
  onSkip: () => void;
  direction: 'left' | 'right' | null;
  isTop: boolean;
  betAmount: string;
  onBetAmountChange: (amount: string) => void;
}

export default function MarketCard({ market, onSwipe, onSkip, direction, isTop, betAmount, onBetAmountChange }: MarketCardProps) {
  const [swipeAmount, setSwipeAmount] = useState(0);
  const [showAmountPicker, setShowAmountPicker] = useState(false);

  const quickAmounts = ['0.001', '0.005', '0.01', '0.05', '0.1'];

  // Fetch live BNB price from CoinGecko
  const { price: bnbPrice } = useBnbPrice();

  const getUSDValue = (bnbAmount: string) => {
    return `≈${formatBnbToUsd(bnbAmount, bnbPrice)}`;
  };

  // Fetch fresh market data from contract to ensure pool distribution is accurate
  const { data: freshMarketData } = useMarket(market.id);

  // Use fresh data if available, otherwise fall back to prop data
  const totalYesAmount = freshMarketData ? Number(freshMarketData.totalYesAmount) : market.totalYesAmount * 1e18;
  const totalNoAmount = freshMarketData ? Number(freshMarketData.totalNoAmount) : market.totalNoAmount * 1e18;

  const totalPool = totalYesAmount + totalNoAmount;
  const yesPercentage = totalPool > 0 ? (totalYesAmount / totalPool) * 100 : 50;

  // Calculate potential payouts for YES and NO
  const betAmountWei = betAmount && !isNaN(parseFloat(betAmount)) ? parseEther(betAmount) : BigInt(0);

  const { data: yesPayout } = useCalculatePotentialPayout(market.id, betAmountWei, true);
  const { data: noPayout } = useCalculatePotentialPayout(market.id, betAmountWei, false);

  const yesOdds = yesPayout && betAmountWei > BigInt(0) ? Number(yesPayout) / Number(betAmountWei) : 1.0;
  const noOdds = noPayout && betAmountWei > BigInt(0) ? Number(noPayout) / Number(betAmountWei) : 1.0;

  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      setSwipeAmount(eventData.deltaX);
    },
    onSwipedLeft: () => {
      if (Math.abs(swipeAmount) > 100) {
        onSwipe(market.id, false, betAmount);
      }
      setSwipeAmount(0);
    },
    onSwipedRight: () => {
      if (Math.abs(swipeAmount) > 100) {
        onSwipe(market.id, true, betAmount);
      }
      setSwipeAmount(0);
    },
    trackMouse: true,
    trackTouch: true,
  });

  const rotation = swipeAmount * 0.03;
  const opacity = 1 - Math.abs(swipeAmount) / 500;

  const getCategoryEmoji = (category: string) => {
    const emojis: { [key: string]: string } = {
      Price: '💰',
      DeFi: '🚀',
      Security: '🛡️',
      Network: '⚡',
      Events: '🎉',
      General: '🎯',
    };
    return emojis[category] || '🎯';
  };

  const getCategoryGradient = (category: string) => {
    const gradients: { [key: string]: string } = {
      Price: 'from-yellow-500 via-orange-500 to-red-500',
      DeFi: 'from-blue-500 via-purple-500 to-pink-500',
      Security: 'from-green-500 via-emerald-500 to-teal-500',
      Network: 'from-purple-500 via-violet-500 to-indigo-500',
      Events: 'from-pink-500 via-rose-500 to-red-500',
      General: 'from-gray-500 via-slate-500 to-zinc-500',
    };
    return gradients[category] || gradients.General;
  };

  return (
    <motion.div
      {...handlers}
      className="absolute inset-0 flex items-center justify-center p-4 md:p-8"
      style={{
        transform: isTop
          ? `translateX(${swipeAmount}px) rotate(${rotation}deg)`
          : 'scale(0.92) translateY(20px)',
        opacity: isTop ? opacity : 0.3,
        zIndex: isTop ? 10 : 5,
        transition: swipeAmount === 0 ? 'transform 0.3s ease-out' : 'none',
      }}
    >
      {/* Meme-style card with bold gradients */}
      <div className="relative w-full max-w-lg h-[85vh] md:h-[75vh] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white/10">

        {/* Animated gradient background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${getCategoryGradient(market.category)} opacity-90`} />

        {/* Swipe feedback overlays */}
        {swipeAmount > 50 && (
          <div className="absolute inset-0 bg-gradient-to-r from-green-400/40 via-green-500/30 to-transparent z-10 animate-pulse" />
        )}
        {swipeAmount < -50 && (
          <div className="absolute inset-0 bg-gradient-to-l from-red-400/40 via-red-500/30 to-transparent z-10 animate-pulse" />
        )}

        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay bg-noise" />

        {/* Main content */}
        <div className="relative z-20 h-full flex flex-col p-6 md:p-8">

          {/* Category badge - meme style */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border-2 border-white/20 shadow-lg">
              <span className="text-2xl">{getCategoryEmoji(market.category)}</span>
              <span className="text-sm font-black uppercase tracking-wider text-white">
                {market.category}
              </span>
            </div>

            {totalPool > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border-2 border-white/20">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-bold text-white">{formatBNB(BigInt(Math.floor(totalPool)))} BNB</span>
              </div>
            )}
          </div>

          {/* Question - big and bold */}
          <div className="flex-1 flex items-center justify-center px-2">
            <h2 className="text-4xl md:text-5xl font-black text-white text-center leading-tight drop-shadow-2xl">
              {market.question}
            </h2>
          </div>

          {/* Bet Amount Selector */}
          <div className="mb-4">
            <div className="bg-black/30 backdrop-blur-md border-2 border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-white/80">BET AMOUNT</span>
                <button
                  onClick={() => setShowAmountPicker(!showAmountPicker)}
                  className="text-xs font-bold text-yellow-400 hover:text-yellow-300"
                >
                  {showAmountPicker ? 'CLOSE' : 'CHANGE'}
                </button>
              </div>

              <div className="text-center mb-2">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-4xl font-black text-white">{parseFloat(betAmount).toFixed(3)}</span>
                  <span className="text-2xl font-bold text-white/60">BNB</span>
                </div>
                <div className="text-sm font-bold text-yellow-400 mt-1">
                  {getUSDValue(betAmount)}
                </div>
              </div>

              {showAmountPicker && (
                <div className="space-y-2 mt-3 pt-3 border-t border-white/10">
                  <div className="grid grid-cols-5 gap-2">
                    {quickAmounts.map((amount) => (
                      <button
                        key={amount}
                        onClick={() => {
                          onBetAmountChange(amount);
                          setShowAmountPicker(false);
                        }}
                        className={`py-3 px-1 rounded-lg font-bold transition-all ${
                          betAmount === amount
                            ? 'bg-yellow-400 text-black'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        <div className="text-sm">{amount}</div>
                        <div className="text-xs opacity-70 mt-0.5">
                          {formatBnbToUsd(amount, bnbPrice)}
                        </div>
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={betAmount}
                    onChange={(e) => onBetAmountChange(e.target.value)}
                    placeholder="Custom amount"
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white font-bold text-center placeholder:text-white/40"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Stats section - meme cards */}
          <div className="space-y-3 mb-6">

            {/* Pool distribution bar */}
            <div className="relative h-16 rounded-2xl overflow-hidden bg-black/30 backdrop-blur-md border-2 border-white/10 p-2">
              <div className="relative h-full rounded-xl overflow-hidden bg-black/40">
                {/* NO side (Red) */}
                <motion.div
                  className="absolute left-0 h-full bg-gradient-to-r from-red-400 to-red-500"
                  initial={{ width: '50%' }}
                  animate={{ width: `${100 - yesPercentage}%` }}
                  transition={{ duration: 0.5 }}
                />
                {/* YES side (Green) */}
                <motion.div
                  className="absolute right-0 h-full bg-gradient-to-l from-green-400 to-green-500"
                  initial={{ width: '50%' }}
                  animate={{ width: `${yesPercentage}%` }}
                  transition={{ duration: 0.5 }}
                />
                <div className="absolute inset-0 flex items-center justify-between px-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">👎</span>
                    <span className="text-lg font-black text-white drop-shadow">{(100 - yesPercentage).toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-white drop-shadow">{yesPercentage.toFixed(0)}%</span>
                    <span className="text-2xl">👍</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Potential Payouts - Dynamic Odds */}
            {betAmountWei > BigInt(0) && (
              <div className="grid grid-cols-2 gap-2">
                {/* NO Payout */}
                <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 backdrop-blur-md border-2 border-red-500/40 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white/70">👎 NO</span>
                    <span className="text-xs font-black text-red-300">{noOdds.toFixed(2)}x</span>
                  </div>
                  <div className="text-lg font-black text-white">
                    {noPayout ? formatBNB(noPayout) : betAmount}
                  </div>
                  <div className="text-xs font-bold text-white/50">BNB</div>
                </div>

                {/* YES Payout */}
                <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-md border-2 border-green-500/40 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white/70">👍 YES</span>
                    <span className="text-xs font-black text-green-300">{yesOdds.toFixed(2)}x</span>
                  </div>
                  <div className="text-lg font-black text-white">
                    {yesPayout ? formatBNB(yesPayout) : betAmount}
                  </div>
                  <div className="text-xs font-bold text-white/50">BNB</div>
                </div>
              </div>
            )}

            {/* Time remaining */}
            <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-black/30 backdrop-blur-md border-2 border-white/10">
              <Clock className="w-5 h-5 text-white" />
              <span className="text-sm font-bold text-white">
                {market.endTime && !isNaN(market.endTime) ? formatDistanceToNow(market.endTime, { addSuffix: true }) : 'Ends soon'}
              </span>
            </div>
          </div>

          {/* Action buttons - huge and meme-y */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => onSwipe(market.id, false, betAmount)}
              className="group relative w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 shadow-2xl transform hover:scale-110 active:scale-95 transition-all duration-200 border-4 border-white/30"
            >
              <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-0 group-hover:opacity-100" />
              <span className="relative text-5xl drop-shadow-lg">👎</span>
            </button>

            <button
              onClick={onSkip}
              className="group relative w-16 h-16 rounded-full bg-black/50 backdrop-blur-md hover:bg-black/70 shadow-xl transform hover:scale-110 active:scale-95 transition-all duration-200 border-2 border-white/20"
            >
              <span className="relative text-3xl">⏭️</span>
            </button>

            <button
              onClick={() => onSwipe(market.id, true, betAmount)}
              className="group relative w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 shadow-2xl transform hover:scale-110 active:scale-95 transition-all duration-200 border-4 border-white/30"
            >
              <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-0 group-hover:opacity-100" />
              <span className="relative text-5xl drop-shadow-lg">👍</span>
            </button>
          </div>

          <p className="text-center text-white/80 text-sm font-bold mt-4 tracking-wide">
            SWIPE TO BET 🔥 TAP BUTTONS 💎
          </p>
        </div>

        {/* Swipe indicators - huge and obvious */}
        <div className="absolute inset-0 flex items-center justify-between px-12 pointer-events-none z-30">
          <motion.div
            className="transform rotate-12"
            style={{
              opacity: Math.min(Math.abs(swipeAmount) / 100, 1),
              display: swipeAmount < -50 ? 'block' : 'none',
              scale: 1 + Math.abs(swipeAmount) / 300,
            }}
          >
            <div className="px-8 py-4 bg-red-500 rounded-2xl border-4 border-white shadow-2xl">
              <span className="text-6xl">👎</span>
              <p className="text-white font-black text-2xl mt-2">NOPE!</p>
            </div>
          </motion.div>

          <motion.div
            className="transform -rotate-12"
            style={{
              opacity: Math.min(Math.abs(swipeAmount) / 100, 1),
              display: swipeAmount > 50 ? 'block' : 'none',
              scale: 1 + Math.abs(swipeAmount) / 300,
            }}
          >
            <div className="px-8 py-4 bg-green-500 rounded-2xl border-4 border-white shadow-2xl">
              <span className="text-6xl">👍</span>
              <p className="text-white font-black text-2xl mt-2">YESS!</p>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
