const hre = require("hardhat");

async function main() {
  const predictMarketAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const PredictMarket = await hre.ethers.getContractAt("PredictMarket", predictMarketAddress);

  console.log("🔍 Testing getActiveMarkets...\n");

  const activeMarkets = await PredictMarket.getActiveMarkets();
  console.log("Active market IDs:", activeMarkets.map(id => id.toString()));
  console.log("Count:", activeMarkets.length);

  const marketCount = await PredictMarket.marketCount();
  console.log("\nTotal market count:", marketCount.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
