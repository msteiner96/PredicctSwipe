'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';

interface TopBarProps {
  currentView?: 'swipe' | 'leaderboard' | 'profile';
  onViewChange?: (view: 'swipe' | 'leaderboard' | 'profile') => void;
}

export default function TopBar({ currentView = 'swipe', onViewChange }: TopBarProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-xl border-b-2 border-white/10">
      <div className="flex items-center justify-between p-3 md:p-4">
        <div className="flex items-center gap-2">
          <div className="relative">
          <img src="/logo.png" alt="PredictSwipe Logo" width={40} height={40} />
          </div>
          <div className="hidden md:block">
            <h1 className="font-black text-lg md:text-xl bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              PREDICTSWIPE
            </h1>
            <p className="text-xs font-bold text-white/60">TO THE MOON 🚀</p>
          </div>
        </div>

        {onViewChange && (
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => onViewChange('swipe')}
              className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all ${
                currentView === 'swipe'
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500 scale-110'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <span className="text-2xl">🎯</span>
              <span className="text-xs font-black text-white hidden md:block">SWIPE</span>
            </button>
            <button
              onClick={() => onViewChange('leaderboard')}
              className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all ${
                currentView === 'leaderboard'
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500 scale-110'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <span className="text-2xl">🏆</span>
              <span className="text-xs font-black text-white hidden md:block">LEADERBOARD</span>
            </button>
            <button
              onClick={() => onViewChange('profile')}
              className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all ${
                currentView === 'profile'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 scale-110'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <span className="text-2xl">💎</span>
              <span className="text-xs font-black text-white hidden md:block">PROFILE</span>
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <ConnectButton
            chainStatus="icon"
            accountStatus={{
              smallScreen: 'avatar',
              largeScreen: 'full',
            }}
            showBalance={false}
          />
        </div>
      </div>
    </div>
  );
}
