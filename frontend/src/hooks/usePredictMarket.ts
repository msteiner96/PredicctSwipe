import { useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS, PREDICT_MARKET_ABI } from '@/contracts';
import { useMemo } from 'react';

export interface Market {
  id: bigint;
  question: string;
  category: string;
  endTime: bigint;
  resolutionTime: bigint;
  totalYesAmount: bigint;
  totalNoAmount: bigint;
  resolved: boolean;
  outcome: boolean;
  creator: string;
  createdAt: bigint;
  metadata: string;
}

export function useMarketCount() {
  return useReadContract({
    address: CONTRACTS.PREDICT_MARKET,
    abi: PREDICT_MARKET_ABI,
    functionName: 'marketCount',
  });
}

export function useMarket(marketId: number) {
  return useReadContract({
    address: CONTRACTS.PREDICT_MARKET,
    abi: PREDICT_MARKET_ABI,
    functionName: 'getMarket',
    args: [BigInt(marketId)],
  });
}

export function useActiveMarkets() {
  const { data: marketIds, isLoading: idsLoading } = useReadContract({
    address: CONTRACTS.PREDICT_MARKET,
    abi: PREDICT_MARKET_ABI,
    functionName: 'getActiveMarkets',
    chainId: 97,
  });

  // Fetch full market data for each ID
  const contracts = useMemo(() =>
    (marketIds as bigint[] || []).map((id) => ({
      address: CONTRACTS.PREDICT_MARKET,
      abi: PREDICT_MARKET_ABI,
      functionName: 'getMarket' as const,
      args: [id],
      chainId: 97,
    })),
    [marketIds]
  );

  const { data: markets, isLoading: marketsLoading, error, refetch } = useReadContracts({
    contracts,
    query: {
      enabled: contracts.length > 0, // Only fetch when we have market IDs
    }
  });

  const formattedData = useMemo(() =>
    markets?.map((m) => m.result) || [],
    [markets]
  );

  return {
    data: formattedData,
    marketIds: marketIds as bigint[] || [],
    isLoading: idsLoading || (contracts.length > 0 && marketsLoading),
    error,
    refetch,
  };
}

// Hook to fetch ALL markets (both active and resolved) for user profile
export function useAllMarkets() {
  const { data: marketCount } = useReadContract({
    address: CONTRACTS.PREDICT_MARKET,
    abi: PREDICT_MARKET_ABI,
    functionName: 'marketCount',
    chainId: 97,
  });

  // Generate array of all market IDs from 0 to marketCount-1
  const allMarketIds = useMemo(() => {
    if (!marketCount) return [];
    const count = Number(marketCount);
    return Array.from({ length: count }, (_, i) => BigInt(i));
  }, [marketCount]);

  // Fetch full market data for each ID
  const contracts = useMemo(() =>
    allMarketIds.map((id) => ({
      address: CONTRACTS.PREDICT_MARKET,
      abi: PREDICT_MARKET_ABI,
      functionName: 'getMarket' as const,
      args: [id],
      chainId: 97,
    })),
    [allMarketIds]
  );

  const { data: markets, isLoading: marketsLoading, error, refetch } = useReadContracts({
    contracts,
    query: {
      enabled: contracts.length > 0,
    }
  });

  const formattedData = useMemo(() =>
    markets?.map((m) => m.result) || [],
    [markets]
  );

  return {
    data: formattedData,
    marketIds: allMarketIds,
    isLoading: marketsLoading,
    error,
    refetch,
  };
}

// Hook for loading markets in batches with user participation check
export function useBatchedMarkets(userAddress: string | undefined, batchSize: number = 3, offset: number = 0) {
  // Get all active market IDs
  const { data: allMarketIds, isLoading: idsLoading } = useReadContract({
    address: CONTRACTS.PREDICT_MARKET,
    abi: PREDICT_MARKET_ABI,
    functionName: 'getActiveMarkets',
    chainId: 97,
  });

  // Get the batch of market IDs
  const batchIds = useMemo(() => {
    const ids = allMarketIds as bigint[] || [];
    return ids.slice(offset, offset + batchSize);
  }, [allMarketIds, offset, batchSize]);

  // Fetch market data for this batch
  const marketContracts = useMemo(() =>
    batchIds.map((id) => ({
      address: CONTRACTS.PREDICT_MARKET,
      abi: PREDICT_MARKET_ABI,
      functionName: 'getMarket' as const,
      args: [id],
      chainId: 97,
    })),
    [batchIds]
  );

  const { data: marketsData, isLoading: marketsLoading } = useReadContracts({
    contracts: marketContracts,
    query: {
      enabled: marketContracts.length > 0,
      refetchInterval: false,
      refetchOnWindowFocus: false,
    }
  });

  // Fetch user bets for this batch (to check participation)
  const userBetContracts = useMemo(() => {
    if (!userAddress) return [];
    return batchIds.map((id) => ({
      address: CONTRACTS.PREDICT_MARKET,
      abi: PREDICT_MARKET_ABI,
      functionName: 'getUserBets' as const,
      args: [userAddress as `0x${string}`, id],
      chainId: 97,
    }));
  }, [batchIds, userAddress]);

  const { data: userBetsData, isLoading: betsLoading } = useReadContracts({
    contracts: userBetContracts,
    query: {
      enabled: userBetContracts.length > 0 && !!userAddress && !marketsLoading,
      refetchInterval: false,
      refetchOnWindowFocus: false,
    }
  });

  // Combine market data with participation status
  const markets = useMemo(() => {
    if (!marketsData) return [];

    return marketsData.map((marketResult, index) => {
      const market = marketResult.result;
      const userBets = userBetsData?.[index]?.result as any[] | undefined;
      const hasParticipated = userBets && Array.isArray(userBets) && userBets.length > 0;

      return {
        market,
        marketId: batchIds[index],
        hasParticipated,
      };
    }).filter(m => m.market); // Filter out any failed fetches
  }, [marketsData, userBetsData, batchIds]);

  const totalMarkets = (allMarketIds as bigint[] || []).length;
  const hasMore = offset + batchSize < totalMarkets;

  return {
    markets,
    totalMarkets,
    hasMore,
    isLoading: idsLoading || marketsLoading || (!!userAddress && betsLoading),
  };
}

