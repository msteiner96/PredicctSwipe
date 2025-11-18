const hre = require("hardhat");

async function main() {
  const predictMarketAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const oracleResolverAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
  const userAddress = "0x9e949c42807CCDDbc388738Fb3C14209005F1A33";

  const [deployer, oracle] = await hre.ethers.getSigners();

  const PredictMarket = await hre.ethers.getContractAt("PredictMarket", predictMarketAddress);
  const OracleResolver = await hre.ethers.getContractAt("OracleResolver", oracleResolverAddress);

  console.log(`🔍 Finding markets with bets from ${userAddress}...\n`);

  const marketCount = await PredictMarket.marketCount();
  const marketsWithBets = [];

  for (let i = 0; i < marketCount; i++) {
    const bets = await PredictMarket.getUserBets(userAddress, i);
    if (bets.length > 0) {
      const market = await PredictMarket.getMarket(i);
      marketsWithBets.push({
        id: i,
        question: market.question,
        bets: bets.length,
        resolved: market.resolved,
      });
    }
  }

  console.log(`Found ${marketsWithBets.length} markets with user bets:\n`);
  marketsWithBets.forEach(m => {
    console.log(`Market ${m.id}: ${m.question}`);
    console.log(`  Bets: ${m.bets}, Resolved: ${m.resolved ? 'YES' : 'NO'}\n`);
  });

  // Resolve unresolved markets
  const unresolvedMarkets = marketsWithBets.filter(m => !m.resolved);

  if (unresolvedMarkets.length === 0) {
    console.log("✅ All markets with user bets are already resolved!");
    return;
  }

  console.log(`⏰ Fast-forwarding time by 8 days...\n`);
  await hre.network.provider.send("evm_increaseTime", [8 * 24 * 60 * 60]); // 8 days
  await hre.network.provider.send("evm_mine");

  console.log(`🤖 Resolving ${unresolvedMarkets.length} markets with AI...\n`);

  for (const market of unresolvedMarkets) {
    // AI determines outcome (random for demo)
    const outcome = Math.random() > 0.5;

    console.log(`Resolving Market ${market.id}: ${outcome ? 'YES ✅' : 'NO ❌'}`);
    const tx = await OracleResolver.connect(oracle).submitResolution(
      market.id,
      outcome,
      `AI Resolution: ${outcome ? 'Prediction came true!' : 'Prediction did not happen'}`
    );
    await tx.wait();
    console.log(`  ✅ Resolved!\n`);
  }

  console.log("🎉 All user markets resolved!\n");
  console.log("📊 Summary:");
  console.log("==========================================\n");

  for (const marketInfo of marketsWithBets) {
    const market = await PredictMarket.getMarket(marketInfo.id);
    console.log(`Market ${marketInfo.id}: ${market.question}`);
    console.log(`  Outcome: ${market.outcome ? 'YES ✅' : 'NO ❌'}`);
    console.log(`  Your bets: ${marketInfo.bets}`);
    console.log(`  Status: Resolved 🔒\n`);
  }

  console.log("💰 Go to Profile → History to claim your winnings!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
