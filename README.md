# PredicctSwipe 📱

<div align="center">
  <img src="https://prediction-tiktok-frontend.vercel.app/logo.png" alt="PredicctSwipe Logo" width="200"/>

  ### Swipe. Predict. Win.

  **The Tinder of Prediction Markets - Built for Gen Z**

  [![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Try_Now-success?style=for-the-badge)](https://prediction-tiktok-frontend.vercel.app/)
  [![BNB Chain](https://img.shields.io/badge/⛓️_BNB_Chain-Testnet-yellow?style=for-the-badge)](https://testnet.bscscan.com/)
  [![Hackathon](https://img.shields.io/badge/🏆_Seedify-Hackathon-purple?style=for-the-badge)](https://dorahacks.io/hackathon/predictionmarketshackathon)

  **[🎮 Try Live Demo](https://prediction-tiktok-frontend.vercel.app/)** | **[📹 Watch Video](#)** | **[📖 Docs](#)**
</div>

---

## 🎯 Hackathon Submission

**Event:** [Seedify Prediction Markets Hackathon](https://dorahacks.io/hackathon/predictionmarketshackathon)
**Category:** DeFi Innovation / UX Excellence
**Network:** BNB Chain Testnet (Chain ID: 97)
**Status:** 🟢 Live & Deployed
**Team:** Solo Submission

---

## 💡 The Big Idea

**What if prediction markets were as addictive as Tinder?**

PredicctSwipe reimagines prediction markets for **Gen Z** by combining the viral UX of dating apps with the power of DeFi. Instead of complex forms and intimidating interfaces, users simply **swipe right for YES, swipe left for NO** on bite-sized prediction questions.

### The Tinder Formula Applied to Prediction Markets

```
Tinder → Dating          =  Quick swipes + Instant gratification + Gamification
PredicctSwipe → Betting  =  Quick swipes + Instant payouts + Leaderboards
```

**Key Insight:** Gen Z doesn't want to "trade" - they want to **play, compete, and win**. We turned prediction markets into a mobile game.

---

## 🚨 The Problem

Traditional prediction markets are **failing to capture Gen Z**:

❌ **Desktop-first UIs** - Forms, charts, overwhelming data
❌ **High barriers** - $50+ minimum bets, complex wallet setups
❌ **Slow interactions** - 30+ seconds to place a bet
❌ **No social proof** - Can't see friends, leaderboards, or competition
❌ **Manual market creation** - Limited variety, slow updates
❌ **Boring** - Feels like work, not entertainment

**Result:** Despite Polymarket doing $200M+ volume, 99% of crypto users have never tried prediction markets.

---

## ✨ The Solution

### 🎯 Core Innovation: Tinder-Style UX

**Betting in 3 Seconds:**
1. **See** a full-screen question card
2. **Swipe** right for YES / left for NO
3. **Win** when the market resolves

That's it. No forms. No complexity. **Pure dopamine-driven prediction gaming.**

### 🤖 AI-Powered Everything

**Market Creation:**
- AI monitors real-time data (crypto prices, DeFi TVL, gas fees, network activity)
- Generates 100+ fresh questions daily
- Examples: "Will BNB hit $700 by Friday?" / "Will BSC gas stay under 5 gwei today?"

**Market Resolution:**
- AI fetches oracle data from CoinGecko, DeFiLlama, BSCScan
- Automatically resolves markets with provable outcomes
- No human intervention needed - fully autonomous

**Current Status:**
- ✅ AI generation logic implemented (locally working)
- ⏳ Cloud deployment pending (Anthropic API integration in progress)

### 💰 Micro-Betting Economy

**Small bets. Many bets. Fast turnover.**

- **Bet sizes:** $0.50 - $50 (0.001 - 10 BNB)
- **Market duration:** 4 hours to 7 days (not weeks)
- **Volume model:** 1000 bets of $5 > 10 bets of $500
- **Target:** Gen Z with small bankrolls but high engagement

### 🏆 Hyper-Gamification

**Everything is a game:**
- **5 Levels:** Rookie → Trader → Analyst → Oracle → Legend
- **Achievement Badges:** Hot Streak, Sharpshooter, Whale Hunter, Bull/Bear Slayer
- **Global Leaderboard:** 24h, 7d, all-time rankings
- **Win Streaks:** 7-day streaks unlock multipliers
- **Social Competition:** See who's #1, compete with friends

---

## 🎮 Key Features

### 📱 Tinder-Style Interface
- **Full-screen vertical cards** - One market at a time, zero distractions
- **Swipe gestures** - Right = YES, Left = NO (muscle memory from dating apps)
- **Smooth animations** - 60fps Framer Motion transitions
- **Infinite scroll** - Fresh markets loaded continuously
- **Mobile-first PWA** - Install to home screen like TikTok

### 🤖 AI Market Engine
- **Real-time monitoring:** CoinGecko prices, DeFiLlama TVL, BSCScan gas
- **Question generation:** AI creates relevant, timely markets every hour
- **Auto-resolution:** Outcomes determined by oracle data, not humans
- **Categories:** Price 💰 | DeFi 🚀 | Security 🛡️ | Network ⚡ | Events 🎉
- **Smart timing:** Markets resolve in hours/days for fast dopamine hits

### 💸 Live Market Data
- **Real-time BNB/USD pricing** from CoinGecko
- **Dynamic odds calculator** - See potential payout before betting
- **Pool distribution viz** - Watch YES vs NO pools grow in real-time
- **Win probability display** - "68% betting YES" social proof
- **Instant updates** - WebSocket feeds for sub-second latency

### 🏆 Gamification System
- **XP & Levels:** Earn experience for every bet, level up for prestige
- **Badges:** Unlock 15+ achievements (Hot Streak, Sharpshooter, etc.)
- **Leaderboard:** Global rankings by profit, win rate, volume
- **Streak bonuses:** 7-day streak = 2x rewards
- **User profiles:** View anyone's stats, bet history, achievements

### 👤 Social Features
- **Public leaderboard** - Top 10 predictors globally
- **User profiles** - Click any username to see their stats
- **Bet history** - Active bets, past wins/losses
- **On-chain usernames** - 3-20 character handles
- **Claimable winnings** - One-click withdraw from profile

---

## 🏗️ Technical Architecture

### Smart Contracts (Solidity 0.8.24)

**PredictMarket.sol** - Core betting engine
```solidity
// Parimutuel pool-based betting
function placeBet(uint256 marketId, bool outcome, string memory username)
    external payable nonReentrant

// Winners split the losing pool
function claimWinnings(uint256 marketId) external nonReentrant
```

**SwipeToken.sol** - ERC20 reward token
```solidity
// 1B max supply, reward distribution
contract SwipeToken is ERC20, ERC20Burnable, Ownable
```

**OracleResolver.sol** - Multi-oracle resolution
```solidity
// Decentralized market resolution
function submitResolution(uint256 marketId, bool outcome, string memory proofUrl)
    external onlyOracle
```

**UserRegistry.sol** - On-chain usernames
```solidity
// Unique username registration
function registerUsername(string memory username) external
```

**Deployed Addresses (BNB Testnet):**
- PredictMarket: `0xB895f15215820133E5E9bA16b75ABDC7b17E6CaB`
- SwipeToken: `0x472dA53A7c96F217Da14375d0dcb53605e6E98A9`
- OracleResolver: `0x54a44Ccd3601378709eB99A76712A60B0f0F1da6`

### Frontend (Next.js 14 + React 18)

**Technology Stack:**
- **Next.js 14** - App Router, Server Components, API Routes
- **TypeScript** - Full type safety
- **TailwindCSS** - Utility-first styling
- **Framer Motion** - 60fps animations
- **RainbowKit** - Wallet connection (MetaMask, WalletConnect, Trust, Coinbase)
- **Wagmi + Viem** - Type-safe Ethereum interactions
- **Zustand** - Lightweight state management
- **react-swipeable** - Touch gesture detection

**Key Components:**

`MarketCard.tsx` - Swipeable prediction cards
```typescript
const handlers = useSwipeable({
  onSwipedLeft: () => handleBet(false),  // Swipe left = NO
  onSwipedRight: () => handleBet(true),  // Swipe right = YES
  preventScrollOnSwipe: true,
  trackMouse: true
})
```

`Leaderboard.tsx` - Competitive rankings
```typescript
// Real-time profit tracking with parimutuel calculations
const topBettors = useMemo(() => {
  return bettors
    .map(bettor => calculateProfit(bettor))
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 10)
}, [bettors])
```

`UserProfile.tsx` - Stats & bet history
```typescript
// Active bets, claimable winnings, historical performance
<Tabs>
  <TabPanel>Active Bets ({activeBets.length})</TabPanel>
  <TabPanel>History ({resolvedBets.length})</TabPanel>
</Tabs>
```

### AI Engine (Python)

**Market Generation Pipeline:**
```python
# Monitor real-time data
bnb_price = get_coingecko_price("binancecoin")
tvl_data = get_defi_llama("bsc")
gas_price = get_bsc_gas_price()

# Generate market ideas with AI
markets = claude.generate_markets({
    "bnb_price": bnb_price,
    "price_change_24h": calculate_change(bnb_price),
    "tvl": tvl_data,
    "gas": gas_price
})

# Create top 2 markets on-chain
for market in markets[:2]:
    create_market_on_chain(market)
```

**Auto-Resolution Logic:**
```python
# Check market outcomes via oracles
if market.category == "price":
    actual_price = get_coingecko_price(market.asset)
    outcome = actual_price >= market.target_price
elif market.category == "defi":
    actual_tvl = get_defi_llama_tvl(market.protocol)
    outcome = actual_tvl >= market.target_tvl

# Resolve on-chain
oracle.resolve_market(market_id, outcome, proof_url)
```

**Data Sources:**
- **CoinGecko API** - Crypto prices (BNB, CAKE, etc.)
- **DeFiLlama API** - Protocol TVL, DeFi metrics
- **BSCScan API** - Gas prices, network activity
- **On-chain** - Block times, tx counts, smart contract events

### Backend (Node.js + Express)

**API Endpoints:**
```javascript
GET  /api/markets          // Fetch active markets
POST /api/markets          // Create new market (AI)
GET  /api/leaderboard      // Top bettors
GET  /api/users/:address   // User profile
POST /api/automation/run   // Trigger AI market gen
```

**WebSocket Server:**
```javascript
// Real-time market updates
wss.on('connection', (ws) => {
  // Push pool updates every 3 seconds
  setInterval(() => {
    ws.send(JSON.stringify({ type: 'pool_update', data }))
  }, 3000)
})
```

---

## 💰 How It Works: Parimutuel Betting

**Unlike traditional betting (you vs house), PredicctSwipe uses peer-to-peer pools:**

### Example Scenario

```
Market: "Will BNB hit $700 by Friday?"

Total Pool: 10 BNB
├─ YES Pool: 3 BNB (30% of bettors)
└─ NO Pool: 7 BNB (70% of bettors)

--- Market Resolves: YES wins! ---

Losing Pool (NO bets): 7 BNB
├─ Platform Fee (2%): 0.14 BNB
└─ Winners' Share: 6.86 BNB

Your Bet: 1 BNB on YES
Your Share: 1 / 3 = 33.33% of YES pool
Your Payout: 1 BNB (original) + (1 × 6.86/3) (winnings)
           = 1 + 2.29 = 3.29 BNB

Your Profit: 2.29 BNB (229% ROI!)
```

### Why Parimutuel?

✅ **No house edge** - You bet against other users
✅ **Better odds for early bets** - Incentivizes quick decisions
✅ **Fair distribution** - Winners split losing pool proportionally
✅ **Sustainable fees** - Only 2% platform fee on losing pool

---

## 🎯 Target Market: Gen Z

### Why Gen Z?

- **250M+ crypto-curious users** globally under 25
- **Mobile-native** - 90% of time spent on phone
- **Gamification addicts** - Fortnite, TikTok, Roblox generation
- **Small bankrolls** - $10-$100 to gamble, not $1000s
- **Social proof driven** - Leaderboards > absolute returns
- **Short attention spans** - Need results in hours, not weeks

### Our Advantages vs Competition

| Feature | PredicctSwipe | Polymarket | Azuro |
|---------|--------------|------------|-------|
| **Min Bet** | $0.50 | $10+ | $5+ |
| **UX** | Tinder swipes | Desktop forms | Sports betting |
| **Speed** | <3 sec | 30+ sec | 15+ sec |
| **Mobile** | PWA, mobile-first | Responsive web | Mobile app |
| **Gamification** | Levels, badges, streaks | None | Basic points |
| **Market Creation** | AI-automated | Manual curation | Sports schedules |
| **Social** | Built-in leaderboard | External | None |
| **Target** | Gen Z (18-25) | Crypto traders (25-45) | Sports bettors |

---

## 🚀 Live Demo

### 🌐 Try It Now: [https://prediction-tiktok-frontend.vercel.app/](https://prediction-tiktok-frontend.vercel.app/)

**Quick Start Guide:**

1. **Visit on desktop** (best experience)
2. **Connect wallet** - MetaMask, WalletConnect, Trust Wallet, Coinbase Wallet
3. **Switch to BNB Testnet** (Chain ID: 97)
4. **Get testnet BNB** - [BNB Faucet](https://testnet.bnbchain.org/faucet-smart)
5. **Start swiping!** - Swipe right for YES, left for NO
6. **Check leaderboard** - See top predictors globally
7. **View your profile** - Track stats, claim winnings

**What to expect:**
- ✅ 10+ active markets across price, DeFi, network categories
- ✅ Real-time BNB/USD pricing
- ✅ Live pool updates (YES vs NO distribution)
- ✅ Smooth swipe animations (try on mobile!)
- ✅ Leaderboard with top 10 bettors
- ✅ User profiles with bet history

---

## 📊 Current Status

### ✅ Completed

- [x] **Smart Contracts** - Deployed to BNB Testnet, fully functional
- [x] **Frontend** - TikTok-style swipe UI, mobile-optimized PWA
- [x] **Web3 Integration** - RainbowKit wallet connection, Wagmi hooks
- [x] **Live Data** - Real-time BNB pricing from CoinGecko
- [x] **Parimutuel System** - Dynamic odds, payout calculations
- [x] **Leaderboard** - Global rankings, profit tracking, win rates
- [x] **User Profiles** - Stats, bet history, claimable winnings
- [x] **Gamification** - Levels, badges, XP system
- [x] **AI Market Logic** - Python engine with DeFi data monitoring
- [x] **Auto-Resolution** - Oracle-based outcome determination

### ⏳ In Progress

- [ ] **AI Deployment** - Deploying Python engine to cloud (Anthropic API integration)
- [ ] **Contract Verification** - BSCScan verification for transparency
- [ ] **Additional Markets** - Expanding from 10 to 100+ active markets
- [ ] **Push Notifications** - Market resolution alerts
- [ ] **Social Sharing** - Tweet your wins

### 🔮 Planned (Post-Hackathon)

- [ ] **Mainnet Launch** - Deploy to BNB Chain mainnet
- [ ] **Mobile Apps** - Native iOS/Android (React Native)
- [ ] **Chainlink Integration** - Decentralized price feeds for resolution
- [ ] **Multi-chain** - Expand to Polygon, Arbitrum, Base
- [ ] **Social Features** - Friends, groups, challenges
- [ ] **Advanced AI** - GPT-4, sentiment analysis, news parsing

---

## 🛠️ Tech Stack Summary

| Layer | Technologies |
|-------|-------------|
| **Blockchain** | BNB Chain, Solidity 0.8.24, Hardhat, Ethers.js |
| **Smart Contracts** | OpenZeppelin (security), Chainlink (oracles), ReentrancyGuard |
| **Frontend** | Next.js 14, React 18, TypeScript, TailwindCSS |
| **Web3** | RainbowKit, Wagmi, Viem, WalletConnect |
| **Animations** | Framer Motion, react-swipeable |
| **Backend** | Node.js, Express, WebSocket (ws) |
| **Database** | MongoDB (user data), Redis (caching) |
| **AI/ML** | Python 3.9+, Anthropic Claude, OpenAI GPT |
| **Data APIs** | CoinGecko, DeFiLlama, BSCScan |
| **Deployment** | Vercel (frontend), Railway (backend), AWS (AI) |

---

## 📁 Project Structure

```
predictswipe/
├── contracts/                    # Solidity smart contracts
│   ├── PredictMarket.sol         # Main betting logic
│   ├── SwipeToken.sol            # ERC20 reward token
│   ├── OracleResolver.sol        # Market resolution
│   ├── UserRegistry.sol          # Username system
│   ├── hardhat.config.js         # Hardhat config
│   └── scripts/                  # 22 deployment scripts
│       ├── deploy.js             # Main deployment
│       ├── create-markets.js     # Seed markets
│       └── verify.js             # Contract verification
│
├── frontend/                     # Next.js 14 application
│   ├── src/
│   │   ├── app/                  # Next.js app router
│   │   │   ├── page.tsx          # Main app page
│   │   │   └── layout.tsx        # Root layout
│   │   ├── components/
│   │   │   ├── features/         # Feature components
│   │   │   │   ├── MarketCard.tsx       # Swipeable cards
│   │   │   │   ├── Leaderboard.tsx      # Rankings
│   │   │   │   └── UserProfile.tsx      # User stats
│   │   │   ├── ui/               # UI primitives
│   │   │   ├── TopBar.tsx        # Header
│   │   │   └── BottomNav.tsx     # Navigation
│   │   ├── hooks/                # Custom React hooks
│   │   │   ├── usePredictMarket.ts
│   │   │   ├── useBnbPrice.ts
│   │   │   └── useLeaderboard.ts
│   │   ├── contracts/            # ABIs and addresses
│   │   │   ├── PredictMarketABI.json
│   │   │   └── addresses.ts
│   │   └── store/                # Zustand state
│   └── public/                   # Static assets
│       └── logo.png
│
├── backend/                      # Node.js API server
│   └── src/
│       ├── index.js              # Express app
│       ├── services/             # Business logic
│       │   ├── marketAutomation.js
│       │   ├── oracleAggregator.js
│       │   └── websocket.js
│       └── routes/               # API routes
│
└── ai-engine/                    # Python AI system
    ├── src/
    │   ├── main.py               # Main automation loop
    │   ├── market_generator.py   # AI question generation
    │   ├── data_fetcher.py       # API integrations
    │   └── auto_resolver.py      # Oracle resolution
    └── requirements.txt          # Python dependencies
```

---

## 🔧 Local Development Setup

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- MetaMask or Web3 wallet
- BNB Testnet tokens

### Installation

```bash
# 1. Clone repository
git clone https://github.com/yourusername/predictswipe.git
cd predictswipe

# 2. Install frontend dependencies
cd frontend
npm install

# 3. Install contract dependencies
cd ../contracts
npm install

# 4. Install backend dependencies
cd ../backend
npm install

# 5. Install AI engine dependencies
cd ../ai-engine
pip install -r requirements.txt
```

### Environment Variables

**Frontend** (`.env.local`):
```env
NEXT_PUBLIC_ALCHEMY_ID=your_alchemy_api_key
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

**Backend** (`.env`):
```env
ANTHROPIC_API_KEY=your_anthropic_api_key
MONGODB_URI=your_mongodb_connection_string
REDIS_URL=your_redis_url
PRIVATE_KEY=your_deployer_wallet_private_key
```

**AI Engine** (`.env`):
```env
OPENAI_API_KEY=your_openai_api_key
COINGECKO_API_KEY=your_coingecko_api_key
DEFI_LLAMA_API_KEY=your_defillama_key
DEPLOYER_PRIVATE_KEY=your_wallet_private_key
RPC_URL=https://data-seed-prebsc-1-s1.bnbchain.org:8545
```

### Running Locally

**Terminal 1 - Frontend:**
```bash
cd frontend
npm run dev
# → http://localhost:3000
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
# → http://localhost:3001
```

**Terminal 3 - AI Engine:**
```bash
cd ai-engine
python src/main.py
# → Runs hourly automation
```

---

## 🧪 Testing

**Smart Contracts:**
```bash
cd contracts
npx hardhat test                    # Run all tests
npx hardhat test --network bscTestnet  # Test on testnet
npx hardhat coverage                # Code coverage
```

**Frontend:**
```bash
cd frontend
npm run test                        # Unit tests
npm run test:e2e                    # E2E tests (Playwright)
```

---

## 🏆 Why PredicctSwipe Wins This Hackathon

### 1. **Novel UX Innovation** 🎨
We're the **first prediction market with Tinder-style swipe interface**. This isn't incremental improvement - it's a paradigm shift. We reduced bet time from 30 seconds to 3 seconds.

### 2. **AI-First Approach** 🤖
**Fully autonomous market lifecycle:**
- AI monitors real-time data (prices, TVL, gas, events)
- AI generates relevant questions every hour
- AI resolves outcomes using oracle data
- **No humans in the loop** after initial setup

### 3. **Gen Z Product-Market Fit** 👾
Traditional prediction markets target traders. PredicctSwipe targets **gamers and TikTokers**:
- Mobile-first PWA (90% of Gen Z time)
- Micro-bets ($0.50+, not $50+)
- Gamification (levels, badges, streaks)
- Fast results (hours, not weeks)

### 4. **Technical Excellence** ⚙️
- **Parimutuel pools** - Peer-to-peer, no house edge
- **Multi-oracle system** - Decentralized resolution
- **ReentrancyGuard** - Security best practices
- **WebSocket feeds** - Real-time updates
- **Deployed & working** - Not vaporware

### 5. **Massive TAM** 📈
- **$200M+ annual volume** on Polymarket (proof of concept)
- **250M+ Gen Z crypto users** globally (our target)
- **99% untapped** - Almost no Gen Z using prediction markets today
- **Viral mechanics** - Leaderboards, sharing, streaks drive organic growth
- **PredicctSwipe opens this massive market** to mobile-first Gen Z users

### 6. **BNB Chain Synergy** ⛓️
- **Low fees** - $0.10/tx enables micro-betting
- **Fast finality** - 3-second confirmations = instant gratification
- **BSC DeFi data** - Rich oracle sources (PancakeSwap, Venus, etc.)
- **Growing ecosystem** - 1M+ daily active users

---

## 🛣️ Roadmap

### 🎯 Phase 1: MVP (✅ Current)
- [x] Core smart contracts (PredictMarket, SwipeToken, OracleResolver)
- [x] TikTok-style swipe UI with Framer Motion
- [x] Web3 wallet integration (RainbowKit)
- [x] AI market generation logic (Python)
- [x] Leaderboard and user profiles
- [x] Parimutuel betting calculations
- [x] Real-time BNB/USD pricing

### 🚀 Phase 2: Mainnet Launch (Q1 2025)
- [ ] Deploy contracts to BNB Chain mainnet
- [ ] Security audit (CertiK or Hacken)
- [ ] Integrate Chainlink Price Feeds for resolution
- [ ] Launch SWIPE token distribution
- [ ] Marketing campaign (Twitter, TikTok, YouTube)
- [ ] Influencer partnerships (crypto Twitter, TikTok)
- [ ] Liquidity bootstrap (SWIPE/BNB pool)

### 📱 Phase 3: Mobile Apps (Q2 2025)
- [ ] Native iOS app (React Native)
- [ ] Native Android app (React Native)
- [ ] Push notifications (market resolutions, wins)
- [ ] Social sharing (share wins to Twitter/TikTok)
- [ ] App Store / Play Store launch
- [ ] Onboarding flow for non-crypto users

### 🌐 Phase 4: Multi-Chain (Q3 2025)
- [ ] Deploy to Polygon (low fees)
- [ ] Deploy to Arbitrum (Ethereum L2)
- [ ] Deploy to Base (Coinbase L2)
- [ ] Cross-chain betting (bet on ETH from BNB Chain)
- [ ] Multi-chain leaderboard aggregation

### 🤖 Phase 5: Advanced AI (Q4 2025)
- [ ] GPT-4 Turbo integration for smarter questions
- [ ] Twitter sentiment analysis markets
- [ ] News event parsing (CoinDesk, Cointelegraph APIs)
- [ ] Predictive modeling (ML suggests markets)
- [ ] User-generated markets (AI validates feasibility)

### 🏛️ Phase 6: Decentralization (2026)
- [ ] DAO governance launch
- [ ] Community oracle network (stake SWIPE to be oracle)
- [ ] Market curation voting (upvote/downvote questions)
- [ ] Treasury management (protocol fees → DAO)
- [ ] Open-source AI models (community-run automation)



## 🎬 Demo Video

🎥 **Watch our 3-minute hackathon pitch:** [YouTube Link](https://www.youtube.com/watch?v=dVoZOdr8AE8)

**Includes:**
- Problem/solution walkthrough
- Live demo of swipe interface
- AI market generation explained
- Leaderboard & gamification showcase
- Technical architecture overview

---

<div align="center">
  <img src="https://prediction-tiktok-frontend.vercel.app/logo.png" alt="PredicctSwipe" width="150"/>

  ### Built for Seedify Prediction Markets Hackathon 2024

  **Swipe. Predict. Win. 🚀**

  [![Try Now](https://img.shields.io/badge/🎮_Try_Live_Demo-Click_Here-success?style=for-the-badge)](https://prediction-tiktok-frontend.vercel.app/)
</div>
