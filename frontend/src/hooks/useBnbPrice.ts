import { useState, useEffect } from 'react';

const COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd';
const FALLBACK_PRICE = 600; // Fallback if API fails
const CACHE_DURATION = 60000; // Cache for 1 minute

let cachedPrice: number | null = null;
let lastFetchTime = 0;

export function useBnbPrice() {
  const [price, setPrice] = useState<number>(FALLBACK_PRICE);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchPrice = async () => {
      const now = Date.now();

      // Use cached price if available and fresh
      if (cachedPrice && (now - lastFetchTime) < CACHE_DURATION) {
        setPrice(cachedPrice);
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch(COINGECKO_API);
        const data = await response.json();

        if (data?.binancecoin?.usd) {
          const newPrice = data.binancecoin.usd;
          cachedPrice = newPrice;
          lastFetchTime = now;
          setPrice(newPrice);
        } else {
          setPrice(FALLBACK_PRICE);
        }
      } catch (error) {
        console.error('Failed to fetch BNB price:', error);
        setPrice(FALLBACK_PRICE);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrice();

    // Refresh price every minute
    const interval = setInterval(fetchPrice, CACHE_DURATION);

    return () => clearInterval(interval);
  }, []);

  return { price, isLoading };
}

// Utility function to convert BNB to USD
export function formatBnbToUsd(bnbAmount: string | number, bnbPrice: number): string {
  const bnb = typeof bnbAmount === 'string' ? parseFloat(bnbAmount) : bnbAmount;
  if (isNaN(bnb)) return '$0.00';

  const usd = bnb * bnbPrice;

  // Format based on amount
  if (usd < 1) {
    return `$${usd.toFixed(2)}`;
  } else if (usd < 1000) {
    return `$${usd.toFixed(1)}`;
  } else if (usd < 1000000) {
    return `$${(usd / 1000).toFixed(1)}k`;
  } else {
    return `$${(usd / 1000000).toFixed(2)}M`;
  }
}
