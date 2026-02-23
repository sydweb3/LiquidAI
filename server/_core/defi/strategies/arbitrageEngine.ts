/**
 * Cross-Chain Arbitrage Strategy Engine
 * Detects and executes arbitrage opportunities across DEXes
 */

import { ethers } from 'ethers';
import { priceOracle } from '../priceOracle';
import { dexManager } from '../dexManager';
import { rpcManager } from '../rpcManager';
import { STRATEGY_DEFAULTS, TOKENS, DEX_CONFIG } from '../config';
import type { TokenSymbol, DexName } from '../config';

interface ArbitrageOpportunity {
  id: string;
  token: TokenSymbol;
  buyDex: DexName;
  sellDex: DexName;
  buyPrice: number;
  sellPrice: number;
  profitPercent: number;
  profitUSD: number;
  amountIn: bigint;
  amountOut: bigint;
  gasCost: bigint;
  netProfit: bigint;
  timestamp: number;
  status: 'detected' | 'executing' | 'completed' | 'failed';
}

interface ArbitrageConfig {
  minProfitPercent: number;
  maxSlippage: number;
  checkInterval: number;
  gasPriceMultiplier: number;
  maxTradeSizeUSD: number;
  minTradeSizeUSD: number;
}

interface ExecutionResult {
  success: boolean;
  txHash?: string;
  profit?: bigint;
  gasUsed?: bigint;
  error?: string;
}

export class ArbitrageEngine {
  private static instance: ArbitrageEngine;
  private opportunities: Map<string, ArbitrageOpportunity> = new Map();
  private config: ArbitrageConfig;
  private isRunning: boolean = false;
  private checkTimer?: NodeJS.Timeout;
  private readonly TRACKED_PAIRS: Array<[TokenSymbol, TokenSymbol]> = [
    ['CRO', 'USDC'],
    ['CRO', 'USDT'],
    ['ETH', 'USDC'],
    ['WBTC', 'USDC'],
    ['VVS', 'CRO'],
    ['MMF', 'CRO']
  ];

  private constructor() {
    this.config = {
      minProfitPercent: STRATEGY_DEFAULTS.arbitrage.minProfitPercent,
      maxSlippage: STRATEGY_DEFAULTS.arbitrage.maxSlippage,
      checkInterval: STRATEGY_DEFAULTS.arbitrage.checkInterval,
      gasPriceMultiplier: STRATEGY_DEFAULTS.arbitrage.gasPriceMultiplier,
      maxTradeSizeUSD: 10000,
      minTradeSizeUSD: 100
    };
  }

  static getInstance(): ArbitrageEngine {
    if (!ArbitrageEngine.instance) {
      ArbitrageEngine.instance = new ArbitrageEngine();
    }
    return ArbitrageEngine.instance;
  }

  /**
   * Start the arbitrage scanner
   */
  start(): void {
    if (this.isRunning) {
      console.log('[Arbitrage] Already running');
      return;
    }

    this.isRunning = true;
    console.log('[Arbitrage] Starting scanner...');
    this.scanLoop();
  }

  /**
   * Stop the arbitrage scanner
   */
  stop(): void {
    this.isRunning = false;
    if (this.checkTimer) {
      clearTimeout(this.checkTimer);
    }
    console.log('[Arbitrage] Scanner stopped');
  }

  /**
   * Main scanning loop
   */
  private async scanLoop(): Promise<void> {
    if (!this.isRunning) return;

    try {
      await this.scanOpportunities();
    } catch (error) {
      console.error('[Arbitrage] Scan error:', error);
    }

    this.checkTimer = setTimeout(() => this.scanLoop(), this.config.checkInterval);
  }

  /**
   * Scan for arbitrage opportunities across DEXes
   */
  async scanOpportunities(): Promise<ArbitrageOpportunity[]> {
    const found: ArbitrageOpportunity[] = [];
    const dexes: DexName[] = ['vvs', 'mmFinance', 'cronaSwap'];

    for (const [baseToken, quoteToken] of this.TRACKED_PAIRS) {
      // Check all DEX combinations
      for (let i = 0; i < dexes.length; i++) {
        for (let j = i + 1; j < dexes.length; j++) {
          const opportunity = await this.checkArbitrage(
            baseToken,
            quoteToken,
            dexes[i],
            dexes[j]
          );

          if (opportunity && opportunity.profitPercent > this.config.minProfitPercent) {
            found.push(opportunity);
            this.opportunities.set(opportunity.id, opportunity);
            console.log(
              `[Arbitrage] Found opportunity: ${baseToken} | Buy: ${opportunity.buyDex} @ $${opportunity.buyPrice.toFixed(6)} | Sell: ${opportunity.sellDex} @ $${opportunity.sellPrice.toFixed(6)} | Profit: ${opportunity.profitPercent.toFixed(2)}%`
            );
          }
        }
      }
    }

    return found;
  }

