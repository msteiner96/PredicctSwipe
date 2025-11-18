'use client';

import { Home, Trophy, User, Flame } from 'lucide-react';
import { useState } from 'react';

export default function BottomNav() {
  const [activeTab, setActiveTab] = useState('home');

  const tabs = [
    { id: 'home', icon: Home, label: 'Markets' },
    { id: 'trending', icon: Flame, label: 'Trending' },
    { id: 'leaderboard', icon: Trophy, label: 'Top' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/10">
      <div className="flex justify-around items-center h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
                isActive ? 'text-primary-400' : 'text-gray-400'
              }`}
            >
              <Icon
                size={24}
                className={`transition-transform ${isActive ? 'scale-110' : ''}`}
              />
              <span className={`text-xs mt-1 font-medium ${isActive ? 'text-primary-400' : ''}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 w-12 h-1 bg-primary-400 rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
