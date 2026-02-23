/**
 * Smart Liquidity Provision Strategy Engine
 * Manages concentrated liquidity positions with auto-rebalancing
 */

import { ethers } from 'ethers';
import { priceOracle } from '../priceOracle';
import { dexManager } from '../dexManager';
import { rpcManager } from '../rpcManager';
import { STRATEGY_DEFAULTS, TOKENS, DEX_CONFIG } from '../config';
import type { TokenSymbol, DexName } from '../config';

interface LiquidityPosition {
  id: string;
  strategyId: number;
  tokenA: TokenSymbol;
  tokenB: TokenSymbol;
  dex: DexName;
  amountA: bigint;
  amountB: bigint;
  liquidity: bigint;
  priceLower: number;
  priceUpper: number;
  currentPrice: number;
  valueUSD: number;
  feesEarned: bigint;
  impermanentLoss: number;
  apr: number;
  status: 'active' | 'needs_rebalance' | 'out_of_range' | 'paused';
  lastRebalance: number;
}

interface LiquidityConfig {
  rebalanceThreshold: number;
  autoCompound: boolean;
  compoundInterval: number;
  maxImpermanentLoss: number;
  targetAPR: number;
  feeCollectionThreshold: number;
}

interface RebalanceAction {
  type: 'rebalance' | 'harvest' | 'withdraw' | 'none';
  reason: string;
  priority: 'low' | 'medium' | 'high';
  estimatedGas: bigint;
  expectedBenefit: number;
}

export class LiquidityEngine {
  private static instance: LiquidityEngine;
  private positions: Map<string, LiquidityPosition> = new Map();
  private config: LiquidityConfig;
  private isRunning: boolean = false;
  private checkTimer?: NodeJS.Timeout;
  private readonly SUPPORTED_PAIRS: Array<[TokenSymbol, TokenSymbol]> = [
    ['CRO', 'USDC'],
    ['CRO', 'USDT'],
    ['ETH', 'CRO'],
    ['WBTC', 'CRO'],
    ['VVS', 'CRO']
  ];

  private constructor() {
    this.config = {
      rebalanceThreshold: STRATEGY_DEFAULTS.liquidity.rebalanceThreshold,
      autoCompound: STRATEGY_DEFAULTS.liquidity.autoCompound,
      compoundInterval: STRATEGY_DEFAULTS.liquidity.compoundInterval,
      maxImpermanentLoss: STRATEGY_DEFAULTS.liquidity.maxImpermanentLoss,
      targetAPR: 20,
      feeCollectionThreshold: 50 // Collect fees when > $50
    };
  }

  static getInstance(): LiquidityEngine {
    if (!LiquidityEngine.instance) {
      LiquidityEngine.instance = new LiquidityEngine();
    }
    return LiquidityEngine.instance;
  }

  /**
   * Start the liquidity position monitor
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[Liquidity] Starting position monitor...');
    this.monitorLoop();
  }

  /**
   * Stop the monitor
   */
  stop(): void {
    this.isRunning = false;
    if (this.checkTimer) clearTimeout(this.checkTimer);
    console.log('[Liquidity] Monitor stopped');
  }

  /**
   * Main monitoring loop
   */
  private async monitorLoop(): Promise<void> {
    if (!this.isRunning) return;

    try {
      await this.checkAllPositions();
      if (this.config.autoCompound) {
        await this.autoCompound();
      }
    } catch (error) {
      console.error('[Liquidity] Monitor error:', error);
    }

    this.checkTimer = setTimeout(() => this.monitorLoop(), 60000); // Check every minute
  }

