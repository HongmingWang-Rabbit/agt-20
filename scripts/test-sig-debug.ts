import pkg from "hardhat";
const { ethers } = pkg;

const CLAIM_FACTORY_ADDRESS = "0x15A169FB7Eb88a05B14Ac75f41fbB6C3A3e4f616";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId;
  console.log("Chain ID:", chainId.toString());
  console.log("Deployer:", deployer.address);
  console.log("Factory:", CLAIM_FACTORY_ADDRESS);

  const claimAmount = 1000n;

  // Method 1: Using solidityPacked (should match abi.encodePacked)
  const packed = ethers.solidityPacked(
    ["address", "uint256", "uint256", "address"],
    [deployer.address, claimAmount, chainId, CLAIM_FACTORY_ADDRESS]
  );
  console.log("\n=== Method 1: solidityPacked ===");
  console.log("Packed length:", (packed.length - 2) / 2, "bytes");
  console.log("Packed:", packed);
  
  const messageHash = ethers.keccak256(packed);
  console.log("Message hash:", messageHash);
  
  // What Solidity's toEthSignedMessageHash does
  // It prepends "\x19Ethereum Signed Message:\n32" (32 is the length of the hash)
  const prefixedHash = ethers.hashMessage(ethers.getBytes(messageHash));
  console.log("Prefixed hash:", prefixedHash);
  
  // Sign the raw message hash (signMessage adds prefix internally)
  const signature = await deployer.signMessage(ethers.getBytes(messageHash));
  console.log("Signature:", signature);
  
  // Verify locally
  const recovered = ethers.recoverAddress(prefixedHash, signature);
  console.log("Recovered:", recovered);
  console.log("Match:", recovered.toLowerCase() === deployer.address.toLowerCase());

  // Let's also manually compute what the contract should compute
  console.log("\n=== Manual Contract Simulation ===");
  
  // Break down the packed data
  const userPadded = deployer.address.toLowerCase().slice(2); // 20 bytes = 40 hex
  const amountHex = claimAmount.toString(16).padStart(64, '0'); // 32 bytes = 64 hex
  const chainHex = chainId.toString(16).padStart(64, '0'); // 32 bytes = 64 hex
  const factoryPadded = CLAIM_FACTORY_ADDRESS.toLowerCase().slice(2); // 20 bytes = 40 hex
  
  const manualPacked = '0x' + userPadded + amountHex + chainHex + factoryPadded;
  console.log("Manual packed:", manualPacked);
  console.log("Packs match:", packed.toLowerCase() === manualPacked.toLowerCase());
  
  const manualHash = ethers.keccak256(manualPacked);
  console.log("Manual hash:", manualHash);
  console.log("Hashes match:", manualHash === messageHash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
