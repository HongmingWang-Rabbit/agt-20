// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title AGT20Claimable
 * @dev ERC20 token that users can claim based on their off-chain (Moltbook) balance
 * - Deployed by first claimer after Moltbook minting is complete
 * - Users claim with a signature from the trusted signer
 */
contract AGT20Claimable is ERC20 {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    address public immutable signer;
    uint256 public immutable maxSupply;
    uint256 public totalClaimed;
    
    mapping(address => uint256) public claimed;
    
    event Claimed(address indexed user, uint256 amount);
    
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 maxSupply_,
        address signer_
    ) ERC20(name_, symbol_) {
        require(maxSupply_ > 0, "Max supply must be > 0");
        require(signer_ != address(0), "Invalid signer");
        
        maxSupply = maxSupply_;
        signer = signer_;
    }
    
    /**
     * @dev Claim tokens based on off-chain balance
     * @param amount Total claimable amount (from Moltbook indexer)
     * @param signature Signature from trusted signer
     */
    function claim(uint256 amount, bytes calldata signature) external {
        require(amount > 0, "Amount must be > 0");
        require(claimed[msg.sender] < amount, "Already claimed full amount");
        
        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            msg.sender,
            amount,
            block.chainid,
            address(this)
        ));
        bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();
        address recovered = ethSignedHash.recover(signature);
        require(recovered == signer, "Invalid signature");
        
        // Calculate claimable amount
        uint256 claimable = amount - claimed[msg.sender];
        require(totalClaimed + claimable <= maxSupply, "Exceeds max supply");
        
        // Update state and mint
        claimed[msg.sender] = amount;
        totalClaimed += claimable;
        _mint(msg.sender, claimable);
        
        emit Claimed(msg.sender, claimable);
    }
    
    /**
     * @dev Check remaining claimable for a user
     */
    function remainingClaim(address user, uint256 totalEntitlement) external view returns (uint256) {
        return totalEntitlement > claimed[user] ? totalEntitlement - claimed[user] : 0;
    }
}

/**
 * @title AGT20ClaimFactory
 * @dev Factory for deploying claimable agt-20 tokens
 * - Only deploys after Moltbook minting is complete
 * - First claimer triggers deployment
 */
contract AGT20ClaimFactory {
    address public immutable signer;
    
    struct TokenInfo {
        address tokenAddress;
        string tick;
        uint256 maxSupply;
        address deployedBy;
        uint256 deployedAt;
    }
    
    mapping(string => address) public tokensByTick;
    mapping(address => TokenInfo) public tokenInfo;
    address[] public allTokens;
    
    event TokenDeployed(
        address indexed tokenAddress,
        string tick,
        uint256 maxSupply,
        address indexed deployedBy
    );
    
    constructor(address signer_) {
        require(signer_ != address(0), "Invalid signer");
        signer = signer_;
    }
    
    /**
     * @dev Deploy a new claimable token (called by first claimer)
     * @param tick Token ticker
     * @param maxSupply Maximum supply (must match Moltbook)
     */
    function deployAndClaim(
        string calldata tick,
        uint256 maxSupply,
        uint256 claimAmount,
        bytes calldata signature
    ) external returns (address) {
        require(bytes(tick).length > 0 && bytes(tick).length <= 10, "Invalid tick length");
        require(tokensByTick[tick] == address(0), "Token already deployed");
        
        // Create token
        string memory name = string(abi.encodePacked("AGT20 ", tick));
        
        AGT20Claimable token = new AGT20Claimable(
            name,
            tick,
            maxSupply,
            signer
        );
        
        address tokenAddr = address(token);
        tokensByTick[tick] = tokenAddr;
        tokenInfo[tokenAddr] = TokenInfo({
            tokenAddress: tokenAddr,
            tick: tick,
            maxSupply: maxSupply,
            deployedBy: msg.sender,
            deployedAt: block.timestamp
        });
        allTokens.push(tokenAddr);
        
        emit TokenDeployed(tokenAddr, tick, maxSupply, msg.sender);
        
        // First claimer also claims their tokens
        token.claim(claimAmount, signature);
        
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
}
