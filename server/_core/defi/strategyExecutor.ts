/**
 * Strategy Executor
 * Main orchestrator for all DeFi strategy engines
 */

import { arbitrageEngine } from './strategies/arbitrageEngine';
import { liquidityEngine } from './strategies/liquidityEngine';
import { yieldEngine } from './strategies/yieldEngine';
import { rebalancingEngine } from './strategies/rebalancingEngine';
import { rpcManager } from './rpcManager';
import { priceOracle } from './priceOracle';
import type { Strategy } from '../../../drizzle/schema';

interface StrategyExecutionResult {
  strategyId: number;
  success: boolean;
  action: string;
  profit?: number;
  error?: string;
  timestamp: number;
}

interface EngineStatus {
  name: string;
  running: boolean;
  stats: Record<string, unknown>;
}

export class StrategyExecutor {
  private static instance: StrategyExecutor;
  private executionHistory: Map<number, StrategyExecutionResult[]> = new Map();
  private isInitialized: boolean = false;

  private constructor() {}

  static getInstance(): StrategyExecutor {
    if (!StrategyExecutor.instance) {
      StrategyExecutor.instance = new StrategyExecutor();
    }
    return StrategyExecutor.instance;
  }

  /**
   * Initialize all engines
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[Executor] Already initialized');
      return;
    }

    try {
      // Check RPC connection
      const health = await rpcManager.getAllNetworkHealth();
      console.log('[Executor] Network health:', health);

      // Start all engines
      arbitrageEngine.start();
      liquidityEngine.start();
      yieldEngine.start();
      rebalancingEngine.start();

      this.isInitialized = true;
      console.log('[Executor] All engines started');
    } catch (error) {
      console.error('[Executor] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Execute a strategy based on its type
   */
  async executeStrategy(strategy: Strategy, privateKey?: string): Promise<StrategyExecutionResult> {
    try {
      let result: StrategyExecutionResult;

      switch (strategy.type) {
        case 'arbitrage':
          result = await this.executeArbitrage(strategy, privateKey);
          break;
        case 'liquidity_provision':
          result = await this.executeLiquidityProvision(strategy, privateKey);
          break;
        case 'yield_farming':
          result = await this.executeYieldFarming(strategy, privateKey);
          break;
        case 'rebalancing':
          result = await this.executeRebalancing(strategy, privateKey);
          break;
        default:
          result = {
            strategyId: strategy.id,
            success: false,
            action: 'unknown_strategy_type',
            error: `Unknown strategy type: ${strategy.type}`,
            timestamp: Date.now()
          };
      }

      // Store execution history
      const history = this.executionHistory.get(strategy.id) || [];
      history.push(result);
      if (history.length > 100) history.shift(); // Keep last 100
      this.executionHistory.set(strategy.id, history);

      return result;
    } catch (error) {
      return {
        strategyId: strategy.id,
        success: false,
        action: 'execution_error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };
    }
  }

  /**
   * Execute arbitrage strategy
   */
  private async executeArbitrage(
    strategy: Strategy,
    privateKey?: string
  ): Promise<StrategyExecutionResult> {
    const opportunities = arbitrageEngine.getOpportunities();
    
    if (opportunities.length === 0) {
      return {
        strategyId: strategy.id,
        success: true,
        action: 'scan_complete',
        timestamp: Date.now()
      };
    }

    if (!privateKey) {
      return {
        strategyId: strategy.id,
        success: false,
        action: 'execution_skipped',
        error: 'Private key required for execution',
        timestamp: Date.now()
      };
    }

    // Execute best opportunity
    const bestOpp = opportunities[0];
    const execResult = await arbitrageEngine.execute(bestOpp, privateKey);

    return {
      strategyId: strategy.id,
      success: execResult.success,
      action: execResult.success ? 'arbitrage_executed' : 'arbitrage_failed',
      profit: execResult.profit ? Number(execResult.profit) / 1e18 : undefined,
      error: execResult.error,
      timestamp: Date.now()
    };
  }

  /**
   * Execute liquidity provision strategy
   */
  private async executeLiquidityProvision(
    strategy: Strategy,
    privateKey?: string
  ): Promise<StrategyExecutionResult> {
    const positions = liquidityEngine.getPositionsForStrategy(strategy.id);
    const stats = liquidityEngine.getPositionStats();

    return {
      strategyId: strategy.id,
      success: true,
      action: 'liquidity_status',
      profit: stats.totalFeesEarned,
      timestamp: Date.now()
    };
  }

  /**
   * Execute yield farming strategy
   */
  private async executeYieldFarming(
    strategy: Strategy,
    privateKey?: string
  ): Promise<StrategyExecutionResult> {
    const positions = yieldEngine.getPositionsForStrategy(strategy.id);
    const stats = yieldEngine.getPortfolioStats();

    return {
      strategyId: strategy.id,
      success: true,
      action: 'yield_status',
      profit: stats.totalEarnings,
      timestamp: Date.now()
    };
  }

  /**
   * Execute rebalancing strategy
   */
  private async executeRebalancing(
    strategy: Strategy,
    privateKey?: string
  ): Promise<StrategyExecutionResult> {
    const portfolio = rebalancingEngine.getPortfolio(strategy.id);
    const plans = rebalancingEngine.getPendingPlans().filter(p => p.strategyId === strategy.id);

    if (plans.length > 0 && privateKey) {
      // Execute first pending plan
      const executed = await rebalancingEngine.executePlan(plans[0].id, privateKey);
      return {
        strategyId: strategy.id,
        success: executed,
        action: executed ? 'rebalanced' : 'rebalance_failed',
        timestamp: Date.now()
      };
    }

    return {
      strategyId: strategy.id,
      success: true,
      action: portfolio?.needsRebalance ? 'waiting_rebalance' : 'balanced',
      timestamp: Date.now()
    };
  }

  /**
   * Get execution history for a strategy
   */
  getExecutionHistory(strategyId: number): StrategyExecutionResult[] {
    return this.executionHistory.get(strategyId) || [];
  }

  /**
   * Get status of all engines
   */
  getEngineStatus(): EngineStatus[] {
    return [
      {
        name: 'Arbitrage',
        running: arbitrageEngine.getStatus().isRunning,
        stats: arbitrageEngine.getStatus()
      },
      {
        name: 'Liquidity',
        running: true, // Would need a getStatus method
        stats: liquidityEngine.getPositionStats()
      },
      {
        name: 'Yield',
        running: true,
        stats: yieldEngine.getPortfolioStats()
      },
      {
        name: 'Rebalancing',
        running: true,
        stats: rebalancingEngine.getStats()
      }
    ];
  }

  /**
   * Stop all engines
   */
  async shutdown(): Promise<void> {
    console.log('[Executor] Shutting down...');
    
    arbitrageEngine.stop();
    liquidityEngine.stop();
    yieldEngine.stop();
    rebalancingEngine.stop();

    this.isInitialized = false;
    console.log('[Executor] All engines stopped');
  }
}

// Singleton export
export const strategyExecutor = StrategyExecutor.getInstance();