  /**
   * Check arbitrage between two DEXes for a token pair
   */
  private async checkArbitrage(
    baseToken: TokenSymbol,
    quoteToken: TokenSymbol,
    dex1: DexName,
    dex2: DexName
  ): Promise<ArbitrageOpportunity | null> {
    try {
      // Get prices from both DEXes
      const [quote1, quote2] = await Promise.all([
        this.getDEXPrice(baseToken, quoteToken, dex1),
        this.getDEXPrice(baseToken, quoteToken, dex2)
      ]);

      if (!quote1 || !quote2) return null;

      // Determine buy/sell direction
      let buyDex: DexName, sellDex: DexName, buyPrice: number, sellPrice: number;
      
      if (quote1.price < quote2.price) {
        buyDex = dex1;
        sellDex = dex2;
        buyPrice = quote1.price;
        sellPrice = quote2.price;
      } else {
        buyDex = dex2;
        sellDex = dex1;
        buyPrice = quote2.price;
        sellPrice = quote1.price;
      }

      // Calculate profit
      const grossProfitPercent = ((sellPrice - buyPrice) / buyPrice) * 100;
      
      // Estimate trade size
      const tradeSizeUSD = Math.min(
        this.config.maxTradeSizeUSD,
        Math.max(this.config.minTradeSizeUSD, 1000)
      );

      const amountIn = ethers.parseUnits(tradeSizeUSD.toString(), 6); // USDC decimals
      
      // Get actual swap quotes
      const [buyQuote, sellQuote] = await Promise.all([
        dexManager.getSwapQuote(amountIn, quoteToken, baseToken, buyDex),
        dexManager.getSwapQuote(1000000000000000000n, baseToken, quoteToken, sellDex) // 1 token
      ]);

      if (!buyQuote || !sellQuote) return null;

      // Calculate expected output
      const expectedOut = Number(buyQuote.amountOut);
      const sellOutput = (expectedOut / 1e18) * Number(sellQuote.amountOut);
      
      // Calculate gas costs
      const gasPrice = await rpcManager.getGasPrice('cronos');
      const estimatedGas = 300000n; // Approximate gas for 2 swaps
      const gasCost = gasPrice * estimatedGas * BigInt(Math.floor(this.config.gasPriceMultiplier * 100));

      // Calculate net profit
      const grossProfit = sellOutput - Number(amountIn);
      const croPrice = (await priceOracle.getPrice('CRO'))?.priceUSD || 0;
      const gasCostUSD = Number(ethers.formatEther(gasCost)) * croPrice;
      const netProfitUSD = (grossProfit / 1e6) - gasCostUSD;
      const netProfitPercent = (netProfitUSD / tradeSizeUSD) * 100;

      if (netProfitPercent < this.config.minProfitPercent) {
        return null;
      }

      const id = `${baseToken}-${buyDex}-${sellDex}-${Date.now()}`;

      return {
        id,
        token: baseToken,
        buyDex,
        sellDex,
        buyPrice,
        sellPrice,
        profitPercent: netProfitPercent,
        profitUSD: netProfitUSD,
        amountIn,
        amountOut: BigInt(Math.floor(sellOutput)),
        gasCost,
        netProfit: BigInt(Math.floor(netProfitUSD * 1e18)),
        timestamp: Date.now(),
        status: 'detected'
      };
    } catch (error) {
      console.error('[Arbitrage] Check opportunity error:', error);
      return null;
    }
  }

  /**
   * Get price from a specific DEX
   */
  private async getDEXPrice(
    baseToken: TokenSymbol,
    quoteToken: TokenSymbol,
    dex: DexName
  ): Promise<{ price: number; dex: DexName } | null> {
    try {
      const poolInfo = await dexManager.getPoolInfo(baseToken, quoteToken, dex);
      if (!poolInfo) return null;

      const price = Number(poolInfo.reserve1) / Number(poolInfo.reserve0);
      return { price, dex };
    } catch {
      return null;
    }
  }

