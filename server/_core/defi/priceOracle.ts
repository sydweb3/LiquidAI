/**
 * Price Oracle Service
 * Aggregates prices from multiple sources: DEX Screener, CoinGecko, Chainlink, Pyth
 */

import axios from 'axios';
import { ethers } from 'ethers';
import { ORACLE_CONFIG, TOKENS, DEX_CONFIG } from './config';
import { rpcManager } from './rpcManager';
import type { TokenSymbol, OracleName } from './config';

// Minimal Chainlink Oracle ABI
const CHAINLINK_ORACLE_ABI = [
  'function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)'
];

interface PriceData {
  price: number;
  source: string;
  timestamp: number;
  confidence: number; // 0-1, higher is more confident
  change24h?: number;
  volume24h?: number;
}

interface TokenPrice {
  symbol: string;
  price: number;
  priceUSD: number;
  change24h?: number;
  volume24h?: number;
  liquidity?: number;
  sources: PriceData[];
  timestamp: number;
}

export class PriceOracle {
  private static instance: PriceOracle;
  private priceCache: Map<string, { data: TokenPrice; expiry: number }> = new Map();
  private readonly CACHE_TTL = 30 * 1000; // 30 seconds for fresh prices
  private readonly COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
  private readonly DEXSCREENER_BASE = 'https://api.dexscreener.com/latest/dex';

  private constructor() {}

  static getInstance(): PriceOracle {
    if (!PriceOracle.instance) {
      PriceOracle.instance = new PriceOracle();
    }
    return PriceOracle.instance;
  }

  /**
   * Get price for a token from multiple sources and aggregate
   */
  async getPrice(token: TokenSymbol | string): Promise<TokenPrice | null> {
    const cacheKey = token.toLowerCase();
    const cached = this.priceCache.get(cacheKey);

    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }

