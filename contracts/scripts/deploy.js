const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying PredictSwipe contracts to BNB Chain...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Deploy SwipeToken
  console.log("\n📝 Deploying SwipeToken...");
  const SwipeToken = await hre.ethers.getContractFactory("SwipeToken");
  const swipeToken = await SwipeToken.deploy();
  await swipeToken.waitForDeployment();
  const swipeTokenAddress = await swipeToken.getAddress();
  console.log("✅ SwipeToken deployed to:", swipeTokenAddress);

  // Deploy PredictMarket
  console.log("\n📝 Deploying PredictMarket...");
  const PredictMarket = await hre.ethers.getContractFactory("PredictMarket");
  const treasuryAddress = deployer.address; // Initially set to deployer, change later
  const predictMarket = await PredictMarket.deploy(deployer.address, treasuryAddress);
  await predictMarket.waitForDeployment();
  const predictMarketAddress = await predictMarket.getAddress();
  console.log("✅ PredictMarket deployed to:", predictMarketAddress);

  // Deploy OracleResolver
  console.log("\n📝 Deploying OracleResolver...");
  const OracleResolver = await hre.ethers.getContractFactory("OracleResolver");
  const oracleResolver = await OracleResolver.deploy(predictMarketAddress);
  await oracleResolver.waitForDeployment();
  const oracleResolverAddress = await oracleResolver.getAddress();
  console.log("✅ OracleResolver deployed to:", oracleResolverAddress);

  // Update PredictMarket oracle
  console.log("\n⚙️  Configuring contracts...");
  await predictMarket.updateOracleResolver(oracleResolverAddress);
  console.log("✅ Oracle resolver set in PredictMarket");

  // Add PredictMarket as minter for SwipeToken
  await swipeToken.addMinter(predictMarketAddress);
  console.log("✅ PredictMarket authorized as SWIPE minter");

  console.log("\n🎉 Deployment Complete!\n");
  console.log("==========================================");
  console.log("Contract Addresses:");
  console.log("==========================================");
  console.log("SwipeToken:      ", swipeTokenAddress);
  console.log("PredictMarket:   ", predictMarketAddress);
  console.log("OracleResolver:  ", oracleResolverAddress);
  console.log("==========================================\n");

  console.log("📋 Save these addresses to your .env file:");
  console.log(`NEXT_PUBLIC_SWIPE_TOKEN=${swipeTokenAddress}`);
  console.log(`NEXT_PUBLIC_PREDICT_MARKET=${predictMarketAddress}`);
  console.log(`NEXT_PUBLIC_ORACLE_RESOLVER=${oracleResolverAddress}`);

  // Wait for block confirmations before verifying
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n⏳ Waiting for block confirmations...");
    await swipeToken.deploymentTransaction().wait(6);

    console.log("\n🔍 Verifying contracts on BscScan...");
    try {
      await hre.run("verify:verify", {
        address: swipeTokenAddress,
        constructorArguments: [],
      });
      console.log("✅ SwipeToken verified");
    } catch (error) {
      console.log("❌ SwipeToken verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: predictMarketAddress,
        constructorArguments: [deployer.address, treasuryAddress],
      });
      console.log("✅ PredictMarket verified");
    } catch (error) {
      console.log("❌ PredictMarket verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: oracleResolverAddress,
        constructorArguments: [predictMarketAddress],
      });
      console.log("✅ OracleResolver verified");
    } catch (error) {
      console.log("❌ OracleResolver verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
