const hre = require("hardhat");

async function main() {
  const predictMarketAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const userAddress = "0x9e949c42807CCDDbc388738Fb3C14209005F1A33";

  const [deployer] = await hre.ethers.getSigners();

  const PredictMarket = await hre.ethers.getContractAt("PredictMarket", predictMarketAddress);

  console.log("🚀 Creating test market that ends in 2 minutes...\n");

  // Create market with 2 minute duration (minimum is 1 hour = 3600 seconds, so we'll use that)
  // Actually let's try 2 minutes = 120 seconds
  let tx = await PredictMarket.createMarket(
    "Will this test market resolve correctly? 🧪",
    "Events",
    120, // 2 minutes
    JSON.stringify({ test: true, quick: true })
  );
  await tx.wait();

  const marketId = (await PredictMarket.marketCount()) - 1n;
  console.log(`✅ Created Market #${marketId}\n`);

  console.log("💰 Placing bets from your account...\n");

  // Impersonate the user account
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [userAddress],
  });

  const user = await hre.ethers.getSigner(userAddress);

  // Place YES bet
  tx = await PredictMarket.connect(user).placeBet(marketId, true, {
    value: hre.ethers.parseEther("0.5")
  });
  await tx.wait();
  console.log("✅ Placed 0.5 BNB on YES");

  // Place another YES bet
  tx = await PredictMarket.connect(user).placeBet(marketId, true, {
    value: hre.ethers.parseEther("0.3")
  });
  await tx.wait();
  console.log("✅ Placed 0.3 BNB on YES");

  await hre.network.provider.request({
    method: "hardhat_stopImpersonatingAccount",
    params: [userAddress],
  });

  // Place some NO bets from deployer to create odds
  tx = await PredictMarket.connect(deployer).placeBet(marketId, false, {
    value: hre.ethers.parseEther("0.2")
  });
  await tx.wait();
  console.log("✅ Placed 0.2 BNB on NO (from deployer)\n");

  const market = await PredictMarket.getMarket(marketId);
  console.log("📊 Market Info:");
  console.log(`Question: ${market.question}`);
  console.log(`Total Pool: ${hre.ethers.formatEther(market.totalYesAmount + market.totalNoAmount)} BNB`);
  console.log(`YES Pool: ${hre.ethers.formatEther(market.totalYesAmount)} BNB`);
  console.log(`NO Pool: ${hre.ethers.formatEther(market.totalNoAmount)} BNB`);
  console.log(`Ends at: ${new Date(Number(market.endTime) * 1000).toLocaleTimeString()}\n`);

  console.log("⏰ Wait 2 minutes, then run:");
  console.log(`   npx hardhat run scripts/resolve-specific.js --network localhost ${marketId} true`);
  console.log("\n💡 This will give you a winning bet to claim!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
