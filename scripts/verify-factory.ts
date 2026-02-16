import pkg from "hardhat";
const { ethers } = pkg;

const CLAIM_FACTORY_ADDRESS = "0x15A169FB7Eb88a05B14Ac75f41fbB6C3A3e4f616";

async function main() {
  const factory = await ethers.getContractAt("AGT20ClaimFactory", CLAIM_FACTORY_ADDRESS);
  
  console.log("Factory address:", CLAIM_FACTORY_ADDRESS);
  console.log("Factory signer:", await factory.signer());
  console.log("Total tokens:", (await factory.totalTokens()).toString());
  
  // Check bytecode exists
  const code = await ethers.provider.getCode(CLAIM_FACTORY_ADDRESS);
  console.log("Has bytecode:", code.length > 2);
  console.log("Bytecode length:", (code.length - 2) / 2, "bytes");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
