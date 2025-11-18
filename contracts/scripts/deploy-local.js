const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying PredictSwipe to LOCAL Hardhat Network...\n");

  const [deployer, oracle, treasury, user1, user2] = await hre.ethers.getSigners();

  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());
  console.log("Oracle address:", oracle.address);
  console.log("Treasury address:", treasury.address);
  console.log("Test users:", user1.address, user2.address);

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
  const predictMarket = await PredictMarket.deploy(oracle.address, treasury.address);
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

  // Deploy UserRegistry
  console.log("\n📝 Deploying UserRegistry...");
  const UserRegistry = await hre.ethers.getContractFactory("UserRegistry");
  const userRegistry = await UserRegistry.deploy();
  await userRegistry.waitForDeployment();
  const userRegistryAddress = await userRegistry.getAddress();
  console.log("✅ UserRegistry deployed to:", userRegistryAddress);

  // Configure contracts
  console.log("\n⚙️  Configuring contracts...");
  await predictMarket.updateOracleResolver(oracleResolverAddress);
  console.log("✅ Oracle resolver set in PredictMarket");

  await oracleResolver.authorizeResolver(oracle.address);
  console.log("✅ Oracle authorized in OracleResolver");

  await swipeToken.addMinter(predictMarketAddress);
  console.log("✅ PredictMarket authorized as SWIPE minter");

  // Transfer some tokens to test users
  console.log("\n💸 Distributing SWIPE tokens to test users...");
  await swipeToken.transfer(user1.address, hre.ethers.parseEther("10000"));
  await swipeToken.transfer(user2.address, hre.ethers.parseEther("10000"));
  console.log("✅ Sent 10,000 SWIPE to each test user");

  console.log("\n🎉 Deployment Complete!\n");
  console.log("==========================================");
  console.log("Contract Addresses:");
  console.log("==========================================");
  console.log("SwipeToken:      ", swipeTokenAddress);
  console.log("PredictMarket:   ", predictMarketAddress);
  console.log("OracleResolver:  ", oracleResolverAddress);
  console.log("UserRegistry:    ", userRegistryAddress);
  console.log("==========================================");
  console.log("Test Accounts:");
  console.log("==========================================");
  console.log("Deployer:        ", deployer.address);
  console.log("Oracle:          ", oracle.address);
  console.log("Treasury:        ", treasury.address);
  console.log("User 1:          ", user1.address);
  console.log("User 2:          ", user2.address);
  console.log("==========================================\n");

  // Create seed data
  console.log("🌱 Seeding initial market data...\n");

  // Market 1: BNB Price
  console.log("Creating market 1: BNB Price prediction");
  await predictMarket.createMarket(
    "Will $BNB hit $700 by Friday?",
    "Price",
    7 * 24 * 60 * 60,
    JSON.stringify({ currentPrice: "$652", change: "+5.2%" })
  );

  // Market 2: DeFi TVL
  console.log("Creating market 2: DeFi TVL prediction");
  await predictMarket.createMarket(
    "Will PancakeSwap TVL reach $3B this week?",
    "DeFi",
    7 * 24 * 60 * 60,
    JSON.stringify({ currentTvl: "$2.8B", change: "+12%" })
  );

  // Market 3: Security
  console.log("Creating market 3: Security prediction");
  await predictMarket.createMarket(
    "Will Venus Protocol stay uncompromised next 30 days?",
    "Security",
    30 * 24 * 60 * 60,
    JSON.stringify({ riskScore: "Low" })
  );

  // Market 4: Token Event
  console.log("Creating market 4: Token event prediction");
  await predictMarket.createMarket(
    "Will $CAKE pump 20% after next burn?",
    "Price",
    7 * 24 * 60 * 60,
    JSON.stringify({ burnDate: "Dec 15", lastBurnPump: "+18%" })
  );

  // Market 5: Network
  console.log("Creating market 5: Network prediction");
  await predictMarket.createMarket(
    "Will BSC gas stay under 5 gwei today?",
    "Network",
    24 * 60 * 60,
    JSON.stringify({ currentGas: "3.2 gwei" })
  );

  console.log("✅ Created 5 seed markets\n");
  console.log("✨ Seed data complete!\n");

  console.log("📋 Save these for your frontend .env.local:");
  console.log("==========================================");
  console.log(`NEXT_PUBLIC_SWIPE_TOKEN=${swipeTokenAddress}`);
  console.log(`NEXT_PUBLIC_PREDICT_MARKET=${predictMarketAddress}`);
  console.log(`NEXT_PUBLIC_ORACLE_RESOLVER=${oracleResolverAddress}`);
  console.log(`NEXT_PUBLIC_USER_REGISTRY=${userRegistryAddress}`);
  console.log(`NEXT_PUBLIC_CHAIN_ID=1337`);
  console.log(`NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545`);
  console.log("==========================================\n");

  console.log("🎮 To interact with contracts:");
  console.log("   npx hardhat console --network localhost\n");

  console.log("🌐 Connect MetaMask to:");
  console.log("   Network: Localhost 8545");
  console.log("   Chain ID: 1337");
  console.log("   RPC: http://127.0.0.1:8545\n");

  console.log("💼 Import test account to MetaMask:");
  console.log("   Account #0:", deployer.address);
  console.log("   Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
