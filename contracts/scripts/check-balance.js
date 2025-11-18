const hre = require("hardhat");

async function main() {
  const address = "0x9e949c42807CCDDbc388738Fb3C14209005F1A33";

  const balance = await hre.ethers.provider.getBalance(address);
  console.log(`\nBalance for ${address}:`);
  console.log(`  ETH: ${hre.ethers.formatEther(balance)} ETH`);

  const swipeToken = await hre.ethers.getContractAt("SwipeToken", "0x5FbDB2315678afecb367f032d93F642f64180aa3");
  const swipeBalance = await swipeToken.balanceOf(address);
  console.log(`  SWIPE: ${hre.ethers.formatEther(swipeBalance)} SWIPE\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
