/**
 * Reward Distribution Scheduler
 * Distributes DeFi rewards to users every 5 minutes based on their investments
 */

import { getUserStrategies, getUserWallet, updateUserBalance, createTransaction } from "../db";

interface RewardCalculation {
  userId: number;
  strategyId: number;
  strategyType: string;
  investedAmount: number;
  rewardAmount: number;
  apy: number;
}

// Mock APY ranges by strategy type (annual, will be converted to per-5-min)
const STRATEGY_APY_RANGES = {
  arbitrage: { min: 15, max: 45 },      // 15-45% APY
  liquidity_provision: { min: 20, max: 60 }, // 20-60% APY
  yield_farming: { min: 10, max: 35 },  // 10-35% APY
  rebalancing: { min: 8, max: 20 }      // 8-20% APY
};

// Calculate rewards for a 5-minute interval
// Formula: (principal * APY) / (365 * 24 * 12)  [12 x 5-minute intervals per hour]
const INTERVALS_PER_YEAR = 365 * 24 * 12; // 105,120 five-minute intervals per year

function calculateReward(principal: number, apy: number): number {
  return (principal * apy / 100) / INTERVALS_PER_YEAR;
}

function getRandomAPY(type: string): number {
  const range = STRATEGY_APY_RANGES[type as keyof typeof STRATEGY_APY_RANGES] || { min: 5, max: 15 };
  return range.min + Math.random() * (range.max - range.min);
}

export class RewardScheduler {
  private static instance: RewardScheduler;
  private intervalId?: NodeJS.Timeout;
  private isRunning: boolean = false;

  private constructor() {}

  static getInstance(): RewardScheduler {
    if (!RewardScheduler.instance) {
      RewardScheduler.instance = new RewardScheduler();
    }
    return RewardScheduler.instance;
  }

  /**
   * Start the reward distribution scheduler
   */
  start(): void {
    if (this.isRunning) {
      console.log('[RewardScheduler] Already running');
      return;
    }

    this.isRunning = true;
    console.log('[RewardScheduler] Starting reward distribution (every 5 minutes)...');
    
    // Run immediately on start
    this.distributeRewards();
    
    // Then run every 5 minutes (300,000 ms)
    this.intervalId = setInterval(() => {
      this.distributeRewards();
    }, 5 * 60 * 1000);
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    console.log('[RewardScheduler] Stopped');
  }

  /**
   * Distribute rewards to all users with active strategies
   */
  async distributeRewards(): Promise<void> {
    console.log('[RewardScheduler] Distributing rewards...');

    try {
      const allUsers = await this.getAllUsersWithStrategies();

      let totalDistributed = 0;
      let userCount = 0;

      for (const user of allUsers) {
        const result = await this.distributeUserRewards(user.id, user.strategies);
        if (result > 0) {
          totalDistributed += result;
          userCount++;
        }
      }

      console.log(
        `[RewardScheduler] Distributed $${totalDistributed.toFixed(4)} to ${userCount} users`
      );
    } catch (error) {
      console.error('[RewardScheduler] Distribution failed:', error);
    }
  }

  /**
   * Get all users with active strategies
   */
  private async getAllUsersWithStrategies(): Promise<Array<{ id: number; strategies: any[] }>> {
    const db = await import('../db');
    
    // Get all strategies from database
    const allStrategies = await db.getAllStrategies();
    
    // Group by user
    const userStrategies = new Map<number, any[]>();
    
    for (const strategy of allStrategies) {
      if (strategy.status === 'active') {
        const existing = userStrategies.get(strategy.userId) || [];
        existing.push(strategy);
        userStrategies.set(strategy.userId, existing);
      }
    }
    
    // Convert to array
    return Array.from(userStrategies.entries()).map(([id, strategies]) => ({
      id,
      strategies
    }));
  }

  /**
   * Distribute rewards for a single user's strategies
   */
  async distributeUserRewards(
    userId: number,
    strategies?: any[]
  ): Promise<number> {
    try {
      // Get user's strategies if not provided
      if (!strategies) {
        strategies = await getUserStrategies(userId) || [];
      }

      // Get user's current wallet
      const wallet = await getUserWallet(userId);
      if (!wallet) return 0;

      // Filter active strategies only
      const activeStrategies = (strategies || []).filter(s => s.status === 'active');
      if (activeStrategies.length === 0) return 0;

      let totalReward = 0;
      const rewardDetails: RewardCalculation[] = [];

      // Calculate reward for each active strategy
      for (const strategy of activeStrategies) {
        // Get invested amount for this strategy (from allocated tokens or default)
        const investedAmount = this.getStrategyInvestedAmount(strategy);
        if (investedAmount <= 0) continue;

        // Get or calculate APY
        const apy = this.getStrategyAPY(strategy);
        
        // Calculate 5-minute reward
        const reward = calculateReward(investedAmount, apy);
        
        if (reward > 0) {
          totalReward += reward;
          rewardDetails.push({
            userId,
            strategyId: strategy.id,
            strategyType: strategy.type,
            investedAmount,
            rewardAmount: reward,
            apy
          });
        }
      }

      // Distribute total reward
      if (totalReward > 0) {
        await updateUserBalance(userId, totalReward, 0, totalReward);

        await createTransaction({
          userId,
          type: 'reward',
          amountUsd: totalReward,
          balanceBefore: wallet.balanceUsd,
          balanceAfter: wallet.balanceUsd + totalReward,
          description: `DeFi rewards from ${activeStrategies.length} active strategies`,
          metadata: {
            details: rewardDetails,
            interval: '5min'
          }
        });

        console.log(
          `[RewardScheduler] User ${userId}: +$${totalReward.toFixed(4)} from ${activeStrategies.length} strategies`
        );
      }

      return totalReward;
    } catch (error) {
      console.error('[RewardScheduler] User reward distribution failed:', error);
      return 0;
    }
  }

  /**
   * Get invested amount for a strategy
   */
  private getStrategyInvestedAmount(strategy: any): number {
    // Check totalDeposited first
    if (strategy.totalDeposited) {
      return parseFloat(strategy.totalDeposited);
    }
    
    // Check allocated tokens
    if (strategy.allocatedTokens && strategy.allocatedTokens.length > 0) {
      return strategy.allocatedTokens.reduce(
        (sum: number, token: any) => sum + parseFloat(token.amount || "0"),
        0
      );
    }
    
    // Default based on strategy type
    return 0; // No reward if nothing invested
  }

  /**
   * Get APY for a strategy
   */
  private getStrategyAPY(strategy: any): number {
    // Use estimatedApy if available
    if (strategy.estimatedApy) {
      return parseFloat(strategy.estimatedApy);
    }
    
    // Generate based on strategy type
    return getRandomAPY(strategy.type);
  }

  /**
   * Manual reward claim (for user-initiated claims)
   */
  async claimRewards(userId: number): Promise<number> {
    return await this.distributeUserRewards(userId);
  }

  /**
   * Get scheduler status
   */
  getStatus(): {
    isRunning: boolean;
    nextDistribution: Date;
  } {
    return {
      isRunning: this.isRunning,
      nextDistribution: new Date(Date.now() + 5 * 60 * 1000)
    };
  }
}

// Singleton export
export const rewardScheduler = RewardScheduler.getInstance();
