const hre = require("hardhat");

async function main() {
  const predictMarketAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const oracleResolverAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

  const [deployer, oracle] = await hre.ethers.getSigners();

  const PredictMarket = await hre.ethers.getContractAt("PredictMarket", predictMarketAddress);
  const OracleResolver = await hre.ethers.getContractAt("OracleResolver", oracleResolverAddress);

  console.log("🚀 Creating quick demo markets (1 hour duration)...\n");

  const marketIds = [];

  // Create 3 quick markets
  let tx = await PredictMarket.createMarket(
    "Will AI resolve this market correctly? 🤖",
    "Events",
    3600, // 1 hour (minimum)
    JSON.stringify({ demo: true, aiResolution: true })
  );
  await tx.wait();
  marketIds.push(await PredictMarket.marketCount() - 1n);
  console.log("✅ Created Market: AI Resolution Test");

  tx = await PredictMarket.createMarket(
    "Quick prediction: Random YES outcome?",
    "General",
    3600,
    JSON.stringify({ demo: true })
  );
  await tx.wait();
  marketIds.push(await PredictMarket.marketCount() - 1n);
  console.log("✅ Created Market: Random Outcome Test");

  tx = await PredictMarket.createMarket(
    "Demo market for instant resolution",
    "Events",
    3600,
    JSON.stringify({ demo: true, instant: true })
  );
  await tx.wait();
  marketIds.push(await PredictMarket.marketCount() - 1n);
  console.log("✅ Created Market: Instant Demo\n");

  console.log("⏰ Fast-forwarding time by 1 hour + 1 minute...\n");

  // Fast-forward time by 1 hour and 1 minute
  await hre.network.provider.send("evm_increaseTime", [3660]);
  await hre.network.provider.send("evm_mine");

  console.log("✅ Time advanced - markets are now ended\n");
  console.log("🤖 AI is now resolving markets...\n");

  // Resolve with AI-determined outcomes
  const outcomes = [true, true, false]; // AI predictions
  const reasons = [
    "AI Resolution: Correct!",
    "AI Resolution: YES outcome",
    "AI Resolution: NO for demo"
  ];

  for (let i = 0; i < marketIds.length; i++) {
    const marketId = marketIds[i];
    console.log(`Resolving Market #${marketId}: ${outcomes[i] ? 'YES ✅' : 'NO ❌'}`);

    tx = await OracleResolver.connect(oracle).submitResolution(
      Number(marketId),
      outcomes[i],
      reasons[i]
    );
    await tx.wait();

    console.log(`  ✅ Resolved with AI\n`);
  }

  console.log("🎉 All demo markets resolved!\n");
  console.log("📊 Final Summary:");
  console.log("==========================================\n");

  for (let i = 0; i < marketIds.length; i++) {
    const marketId = marketIds[i];
    const market = await PredictMarket.getMarket(marketId);

    console.log(`Market #${marketId}: ${market.question}`);
    console.log(`  AI Outcome: ${market.outcome ? "YES ✅" : "NO ❌"}`);
    console.log(`  Category: ${market.category}`);
    console.log(`  Status: ${market.resolved ? "Resolved 🔒" : "Active"}\n`);
  }

  console.log("💡 These markets are ready for the UI!");
  console.log("🎯 You can now see them resolved in your app!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
