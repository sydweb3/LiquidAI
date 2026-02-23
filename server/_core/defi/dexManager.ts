/**
 * DEX Integration Layer
 * Supports VVS Finance, MM Finance, and other Cronos DEXes
 */

import { ethers, Contract } from 'ethers';
import { DEX_CONFIG, TOKENS } from './config';
import { rpcManager } from './rpcManager';
import { priceOracle } from './priceOracle';
import type { DexName, TokenSymbol } from './config';

// VVS Router ABI (Uniswap V2 compatible)
const VVS_ROUTER_ABI = [
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline) returns (uint[] memory amounts)',
  'function swapTokensForExactTokens(uint amountOut, uint amountInMax, address[] path, address to, uint deadline) returns (uint[] memory amounts)',
  'function getAmountsOut(uint amountIn, address[] path) view returns (uint[] memory amounts)',
  'function getAmountsIn(uint amountOut, address[] path) view returns (uint[] memory amounts)',
  'function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) returns (uint amountA, uint amountB, uint liquidity)',
  'function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) returns (uint amountA, uint amountB)',
  'function quote(uint amountA, uint reserveA, uint reserveB) pure returns (uint amountB)',
  'function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) pure returns (uint amountOut)',
  'factory() view returns (address)',
  'WETH() view returns (address)'
];

// VVS Factory ABI
const VVS_FACTORY_ABI = [
  'function getPair(address tokenA, address tokenB) view returns (address)',
  'function allPairs(uint) view returns (address)',
  'function allPairsLength() view returns (uint)',
  'event PairCreated(address indexed token0, address indexed token1, address pair, uint)'
];

// VVS LP Token ABI
const LP_TOKEN_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function totalSupply() view returns (uint256)',
  'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() view returns (address)',
  'function token1() view returns (address)',
  'function decimals() view returns (uint8)'
];

interface SwapQuote {
  amountIn: bigint;
  amountOut: bigint;
  amountOutMin: bigint;
  path: string[];
  priceImpact: number;
  fee: number;
  gasEstimate?: bigint;
}

interface LiquidityPosition {
  tokenA: string;
  tokenB: string;
  amountA: bigint;
  amountB: bigint;
  liquidity: bigint;
  share: number; // Percentage of total pool
}

interface PoolInfo {
  address: string;
  token0: string;
  token1: string;
  reserve0: bigint;
  reserve1: bigint;
  totalSupply: bigint;
  fee: number;
}

export class DEXManager {
  private static instance: DEXManager;
  private routers: Map<DexName, Contract> = new Map();
  private factories: Map<DexName, Contract> = new Map();

  private constructor() {}

  static getInstance(): DEXManager {
    if (!DEXManager.instance) {
      DEXManager.instance = new DEXManager();
    }
    return DEXManager.instance;
  }

  /**
   * Get router contract for a DEX
   */
  private getRouter(dex: DexName = 'vvs'): Contract {
    if (!this.routers.has(dex)) {
      const provider = rpcManager.getProvider('cronos');
      const config = DEX_CONFIG[dex];
      this.routers.set(dex, new Contract(config.router, VVS_ROUTER_ABI, provider));
    }
    return this.routers.get(dex)!;
  }

  /**
   * Get factory contract for a DEX
   */
  private getFactory(dex: DexName = 'vvs'): Contract {
    if (!this.factories.has(dex)) {
      const provider = rpcManager.getProvider('cronos');
      const config = DEX_CONFIG[dex];
      this.factories.set(dex, new Contract(config.factory, VVS_FACTORY_ABI, provider));
    }
    return this.factories.get(dex)!;
  }

  /**
   * Get token address (handling native CRO)
   */
  private getTokenAddress(token: TokenSymbol | string): string {
    if (token === 'CRO') {
      return TOKENS.WCRO.address; // Use WCRO for swaps
    }
    const tokenConfig = TOKENS[token as TokenSymbol];
    return tokenConfig?.address || token;
  }

  /**
   * Get pool address for a token pair
   */
  async getPoolAddress(
    tokenA: TokenSymbol | string,
    tokenB: TokenSymbol | string,
    dex: DexName = 'vvs'
  ): Promise<string | null> {
    try {
      const factory = this.getFactory(dex);
      const addressA = this.getTokenAddress(tokenA);
      const addressB = this.getTokenAddress(tokenB);

      // Sort addresses (factory expects sorted order)
      const [token0, token1] = addressA.toLowerCase() < addressB.toLowerCase()
        ? [addressA, addressB]
        : [addressB, addressA];

      const pairAddress = await factory.getPair(token0, token1);
      return pairAddress === ethers.ZeroAddress ? null : pairAddress;
    } catch (error) {
      console.error(`[DEX] Failed to get pool address:`, error);
      return null;
    }
  }