  /**
   * Create a new liquidity position
   */
  async createPosition(
    strategyId: number,
    tokenA: TokenSymbol,
    tokenB: TokenSymbol,
    amountA: bigint,
    amountB: bigint,
    priceRangePercent: number = 20, // ±20% from current price
    dex: DexName = 'vvs'
  ): Promise<LiquidityPosition | null> {
    try {
      // Get current price
      const priceData = await priceOracle.getPrice(tokenA);
      if (!priceData) {
        throw new Error('Failed to get token price');
      }

      const currentPrice = priceData.priceUSD;
      const priceLower = currentPrice * (1 - priceRangePercent / 100);
      const priceUpper = currentPrice * (1 + priceRangePercent / 100);

      // Add liquidity
      const poolInfo = await dexManager.getPoolInfo(tokenA, tokenB, dex);
      if (!poolInfo) {
        throw new Error('Pool not found');
      }

      const id = `${strategyId}-${tokenA}-${tokenB}-${dex}`;
      
      const position: LiquidityPosition = {
        id,
        strategyId,
        tokenA,
        tokenB,
        dex,
        amountA,
        amountB,
        liquidity: 0n, // Will be set after transaction
        priceLower,
        priceUpper,
        currentPrice,
        valueUSD: 0,
        feesEarned: 0n,
        impermanentLoss: 0,
        apr: 0,
        status: 'active',
        lastRebalance: Date.now()
      };

      this.positions.set(id, position);
      console.log(`[Liquidity] Created position: ${id}`);
      
      return position;
    } catch (error) {
      console.error('[Liquidity] Failed to create position:', error);
      return null;
    }
  }

  /**
   * Check all positions for rebalancing needs
   */
  private async checkAllPositions(): Promise<void> {
    for (const [id, position] of this.positions) {
      if (position.status === 'paused') continue;

      const action = await this.analyzePosition(position);
      
      if (action.type !== 'none') {
        console.log(
          `[Liquidity] Position ${id} needs ${action.type}: ${action.reason} (Priority: ${action.priority})`
        );
        
        if (action.type === 'rebalance' && action.priority === 'high') {
          await this.rebalancePosition(position);
        }
      }
    }
  }

  /**
   * Analyze a position for required actions
   */
  private async analyzePosition(position: LiquidityPosition): Promise<RebalanceAction> {
    try {
      // Get current price
      const priceData = await priceOracle.getPrice(position.tokenA);
      if (!priceData) {
        return { type: 'none', reason: 'Price unavailable', priority: 'low', estimatedGas: 0n, expectedBenefit: 0 };
      }

      const currentPrice = priceData.priceUSD;
      const priceChange = ((currentPrice - position.currentPrice) / position.currentPrice) * 100;

      // Check if price is out of range
      if (currentPrice < position.priceLower || currentPrice > position.priceUpper) {
        return {
          type: 'rebalance',
          reason: `Price out of range (${currentPrice.toFixed(4)} not in [${position.priceLower.toFixed(4)}, ${position.priceUpper.toFixed(4)}])`,
          priority: 'high',
          estimatedGas: 200000n,
          expectedBenefit: position.impermanentLoss * 0.8
        };
      }

      // Check if rebalancing needed based on threshold
      if (Math.abs(priceChange) > this.config.rebalanceThreshold * 100) {
        return {
          type: 'rebalance',
          reason: `Price moved ${priceChange.toFixed(2)}% (threshold: ${this.config.rebalanceThreshold * 100}%)`,
          priority: 'medium',
          estimatedGas: 200000n,
          expectedBenefit: Math.abs(priceChange) * 0.5
        };
      }

      // Check impermanent loss
      const il = dexManager.calculateImpermanentLoss(currentPrice / position.currentPrice);
      position.impermanentLoss = il;

      if (Math.abs(il) > this.config.maxImpermanentLoss * 100) {
        return {
          type: 'withdraw',
          reason: `Impermanent loss ${il.toFixed(2)}% exceeds max ${this.config.maxImpermanentLoss * 100}%`,
          priority: 'high',
          estimatedGas: 150000n,
          expectedBenefit: 0 // Prevent further loss
        };
      }

      // Check fees to harvest
      if (Number(position.feesEarned) > this.config.feeCollectionThreshold * 1e18) {
        return {
          type: 'harvest',
          reason: `Fees earned: $${(Number(position.feesEarned) / 1e18).toFixed(2)}`,
          priority: 'low',
          estimatedGas: 100000n,
          expectedBenefit: Number(position.feesEarned) / 1e18
        };
      }

      return { type: 'none', reason: 'No action needed', priority: 'low', estimatedGas: 0n, expectedBenefit: 0 };
    } catch (error) {
      console.error('[Liquidity] Analysis error:', error);
      return { type: 'none', reason: 'Analysis failed', priority: 'low', estimatedGas: 0n, expectedBenefit: 0 };
    }
  }

