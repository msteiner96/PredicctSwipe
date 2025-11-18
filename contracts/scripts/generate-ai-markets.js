const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("🤖 AI Market Generator - Creating trending prediction markets...\n");
  console.log("Deployer:", deployer.address);

  const predictMarket = await hre.ethers.getContractAt(
    "PredictMarket",
    "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
  );

  // Get current date for dynamic market generation
  const now = new Date();
  const currentMonth = now.toLocaleString('default', { month: 'long' });
  const currentYear = now.getFullYear();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1).toLocaleString('default', { month: 'long' });
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = daysInMonth - now.getDate();

  // Trending crypto topics and realistic price predictions
  const markets = [
    // Hot Price Predictions (realistic ranges)
    {
      question: `Will $ETH break $4,000 before ${nextMonth}?`,
      category: "Price",
      duration: daysRemaining * 24 * 60 * 60,
      metadata: {
        currentPrice: "$3,750",
        target: "$4,000",
        change24h: "+2.3%",
        volume24h: "$15.2B"
      }
    },
    {
      question: `Will $BTC reach $110,000 by end of ${currentMonth}?`,
      category: "Price",
      duration: daysRemaining * 24 * 60 * 60,
      metadata: {
        currentPrice: "$103,250",
        target: "$110,000",
        ath: "$108,786"
      }
    },
    {
      question: "Will $SOL flip $BNB in market cap this week?",
      category: "Price",
      duration: 7 * 24 * 60 * 60,
      metadata: {
        solMcap: "$85B",
        bnbMcap: "$92B",
        gap: "7.6%"
      }
    },
    {
      question: "Will any altcoin pump 50%+ in the next 24 hours?",
      category: "Price",
      duration: 24 * 60 * 60,
      metadata: {
        tracking: "Top 100",
        lastOccurrence: "3 days ago"
      }
    },

    // DeFi & Protocol Events
    {
      question: "Will Uniswap v4 launch in Q1 2025?",
      category: "DeFi",
      duration: 30 * 24 * 60 * 60,
      metadata: {
        status: "Testing Phase",
        proposal: "Approved",
        expectedQuarter: "Q1 2025"
      }
    },
    {
      question: "Will any DEX surpass $10B daily volume this week?",
      category: "DeFi",
      duration: 7 * 24 * 60 * 60,
      metadata: {
        currentLeader: "Uniswap",
        currentVolume: "$8.5B"
      }
    },
    {
      question: "Will total DeFi TVL exceed $150B this month?",
      category: "DeFi",
      duration: daysRemaining * 24 * 60 * 60,
      metadata: {
        currentTVL: "$142B",
        change7d: "+8.4%"
      }
    },
    {
      question: "Will a new L2 solution launch on Ethereum this month?",
      category: "DeFi",
      duration: daysRemaining * 24 * 60 * 60,
      metadata: {
        rumored: "Multiple",
        currentL2s: "15+"
      }
    },

    // Network & Gas Predictions
    {
      question: "Will Ethereum gas fees drop below 5 gwei this week?",
      category: "Network",
      duration: 7 * 24 * 60 * 60,
      metadata: {
        currentGas: "12 gwei",
        avg7d: "15 gwei"
      }
    },
    {
      question: "Will Base surpass Arbitrum in daily transactions?",
      category: "Network",
      duration: 14 * 24 * 60 * 60,
      metadata: {
        baseTx: "4.2M/day",
        arbTx: "5.8M/day"
      }
    },
    {
      question: "Will Solana process 100M+ transactions in a single day?",
      category: "Network",
      duration: 14 * 24 * 60 * 60,
      metadata: {
        record: "92M",
        avg: "68M/day"
      }
    },

    // Memecoins & Trending Tokens
    {
      question: "Will a new memecoin reach $1B market cap this week?",
      category: "Events",
      duration: 7 * 24 * 60 * 60,
      metadata: {
        recentExample: "$PEPE",
        frequency: "~1-2 per month"
      }
    },
    {
      question: "Will $PEPE get listed on Coinbase this month?",
      category: "Events",
      duration: daysRemaining * 24 * 60 * 60,
      metadata: {
        currentExchanges: "Binance, OKX, Bybit",
        rumors: "High"
      }
    },
    {
      question: "Will any AI agent token hit top 50 by market cap?",
      category: "Events",
      duration: 14 * 24 * 60 * 60,
      metadata: {
        trending: "AI narrative",
        current: "#52-#80 range"
      }
    },

    // NFT & Gaming
    {
      question: "Will Pudgy Penguins floor hit 30 ETH this month?",
      category: "Price",
      duration: daysRemaining * 24 * 60 * 60,
      metadata: {
        currentFloor: "24.5 ETH",
        volume24h: "450 ETH"
      }
    },
    {
      question: "Will a new NFT collection do 10,000+ ETH volume on launch?",
      category: "Events",
      duration: 14 * 24 * 60 * 60,
      metadata: {
        lastOccurrence: "2 weeks ago",
        market: "Heating up"
      }
    },

    // Regulation & Institutional
    {
      question: "Will SEC approve spot Ethereum ETF options this month?",
      category: "Events",
      duration: daysRemaining * 24 * 60 * 60,
      metadata: {
        btcEtfOptions: "Approved Jan 2025",
        nextInLine: "ETH"
      }
    },
    {
      question: "Will Trump announce a strategic Bitcoin reserve?",
      category: "Events",
      duration: 30 * 24 * 60 * 60,
      metadata: {
        inauguration: "Jan 20, 2025",
        speculation: "Very High"
      }
    },
    {
      question: "Will a Fortune 500 company add crypto to treasury?",
      category: "Events",
      duration: 30 * 24 * 60 * 60,
      metadata: {
        recent: "MicroStrategy, Tesla",
        trend: "Growing"
      }
    },

    // Social & Influencer Events
    {
      question: "Will Elon tweet about Dogecoin in the next 48 hours?",
      category: "Events",
      duration: 2 * 24 * 60 * 60,
      metadata: {
        lastTweet: "5 days ago",
        frequency: "~2x per week"
      }
    },
    {
      question: "Will CZ return to Twitter/X this week?",
      category: "Events",
      duration: 7 * 24 * 60 * 60,
      metadata: {
        status: "Released from custody",
        lastActive: "Nov 2024"
      }
    },

    // Security & Hacks
    {
      question: "Will there be a $50M+ DeFi hack this month?",
      category: "Security",
      duration: daysRemaining * 24 * 60 * 60,
      metadata: {
        lastMajor: "3 weeks ago",
        avgPerMonth: "1-2"
      }
    },
    {
      question: "Will a CEX announce a security breach this week?",
      category: "Security",
      duration: 7 * 24 * 60 * 60,
      metadata: {
        riskLevel: "Medium",
        recent: "None in 2025"
      }
    },

    // Macro & Market Sentiment
    {
      question: "Will crypto total market cap exceed $4 trillion?",
      category: "Events",
      duration: 30 * 24 * 60 * 60,
      metadata: {
        current: "$3.7T",
        ath: "$3.0T (Nov 2021)"
      }
    },
    {
      question: "Will Bitcoin dominance drop below 55% this month?",
      category: "Price",
      duration: daysRemaining * 24 * 60 * 60,
      metadata: {
        current: "58.2%",
        trend: "Declining"
      }
    },

    // Ecosystem Specific
    {
      question: "Will Shibarium process 10M transactions in a day?",
      category: "Network",
      duration: 14 * 24 * 60 * 60,
      metadata: {
        current: "6.5M/day",
        growth: "+45% monthly"
      }
    },
    {
      question: "Will Polygon launch zkEVM v2 this month?",
      category: "DeFi",
      duration: daysRemaining * 24 * 60 * 60,
      metadata: {
        status: "Beta",
        expected: "Q1 2025"
      }
    },
  ];

  console.log(`📝 Creating ${markets.length} AI-generated markets...\n`);

  let created = 0;
  let failed = 0;

  for (let i = 0; i < markets.length; i++) {
    const market = markets[i];

    try {
      const tx = await predictMarket.createMarket(
        market.question,
        market.category,
        market.duration,
        JSON.stringify(market.metadata)
      );
      await tx.wait();
      created++;
      console.log(`✅ [${i + 1}/${markets.length}] ${market.question.substring(0, 60)}...`);
    } catch (error) {
      failed++;
      console.log(`❌ [${i + 1}/${markets.length}] Failed: ${error.message.split('\n')[0]}`);
    }
  }

  console.log("\n🎉 Market generation complete!\n");
  console.log(`✅ Created: ${created}`);
  console.log(`❌ Failed: ${failed}`);

  const totalMarkets = await predictMarket.marketCount();
  console.log(`📊 Total markets: ${totalMarkets.toString()}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