  /**
   * Execute an arbitrage opportunity
   */
  async execute(opportunity: ArbitrageOpportunity, privateKey: string): Promise<ExecutionResult> {
    try {
      console.log(`[Arbitrage] Executing: ${opportunity.id}`);
      opportunity.status = 'executing';

      const signer = rpcManager.getSigner('cronos', privateKey);
      const recipient = await signer.getAddress();

      // Step 1: Approve tokens if needed
      const quoteToken: TokenSymbol = 'USDC';
      const routerAddress = DEX_CONFIG[opportunity.buyDex].router;
      
      const needsApproval = await dexManager.checkAllowance(
        quoteToken,
        recipient,
        routerAddress,
        opportunity.amountIn
      );

      if (!needsApproval) {
        const approveTx = await dexManager.buildApproveTransaction(
          quoteToken,
          routerAddress,
          ethers.MaxUint256 // Unlimited approval
        );
        
        if (approveTx) {
          const tx = await signer.sendTransaction({
            to: approveTx.to,
            data: approveTx.data
          });
          await tx.wait();
        }
      }

      // Step 2: Execute buy on first DEX
      const buyTxData = await dexManager.buildSwapTransaction(
        opportunity.amountIn,
        quoteToken,
        opportunity.token,
        recipient,
        Math.floor(this.config.maxSlippage * 100), // Convert to bps
        opportunity.buyDex
      );

      if (!buyTxData) {
        throw new Error('Failed to build buy transaction');
      }

      const buyTx = await signer.sendTransaction({
        to: buyTxData.to,
        data: buyTxData.data,
        value: buyTxData.value
      });

      const buyReceipt = await buyTx.wait();
      if (!buyReceipt) {
        throw new Error('Buy transaction failed');
      }
      console.log(`[Arbitrage] Buy tx: ${buyTx.hash}`);

      // Parse bought amount from events
      const boughtAmount = this.parseSwapAmount(buyReceipt, opportunity.token);

      // Step 3: Execute sell on second DEX
      const sellTxData = await dexManager.buildSwapTransaction(
        boughtAmount,
        opportunity.token,
        quoteToken,
        recipient,
        Math.floor(this.config.maxSlippage * 100),
        opportunity.sellDex
      );

      if (!sellTxData) {
        throw new Error('Failed to build sell transaction');
      }

      const sellTx = await signer.sendTransaction({
        to: sellTxData.to,
        data: sellTxData.data,
        value: sellTxData.value
      });

      const sellReceipt = await sellTx.wait();
      if (!sellReceipt) {
        throw new Error('Sell transaction failed');
      }
      console.log(`[Arbitrage] Sell tx: ${sellTx.hash}`);

      // Calculate actual profit
      const soldAmount = this.parseSwapAmount(sellReceipt, quoteToken);
      const profit = soldAmount - opportunity.amountIn;

      opportunity.status = 'completed';

      return {
        success: true,
        txHash: sellTx.hash,
        profit,
        gasUsed: buyReceipt.gasUsed + sellReceipt.gasUsed
      };
    } catch (error) {
      console.error('[Arbitrage] Execution failed:', error);
      opportunity.status = 'failed';
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Parse swap amount from transaction receipt
   */
  private parseSwapAmount(receipt: ethers.TransactionReceipt, token: TokenSymbol): bigint {
    // In production, parse actual Transfer events
    // This is a simplified version
    return 0n;
  }

  /**
   * Get all detected opportunities
   */
  getOpportunities(): ArbitrageOpportunity[] {
    return Array.from(this.opportunities.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50); // Return last 50
  }

  /**
   * Get opportunity by ID
   */
  getOpportunity(id: string): ArbitrageOpportunity | undefined {
    return this.opportunities.get(id);
  }

  /**
   * Clear old opportunities
   */
  clearOldOpportunities(maxAge: number = 3600000): void {
    const now = Date.now();
    for (const [id, opp] of this.opportunities) {
      if (now - opp.timestamp > maxAge) {
        this.opportunities.delete(id);
      }
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ArbitrageConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[Arbitrage] Config updated:', this.config);
  }

  /**
   * Get current status
   */
  getStatus(): {
    isRunning: boolean;
    opportunityCount: number;
    config: ArbitrageConfig;
  } {
    return {
      isRunning: this.isRunning,
      opportunityCount: this.opportunities.size,
      config: this.config
    };
  }
}

// Singleton export
export const arbitrageEngine = ArbitrageEngine.getInstance();
