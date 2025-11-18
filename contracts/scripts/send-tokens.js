const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const userAddress = "0x8ae0BEc841F35D83D102DEe6032928230ffD77CD";

  console.log("💰 Sending test tokens to:", userAddress);
  console.log("From deployer:", deployer.address);

  // Send 10 ETH
  const ethTx = await deployer.sendTransaction({
    to: userAddress,
    value: hre.ethers.parseEther("10")
  });
  await ethTx.wait();
  console.log("✅ Sent 10 ETH");

  // Send 10,000 SWIPE tokens
  const swipeToken = await hre.ethers.getContractAt(
    "SwipeToken",
    "0x5FbDB2315678afecb367f032d93F642f64180aa3"
  );

  const swipeTx = await swipeToken.transfer(
    userAddress,
    hre.ethers.parseEther("10000")
  );
  await swipeTx.wait();
  console.log("✅ Sent 10,000 SWIPE tokens");

  // Check balances
  const ethBalance = await hre.ethers.provider.getBalance(userAddress);
  const swipeBalance = await swipeToken.balanceOf(userAddress);

  console.log("\n📊 Final Balances:");
  console.log("ETH:", hre.ethers.formatEther(ethBalance));
  console.log("SWIPE:", hre.ethers.formatEther(swipeBalance));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