  /**
   * Get pool reserves and info
   */
  async getPoolInfo(
    tokenA: TokenSymbol | string,
    tokenB: TokenSymbol | string,
    dex: DexName = 'vvs'
  ): Promise<PoolInfo | null> {
    try {
      const poolAddress = await this.getPoolAddress(tokenA, tokenB, dex);
      if (!poolAddress) {
        return null;
      }

      const provider = rpcManager.getProvider('cronos');
      const poolContract = new Contract(poolAddress, LP_TOKEN_ABI, provider);

      const [reserve0, reserve1, totalSupply, token0, token1] = await Promise.all([
        poolContract.getReserves().then(r => r.reserve0),
        poolContract.getReserves().then(r => r.reserve1),
        poolContract.totalSupply(),
        poolContract.token0(),
        poolContract.token1()
      ]);

      return {
        address: poolAddress,
        token0,
        token1,
        reserve0: BigInt(reserve0.toString()),
        reserve1: BigInt(reserve1.toString()),
        totalSupply: BigInt(totalSupply.toString()),
        fee: DEX_CONFIG[dex].fee
      };
    } catch (error) {
      console.error(`[DEX] Failed to get pool info:`, error);
      return null;
    }
  }

  /**
   * Get swap quote (price and amounts)
   */
  async getSwapQuote(
    amountIn: bigint,
    tokenIn: TokenSymbol | string,
    tokenOut: TokenSymbol | string,
    dex: DexName = 'vvs'
  ): Promise<SwapQuote | null> {
    try {
      const router = this.getRouter(dex);
      const addressIn = this.getTokenAddress(tokenIn);
      const addressOut = this.getTokenAddress(tokenOut);

      // Get amounts out
      const amounts = await router.getAmountsOut(amountIn, [addressIn, addressOut]);
      const amountOut = BigInt(amounts[1].toString());

      // Calculate price impact using pool info
      const poolInfo = await this.getPoolInfo(tokenIn, tokenOut, dex);
      let priceImpact = 0;

      if (poolInfo) {
        // Simplified price impact calculation
        const reserveIn = addressIn.toLowerCase() < addressOut.toLowerCase()
          ? poolInfo.reserve0
          : poolInfo.reserve1;
        const reserveOut = addressIn.toLowerCase() < addressOut.toLowerCase()
          ? poolInfo.reserve1
          : poolInfo.reserve0;

        if (reserveIn > 0n && reserveOut > 0n) {
          const impact = Number(amountIn) / Number(reserveIn);
          priceImpact = impact * 100; // Percentage
        }
      }

      // Apply slippage tolerance (0.5% default)
      const slippageBps = 50; // 0.5%
      const amountOutMin = (amountOut * BigInt(10000 - slippageBps)) / BigInt(10000);

      return {
        amountIn,
        amountOut,
        amountOutMin,
        path: [addressIn, addressOut],
        priceImpact,
        fee: DEX_CONFIG[dex].fee
      };
    } catch (error) {
      console.error(`[DEX] Failed to get swap quote:`, error);
      return null;
    }
  }

  /**
   * Find optimal swap route across multiple DEXes
   */
  async findBestRoute(
    amountIn: bigint,
    tokenIn: TokenSymbol | string,
    tokenOut: TokenSymbol | string
  ): Promise<{
    dex: DexName;
    quote: SwapQuote;
    amountOut: bigint;
  } | null> {
    const dexes: DexName[] = ['vvs', 'mmFinance', 'cronaSwap'];
    let bestRoute: { dex: DexName; quote: SwapQuote; amountOut: bigint } | null = null;

    const quotes = await Promise.all(
      dexes.map(async dex => {
        try {
          const quote = await this.getSwapQuote(amountIn, tokenIn, tokenOut, dex);
          return { dex, quote };
        } catch {
          return { dex, quote: null };
        }
      })
    );

    for (const { dex, quote } of quotes) {
      if (quote && (!bestRoute || quote.amountOut > bestRoute.amountOut)) {
        bestRoute = { dex, quote, amountOut: quote.amountOut };
      }
    }

    return bestRoute;
  }

