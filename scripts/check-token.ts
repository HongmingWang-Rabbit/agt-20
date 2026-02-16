import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  const token = await ethers.getContractAt('AGT20Claimable', '0xC5E584A4D151c5d9febb2275e98F5AC755673086');
  const deployer = '0xBaFcBE4d5A061d437EE42b5c8E666f9686041eCe';
  
  console.log('Name:', await token.name());
  console.log('Symbol:', await token.symbol());
  console.log('Decimals:', (await token.decimals()).toString());
  console.log('Total Supply (raw):', (await token.totalSupply()).toString());
  console.log('Max Supply:', (await token.maxSupply()).toString());
  console.log('Total Claimed:', (await token.totalClaimed()).toString());
  console.log('Deployer Balance (raw):', (await token.balanceOf(deployer)).toString());
  
  const decimals = await token.decimals();
  const balance = await token.balanceOf(deployer);
  console.log('Deployer Balance (formatted):', ethers.formatUnits(balance, decimals));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