    try {
      const [dexScreenerPrice, coingeckoPrice, chainlinkPrice] = await Promise.allSettled([
        this.getDexScreenerPrice(token),
        this.getCoinGeckoPrice(token),
        this.getChainlinkPrice(token)
      ]);

      const prices: PriceData[] = [];

      if (dexScreenerPrice.status === 'fulfilled' && dexScreenerPrice.value) {
        prices.push(dexScreenerPrice.value);
      }
      if (coingeckoPrice.status === 'fulfilled' && coingeckoPrice.value) {
        prices.push(coingeckoPrice.value);
      }
      if (chainlinkPrice.status === 'fulfilled' && chainlinkPrice.value) {
        prices.push(chainlinkPrice.value);
      }

      if (prices.length === 0) {
        console.warn(`[Oracle] No price sources available for ${token}`);
        return null;
      }

      // Weighted average based on confidence
      const weightedPrice = this.calculateWeightedPrice(prices);
      
      const tokenPrice: TokenPrice = {
        symbol: token,
        price: weightedPrice,
        priceUSD: weightedPrice, // For CRO, price = priceUSD
        sources: prices,
        timestamp: Date.now()
      };

      // Add 24h change and volume from CoinGecko if available
      if (coingeckoPrice.status === 'fulfilled' && coingeckoPrice.value?.change24h) {
        tokenPrice.change24h = coingeckoPrice.value.change24h;
        tokenPrice.volume24h = coingeckoPrice.value.volume24h;
      }

      // Cache the result
      this.priceCache.set(cacheKey, {
        data: tokenPrice,
        expiry: Date.now() + this.CACHE_TTL
      });

      return tokenPrice;
    } catch (error) {
      console.error(`[Oracle] Failed to get price for ${token}:`, error);
      return null;
    }
  }

  /**
   * Get prices for multiple tokens
   */
  async getPrices(tokens: (TokenSymbol | string)[]): Promise<Record<string, TokenPrice>> {
    const results = await Promise.all(tokens.map(token => this.getPrice(token)));
    const prices: Record<string, TokenPrice> = {};

    results.forEach((result, index) => {
      if (result) {
        prices[tokens[index]] = result;
      }
    });

    return prices;
  }

  /**
   * Get price from DEX Screener (real-time DEX prices)
   */
  private async getDexScreenerPrice(token: TokenSymbol | string): Promise<PriceData | null> {
    try {
      const tokenConfig = TOKENS[token as TokenSymbol];
      const tokenAddress = tokenConfig?.address || token;

      // For native CRO, use WCRO pair
      const searchAddress = token === 'CRO' ? TOKENS.WCRO.address : tokenAddress;

      const response = await axios.get(
        `${this.DEXSCREENER_BASE}/tokens/v1/cronos/${searchAddress}`,
        { timeout: 5000 }
      );

      if (!response.data || !response.data.pairs || response.data.pairs.length === 0) {
        return null;
      }

      // Get the most liquid pair
      const pairs = response.data.pairs.sort(
        (a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
      );

      const topPair = pairs[0];
      const price = parseFloat(topPair.priceUsd || '0');
      const liquidity = topPair.liquidity?.usd || 0;

      // Confidence based on liquidity
      let confidence = 0.5;
      if (liquidity > 1000000) confidence = 0.9;
      else if (liquidity > 100000) confidence = 0.7;
      else if (liquidity > 10000) confidence = 0.6;

      return {
        price,
        source: 'dexscreener',
        timestamp: Date.now(),
        confidence
      };
    } catch (error: any) {
      console.warn('[Oracle] DEX Screener failed:', error.message);
      return null;
    }
  }

  /**
   * Get price from CoinGecko
   */
  private async getCoinGeckoPrice(token: TokenSymbol | string): Promise<PriceData | null> {
    try {
      const tokenConfig = TOKENS[token as TokenSymbol];
      if (!tokenConfig?.coingeckoId) {
        return null;
      }

      const response = await axios.get(
        `${this.COINGECKO_BASE}/simple/price`,
        {
          params: {
            ids: tokenConfig.coingeckoId,
            vs_currencies: 'usd',
            include_24hr_vol: 'true',
            include_24hr_change: 'true'
          },
          timeout: 5000
        }
      );

      const data = response.data[tokenConfig.coingeckoId];
      if (!data || !data.usd) {
        return null;
      }

      return {
        price: data.usd,
        source: 'coingecko',
        timestamp: Date.now(),
        confidence: 0.8, // CoinGecko is reliable but may have slight delay
        change24h: data.usd_24h_change,
        volume24h: data.usd_24h_vol
      };
    } catch (error: any) {
      console.warn('[Oracle] CoinGecko failed:', error.message);
      return null;
    }
  }

  /**
   * Get price from Chainlink Oracle (on-chain)
   */
  private async getChainlinkPrice(token: TokenSymbol | string): Promise<PriceData | null> {
    try {
      const feedKey = `${token}/USD` as keyof typeof ORACLE_CONFIG.chainlink.feeds;
      const feedAddress = ORACLE_CONFIG.chainlink.feeds[feedKey];
      if (!feedAddress) {
        return null;
      }

      const provider = rpcManager.getProvider('cronos');
      const oracle = new ethers.Contract(feedAddress, CHAINLINK_ORACLE_ABI, provider);

      const roundData = await oracle.latestRoundData();
      const answer = BigInt(roundData.answer.toString());
      const updatedAt = BigInt(roundData.updatedAt.toString());

      // Chainlink prices are typically 8 decimals
      const price = Number(answer) / 1e8;
      const age = Date.now() - Number(updatedAt) * 1000;

      // Stale data check (older than 1 hour)
      if (age > 3600000) {
        console.warn(`[Oracle] Chainlink data is stale (${age}ms old)`);
        return null;
      }

      return {
        price,
        source: 'chainlink',
        timestamp: Date.now(),
        confidence: 0.95
      };
    } catch (error: any) {
      console.warn('[Oracle] Chainlink failed:', error.message);
      return null;
    }
  }

  /**
   * Calculate weighted average price from multiple sources
   */
  private calculateWeightedPrice(prices: PriceData[]): number {
    if (prices.length === 0) return 0;
    if (prices.length === 1) return prices[0].price;

    const totalWeight = prices.reduce((sum, p) => sum + p.confidence, 0);
    const weightedSum = prices.reduce((sum, p) => sum + p.price * p.confidence, 0);

    return weightedSum / totalWeight;
  }

  /**
   * Calculate arbitrage opportunity between two DEXes
   */
  async getArbitrageOpportunity(
    token: TokenSymbol,
    dex1: string,
    dex2: string
  ): Promise<{
    profitPercent: number;
    buyDex: string;
    sellDex: string;
    buyPrice: number;
    sellPrice: number;
  } | null> {
    const price = await this.getPrice(token);
    if (!price) return null;

    // In a real implementation, we'd get DEX-specific prices
    // For now, we simulate with a small variance
    const variance = 0.001; // 0.1% simulated difference
    const price1 = price.priceUSD * (1 - variance);
    const price2 = price.priceUSD * (1 + variance);

    const profitPercent = ((price2 - price1) / price1) * 100;

    if (profitPercent < 0.3) { // Minimum 0.3% to be worthwhile
      return null;
    }

    return {
      profitPercent,
      buyDex: dex1,
      sellDex: dex2,
      buyPrice: price1,
      sellPrice: price2
    };
  }

  /**
   * Get token pair price ratio
   */
  async getPairPriceRatio(baseToken: TokenSymbol, quoteToken: TokenSymbol): Promise<number | null> {
    const [basePrice, quotePrice] = await Promise.all([
      this.getPrice(baseToken),
      this.getPrice(quoteToken)
    ]);

    if (!basePrice || !quotePrice || quotePrice.priceUSD === 0) {
      return null;
    }

    return basePrice.priceUSD / quotePrice.priceUSD;
  }

  /**
   * Clear price cache for a token
   */
  invalidateCache(token: TokenSymbol | string): void {
    const cacheKey = token.toLowerCase();
    this.priceCache.delete(cacheKey);
  }

  /**
   * Clear all price caches
   */
  invalidateAllCache(): void {
    this.priceCache.clear();
  }
}

// Singleton export
export const priceOracle = PriceOracle.getInstance();
