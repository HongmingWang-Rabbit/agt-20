import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying AGT20Factory with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  const AGT20Factory = await ethers.getContractFactory("AGT20Factory");
  const factory = await AGT20Factory.deploy();
  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();
  console.log("AGT20Factory deployed to:", factoryAddress);

  // Verify deployment
  const totalTokens = await factory.totalTokens();
  console.log("Initial token count:", totalTokens.toString());

  console.log("\n=== Deployment Complete ===");
  console.log("Factory:", factoryAddress);
  console.log("\nTo deploy a token, call:");
  console.log(`  factory.deploy("TICK", maxSupply, mintLimit)`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
