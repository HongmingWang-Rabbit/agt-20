import pkg from "hardhat";
const { ethers } = pkg;

const FACTORY_ADDRESS = "0x149CFa35438D5Aa6d544fa03ceDFA7A763b54683";

const TOKENS = [
  { tick: "CNY", maxSupply: "88888888", mintLimit: "888" },
  { tick: "AGNT", maxSupply: "1000000", mintLimit: "100" },
];

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying tokens with account:", deployer.address);

  const factory = await ethers.getContractAt("AGT20Factory", FACTORY_ADDRESS);

  for (const token of TOKENS) {
    console.log(`\nDeploying $${token.tick}...`);
    
    // Check if already exists
    const existing = await factory.getToken(token.tick);
    if (existing !== "0x0000000000000000000000000000000000000000") {
      console.log(`  Already exists at: ${existing}`);
      continue;
    }

    const tx = await factory.deploy(token.tick, token.maxSupply, token.mintLimit);
    const receipt = await tx.wait();
    
    const tokenAddress = await factory.getToken(token.tick);
    console.log(`  ✅ Deployed at: ${tokenAddress}`);
    console.log(`  Max Supply: ${token.maxSupply}`);
    console.log(`  Mint Limit: ${token.mintLimit}`);
  }

  console.log("\n=== All Tokens Deployed ===");
  const allTokens = await factory.getAllTokens();
  console.log("Total tokens:", allTokens.length);
  for (const addr of allTokens) {
    const token = await ethers.getContractAt("AGT20Token", addr);
    const symbol = await token.symbol();
    console.log(`  $${symbol}: ${addr}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
