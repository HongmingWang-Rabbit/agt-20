'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { AGT20ClaimFactoryABI, AGT20ClaimableABI, CONTRACTS } from '@/lib/wagmi';

interface ClaimButtonProps {
  tick: string;
  maxSupply: bigint;
  currentSupply: bigint;
}

interface ClaimInfo {
  isClaimable: boolean;
  userBalance: string;
  message: string;
}

export function ClaimButton({ tick, maxSupply, currentSupply }: ClaimButtonProps) {
  const { address, isConnected } = useAccount();
  const [agentName, setAgentName] = useState('');
  const [claimInfo, setClaimInfo] = useState<ClaimInfo | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isClaimable = currentSupply >= maxSupply;
  const progress = Number((currentSupply * BigInt(100)) / maxSupply);

  // Check if token is already deployed on-chain
  const { data: tokenAddress } = useReadContract({
    address: CONTRACTS.claimFactory,
    abi: AGT20ClaimFactoryABI,
    functionName: 'getToken',
    args: [tick],
  });

  const isDeployed = tokenAddress && tokenAddress !== '0x0000000000000000000000000000000000000000';

  // Get user's claimed amount (if deployed)
  const { data: claimedAmount, refetch: refetchClaimed } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: AGT20ClaimableABI,
    functionName: 'claimed',
    args: address ? [address] : undefined,
    query: { enabled: isDeployed && !!address },
  });

  // Deploy and claim (first claimer)
  const { writeContract: deployAndClaim, data: deployHash, isPending: isDeploying } = useWriteContract();
  
  // Claim (subsequent claimers)
  const { writeContract: claim, data: claimHash, isPending: isClaiming } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: deployHash || claimHash,
  });

  // Check balance when agent name changes
  const checkBalance = async () => {
    if (!agentName) return;
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/claim?tick=${tick}&agent=${agentName}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setClaimInfo(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  // Get signature for claim
  const getSignature = async () => {
    if (!agentName || !address) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tick,
          agentName,
          walletAddress: address,
          tokenAddress: isDeployed ? tokenAddress : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setSignature(data.signature);
      setClaimInfo(prev => prev ? { ...prev, userBalance: data.amount } : null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  // Handle claim
  const handleClaim = async () => {
    if (!signature || !claimInfo) return;

    const amount = BigInt(claimInfo.userBalance);

    if (!isDeployed) {
      // First claimer - deploy and claim
      deployAndClaim({
        address: CONTRACTS.claimFactory,
        abi: AGT20ClaimFactoryABI,
        functionName: 'deployAndClaim',
        args: [tick, maxSupply, amount, signature as `0x${string}`],
      });
    } else {
      // Subsequent claimers
      claim({
        address: tokenAddress as `0x${string}`,
        abi: AGT20ClaimableABI,
        functionName: 'claim',
        args: [amount, signature as `0x${string}`],
      });
    }
  };

  // Refetch after successful claim
  useEffect(() => {
    if (isSuccess) {
      refetchClaimed();
      setSignature(null);
    }
  }, [isSuccess, refetchClaimed]);

  // Not claimable yet - show minting progress
  if (!isClaimable) {
    return (
      <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <h3 className="text-lg font-bold text-yellow-400 mb-3">⏳ Minting in Progress on Moltbook</h3>
        <div className="mb-2">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-400">Progress</span>
            <span className="text-white">
              {Number(currentSupply).toLocaleString()} / {Number(maxSupply).toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3">
            <div
              className="bg-yellow-500 h-3 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <p className="text-slate-400 text-sm mt-3">
          Once all tokens are minted via Moltbook posts, you&apos;ll be able to claim your on-chain tokens here.
        </p>
      </div>
    );
  }

  // Claimable!
  return (
    <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-emerald-700">
      <h3 className="text-lg font-bold text-emerald-400 mb-3">🎉 Claim Your Tokens On-Chain!</h3>
      
      {!isConnected ? (
        <div>
          <p className="text-slate-400 mb-3">Connect your wallet to claim tokens</p>
          <ConnectButton />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Wallet</span>
            <ConnectButton accountStatus="address" />
          </div>

          {/* Agent name input */}
          <div>
            <label className="block text-slate-400 text-sm mb-1">Your Moltbook Agent Name</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="e.g., clawd-hm"
                className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white"
              />
              <button
                onClick={checkBalance}
                disabled={!agentName || loading}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 rounded"
              >
                Check
              </button>
            </div>
          </div>

          {/* Balance info */}
          {claimInfo && (
            <div className="p-3 bg-slate-900 rounded">
              <div className="flex justify-between">
                <span className="text-slate-400">Your Balance</span>
                <span className="text-emerald-400 font-bold">{Number(claimInfo.userBalance).toLocaleString()} ${tick}</span>
              </div>
              {claimedAmount !== undefined && claimedAmount > 0n && (
                <div className="flex justify-between mt-1">
                  <span className="text-slate-400">Already Claimed</span>
                  <span className="text-white">{Number(claimedAmount).toLocaleString()}</span>
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          {/* Claim button */}
          {claimInfo && BigInt(claimInfo.userBalance) > 0n && (
            <>
              {!signature ? (
                <button
                  onClick={getSignature}
                  disabled={loading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 rounded-lg font-bold"
                >
                  {loading ? 'Getting signature...' : 'Prepare Claim'}
                </button>
              ) : (
                <button
                  onClick={handleClaim}
                  disabled={isDeploying || isClaiming || isConfirming}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 rounded-lg font-bold"
                >
                  {isDeploying || isClaiming ? '⏳ Confirm in wallet...' : isConfirming ? '⛏️ Mining...' : 
                   !isDeployed ? `Deploy & Claim ${Number(claimInfo.userBalance).toLocaleString()} $${tick}` :
                   `Claim ${Number(claimInfo.userBalance).toLocaleString()} $${tick}`}
                </button>
              )}
            </>
          )}

          {isSuccess && (
            <p className="text-center text-emerald-400">✅ Claimed successfully!</p>
          )}

          {/* Contract info */}
          {isDeployed && (
            <p className="text-xs text-slate-500 text-center">
              Token Contract:{' '}
              <a
                href={`https://hashkeychain-testnet-explorer.alt.technology/address/${tokenAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                {(tokenAddress as string).slice(0, 10)}...
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
