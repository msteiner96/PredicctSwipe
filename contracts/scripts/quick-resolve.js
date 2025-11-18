const hre = require("hardhat");

async function main() {
  const oracleResolverAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
  const predictMarketAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

  const [deployer, oracle] = await hre.ethers.getSigners();

  const OracleResolver = await hre.ethers.getContractAt("OracleResolver", oracleResolverAddress);
  const PredictMarket = await hre.ethers.getContractAt("PredictMarket", predictMarketAddress);

  console.log("🔮 Quick Resolving first 3 test markets (using emergency resolve)...\n");

  // Resolve Market 0: YES wins
  console.log("Resolving Market 0: YES wins");
  let tx = await OracleResolver.connect(deployer).emergencyResolve(0, true, "AI Resolution - Early testing");
  await tx.wait();
  console.log("  ✅ Market 0 resolved: YES\n");

  // Resolve Market 1: NO wins
  console.log("Resolving Market 1: NO wins");
  tx = await OracleResolver.connect(deployer).emergencyResolve(1, false, "AI Resolution - Early testing");
  await tx.wait();
  console.log("  ✅ Market 1 resolved: NO\n");

  // Resolve Market 2: YES wins
  console.log("Resolving Market 2: YES wins");
  tx = await OracleResolver.connect(deployer).emergencyResolve(2, true, "AI Resolution - Early testing");
  await tx.wait();
  console.log("  ✅ Market 2 resolved: YES\n");

  console.log("🎉 Test markets resolved!\n");
  console.log("📊 Results Summary:");
  console.log("==========================================");

  for (let i = 0; i < 3; i++) {
    const market = await PredictMarket.getMarket(i);
    const totalPool = market.totalYesAmount + market.totalNoAmount;
    const winningPool = market.outcome ? market.totalYesAmount : market.totalNoAmount;
    const losingPool = market.outcome ? market.totalNoAmount : market.totalYesAmount;

    console.log(`\nMarket ${i}: ${market.question}`);
    console.log(`  Outcome: ${market.outcome ? "YES ✅" : "NO ❌"}`);
    console.log(`  Total Pool: ${hre.ethers.formatEther(totalPool)} BNB`);
    console.log(`  Winning Pool: ${hre.ethers.formatEther(winningPool)} BNB`);
    console.log(`  Losing Pool: ${hre.ethers.formatEther(losingPool)} BNB (distributed to winners)`);
  }

  console.log("\n🎯 Winners can now claim their rewards in the UI!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
