import { formatEther } from 'viem';

/**
 * Format BNB amounts with smart decimal places
 * - Small amounts (< 0.01): show 4 decimals
 * - Medium amounts (0.01 - 1): show 3 decimals
 * - Large amounts (> 1): show 2 decimals
 */
export function formatBNB(wei: bigint | number, options?: { maxDecimals?: number; minDecimals?: number }): string {
  const valueStr = typeof wei === 'bigint' ? formatEther(wei) : wei.toString();
  const value = parseFloat(valueStr);

  if (value === 0) return '0';

  const maxDecimals = options?.maxDecimals;
  const minDecimals = options?.minDecimals ?? 0;

  let decimals: number;

  if (maxDecimals !== undefined) {
    decimals = maxDecimals;
  } else if (value < 0.01) {
    decimals = 4;
  } else if (value < 1) {
    decimals = 3;
  } else if (value < 100) {
    decimals = 2;
  } else {
    decimals = 1;
  }

  // Ensure we don't show unnecessary trailing zeros
  const formatted = value.toFixed(decimals);
  const num = parseFloat(formatted);

  return num.toLocaleString('en-US', {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format BNB with currency symbol
 */
export function formatBNBWithSymbol(wei: bigint | number, options?: { maxDecimals?: number; minDecimals?: number }): string {
  return `${formatBNB(wei, options)} BNB`;
}

/**
 * Format large numbers with K, M, B suffixes
 */
export function formatCompact(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toFixed(2);
}
