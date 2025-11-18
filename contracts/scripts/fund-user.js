const hre = require("hardhat");

async function main() {
  const userAddress = "0x9e949c42807CCDDbc388738Fb3C14209005F1A33";
  
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("💸 Funding user account...\n");
  console.log("User Address:", userAddress);
  
  // Send ETH
  const ethAmount = hre.ethers.parseEther("10");
  const tx = await deployer.sendTransaction({
    to: userAddress,
    value: ethAmount,
  });
  await tx.wait();
  console.log("✅ Sent 10 ETH to user");
  
  // Send SWIPE tokens
  const swipeTokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const SwipeToken = await hre.ethers.getContractAt("SwipeToken", swipeTokenAddress);
  
  const swipeAmount = hre.ethers.parseEther("10000");
  await SwipeToken.transfer(userAddress, swipeAmount);
  console.log("✅ Sent 10,000 SWIPE to user");
  
  console.log("\n🎉 Funding complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
