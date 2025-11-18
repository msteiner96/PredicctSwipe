const hre = require("hardhat");

async function main() {
  const predictMarketAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

  console.log("🔍 Verifying deployment...\n");

  try {
    const PredictMarket = await hre.ethers.getContractAt("PredictMarket", predictMarketAddress);

    const marketCount = await PredictMarket.marketCount();
    console.log("✅ Contract is accessible");
    console.log("📊 Market count:", marketCount.toString());

    if (marketCount > 0) {
      console.log("\n📋 First market:");
      const market = await PredictMarket.getMarket(0);
      console.log("  Question:", market.question);
      console.log("  Category:", market.category);
      console.log("  Total YES:", hre.ethers.formatEther(market.totalYesAmount), "ETH");
      console.log("  Total NO:", hre.ethers.formatEther(market.totalNoAmount), "ETH");
    }

    console.log("\n✅ Deployment verified successfully!");

  } catch (error) {
    console.error("❌ Error verifying deployment:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
