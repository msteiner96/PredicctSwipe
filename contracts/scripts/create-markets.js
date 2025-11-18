const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("🎯 Creating additional prediction markets...\n");
  console.log("Deployer:", deployer.address);

  const predictMarket = await hre.ethers.getContractAt(
    "PredictMarket",
    "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
  );

  const markets = [
    // Price Predictions
    {
      question: "Will $ETH break $4000 this month?",
      category: "Price",
      duration: 30 * 24 * 60 * 60,
      metadata: { currentPrice: "$3,750", target: "$4,000" }
    },
    {
      question: "Will $SOL flip $BNB in market cap?",
      category: "Price",
      duration: 60 * 24 * 60 * 60,
      metadata: { solMcap: "$85B", bnbMcap: "$95B" }
    },
    {
      question: "Will $MATIC reach $2 before end of quarter?",
      category: "Price",
      duration: 45 * 24 * 60 * 60,
      metadata: { currentPrice: "$0.85", change24h: "+8.2%" }
    },
    {
      question: "Will Bitcoin dominance drop below 40%?",
      category: "Price",
      duration: 21 * 24 * 60 * 60,
      metadata: { currentDominance: "48.5%" }
    },

    // DeFi Predictions
    {
      question: "Will Uniswap V4 launch this quarter?",
      category: "DeFi",
      duration: 90 * 24 * 60 * 60,
      metadata: { status: "In Development", expectedQ: "Q1" }
    },
    {
      question: "Will Total DeFi TVL exceed $100B?",
      category: "DeFi",
      duration: 30 * 24 * 60 * 60,
      metadata: { currentTVL: "$92B", change: "+5.4%" }
    },
    {
      question: "Will Aave launch on Base chain?",
      category: "DeFi",
      duration: 60 * 24 * 60 * 60,
      metadata: { proposal: "Under Discussion" }
    },
    {
      question: "Will Curve Finance v2 volume hit $1B daily?",
      category: "DeFi",
      duration: 14 * 24 * 60 * 60,
      metadata: { currentVolume: "$650M" }
    },

    // Security Predictions
    {
      question: "Will there be a major bridge hack (>$10M) this month?",
      category: "Security",
      duration: 30 * 24 * 60 * 60,
      metadata: { lastIncident: "23 days ago" }
    },
    {
      question: "Will MetaMask add native 2FA this year?",
      category: "Security",
      duration: 180 * 24 * 60 * 60,
      metadata: { requestedFeature: "Yes" }
    },
    {
      question: "Will Tornado Cash contracts stay frozen?",
      category: "Security",
      duration: 90 * 24 * 60 * 60,
      metadata: { status: "Sanctioned" }
    },

    // Network Predictions
    {
      question: "Will Ethereum gas fees average <10 gwei this week?",
      category: "Network",
      duration: 7 * 24 * 60 * 60,
      metadata: { currentGas: "15 gwei", avg7d: "18 gwei" }
    },
    {
      question: "Will BSC process 10M+ transactions in a day?",
      category: "Network",
      duration: 14 * 24 * 60 * 60,
      metadata: { currentTx: "8.5M/day" }
    },
    {
      question: "Will Arbitrum surpass Optimism in daily users?",
      category: "Network",
      duration: 21 * 24 * 60 * 60,
      metadata: { arbUsers: "85K", opUsers: "92K" }
    },

    // Events & Governance
    {
      question: "Will Vitalik tweet about AI this week?",
      category: "Events",
      duration: 7 * 24 * 60 * 60,
      metadata: { lastAITweet: "3 days ago" }
    },
    {
      question: "Will a major CEX list $PEPE?",
      category: "Events",
      duration: 30 * 24 * 60 * 60,
      metadata: { currentExchanges: "15" }
    },
    {
      question: "Will MakerDAO rebrand succeed?",
      category: "Events",
      duration: 45 * 24 * 60 * 60,
      metadata: { votePassed: "Yes", newName: "Sky" }
    },

    // NFT & Gaming
    {
      question: "Will Azuki floor price hit 10 ETH?",
      category: "Price",
      duration: 30 * 24 * 60 * 60,
      metadata: { currentFloor: "5.2 ETH" }
    },
    {
      question: "Will a play-to-earn game reach 1M daily active users?",
      category: "Events",
      duration: 60 * 24 * 60 * 60,
      metadata: { current: "Peak was 850K" }
    },

    // Regulatory & Institutional
    {
      question: "Will SEC approve spot Bitcoin ETF options?",
      category: "Events",
      duration: 90 * 24 * 60 * 60,
      metadata: { status: "Under Review" }
    },
    {
      question: "Will a major bank launch crypto custody?",
      category: "Events",
      duration: 60 * 24 * 60 * 60,
      metadata: { rumored: "JPMorgan" }
    }
  ];

  console.log(`📝 Creating ${markets.length} new markets...\n`);

  for (let i = 0; i < markets.length; i++) {
    const market = markets[i];
    console.log(`[${i + 1}/${markets.length}] ${market.question}`);

    try {
      const tx = await predictMarket.createMarket(
        market.question,
        market.category,
        market.duration,
        JSON.stringify(market.metadata)
      );
      await tx.wait();
      console.log(`   ✅ Created (${market.category}, ${market.duration / (24 * 60 * 60)} days)`);
    } catch (error) {
      console.log(`   ❌ Failed:`, error.message);
    }
  }

  console.log("\n🎉 Market creation complete!\n");

  // Get total market count
  const totalMarkets = await predictMarket.marketCount();
  console.log("📊 Total markets:", totalMarkets.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