  /**
   * Rebalance a position
   */
  private async rebalancePosition(position: LiquidityPosition): Promise<boolean> {
    try {
      console.log(`[Liquidity] Rebalancing position: ${position.id}`);
      
      // In production, this would:
      // 1. Remove existing liquidity
      // 2. Swap tokens to rebalance ratio
      // 3. Add new liquidity with updated price range
      
      position.lastRebalance = Date.now();
      position.currentPrice = (await priceOracle.getPrice(position.tokenA))?.priceUSD || position.currentPrice;
      
      // Recalculate price range around new price
      const rangePercent = 20;
      position.priceLower = position.currentPrice * (1 - rangePercent / 100);
      position.priceUpper = position.currentPrice * (1 + rangePercent / 100);
      position.status = 'active';

      console.log(`[Liquidity] Rebalanced: ${position.id} @ $${position.currentPrice.toFixed(4)}`);
      return true;
    } catch (error) {
      console.error('[Liquidity] Rebalance failed:', error);
      return false;
    }
  }

  /**
   * Auto-compound earnings
   */
  private async autoCompound(): Promise<void> {
    const now = Date.now();
    
    for (const position of this.positions.values()) {
      if (position.status !== 'active') continue;
      if (now - position.lastRebalance < this.config.compoundInterval) continue;

      try {
        console.log(`[Liquidity] Auto-compounding: ${position.id}`);
        
        // In production, this would:
        // 1. Harvest fees
        // 2. Swap fees to LP tokens
        // 3. Add to existing position
        
        position.lastRebalance = now;
      } catch (error) {
        console.error('[Liquidity] Auto-compound failed:', error);
      }
    }
  }

  /**
   * Get position by ID
   */
  getPosition(id: string): LiquidityPosition | undefined {
    return this.positions.get(id);
  }

  /**
   * Get all positions for a strategy
   */
  getPositionsForStrategy(strategyId: number): LiquidityPosition[] {
    return Array.from(this.positions.values()).filter(p => p.strategyId === strategyId);
  }

  /**
   * Remove a position
   */
  async removePosition(id: string): Promise<boolean> {
    try {
      const position = this.positions.get(id);
      if (!position) return false;

      // In production, remove liquidity from DEX
      this.positions.delete(id);
      console.log(`[Liquidity] Removed position: ${id}`);
      return true;
    } catch (error) {
      console.error('[Liquidity] Remove failed:', error);
      return false;
    }
  }

  /**
   * Get position stats
   */
  getPositionStats(): {
    totalPositions: number;
    totalValueUSD: number;
    totalFeesEarned: number;
    avgImpermanentLoss: number;
    activePositions: number;
  } {
    const positions = Array.from(this.positions.values());
    return {
      totalPositions: positions.length,
      totalValueUSD: positions.reduce((sum, p) => sum + p.valueUSD, 0),
      totalFeesEarned: positions.reduce((sum, p) => sum + Number(p.feesEarned), 0) / 1e18,
      avgImpermanentLoss: positions.reduce((sum, p) => sum + p.impermanentLoss, 0) / positions.length || 0,
      activePositions: positions.filter(p => p.status === 'active').length
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<LiquidityConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[Liquidity] Config updated:', this.config);
  }
}

// Singleton export
export const liquidityEngine = LiquidityEngine.getInstance();
