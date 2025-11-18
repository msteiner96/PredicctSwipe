'use client';

import { useState } from 'react';
import { formatEther } from 'viem';

// Mock data
const MOCK_MARKETS = [
  {
    id: BigInt(1),
    question: "Will Bitcoin reach $100k by end of 2025?",
    totalYesAmount: BigInt(5000000000000000000),
    totalNoAmount: BigInt(3000000000000000000),
    resolved: false,
    outcome: false,
    resolutionTime: BigInt(Math.floor(Date.now() / 1000) + 86400 * 30),
  },
  {
    id: BigInt(2),
    question: "Will Ethereum 2.0 launch successfully this year?",
    totalYesAmount: BigInt(2000000000000000000),
    totalNoAmount: BigInt(4000000000000000000),
    resolved: false,
    outcome: false,
    resolutionTime: BigInt(Math.floor(Date.now() / 1000) + 86400 * 60),
  },
];

const MOCK_WALLET = {
  address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  balance: "2.5 BNB",
};

const MOCK_LEADERBOARD = [
  { rank: 1, address: "0x742d...f44e", profit: "+1.2 BNB", winRate: 75.5, bets: 12 },
  { rank: 2, address: "0x8d12...3a9f", profit: "+0.8 BNB", winRate: 68.2, bets: 8 },
  { rank: 3, address: "0x5f3a...bc12", profit: "+0.5 BNB", winRate: 62.1, bets: 15 },
];

interface Step {
  id: number;
  title: string;
  description: string;
  component: React.ReactNode;
}

