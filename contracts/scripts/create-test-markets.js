const hre = require("hardhat");

async function main() {
  const predictMarketAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const PredictMarket = await hre.ethers.getContractAt("PredictMarket", predictMarketAddress);

  const [deployer, oracle, treasury, user1, user2] = await hre.ethers.getSigners();

  console.log("🎲 Creating test markets that end in 1 hour (for testing)...\n");

  // Market 1: Quick test market - ends in 1 hour + 5 min
  console.log("Creating market 1: BTC prediction (1h 5m)");
  let tx = await PredictMarket.createMarket(
    "Will BTC hit $100k in the next hour? 🚀",
    "Price",
    65 * 60, // 1 hour 5 minutes (minimum is 1 hour)
    JSON.stringify({ currentPrice: "$98,500", target: "$100k" })
  );
  await tx.wait();

  // Market 2: Another quick test market
  console.log("Creating market 2: ETH prediction (1h 10m)");
  tx = await PredictMarket.createMarket(
    "Will ETH pump 10% in next hour?",
    "Price",
    70 * 60, // 1 hour 10 minutes
    JSON.stringify({ currentPrice: "$3,800", target: "$4,180" })
  );
  await tx.wait();

  // Market 3: Slightly longer for variety
  console.log("Creating market 3: Meme coin prediction (1h 15m)");
  tx = await PredictMarket.createMarket(
    "Will DOGE moon in next hour? 🚀",
    "Meme",
    75 * 60, // 1 hour 15 minutes
    JSON.stringify({ sentiment: "bullish", moonLevel: "max" })
  );
  await tx.wait();

  console.log("\n💰 Seeding markets with test bets...\n");

  // Market 0: BTC - Place bets from multiple users
  console.log("Seeding market 0 (BTC):");

  // User1 bets 1 ETH on YES (early bet = better odds)
  tx = await PredictMarket.connect(user1).placeBet(0, true, { value: hre.ethers.parseEther("1.0") });
  await tx.wait();
  console.log("  ✅ User1: 1.0 ETH on YES");

  // User2 bets 0.5 ETH on NO
  tx = await PredictMarket.connect(user2).placeBet(0, false, { value: hre.ethers.parseEther("0.5") });
  await tx.wait();
  console.log("  ✅ User2: 0.5 ETH on NO");

  // Deployer bets 2 ETH on YES
  tx = await PredictMarket.connect(deployer).placeBet(0, true, { value: hre.ethers.parseEther("2.0") });
  await tx.wait();
  console.log("  ✅ Deployer: 2.0 ETH on YES");

  // Market 1: ETH - Place bets
  console.log("\nSeeding market 1 (ETH):");

  // User1 bets 0.8 ETH on NO
  tx = await PredictMarket.connect(user1).placeBet(1, false, { value: hre.ethers.parseEther("0.8") });
  await tx.wait();
  console.log("  ✅ User1: 0.8 ETH on NO");

  // User2 bets 1.5 ETH on YES
  tx = await PredictMarket.connect(user2).placeBet(1, true, { value: hre.ethers.parseEther("1.5") });
  await tx.wait();
  console.log("  ✅ User2: 1.5 ETH on YES");

  // Deployer bets 0.3 ETH on NO
  tx = await PredictMarket.connect(deployer).placeBet(1, false, { value: hre.ethers.parseEther("0.3") });
  await tx.wait();
  console.log("  ✅ Deployer: 0.3 ETH on NO");

  // Market 2: DOGE - Place bets
  console.log("\nSeeding market 2 (DOGE):");

  // User1 bets 0.5 ETH on YES
  tx = await PredictMarket.connect(user1).placeBet(2, true, { value: hre.ethers.parseEther("0.5") });
  await tx.wait();
  console.log("  ✅ User1: 0.5 ETH on YES");

  // User2 bets 1.0 ETH on YES
  tx = await PredictMarket.connect(user2).placeBet(2, true, { value: hre.ethers.parseEther("1.0") });
  await tx.wait();
  console.log("  ✅ User2: 1.0 ETH on YES");

  // Get user address that was funded
  const userAddress = "0x9e949c42807CCDDbc388738Fb3C14209005F1A33";
  console.log(`\n💸 Adding bet for your funded account (${userAddress})...\n`);

  // Send some ETH to that account if not already done
  tx = await deployer.sendTransaction({
    to: userAddress,
    value: hre.ethers.parseEther("5.0"),
  });
  await tx.wait();

  // Impersonate the user account to place a bet
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [userAddress],
  });

  const fundedUser = await hre.ethers.getSigner(userAddress);

  // Place bet from funded user on Market 0
  tx = await PredictMarket.connect(fundedUser).placeBet(0, true, { value: hre.ethers.parseEther("0.5") });
  await tx.wait();
  console.log(`  ✅ Your account: 0.5 ETH on YES (Market 0)`);

  // Place bet from funded user on Market 1
  tx = await PredictMarket.connect(fundedUser).placeBet(1, false, { value: hre.ethers.parseEther("0.3") });
  await tx.wait();
  console.log(`  ✅ Your account: 0.3 ETH on NO (Market 1)`);

  await hre.network.provider.request({
    method: "hardhat_stopImpersonatingAccount",
    params: [userAddress],
  });

  console.log("\n✅ Test markets created and seeded!\n");
  console.log("📊 Market Summary:");
  console.log("==========================================");

  for (let i = 0; i < 3; i++) {
    const market = await PredictMarket.getMarket(i);
    const totalPool = market.totalYesAmount + market.totalNoAmount;
    console.log(`\nMarket ${i}: ${market.question}`);
    console.log(`  Total Pool: ${hre.ethers.formatEther(totalPool)} ETH`);
    console.log(`  YES Pool: ${hre.ethers.formatEther(market.totalYesAmount)} ETH`);
    console.log(`  NO Pool: ${hre.ethers.formatEther(market.totalNoAmount)} ETH`);
    console.log(`  Ends: ${new Date(Number(market.endTime) * 1000).toLocaleTimeString()}`);
  }

  console.log("\n⏰ Markets will end in ~1 hour");
  console.log("💡 To test claiming immediately, resolve them now:");
  console.log("   npx hardhat run scripts/resolve-market.js --network localhost all");
  console.log("\n🎯 After resolving, you can test claiming your winnings in the UI!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
