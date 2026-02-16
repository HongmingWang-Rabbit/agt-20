import pkg from "hardhat";
const { ethers } = pkg;

const CLAIM_FACTORY_ADDRESS = "0x1902418523A51476c43c6e80e55cB9d781dFB7e2";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Testing with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "HSK");

  // Get actual chain ID from network
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId;
  console.log("Chain ID:", chainId.toString());

  const factory = await ethers.getContractAt("AGT20ClaimFactory", CLAIM_FACTORY_ADDRESS) as any;
  
  // Verify the signer
  const factorySigner = await factory.signer();
  console.log("Factory signer:", factorySigner);
  console.log("Deployer matches signer:", deployer.address.toLowerCase() === factorySigner.toLowerCase());

  // Test token params - single mint
  const tick = "TEST" + Math.floor(Date.now() / 1000).toString().slice(-4);
  const maxSupply = 1000n; // 1000 tokens total
  const claimAmount = 1000n; // User claims all (simulating they minted everything)
  
  console.log(`\n=== Deploying Test Token: $${tick} ===`);
  console.log(`Max Supply: ${maxSupply}`);
  console.log(`Claim Amount: ${claimAmount}`);

  // Create signature for claim
  // Message: user, amount, chainId, factory (for deployAndClaim, useFactoryAddress=true)
  
  // Use ABI encoder to match Solidity's abi.encodePacked
  const packed = ethers.solidityPacked(
    ["address", "uint256", "uint256", "address"],
    [deployer.address, claimAmount, chainId, CLAIM_FACTORY_ADDRESS]
  );
  console.log("\nPacked data:", packed);
  
  const messageHash = ethers.keccak256(packed);
  console.log("Message hash:", messageHash);
  
  // Sign the hash
  const signature = await deployer.signMessage(ethers.getBytes(messageHash));
  console.log("Signature:", signature);

  // Debug - recover to verify
  const ethSignedHash = ethers.hashMessage(ethers.getBytes(messageHash));
  const recovered = ethers.recoverAddress(ethSignedHash, signature);
  console.log("Recovered signer:", recovered);
  console.log("Signer matches:", recovered.toLowerCase() === factorySigner.toLowerCase());

  // Deploy and claim in one transaction
  console.log("\nCalling deployAndClaim...");
  const tx = await factory.deployAndClaim(tick, maxSupply, claimAmount, signature);
  console.log("Tx hash:", tx.hash);
  
  const receipt = await tx.wait();
  console.log("Gas used:", receipt?.gasUsed.toString());

  // Get the deployed token
  const tokenAddress = await factory.getToken(tick);
  console.log("\n=== Token Deployed ===");
  console.log("Token Address:", tokenAddress);

  // Check the token state
  const token = await ethers.getContractAt("AGT20Claimable", tokenAddress);
  const name = await token.name();
  const symbol = await token.symbol();
  const totalSupply = await token.totalSupply();
  const totalClaimed = await token.totalClaimed();
  const balance = await token.balanceOf(deployer.address);
  
  console.log("\n=== Token State ===");
  console.log("Name:", name);
  console.log("Symbol:", symbol);
  console.log("Max Supply:", (await token.maxSupply()).toString());
  console.log("Total Supply:", totalSupply.toString());
  console.log("Total Claimed:", totalClaimed.toString());
  console.log("Deployer Balance:", balance.toString());
  
  // Verify distribution is correct
  console.log("\n=== Verification ===");
  if (balance === claimAmount) {
    console.log("✅ Deployer received correct amount");
  } else {
    console.log("❌ Balance mismatch!");
  }
  
  if (totalClaimed === claimAmount) {
    console.log("✅ Total claimed matches");
  } else {
    console.log("❌ Total claimed mismatch!");
  }
  
  if (totalClaimed === maxSupply) {
    console.log("✅ Token fully distributed (total claimed == max supply)");
  } else {
    console.log(`⚠️ Not fully distributed: ${totalClaimed}/${maxSupply}`);
  }

  console.log("\n=== Test Complete ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
