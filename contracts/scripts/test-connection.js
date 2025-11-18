const hre = require("hardhat");

async function main() {
  const predictMarket = await hre.ethers.getContractAt(
    "PredictMarket",
    "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
  );

  console.log("📊 Checking contract state...\n");

  const marketCount = await predictMarket.marketCount();
  console.log("Total markets:", marketCount.toString());

  console.log("\n🎯 Fetching active markets...");
  const activeMarkets = await predictMarket.getActiveMarkets();
  console.log("Active markets found:", activeMarkets.length);

  if (activeMarkets.length > 0) {
    console.log("\n✅ First 3 markets:");
    for (let i = 0; i < Math.min(3, activeMarkets.length); i++) {
      const market = activeMarkets[i];
      console.log(`\n[${i + 1}]`);
      console.log("  Question:", market.question);
      console.log("  Category:", market.category);
      console.log("  ID:", market.id.toString());
      console.log("  Metadata:", market.metadata);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
