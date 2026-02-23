/**
 * Portfolio Rebalancing Strategy Engine
 * Maintains target asset allocations with gas-optimized rebalancing
 */

import { ethers } from 'ethers';
import { priceOracle } from '../priceOracle';
import { dexManager } from '../dexManager';
import { rpcManager } from '../rpcManager';
import { STRATEGY_DEFAULTS, TOKENS } from '../config';
import type { TokenSymbol } from '../config';

interface AssetAllocation {
  token: TokenSymbol;
  targetPercent: number; // Target allocation percentage
  currentPercent: number; // Current allocation percentage
  deviation: number; // Deviation from target
  valueUSD: number;
  amount: bigint;
}

interface RebalancePlan {
  id: string;
  strategyId: number;
  timestamp: number;
  trades: Array<{
    tokenIn: TokenSymbol;
    tokenOut: TokenSymbol;
    amountIn: bigint;
    expectedOut: bigint;
    reason: string;
  }>;
  totalGasEstimate: bigint;
  expectedImprovement: number; // Reduction in deviation
  status: 'pending' | 'executing' | 'completed' | 'failed';
}

interface PortfolioState {
  totalValueUSD: number;
  allocations: AssetAllocation[];
  totalDeviation: number;
  needsRebalance: boolean;
  lastRebalance: number;
}

interface RebalanceConfig {
  threshold: number; // Rebalance when deviation > threshold
  checkInterval: number;
  gasOptimization: {
    batchThreshold: number;
    timeDelay: number;
  };
  slippageTolerance: number;
}

export class RebalancingEngine {
  private static instance: RebalancingEngine;
  private portfolios: Map<number, PortfolioState> = new Map();
  private pendingPlans: Map<string, RebalancePlan> = new Map();
  private config: RebalanceConfig;
  private isRunning: boolean = false;
  private checkTimer?: NodeJS.Timeout;

  private constructor() {
    this.config = {
      threshold: STRATEGY_DEFAULTS.rebalancing.threshold,
      checkInterval: STRATEGY_DEFAULTS.rebalancing.checkInterval,
      gasOptimization: STRATEGY_DEFAULTS.rebalancing.gasOptimization,
      slippageTolerance: STRATEGY_DEFAULTS.arbitrage.maxSlippage
    };
  }

  static getInstance(): RebalancingEngine {
    if (!RebalancingEngine.instance) {
      RebalancingEngine.instance = new RebalancingEngine();
    }
    return RebalancingEngine.instance;
  }

  /**
   * Start rebalancing monitor
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[Rebalance] Starting monitor...');
    this.monitorLoop();
  }

  /**
   * Stop monitor
   */
  stop(): void {
    this.isRunning = false;
    if (this.checkTimer) clearTimeout(this.checkTimer);
    console.log('[Rebalance] Monitor stopped');
  }

  /**
   * Main monitoring loop
   */
  private async monitorLoop(): Promise<void> {
    if (!this.isRunning) return;

    try {
      for (const [strategyId] of this.portfolios) {
        await this.checkPortfolio(strategyId);
      }
    } catch (error) {
      console.error('[Rebalance] Monitor error:', error);
    }

    this.checkTimer = setTimeout(() => this.monitorLoop(), this.config.checkInterval);
  }

  /**
   * Initialize or update portfolio state
   */
  async updatePortfolio(
    strategyId: number,
    targetAllocations: Array<{ token: TokenSymbol; percent: number }>,
    holdings: Array<{ token: TokenSymbol; amount: bigint }>
  ): Promise<PortfolioState> {
    const prices = await priceOracle.getPrices(targetAllocations.map(a => a.token));
    
    // Calculate current values and percentages
    const allocations: AssetAllocation[] = targetAllocations.map(target => {
      const holding = holdings.find(h => h.token === target.token);
      const amount = holding?.amount || 0n;
      const price = prices[target.token]?.priceUSD || 0;
      const valueUSD = Number(ethers.formatUnits(amount, 6)) * price;

      return {
        token: target.token,
        targetPercent: target.percent,
        currentPercent: 0, // Will calculate after total
        deviation: 0,
        valueUSD,
        amount
      };
    });

    const totalValueUSD = allocations.reduce((sum, a) => sum + a.valueUSD, 0);

    // Calculate percentages and deviations
    allocations.forEach(alloc => {
      alloc.currentPercent = totalValueUSD > 0 ? (alloc.valueUSD / totalValueUSD) * 100 : 0;
      alloc.deviation = alloc.currentPercent - alloc.targetPercent;
    });

    const totalDeviation = allocations.reduce((sum, a) => sum + Math.abs(a.deviation), 0);
    const needsRebalance = totalDeviation > this.config.threshold * 100;

    const state: PortfolioState = {
      totalValueUSD,
      allocations,
      totalDeviation,
      needsRebalance,
      lastRebalance: this.portfolios.get(strategyId)?.lastRebalance || 0
    };

    this.portfolios.set(strategyId, state);
    return state;
  }

  /**
   * Check if portfolio needs rebalancing
   */
  private async checkPortfolio(strategyId: number): Promise<void> {
    const state = this.portfolios.get(strategyId);
    if (!state) return;

    // Recalculate current state
    const currentHoldings = state.allocations.map(a => ({
      token: a.token,
      amount: a.amount
    }));

    const targetAllocations = state.allocations.map(a => ({
      token: a.token,
      percent: a.targetPercent
    }));

    const updatedState = await this.updatePortfolio(strategyId, targetAllocations, currentHoldings);

    if (updatedState.needsRebalance) {
      console.log(
        `[Rebalance] Portfolio ${strategyId} needs rebalancing (deviation: ${updatedState.totalDeviation.toFixed(2)}%)`
      );

      const plan = await this.createRebalancePlan(strategyId, updatedState);
      if (plan && plan.trades.length > 0) {
        this.pendingPlans.set(plan.id, plan);
        console.log(`[Rebalance] Created plan ${plan.id} with ${plan.trades.length} trades`);
      }
    }
  }

