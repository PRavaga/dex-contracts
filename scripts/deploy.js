const hre = require("hardhat");

async function main() {
  const Wallet = await hre.ethers.getContractFactory("Wallet");
  const wallet = await Wallet.deploy();

  await wallet.deployed();

  console.log(`wallet deployed to ${wallet.address}`);

  const Link = await hre.ethers.getContractFactory("Link");
  const link = await Link.deploy();

  await link.deployed();

  console.log(`link deployed to ${link.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
