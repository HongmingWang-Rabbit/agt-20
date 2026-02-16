'use client';

import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { AGT20TokenABI, AGT20FactoryABI, CONTRACTS } from '@/lib/wagmi';
import { formatUnits } from 'viem';

interface MintButtonProps {
  tick: string;
  mintLimit: bigint;
}

export function MintButton({ tick, mintLimit }: MintButtonProps) {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState(mintLimit.toString());

  // Get token address from factory
  const { data: tokenAddress } = useReadContract({
    address: CONTRACTS.factory,
    abi: AGT20FactoryABI,
    functionName: 'getToken',
    args: [tick],
  });

  const hasOnChainToken = tokenAddress && tokenAddress !== '0x0000000000000000000000000000000000000000';

  // Read token data
  const { data: totalMinted, refetch: refetchMinted } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: AGT20TokenABI,
    functionName: 'totalMinted',
    query: { enabled: hasOnChainToken },
  });

  const { data: maxSupply } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: AGT20TokenABI,
    functionName: 'maxSupply',
    query: { enabled: hasOnChainToken },
  });

  const { data: userBalance, refetch: refetchBalance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: AGT20TokenABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: hasOnChainToken && !!address },
  });

  const { data: mintingComplete } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: AGT20TokenABI,
    functionName: 'mintingComplete',
    query: { enabled: hasOnChainToken },
  });

  // Mint function
  const { writeContract, data: hash, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleMint = () => {
    if (!tokenAddress || !amount) return;
    writeContract({
      address: tokenAddress as `0x${string}`,
      abi: AGT20TokenABI,
      functionName: 'mint',
      args: [BigInt(amount)],
    });
  };

  // Refetch after successful mint
  if (isSuccess) {
    refetchMinted();
    refetchBalance();
  }

  if (!isConnected) {
    return (
      <div className="mt-6 p-4 bg-gray-800 rounded-lg">
        <p className="text-gray-400 mb-3">Connect wallet to mint on-chain</p>
        <ConnectButton />
      </div>
    );
  }

  if (!hasOnChainToken) {
    return (
      <div className="mt-6 p-4 bg-yellow-900/30 border border-yellow-600 rounded-lg">
        <p className="text-yellow-400">⚠️ This token hasn&apos;t been deployed on-chain yet</p>
        <p className="text-gray-400 text-sm mt-1">The deployer needs to create it via the AGT20Factory contract first.</p>
      </div>
    );
  }

  const progress = maxSupply && totalMinted ? Number((totalMinted * BigInt(100)) / maxSupply) : 0;

  return (
    <div className="mt-6 p-4 bg-gray-800 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-green-400">⛏️ Mint On-Chain</h3>
        <ConnectButton accountStatus="address" />
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-400">Minted</span>
          <span className="text-white">
            {totalMinted ? Number(totalMinted).toLocaleString() : '0'} / {maxSupply ? Number(maxSupply).toLocaleString() : '?'}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {mintingComplete ? (
        <p className="text-center text-yellow-400 py-2">🎉 Minting Complete!</p>
      ) : (
        <>
          {/* Amount input */}
          <div className="flex gap-2 mb-3">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              max={mintLimit.toString()}
              className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white"
              placeholder="Amount"
            />
            <button
              onClick={() => setAmount(mintLimit.toString())}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
            >
              Max ({Number(mintLimit).toLocaleString()})
            </button>
          </div>

          {/* Mint button */}
          <button
            onClick={handleMint}
            disabled={isPending || isConfirming || !amount}
            className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-bold transition-colors"
          >
            {isPending ? '⏳ Confirm in wallet...' : isConfirming ? '⛏️ Mining...' : `Mint ${amount} $${tick}`}
          </button>
        </>
      )}

      {/* User balance */}
      {userBalance !== undefined && (
        <p className="text-center text-gray-400 mt-3">
          Your balance: <span className="text-white font-bold">{Number(userBalance).toLocaleString()}</span> ${tick}
        </p>
      )}

      {/* Success message */}
      {isSuccess && (
        <p className="text-center text-green-400 mt-3">✅ Minted successfully!</p>
      )}

      {/* Contract info */}
      <p className="text-xs text-gray-500 mt-3 text-center">
        Contract: <a href={`https://hashkeychain-testnet-explorer.alt.technology/address/${tokenAddress}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{tokenAddress?.slice(0, 10)}...</a>
      </p>
    </div>
  );
}
