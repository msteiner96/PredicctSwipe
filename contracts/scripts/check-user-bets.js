const hre = require("hardhat");

async function main() {
  const userAddress = "0x8ae0BEc841F35D83D102DEe6032928230ffD77CD";
  const predictMarketAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

  const PredictMarket = await hre.ethers.getContractAt("PredictMarket", predictMarketAddress);

  console.log("🔍 Checking user bets for:", userAddress);
  console.log("PredictMarket address:", predictMarketAddress);

  // Get user's markets
  const userMarkets = await PredictMarket.getUserMarkets(userAddress);
  console.log("\n📋 User's market IDs:", userMarkets.map(id => id.toString()));

  // Get bets for each market
  for (const marketId of userMarkets) {
    console.log(`\n💰 Bets for market ${marketId}:`);
    const bets = await PredictMarket.getUserBets(userAddress, marketId);
    console.log(`  Total bets: ${bets.length}`);
    bets.forEach((bet, index) => {
      console.log(`  Bet ${index + 1}:`, {
        amount: hre.ethers.formatEther(bet.amount),
        isYes: bet.isYes,
        timestamp: new Date(Number(bet.timestamp) * 1000).toISOString(),
        claimed: bet.claimed
      });
    });
  }

  // Also check all markets to see total bets
  console.log("\n\n📊 All Markets Overview:");
  const marketCount = await PredictMarket.marketCount();
  for (let i = 0; i < marketCount; i++) {
    const market = await PredictMarket.getMarket(i);
    const allBets = await PredictMarket.getMarketBets(i);
    const userBetsInMarket = allBets.filter(bet => bet.bettor.toLowerCase() === userAddress.toLowerCase());

    if (userBetsInMarket.length > 0) {
      console.log(`\nMarket ${i}: ${market.question}`);
      console.log(`  Your bets: ${userBetsInMarket.length}`);
      console.log(`  Total volume: ${hre.ethers.formatEther(market.totalYesAmount + market.totalNoAmount)} ETH`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