export function usePlaceBet() {
  const { data: hash, writeContract, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const placeBet = async (marketId: number, isYes: boolean, amount: bigint) => {
    writeContract({
      address: CONTRACTS.PREDICT_MARKET,
      abi: PREDICT_MARKET_ABI,
      functionName: 'placeBet',
      args: [BigInt(marketId), isYes],
      value: amount,
    });
  };

  return {
    placeBet,
    isPending,
    isConfirming,
    isSuccess,
    hash,
  };
}

export function useClaimWinnings() {
  const { data: hash, writeContract, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimWinnings = async (marketId: number, betIndex: number) => {
    writeContract({
      address: CONTRACTS.PREDICT_MARKET,
      abi: PREDICT_MARKET_ABI,
      functionName: 'claimWinnings',
      args: [BigInt(marketId), BigInt(betIndex)],
    });
  };

  return {
    claimWinnings,
    isPending,
    isConfirming,
    isSuccess,
    hash,
  };
}

export function useCalculatePotentialPayout(marketId: number | undefined, betAmount: bigint, isYes: boolean) {
  return useReadContract({
    address: CONTRACTS.PREDICT_MARKET,
    abi: PREDICT_MARKET_ABI,
    functionName: 'calculatePotentialPayout',
    args: marketId !== undefined ? [BigInt(marketId), betAmount, isYes] : undefined,
    query: {
      enabled: marketId !== undefined && betAmount > BigInt(0),
    }
  });
}

export function useGetCurrentOdds(marketId: number | undefined) {
  return useReadContract({
    address: CONTRACTS.PREDICT_MARKET,
    abi: PREDICT_MARKET_ABI,
    functionName: 'getCurrentOdds',
    args: marketId !== undefined ? [BigInt(marketId)] : undefined,
    query: {
      enabled: marketId !== undefined,
    }
  });
}

export function useUserBets(userAddress: string | undefined, marketId: number) {
  return useReadContract({
    address: CONTRACTS.PREDICT_MARKET,
    abi: PREDICT_MARKET_ABI,
    functionName: 'getUserBets',
    args: userAddress ? [userAddress as `0x${string}`, BigInt(marketId)] : undefined,
  });
}

export function useUserMarkets(userAddress: string | undefined) {
  return useReadContract({
    address: CONTRACTS.PREDICT_MARKET,
    abi: PREDICT_MARKET_ABI,
    functionName: 'getUserMarkets',
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
    chainId: 97,
    query: {
      enabled: !!userAddress,
    }
  });
}

export function useAllUserBets(userAddress: string | undefined) {
  // WORKAROUND: Contract bug - userMarkets array is never populated
  // Instead, fetch ALL markets (active + resolved) and check each one for user bets
  const { data: marketCount } = useReadContract({
    address: CONTRACTS.PREDICT_MARKET,
    abi: PREDICT_MARKET_ABI,
    functionName: 'marketCount',
    chainId: 97,
  });

  // Generate array of all market IDs from 0 to marketCount-1
  const allMarketIds = useMemo(() => {
    if (!marketCount) return [];
    const count = Number(marketCount);
    return Array.from({ length: count }, (_, i) => BigInt(i));
  }, [marketCount]);

  // Fetch user bets for ALL markets (both active and resolved)
  const contracts = useMemo(() =>
    allMarketIds.map((marketId) => ({
      address: CONTRACTS.PREDICT_MARKET,
      abi: PREDICT_MARKET_ABI,
      functionName: 'getUserBets' as const,
      args: [userAddress as `0x${string}`, marketId],
      chainId: 97,
    })),
    [allMarketIds, userAddress]
  );

  const { data: betsData, isLoading, refetch } = useReadContracts({
    contracts,
    query: {
      enabled: !!userAddress && contracts.length > 0,
    }
  });

  // Filter out empty results and collect market IDs with bets
  const marketIdsWithBets: bigint[] = [];
  const userBets = (betsData || []).map((result, index) => {
    const bets = result.result as any[];
    if (bets && bets.length > 0) {
      marketIdsWithBets.push(allMarketIds[index]);
    }
    return result.result;
  }).filter((bets: any) => bets && Array.isArray(bets) && bets.length > 0);

  return {
    data: userBets,
    marketIds: marketIdsWithBets,
    isLoading,
    refetch,
  };
}

export function useMarketBets(marketId: number) {
  return useReadContract({
    address: CONTRACTS.PREDICT_MARKET,
    abi: PREDICT_MARKET_ABI,
    functionName: 'getMarketBets',
    args: [BigInt(marketId)],
    chainId: 97,
  });
}
