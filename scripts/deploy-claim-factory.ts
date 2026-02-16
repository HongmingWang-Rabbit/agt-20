import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying AGT20ClaimFactory with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Use deployer as signer for claim signatures
  const signerAddress = deployer.address;
  console.log("Claim signer:", signerAddress);

  const AGT20ClaimFactory = await ethers.getContractFactory("AGT20ClaimFactory");
  const factory = await AGT20ClaimFactory.deploy(signerAddress);
  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();
  console.log("\n=== Deployment Complete ===");
  console.log("AGT20ClaimFactory:", factoryAddress);
  console.log("Signer:", signerAddress);
  console.log("\nAdd to .env:");
  console.log(`CLAIM_FACTORY_ADDRESS=${factoryAddress}`);
  console.log(`SIGNER_ADDRESS=${signerAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