export default function DemoPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedMarket, setSelectedMarket] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState("0.1");
  const [betSide, setBetSide] = useState<'yes' | 'no' | null>(null);
  const [walletConnected, setWalletConnected] = useState(false);

  const steps: Step[] = [
    {
      id: 0,
      title: "Backend Market Creation",
      description: "AI-powered backend automatically creates prediction markets",
      component: (
        <div className="space-y-6">
          <div className="bg-black/40 backdrop-blur-md border-4 border-purple-500/50 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">🤖</div>
              <div>
                <h3 className="text-2xl font-black text-white">Claude AI Market Generator</h3>
                <p className="text-white/60">Autonomous market creation every 2 minutes</p>
              </div>
            </div>

            <div className="bg-purple-900/30 rounded-xl p-4 border-2 border-purple-500/30 mb-4">
              <div className="text-sm text-purple-300 font-mono mb-2">$ Analyzing trending topics...</div>
              <div className="text-sm text-purple-300 font-mono mb-2">$ Generating market question...</div>
              <div className="text-sm text-green-400 font-mono">✓ Market created: "Will Bitcoin reach $100k by end of 2025?"</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {MOCK_MARKETS.map((market) => (
                <div key={market.id.toString()} className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl p-4 border-2 border-white/10">
                  <div className="text-xs text-white/60 mb-2">MARKET #{market.id.toString()}</div>
                  <div className="text-sm font-bold text-white line-clamp-2">{market.question}</div>
                  <div className="mt-3 flex gap-2">
                    <div className="flex-1 bg-green-500/20 rounded px-2 py-1 text-xs text-green-400 font-bold">
                      YES: {formatEther(market.totalYesAmount)} BNB
                    </div>
                    <div className="flex-1 bg-red-500/20 rounded px-2 py-1 text-xs text-red-400 font-bold">
                      NO: {formatEther(market.totalNoAmount)} BNB
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setCurrentStep(1)}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-black text-xl text-white hover:scale-105 transition-all shadow-lg"
          >
            NEXT: Connect Wallet
          </button>
        </div>
      ),
    },
    {
      id: 1,
      title: "Wallet Connection",
      description: "Users connect their Web3 wallet to start betting",
      component: (
        <div className="space-y-6">
          {!walletConnected ? (
            <div className="bg-black/40 backdrop-blur-md border-4 border-yellow-500/50 rounded-3xl p-8 text-center">
              <div className="text-6xl mb-4">👛</div>
              <h3 className="text-3xl font-black text-white mb-2">Connect Your Wallet</h3>
              <p className="text-white/60 mb-6">Choose your preferred wallet to get started</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {['MetaMask', 'Trust Wallet', 'Rabby Wallet', 'Coinbase'].map((wallet) => (
                  <button
                    key={wallet}
                    onClick={() => setWalletConnected(true)}
                    className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border-2 border-white/20 rounded-xl p-4 hover:border-yellow-500/50 transition-all"
                  >
                    <div className="text-2xl mb-2">🦊</div>
                    <div className="font-bold text-white">{wallet}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-black/40 backdrop-blur-md border-4 border-green-500/50 rounded-3xl p-8 text-center">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-3xl font-black text-white mb-2">Wallet Connected!</h3>
              <div className="bg-green-900/30 rounded-xl p-4 border-2 border-green-500/30 mb-6">
                <div className="text-sm text-white/60 mb-1">Address</div>
                <div className="font-mono font-bold text-green-400">{MOCK_WALLET.address}</div>
                <div className="text-sm text-white/60 mt-3 mb-1">Balance</div>
                <div className="text-2xl font-black text-white">{MOCK_WALLET.balance}</div>
                <div className="text-xs text-white/60">≈$1,500 USD</div>
              </div>

              <button
                onClick={() => setCurrentStep(2)}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full font-black text-xl text-white hover:scale-105 transition-all shadow-lg"
              >
                NEXT: Browse Markets
              </button>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 2,
      title: "Browse & Bet",
      description: "Swipe through markets and place your predictions",
      component: (
        <div className="space-y-6">
          <div className="bg-black/40 backdrop-blur-md border-4 border-blue-500/50 rounded-3xl p-6">
            <div className="text-center mb-4">
              <div className="text-5xl mb-2">📊</div>
              <h3 className="text-2xl font-black text-white">Market Swipe</h3>
              <p className="text-white/60">Swipe through predictions</p>
            </div>

            {selectedMarket === null ? (
              <div className="space-y-4">
                {MOCK_MARKETS.map((market, idx) => (
                  <div
                    key={market.id.toString()}
                    onClick={() => setSelectedMarket(idx)}
                    className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl p-6 border-2 border-white/20 cursor-pointer hover:border-blue-500/50 transition-all hover:scale-105"
                  >
                    <div className="text-sm text-white/60 mb-2">MARKET #{market.id.toString()}</div>
                    <div className="text-xl font-black text-white mb-4">{market.question}</div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-green-500/20 rounded-xl p-3 border border-green-500/30">
                        <div className="text-xs text-green-400 mb-1">YES POOL</div>
                        <div className="text-lg font-bold text-white">{formatEther(market.totalYesAmount)} BNB</div>
                        <div className="text-xs text-white/60">≈$3,000 USD</div>
                      </div>
                      <div className="bg-red-500/20 rounded-xl p-3 border border-red-500/30">
                        <div className="text-xs text-red-400 mb-1">NO POOL</div>
                        <div className="text-lg font-bold text-white">{formatEther(market.totalNoAmount)} BNB</div>
                        <div className="text-xs text-white/60">≈$1,800 USD</div>
                      </div>
                    </div>

                    <div className="text-center text-sm text-white/60">
                      Click to place bet
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-blue-600/30 to-purple-600/30 rounded-2xl p-6 border-2 border-blue-500/50">
                  <div className="text-xl font-black text-white mb-4">
                    {MOCK_MARKETS[selectedMarket].question}
                  </div>

                  <div className="mb-4">
                    <label className="text-sm text-white/60 block mb-2">Bet Amount (BNB)</label>
                    <input
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      className="w-full bg-black/40 border-2 border-white/20 rounded-xl px-4 py-3 text-white font-bold text-lg focus:border-blue-500/50 outline-none"
                      step="0.1"
                      min="0.1"
                    />
                    <div className="text-xs text-white/60 mt-1">≈${(parseFloat(betAmount) * 600).toFixed(2)} USD</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      onClick={() => setBetSide('yes')}
                      className={`py-4 rounded-xl font-black text-lg transition-all ${
                        betSide === 'yes'
                          ? 'bg-green-500 text-white scale-105 shadow-lg'
                          : 'bg-green-500/20 text-green-400 border-2 border-green-500/30'
                      }`}
                    >
                      BET YES
                    </button>
                    <button
                      onClick={() => setBetSide('no')}
                      className={`py-4 rounded-xl font-black text-lg transition-all ${
                        betSide === 'no'
                          ? 'bg-red-500 text-white scale-105 shadow-lg'
                          : 'bg-red-500/20 text-red-400 border-2 border-red-500/30'
                      }`}
                    >
                      BET NO
                    </button>
                  </div>

                  {betSide && (
                    <div className="bg-black/40 rounded-xl p-4 border-2 border-white/10 mb-4">
                      <div className="text-sm text-white/60 mb-2">Your Bet Summary</div>
                      <div className="flex justify-between items-center">
                        <span className="text-white">Amount:</span>
                        <span className="font-bold text-white">{betAmount} BNB</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white">Side:</span>
                        <span className={`font-bold ${betSide === 'yes' ? 'text-green-400' : 'text-red-400'}`}>
                          {betSide.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/10">
                        <span className="text-white">Potential Payout:</span>
                        <span className="font-bold text-yellow-400">{(parseFloat(betAmount) * 1.8).toFixed(2)} BNB</span>
                      </div>
                    </div>
                  )}

                  {betSide && (
                    <button
                      onClick={() => setCurrentStep(3)}
                      className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full font-black text-xl text-white hover:scale-105 transition-all shadow-lg"
                    >
                      CONFIRM BET
                    </button>
                  )}
                </div>

                <button
                  onClick={() => {
                    setSelectedMarket(null);
                    setBetSide(null);
                  }}
                  className="w-full py-3 bg-black/40 border-2 border-white/20 rounded-full font-bold text-white hover:border-white/40 transition-all"
                >
                  Back to Markets
                </button>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 3,
      title: "Leaderboard",
      description: "Track top performers and your ranking",
      component: (
        <div className="space-y-6">
          <div className="bg-black/40 backdrop-blur-md border-4 border-yellow-500/50 rounded-3xl p-6">
            <div className="text-center mb-6">
              <div className="text-5xl mb-2">🏆</div>
              <h3 className="text-3xl font-black text-white">LEADERBOARD</h3>
              <p className="text-white/60">TOP DEGENS</p>
            </div>

            <div className="space-y-3">
              {MOCK_LEADERBOARD.map((entry) => (
                <div
                  key={entry.rank}
                  className={`relative bg-black/40 backdrop-blur-md border-4 rounded-2xl p-4 ${
                    entry.rank === 1
                      ? 'border-yellow-500/50 shadow-xl shadow-yellow-500/30'
                      : entry.rank === 2
                      ? 'border-gray-400/50 shadow-xl shadow-gray-400/30'
                      : 'border-orange-600/50 shadow-xl shadow-orange-600/30'
                  }`}
                >
                  <div className="absolute -top-2 -left-2 w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center border-4 border-black">
                    <span className="text-lg font-black text-white">{entry.rank}</span>
                  </div>

                  <div className="flex items-center gap-4 ml-6">
                    <div className="text-3xl">
                      {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                    </div>

                    <div className="flex-1">
                      <div className="font-black text-lg text-white font-mono mb-1">{entry.address}</div>
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-white/60">Profit: </span>
                          <span className="font-black text-green-400">{entry.profit}</span>
                        </div>
                        <div>
                          <span className="text-white/60">Bets: </span>
                          <span className="font-black text-white">{entry.bets}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl px-3 py-2 border-2 border-white/20">
                      <div className="text-xs font-bold text-white/70">WIN RATE</div>
                      <div className="text-xl font-black text-white">{entry.winRate}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setCurrentStep(4)}
            className="w-full py-4 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-full font-black text-xl text-white hover:scale-105 transition-all shadow-lg"
          >
            NEXT: Claim Winnings
          </button>
        </div>
      ),
    },
    {
      id: 4,
      title: "Claim Winnings",
      description: "Collect your profits from winning bets",
      component: (
        <div className="space-y-6">
          <div className="bg-black/40 backdrop-blur-md border-4 border-green-500/50 rounded-3xl p-6">
            <div className="text-center mb-6">
              <div className="text-6xl mb-2">💰</div>
              <h3 className="text-3xl font-black text-white">CLAIM WINNINGS</h3>
              <p className="text-white/60">Collect your profits</p>
            </div>

            <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-2xl p-6 border-2 border-green-500/30 mb-6">
              <div className="text-center mb-4">
                <div className="text-sm text-white/60 mb-2">Total Claimable</div>
                <div className="text-5xl font-black text-green-400 mb-1">+0.8 BNB</div>
                <div className="text-lg text-white/60">≈$480 USD</div>
              </div>

              <div className="space-y-3">
                <div className="bg-black/40 rounded-xl p-4 border border-white/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-white/60">Market #1</span>
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full font-bold">WON</span>
                  </div>
                  <div className="text-sm font-bold text-white mb-1">Will Bitcoin reach $100k?</div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-white/60">Your bet: 0.5 BNB on YES</span>
                    <span className="text-sm font-black text-green-400">+0.4 BNB</span>
                  </div>
                </div>

                <div className="bg-black/40 rounded-xl p-4 border border-white/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-white/60">Market #3</span>
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full font-bold">WON</span>
                  </div>
                  <div className="text-sm font-bold text-white mb-1">Will ETH 2.0 launch?</div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-white/60">Your bet: 0.3 BNB on NO</span>
                    <span className="text-sm font-black text-green-400">+0.4 BNB</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setCurrentStep(5)}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full font-black text-xl text-white hover:scale-105 transition-all shadow-lg animate-pulse"
            >
              CLAIM ALL WINNINGS
            </button>
          </div>
        </div>
      ),
    },
    {
      id: 5,
      title: "Success!",
      description: "Transaction complete",
      component: (
        <div className="space-y-6">
          <div className="bg-black/40 backdrop-blur-md border-4 border-green-500/50 rounded-3xl p-8 text-center">
            <div className="text-8xl mb-4 animate-bounce">🎉</div>
            <h3 className="text-4xl font-black text-white mb-2">SUCCESS!</h3>
            <p className="text-xl text-white/60 mb-6">Winnings claimed successfully</p>

            <div className="bg-green-900/30 rounded-2xl p-6 border-2 border-green-500/30 mb-6">
              <div className="text-sm text-white/60 mb-2">Transaction Hash</div>
              <div className="font-mono text-xs text-green-400 mb-4">0x7f3a...9c2e</div>

              <div className="text-sm text-white/60 mb-2">Amount Received</div>
              <div className="text-4xl font-black text-green-400 mb-1">+0.8 BNB</div>
              <div className="text-lg text-white/60">≈$480 USD</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setCurrentStep(0)}
                className="py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-black text-white hover:scale-105 transition-all"
              >
                START OVER
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="py-3 bg-black/40 border-2 border-white/20 rounded-full font-bold text-white hover:border-white/40 transition-all"
              >
                GO TO APP
              </button>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-orange-900 overflow-hidden relative">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15),transparent_50%)] animate-pulse" />
      <div className="absolute inset-0 bg-noise opacity-20" />

      {/* Demo banner */}
      <div className="relative z-20 bg-yellow-500/20 border-b-4 border-yellow-500/50 backdrop-blur-sm py-3 px-6">
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl">🎬</span>
          <span className="font-black text-yellow-400 text-lg">DEMO MODE - NOT FOR PRODUCTION</span>
          <span className="text-2xl">🎬</span>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-8">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-black transition-all ${
                    idx <= currentStep
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white scale-110'
                      : 'bg-black/40 text-white/40 border-2 border-white/20'
                  }`}
                >
                  {idx + 1}
                </div>
                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-2 mx-2 rounded-full ${idx < currentStep ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-black/40'}`} />
                )}
              </div>
            ))}
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-black text-white mb-2">{steps[currentStep].title}</h2>
            <p className="text-white/60">{steps[currentStep].description}</p>
          </div>
        </div>

        {/* Step content */}
        <div className="mb-8">{steps[currentStep].component}</div>

        {/* Navigation */}
        {currentStep > 0 && currentStep < 5 && (
          <button
            onClick={() => setCurrentStep(currentStep - 1)}
            className="w-full py-3 bg-black/40 border-2 border-white/20 rounded-full font-bold text-white hover:border-white/40 transition-all"
          >
            ← BACK
          </button>
        )}
      </div>
    </div>
  );
}
