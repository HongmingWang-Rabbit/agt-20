// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AGT20Token
 * @dev ERC20 token following agt-20 inscription standard
 * - Fixed max supply
 * - Per-operation mint limit
 * - Anyone can mint until max supply reached
 */
contract AGT20Token is ERC20, Ownable {
    uint256 public immutable maxSupply;
    uint256 public immutable mintLimit;
    uint256 public totalMinted;
    
    event Mint(address indexed to, uint256 amount, uint256 totalMinted);
    
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 maxSupply_,
        uint256 mintLimit_,
        address deployer_
    ) ERC20(name_, symbol_) Ownable(deployer_) {
        require(maxSupply_ > 0, "Max supply must be > 0");
        require(mintLimit_ > 0, "Mint limit must be > 0");
        require(mintLimit_ <= maxSupply_, "Mint limit exceeds max supply");
        
        maxSupply = maxSupply_;
        mintLimit = mintLimit_;
    }
    
    /**
     * @dev Mint tokens (anyone can call)
     * @param amount Amount to mint (must be <= mintLimit)
     */
    function mint(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        require(amount <= mintLimit, "Exceeds mint limit");
        require(totalMinted + amount <= maxSupply, "Exceeds max supply");
        
        totalMinted += amount;
        _mint(msg.sender, amount);
        
        emit Mint(msg.sender, amount, totalMinted);
    }
    
    /**
     * @dev Check remaining mintable supply
     */
    function remainingSupply() external view returns (uint256) {
        return maxSupply - totalMinted;
    }
    
    /**
     * @dev Check if minting is complete
     */
    function mintingComplete() external view returns (bool) {
        return totalMinted >= maxSupply;
    }
}

/**
 * @title AGT20Factory
 * @dev Factory for deploying agt-20 tokens
 */
contract AGT20Factory {
    struct TokenInfo {
        address tokenAddress;
        string tick;
        uint256 maxSupply;
        uint256 mintLimit;
        address deployer;
        uint256 deployedAt;
    }
    
    mapping(string => address) public tokensByTick;
    mapping(address => TokenInfo) public tokenInfo;
    address[] public allTokens;
    
    event TokenDeployed(
        address indexed tokenAddress,
        string tick,
        uint256 maxSupply,
        uint256 mintLimit,
        address indexed deployer
    );
    
    /**
     * @dev Deploy a new agt-20 token
     * @param tick Token ticker (must be unique)
     * @param maxSupply Maximum supply
     * @param mintLimit Max amount per mint operation
     */
    function deploy(
        string calldata tick,
        uint256 maxSupply,
        uint256 mintLimit
    ) external returns (address) {
        require(bytes(tick).length > 0 && bytes(tick).length <= 10, "Invalid tick length");
        require(tokensByTick[tick] == address(0), "Tick already exists");
        
        // Create token name from tick
        string memory name = string(abi.encodePacked("AGT20 ", tick));
        
        AGT20Token token = new AGT20Token(
            name,
            tick,
            maxSupply,
            mintLimit,
            msg.sender
        );
        
        address tokenAddr = address(token);
        tokensByTick[tick] = tokenAddr;
        tokenInfo[tokenAddr] = TokenInfo({
            tokenAddress: tokenAddr,
            tick: tick,
            maxSupply: maxSupply,
            mintLimit: mintLimit,
            deployer: msg.sender,
            deployedAt: block.timestamp
        });
        allTokens.push(tokenAddr);
        
        emit TokenDeployed(tokenAddr, tick, maxSupply, mintLimit, msg.sender);
        
        return tokenAddr;
    }
    
    /**
     * @dev Get token address by tick
     */
    function getToken(string calldata tick) external view returns (address) {
        return tokensByTick[tick];
    }
    
    /**
     * @dev Get total number of deployed tokens
     */
    function totalTokens() external view returns (uint256) {
        return allTokens.length;
    }
    
    /**
     * @dev Get all token addresses
     */
    function getAllTokens() external view returns (address[] memory) {
        return allTokens;
    }
}
