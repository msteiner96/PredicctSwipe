const hre = require("hardhat");

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log("Usage: npx hardhat run scripts/resolve-market.js --network localhost <marketId> <outcome>");
    console.log("Example: npx hardhat run scripts/resolve-market.js --network localhost 0 true");
    console.log("\nOr resolve all test markets:");
    console.log("npx hardhat run scripts/resolve-market.js --network localhost all");
    process.exit(1);
  }

  const oracleResolverAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
  const predictMarketAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

  const [deployer, oracle] = await hre.ethers.getSigners();

  const OracleResolver = await hre.ethers.getContractAt("OracleResolver", oracleResolverAddress);
  const PredictMarket = await hre.ethers.getContractAt("PredictMarket", predictMarketAddress);

  if (args[0] === "all") {
    console.log("🔮 Resolving all test markets (0, 1, 2)...\n");

    // Resolve Market 0: BTC - YES wins
    console.log("Resolving Market 0: BTC (YES wins)");
    let tx = await OracleResolver.connect(oracle).resolveMarket(0, true);
    await tx.wait();
    console.log("  ✅ Market 0 resolved: YES");

    // Resolve Market 1: ETH - NO wins
    console.log("\nResolving Market 1: ETH (NO wins)");
    tx = await OracleResolver.connect(oracle).resolveMarket(1, false);
    await tx.wait();
    console.log("  ✅ Market 1 resolved: NO");

    // Resolve Market 2: DOGE - YES wins
    console.log("\nResolving Market 2: DOGE (YES wins)");
    tx = await OracleResolver.connect(oracle).resolveMarket(2, true);
    await tx.wait();
    console.log("  ✅ Market 2 resolved: YES");

    console.log("\n🎉 All test markets resolved!");
    console.log("\n📊 Results Summary:");
    console.log("==========================================");

    for (let i = 0; i < 3; i++) {
      const market = await PredictMarket.getMarket(i);
      const totalPool = market.totalYesAmount + market.totalNoAmount;
      const winningPool = market.outcome ? market.totalYesAmount : market.totalNoAmount;
      const losingPool = market.outcome ? market.totalNoAmount : market.totalYesAmount;

      console.log(`\nMarket ${i}: ${market.question}`);
      console.log(`  Outcome: ${market.outcome ? "YES ✅" : "NO ❌"}`);
      console.log(`  Total Pool: ${hre.ethers.formatEther(totalPool)} ETH`);
      console.log(`  Winning Pool: ${hre.ethers.formatEther(winningPool)} ETH`);
      console.log(`  Losing Pool: ${hre.ethers.formatEther(losingPool)} ETH (to be distributed)`);
    }

  } else {
    const marketId = parseInt(args[0]);
    const outcome = args[1] === "true";

    console.log(`🔮 Resolving Market ${marketId} with outcome: ${outcome ? "YES" : "NO"}...\n`);

    const market = await PredictMarket.getMarket(marketId);
    console.log(`Market: ${market.question}`);

    const tx = await OracleResolver.connect(oracle).resolveMarket(marketId, outcome);
    await tx.wait();

    console.log(`\n✅ Market ${marketId} resolved!`);

    const totalPool = market.totalYesAmount + market.totalNoAmount;
    const winningPool = outcome ? market.totalYesAmount : market.totalNoAmount;
    const losingPool = outcome ? market.totalNoAmount : market.totalYesAmount;

    console.log(`\n📊 Market Stats:`);
    console.log(`  Outcome: ${outcome ? "YES ✅" : "NO ❌"}`);
    console.log(`  Total Pool: ${hre.ethers.formatEther(totalPool)} ETH`);
    console.log(`  Winning Pool: ${hre.ethers.formatEther(winningPool)} ETH`);
    console.log(`  Losing Pool: ${hre.ethers.formatEther(losingPool)} ETH`);
  }

  console.log("\n🎯 Winners can now claim their rewards in the UI!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
