import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;
import { AGT20Token, AGT20Factory, AGT20Claimable, AGT20ClaimFactory } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("AGT20 Contracts", function () {
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
  });

  describe("AGT20Token", function () {
    let token: AGT20Token;

    beforeEach(async function () {
      const AGT20Token = await ethers.getContractFactory("AGT20Token");
      token = await AGT20Token.deploy("Test Token", "TEST", 1000000n, 100n, owner.address);
    });

    it("should deploy with correct parameters", async function () {
      expect(await token.name()).to.equal("Test Token");
      expect(await token.symbol()).to.equal("TEST");
      expect(await token.maxSupply()).to.equal(1000000n);
      expect(await token.mintLimit()).to.equal(100n);
    });

    it("should allow minting within limit", async function () {
      await token.connect(user1).mint(100n);
      expect(await token.balanceOf(user1.address)).to.equal(100n);
      expect(await token.totalMinted()).to.equal(100n);
    });

    it("should reject minting above limit", async function () {
      await expect(token.connect(user1).mint(101n)).to.be.revertedWith("Exceeds mint limit");
    });

    it("should reject minting beyond max supply", async function () {
      // Mint until near max
      for (let i = 0; i < 9999; i++) {
        await token.connect(user1).mint(100n);
      }
      // Last mint should work
      await token.connect(user1).mint(100n);
      expect(await token.totalMinted()).to.equal(1000000n);
      
      // Next mint should fail
      await expect(token.connect(user1).mint(1n)).to.be.revertedWith("Exceeds max supply");
    });

    it("should track remaining supply", async function () {
      await token.connect(user1).mint(100n);
      expect(await token.remainingSupply()).to.equal(999900n);
    });

    it("should report minting complete status", async function () {
      expect(await token.mintingComplete()).to.equal(false);
      
      // Mint all
      for (let i = 0; i < 10000; i++) {
        await token.connect(user1).mint(100n);
      }
      
      expect(await token.mintingComplete()).to.equal(true);
    });
  });

  describe("AGT20Factory", function () {
    let factory: AGT20Factory;

    beforeEach(async function () {
      const AGT20Factory = await ethers.getContractFactory("AGT20Factory");
      factory = await AGT20Factory.deploy();
    });

    it("should deploy new tokens", async function () {
      const tx = await factory.deploy("TEST", 1000000n, 100n);
      await tx.wait();

      const tokenAddress = await factory.getToken("TEST");
      expect(tokenAddress).to.not.equal(ethers.ZeroAddress);
    });

    it("should reject duplicate tickers", async function () {
      await factory.deploy("TEST", 1000000n, 100n);
      await expect(factory.deploy("TEST", 500000n, 50n)).to.be.revertedWith("Tick already exists");
    });

    it("should track all tokens", async function () {
      await factory.deploy("AAA", 1000000n, 100n);
      await factory.deploy("BBB", 2000000n, 200n);
      
      expect(await factory.totalTokens()).to.equal(2n);
      
      const allTokens = await factory.getAllTokens();
      expect(allTokens.length).to.equal(2);
    });
  });

  describe("AGT20Claimable", function () {
    let token: AGT20Claimable;

    beforeEach(async function () {
      const AGT20Claimable = await ethers.getContractFactory("AGT20Claimable");
      // Pass owner as factory address for testing
      token = await AGT20Claimable.deploy("Claim Token", "CLAIM", 1000000n, owner.address, owner.address);
    });

    it("should deploy with correct parameters", async function () {
      expect(await token.symbol()).to.equal("CLAIM");
      expect(await token.maxSupply()).to.equal(1000000n);
      expect(await token.signer()).to.equal(owner.address);
    });

    it("should allow claiming with valid signature", async function () {
      const amount = 1000n;
      const chainId = (await ethers.provider.getNetwork()).chainId;
      
      // Create message hash
      const messageHash = ethers.solidityPackedKeccak256(
        ["address", "uint256", "uint256", "address"],
        [user1.address, amount, chainId, await token.getAddress()]
      );
      
      // Sign the message
      const signature = await owner.signMessage(ethers.getBytes(messageHash));
      
      // Claim (use token address, not factory)
      await token.connect(user1)["claim(uint256,bytes,bool)"](amount, signature, false);
      
      expect(await token.balanceOf(user1.address)).to.equal(amount);
      expect(await token.claimed(user1.address)).to.equal(amount);
    });

    it("should reject invalid signature", async function () {
      const amount = 1000n;
      const chainId = (await ethers.provider.getNetwork()).chainId;
      
      // Create message with wrong amount
      const messageHash = ethers.solidityPackedKeccak256(
        ["address", "uint256", "uint256", "address"],
        [user1.address, amount + 1n, chainId, await token.getAddress()]
      );
      
      const signature = await owner.signMessage(ethers.getBytes(messageHash));
      
      await expect(token.connect(user1)["claim(uint256,bytes,bool)"](amount, signature, false)).to.be.revertedWith("Invalid signature");
    });

    it("should prevent double claiming", async function () {
      const amount = 1000n;
      const chainId = (await ethers.provider.getNetwork()).chainId;
      
      const messageHash = ethers.solidityPackedKeccak256(
        ["address", "uint256", "uint256", "address"],
        [user1.address, amount, chainId, await token.getAddress()]
      );
      
      const signature = await owner.signMessage(ethers.getBytes(messageHash));
      
      await token.connect(user1)["claim(uint256,bytes,bool)"](amount, signature, false);
      
      // Try to claim again with same signature
      await expect(token.connect(user1)["claim(uint256,bytes,bool)"](amount, signature, false)).to.be.revertedWith("Already claimed full amount");
    });
  });

  describe("AGT20ClaimFactory", function () {
    let factory: AGT20ClaimFactory;

    beforeEach(async function () {
      const AGT20ClaimFactory = await ethers.getContractFactory("AGT20ClaimFactory");
      factory = await AGT20ClaimFactory.deploy(owner.address);
    });

    it("should deploy with correct signer", async function () {
      expect(await factory.signer()).to.equal(owner.address);
    });

    it("should deploy and claim in one transaction", async function () {
      const tick = "TEST";
      const maxSupply = 1000000n;
      const claimAmount = 1000n;
      const chainId = (await ethers.provider.getNetwork()).chainId;
      
      // We need to predict the token address for the signature
      // For simplicity, we'll use the factory address in the signature
      const messageHash = ethers.solidityPackedKeccak256(
        ["address", "uint256", "uint256", "address"],
        [user1.address, claimAmount, chainId, await factory.getAddress()]
      );
      
      const signature = await owner.signMessage(ethers.getBytes(messageHash));
      
      await factory.connect(user1).deployAndClaim(tick, maxSupply, claimAmount, signature);
      
      const tokenAddress = await factory.getToken(tick);
      expect(tokenAddress).to.not.equal(ethers.ZeroAddress);
      
      const token = await ethers.getContractAt("AGT20Claimable", tokenAddress);
      expect(await token.balanceOf(user1.address)).to.equal(claimAmount);
    });
  });
});