  /**
   * Calculate impermanent loss for LP position
   */
  calculateImpermanentLoss(priceRatio: number): number {
    // IL = 2 * sqrt(priceRatio) / (1 + priceRatio) - 1
    const sqrt = Math.sqrt(priceRatio);
    const il = (2 * sqrt) / (1 + priceRatio) - 1;
    return il * 100; // Return as percentage
  }

  /**
   * Get LP token value and fees earned
   */
  async getLPPosition(
    lpTokenAddress: string,
    owner: string
  ): Promise<{
    liquidity: bigint;
    share: number;
    valueUSD: number;
    feesEarned?: number;
  } | null> {
    try {
      const provider = rpcManager.getProvider('cronos');
      const lpContract = new Contract(lpTokenAddress, LP_TOKEN_ABI, provider);

      const [balance, totalSupply] = await Promise.all([
        lpContract.balanceOf(owner),
        lpContract.totalSupply()
      ]);

      const liquidity = BigInt(balance.toString());
      const total = BigInt(totalSupply.toString());
      const share = Number(liquidity) / Number(total) * 100;

      // Get pool reserves to calculate value
      const [reserve0, reserve1, token0, token1] = await Promise.all([
        lpContract.getReserves().then(r => r.reserve0),
        lpContract.getReserves().then(r => r.reserve1),
        lpContract.token0(),
        lpContract.token1()
      ]);

      // Get token prices
      const [price0, price1] = await Promise.all([
        priceOracle.getPrice(token0 as TokenSymbol),
        priceOracle.getPrice(token1 as TokenSymbol)
      ]);

      let valueUSD = 0;
      if (price0 && price1) {
        const shareDecimal = Number(liquidity) / Number(total);
        const reserve0USD = Number(reserve0) * price0.priceUSD;
        const reserve1USD = Number(reserve1) * price1.priceUSD;
        valueUSD = (reserve0USD + reserve1USD) * shareDecimal;
      }

      return {
        liquidity,
        share,
        valueUSD
      };
    } catch (error) {
      console.error(`[DEX] Failed to get LP position:`, error);
      return null;
    }
  }

  /**
   * Build swap transaction data (for simulation or execution)
   */
  async buildSwapTransaction(
    amountIn: bigint,
    tokenIn: TokenSymbol | string,
    tokenOut: TokenSymbol | string,
    recipient: string,
    slippageBps: number = 50, // 0.5%
    dex: DexName = 'vvs'
  ): Promise<{
    to: string;
    data: string;
    value: bigint;
    quote: SwapQuote;
  } | null> {
    try {
      const quote = await this.getSwapQuote(amountIn, tokenIn, tokenOut, dex);
      if (!quote) {
        return null;
      }

      const router = this.getRouter(dex);
      const deadline = Math.floor(Date.now() / 1000) + 1800; // 30 minutes

      // Build swap calldata
      const data = await router.swapExactTokensForTokens.populateTransaction(
        amountIn,
        quote.amountOutMin,
        quote.path,
        recipient,
        deadline
      );

      return {
        to: DEX_CONFIG[dex].router,
        data: data.data || '0x',
        value: tokenIn === 'CRO' ? amountIn : 0n,
        quote
      };
    } catch (error) {
      console.error(`[DEX] Failed to build swap transaction:`, error);
      return null;
    }
  }

  /**
   * Check if token approval is needed
   */
  async checkAllowance(
    token: TokenSymbol | string,
    owner: string,
    spender: string,
    amount: bigint
  ): Promise<boolean> {
    try {
      const tokenAddress = this.getTokenAddress(token);
      const provider = rpcManager.getProvider('cronos');
      const tokenContract = new Contract(tokenAddress, VVS_ROUTER_ABI, provider);

      const allowance = await tokenContract.allowance(owner, spender);
      return BigInt(allowance.toString()) >= amount;
    } catch (error) {
      console.error(`[DEX] Failed to check allowance:`, error);
      return false;
    }
  }

  /**
   * Build token approval transaction
   */
  async buildApproveTransaction(
    token: TokenSymbol | string,
    spender: string,
    amount: bigint
  ): Promise<{
    to: string;
    data: string;
  } | null> {
    try {
      const tokenAddress = this.getTokenAddress(token);
      const provider = rpcManager.getProvider('cronos');
      const tokenContract = new Contract(tokenAddress, VVS_ROUTER_ABI, provider);

      const data = await tokenContract.approve.populateTransaction(spender, amount);

      return {
        to: tokenAddress,
        data: data.data || '0x'
      };
    } catch (error) {
      console.error(`[DEX] Failed to build approval:`, error);
      return null;
    }
  }
}

// Singleton export
export const dexManager = DEXManager.getInstance();