  /**
   * Create a rebalancing plan
   */
  private async createRebalancePlan(
    strategyId: number,
    state: PortfolioState
  ): Promise<RebalancePlan | null> {
    const trades: RebalancePlan['trades'] = [];
    let totalGasEstimate = 0n;

    // Find tokens to sell (overweight) and buy (underweight)
    const overweight = state.allocations.filter(a => a.deviation > this.config.threshold * 100);
    const underweight = state.allocations.filter(a => a.deviation < -this.config.threshold * 100);

    if (overweight.length === 0 || underweight.length === 0) {
      return null;
    }

    // Match overweight with underweight
    for (const sell of overweight) {
      const sellValueUSD = (sell.deviation / 100) * state.totalValueUSD;
      
      for (const buy of underweight) {
        const buyNeededUSD = Math.abs((buy.deviation / 100) * state.totalValueUSD);
        const tradeValueUSD = Math.min(sellValueUSD, buyNeededUSD);

        if (tradeValueUSD < 10) continue; // Skip tiny trades

        const sellPrice = (await priceOracle.getPrice(sell.token))?.priceUSD || 0;
        if (sellPrice === 0) continue;

        const amountIn = ethers.parseUnits((tradeValueUSD / sellPrice).toString(), 18);

        // Get swap quote
        const quote = await dexManager.getSwapQuote(amountIn, sell.token, buy.token);
        if (!quote) continue;

        trades.push({
          tokenIn: sell.token,
          tokenOut: buy.token,
          amountIn,
          expectedOut: quote.amountOut,
          reason: `Rebalance: ${sell.token} (${sell.currentPercent.toFixed(1)}% → ${sell.targetPercent}%) to ${buy.token} (${buy.currentPercent.toFixed(1)}% → ${buy.targetPercent}%)`
        });

        totalGasEstimate += 150000n; // Estimated gas per swap
      }
    }

    if (trades.length === 0) return null;

    const expectedImprovement = state.totalDeviation * 0.7; // Expect 70% reduction

    return {
      id: `rebalance-${strategyId}-${Date.now()}`,
      strategyId,
      timestamp: Date.now(),
      trades,
      totalGasEstimate,
      expectedImprovement,
      status: 'pending'
    };
  }

  /**
   * Execute a rebalancing plan
   */
  async executePlan(planId: string, privateKey: string): Promise<boolean> {
    const plan = this.pendingPlans.get(planId);
    if (!plan) {
      console.error('[Rebalance] Plan not found:', planId);
      return false;
    }

    try {
      console.log(`[Rebalance] Executing plan: ${planId}`);
      plan.status = 'executing';

      const signer = rpcManager.getSigner('cronos', privateKey);
      const recipient = await signer.getAddress();

      // Execute each trade
      for (const trade of plan.trades) {
        const txData = await dexManager.buildSwapTransaction(
          trade.amountIn,
          trade.tokenIn,
          trade.tokenOut,
          recipient,
          Math.floor(this.config.slippageTolerance * 100),
          'vvs'
        );

        if (!txData) {
          throw new Error(`Failed to build swap for ${trade.tokenIn} → ${trade.tokenOut}`);
        }

        const tx = await signer.sendTransaction({
          to: txData.to,
          data: txData.data,
          value: txData.value
        });

        await tx.wait();
        console.log(`[Rebalance] Executed: ${trade.tokenIn} → ${trade.tokenOut} (${tx.hash})`);
      }

      plan.status = 'completed';
      
      // Update portfolio state
      const state = this.portfolios.get(plan.strategyId);
      if (state) {
        state.lastRebalance = Date.now();
        state.totalDeviation *= (1 - this.config.threshold); // Reduce deviation
        state.needsRebalance = state.totalDeviation > this.config.threshold * 100;
      }

      console.log(`[Rebalance] Plan ${planId} completed successfully`);
      return true;
    } catch (error) {
      console.error('[Rebalance] Execution failed:', error);
      plan.status = 'failed';
      return false;
    }
  }

  /**
   * Get portfolio state
   */
  getPortfolio(strategyId: number): PortfolioState | undefined {
    return this.portfolios.get(strategyId);
  }

  /**
   * Get pending rebalance plans
   */
  getPendingPlans(): RebalancePlan[] {
    return Array.from(this.pendingPlans.values())
      .filter(p => p.status === 'pending')
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get rebalancing history
   */
  getHistory(strategyId: number, limit: number = 10): RebalancePlan[] {
    return Array.from(this.pendingPlans.values())
      .filter(p => p.strategyId === strategyId && p.status !== 'pending')
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Cancel a pending plan
   */
  cancelPlan(planId: string): boolean {
    return this.pendingPlans.delete(planId);
  }

  /**
   * Get rebalancing stats
   */
  getStats(): {
    totalPortfolios: number;
    needsRebalance: number;
    pendingPlans: number;
    totalValueUSD: number;
  } {
    const portfolios = Array.from(this.portfolios.values());
    return {
      totalPortfolios: portfolios.length,
      needsRebalance: portfolios.filter(p => p.needsRebalance).length,
      pendingPlans: Array.from(this.pendingPlans.values()).filter(p => p.status === 'pending').length,
      totalValueUSD: portfolios.reduce((sum, p) => sum + p.totalValueUSD, 0)
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RebalanceConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[Rebalance] Config updated:', this.config);
  }
}

// Singleton export
export const rebalancingEngine = RebalancingEngine.getInstance();
