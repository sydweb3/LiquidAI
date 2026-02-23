import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getDashboardData,
  getUserStrategies,
  getStrategyById,
  createStrategy,
  updateStrategy,
  updateStrategyStatus,
  getUserPositions,
  getUserActivityLogs,
  createActivityLog,
  updateUserWallets,
  getUserWallet,
  updateUserBalance,
  createTransaction,
  getUserTransactions
} from "./db";
import {
  strategyExecutor,
  priceOracle,
  dexManager,
  arbitrageEngine,
  liquidityEngine,
  yieldEngine,
  rebalancingEngine,
  TOKENS
} from "./_core/defi";

export const appRouter = router({
  system: systemRouter,

  // Auth endpoints (simplified - always returns current user)
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      // Development mode - no session to clear
      return { success: true } as const;
    }),
  }),

  // Dashboard endpoints
  dashboard: router({
    getData: protectedProcedure.query(async ({ ctx }) => {
      return await getDashboardData(ctx.user.id);
    }),

    getPortfolioSummary: protectedProcedure.query(async ({ ctx }) => {
      const positions = await getUserPositions(ctx.user.id);
      const totalValue = positions.reduce((sum, p) => sum + parseFloat(p.valueUsd || "0"), 0);
      
      const byChain = {
        cronos: positions.filter(p => p.chain === "cronos"),
        crypto_com: positions.filter(p => p.chain === "crypto_com")
      };

      return {
        totalValue,
        positions,
        byChain,
        changePercent24h: 2.34, // Mock data for demo
        profitLoss: totalValue * 0.0234
      };
    }),

    connectWallet: protectedProcedure
      .input(z.object({
        evmAddress: z.string().length(42),
        cronosAddress: z.string().length(42).optional()
      }))
      .mutation(async ({ ctx, input }) => {
        await updateUserWallets(ctx.user.id, input.evmAddress, input.cronosAddress);
        return { success: true };
      }),
  }),

  // Strategy endpoints
  strategies: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserStrategies(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await getStrategyById(input.id, ctx.user.id);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(128),
        type: z.enum(["arbitrage", "liquidity_provision", "yield_farming", "rebalancing"]),
        parameters: z.object({
          threshold: z.number().optional(),
          frequency: z.string().optional(),
          maxSlippage: z.number().optional(),
          targetAllocation: z.record(z.string(), z.number()).optional(),
          minProfitPercent: z.number().optional(),
          gasLimit: z.number().optional()
        }).optional(),
        allocatedTokens: z.array(z.object({
          token: z.string(),
          amount: z.string(),
          chain: z.string()
        })).optional()
      }))
      .mutation(async ({ ctx, input }) => {
        const strategyId = await createStrategy({
          userId: ctx.user.id,
          name: input.name,
          type: input.type,
          parameters: input.parameters,
          allocatedTokens: input.allocatedTokens,
          status: "paused"
        });
        return { id: strategyId, success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(128).optional(),
        parameters: z.object({
          threshold: z.number().optional(),
          frequency: z.string().optional(),
          maxSlippage: z.number().optional(),
          targetAllocation: z.record(z.string(), z.number()).optional(),
          minProfitPercent: z.number().optional(),
          gasLimit: z.number().optional()
        }).optional(),
        allocatedTokens: z.array(z.object({
          token: z.string(),
          amount: z.string(),
          chain: z.string()
        })).optional()
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        await updateStrategy(id, ctx.user.id, updates);
        return { success: true };
      }),

    setStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["active", "paused", "stopped"])
      }))
      .mutation(async ({ ctx, input }) => {
        await updateStrategyStatus(input.id, ctx.user.id, input.status);
        return { success: true };
      }),

    // Get available strategy templates
    getTemplates: publicProcedure.query(() => {
      return [
        {
          id: "arbitrage",
          name: "Cross-Chain Arbitrage",
          description: "Automatically detect and execute profitable arbitrage opportunities between Crypto.com and Cronos chains",
          estimatedApy: "15-45%",
          riskLevel: "medium",
          minDeposit: 100,
          supportedTokens: ["CRO", "USDC", "USDT", "ETH", "BTC"]
        },
        {
          id: "liquidity_provision",
          name: "Smart Liquidity Provision",
          description: "AI-optimized liquidity provision on VVS Finance with automatic rebalancing",
          estimatedApy: "20-60%",
          riskLevel: "medium-high",
          minDeposit: 500,
          supportedTokens: ["CRO", "USDC", "VVS", "TONIC"]
        },
        {
          id: "yield_farming",
          name: "Yield Optimization",
          description: "Maximize yields across multiple DeFi protocols with automated compounding",
          estimatedApy: "10-35%",
          riskLevel: "low-medium",
          minDeposit: 250,
          supportedTokens: ["CRO", "USDC", "USDT"]
        },
        {
          id: "rebalancing",
          name: "Portfolio Rebalancing",
          description: "Maintain target allocations with intelligent rebalancing triggers",
          estimatedApy: "8-20%",
          riskLevel: "low",
          minDeposit: 1000,
          supportedTokens: ["CRO", "USDC", "USDT", "ETH", "BTC", "ATOM"]
        }
      ];
    })
  }),

  // Activity log endpoints
  activity: router({
    list: protectedProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0)
      }).optional())
      .query(async ({ ctx, input }) => {
        const { limit = 50, offset = 0 } = input || {};
        return await getUserActivityLogs(ctx.user.id, limit, offset);
      }),

    create: protectedProcedure
      .input(z.object({
        strategyId: z.number().optional(),
        type: z.enum([
          "bridge", "swap", "add_liquidity", "remove_liquidity",
          "deposit", "withdraw", "strategy_execution", "approval"
        ]),
        chain: z.enum(["crypto_com", "cronos"]),
        txHash: z.string().optional(),
        fromToken: z.string().optional(),
        toToken: z.string().optional(),
        fromAmount: z.string().optional(),
        toAmount: z.string().optional(),
        valueUsd: z.string().optional(),
        metadata: z.record(z.string(), z.unknown()).optional()
      }))
      .mutation(async ({ ctx, input }) => {
        const logId = await createActivityLog({
          userId: ctx.user.id,
          strategyId: input.strategyId,
          type: input.type,
          chain: input.chain,
          txHash: input.txHash,
          fromToken: input.fromToken,
          toToken: input.toToken,
          fromAmount: input.fromAmount,
          toAmount: input.toAmount,
          valueUsd: input.valueUsd,
          metadata: input.metadata,
          status: "pending"
        });
        return { id: logId, success: true };
      })
  }),

  // Market data endpoints (mock for demo)
  market: router({
    getPrices: publicProcedure.query(() => {
      return {
        CRO: { price: 0.0892, change24h: 2.34 },
        USDC: { price: 1.00, change24h: 0.01 },
        USDT: { price: 1.00, change24h: -0.02 },
        ETH: { price: 3456.78, change24h: 1.56 },
        BTC: { price: 98234.56, change24h: 0.89 },
        VVS: { price: 0.00000234, change24h: -3.21 },
        TONIC: { price: 0.00000012, change24h: 5.67 }
      };
    }),

    getPoolData: publicProcedure.query(() => {
      return [
        { pair: "CRO/USDC", tvl: 45000000, apr: 23.45, volume24h: 2340000 },
        { pair: "CRO/ETH", tvl: 28000000, apr: 18.92, volume24h: 1560000 },
        { pair: "VVS/CRO", tvl: 12000000, apr: 45.67, volume24h: 890000 },
        { pair: "USDC/USDT", tvl: 67000000, apr: 8.34, volume24h: 5670000 }
      ];
    })
  }),

  // DeFi strategy endpoints
  defi: router({
    // Get real-time token prices
    getPrices: publicProcedure
      .input(z.object({
        tokens: z.array(z.string()).optional()
      }).optional())
      .query(async ({ input }) => {
        const tokens = input?.tokens || Object.keys(TOKENS);
        const prices = await priceOracle.getPrices(tokens);
        return prices;
      }),

    // Get arbitrage opportunities
    getArbitrageOpportunities: publicProcedure.query(() => {
      return arbitrageEngine.getOpportunities();
    }),

    // Get arbitrage engine status
    getArbitrageStatus: publicProcedure.query(() => {
      return arbitrageEngine.getStatus();
    }),

    // Get liquidity positions
    getLiquidityPositions: protectedProcedure
      .input(z.object({
        strategyId: z.number().optional()
      }).optional())
      .query(async ({ ctx, input }) => {
        if (input?.strategyId) {
          return liquidityEngine.getPositionsForStrategy(input.strategyId);
        }
        return liquidityEngine.getPositionStats();
      }),

    // Get yield opportunities
    getYieldOpportunities: publicProcedure
      .input(z.object({
        token: z.string().optional(),
        limit: z.number().default(10)
      }).optional())
      .query(async ({ input }) => {
        const token = input?.token as any || 'USDC';
        return yieldEngine.getBestOpportunities(token, input?.limit);
      }),

    // Get yield portfolio stats
    getYieldPortfolio: protectedProcedure.query(async ({ ctx }) => {
      return yieldEngine.getPortfolioStats();
    }),

    // Get rebalancing status
    getRebalancingStatus: protectedProcedure.query(async ({ ctx }) => {
      return rebalancingEngine.getStats();
    }),

    // Get pending rebalance plans
    getRebalancePlans: protectedProcedure.query(() => {
      return rebalancingEngine.getPendingPlans();
    }),

    // Execute rebalance plan
    executeRebalance: protectedProcedure
      .input(z.object({
        planId: z.string()
      }))
      .mutation(async ({ ctx, input }) => {
        // In production, use actual private key from secure storage
        const privateKey = process.env.WALLET_PRIVATE_KEY;
        if (!privateKey) {
          throw new Error('Private key not configured');
        }
        return rebalancingEngine.executePlan(input.planId, privateKey);
      }),

    // Get all engine statuses
    getEngineStatus: publicProcedure.query(() => {
      return strategyExecutor.getEngineStatus();
    }),

    // Get execution history for a strategy
    getExecutionHistory: protectedProcedure
      .input(z.object({
        strategyId: z.number()
      }))
      .query(async ({ input }) => {
        return strategyExecutor.getExecutionHistory(input.strategyId);
      })
  }),

  // Wallet endpoints
  wallet: router({
    // Get user wallet balance
    getBalance: protectedProcedure.query(async ({ ctx }) => {
      const wallet = await getUserWallet(ctx.user.id);
      return wallet || { balanceUsd: 10000, investedUsd: 0, totalRewardsUsd: 0 };
    }),

    // Get transaction history
    getTransactions: protectedProcedure
      .input(z.object({
        limit: z.number().default(50)
      }).optional())
      .query(async ({ ctx, input }) => {
        return await getUserTransactions(ctx.user.id, input?.limit || 50);
      }),

    // Deposit funds (add to balance)
    deposit: protectedProcedure
      .input(z.object({
        amount: z.number().positive()
      }))
      .mutation(async ({ ctx, input }) => {
        const wallet = await getUserWallet(ctx.user.id);
        if (!wallet) throw new Error('Wallet not found');

        await updateUserBalance(ctx.user.id, input.amount, 0, 0);
        
        await createTransaction({
          userId: ctx.user.id,
          type: 'deposit',
          amountUsd: input.amount,
          balanceBefore: wallet.balanceUsd,
          balanceAfter: wallet.balanceUsd + input.amount,
          description: 'Deposit funds'
        });

        return { success: true, newBalance: wallet.balanceUsd + input.amount };
      }),

    // Invest in strategy
    invest: protectedProcedure
      .input(z.object({
        strategyId: z.number(),
        amount: z.number().positive()
      }))
      .mutation(async ({ ctx, input }) => {
        const wallet = await getUserWallet(ctx.user.id);
        if (!wallet) throw new Error('Wallet not found');

        if (wallet.balanceUsd < input.amount) {
          throw new Error('Insufficient balance');
        }

        // Update strategy's totalDeposited
        const db = await import('./db');
        const strategy = await db.getStrategyById(input.strategyId, ctx.user.id);
        if (!strategy) throw new Error('Strategy not found');

        const newTotalDeposited = parseFloat(strategy.totalDeposited || '0') + input.amount;
        await db.updateStrategy(input.strategyId, ctx.user.id, {
          totalDeposited: newTotalDeposited.toString()
        });

        // Deduct from balance, add to invested
        await updateUserBalance(ctx.user.id, -input.amount, input.amount, 0);

        await createTransaction({
          userId: ctx.user.id,
          type: 'invest',
          amountUsd: input.amount,
          balanceBefore: wallet.balanceUsd,
          balanceAfter: wallet.balanceUsd - input.amount,
          description: `Invest in strategy ${input.strategyId}`,
          metadata: { strategyId: input.strategyId }
        });

        return { 
          success: true, 
          newBalance: wallet.balanceUsd - input.amount,
          newInvested: wallet.investedUsd + input.amount
        };
      }),

    // Withdraw from strategy
    withdraw: protectedProcedure
      .input(z.object({
        strategyId: z.number(),
        amount: z.number().positive()
      }))
      .mutation(async ({ ctx, input }) => {
        const wallet = await getUserWallet(ctx.user.id);
        if (!wallet) throw new Error('Wallet not found');

        if (wallet.investedUsd < input.amount) {
          throw new Error('Insufficient invested amount');
        }

        // Deduct from invested, add to balance
        await updateUserBalance(ctx.user.id, input.amount, -input.amount, 0);

        await createTransaction({
          userId: ctx.user.id,
          type: 'withdraw_invest',
          amountUsd: input.amount,
          balanceBefore: wallet.balanceUsd,
          balanceAfter: wallet.balanceUsd + input.amount,
          description: `Withdraw from strategy ${input.strategyId}`,
          metadata: { strategyId: input.strategyId }
        });

        return { 
          success: true, 
          newBalance: wallet.balanceUsd + input.amount,
          newInvested: wallet.investedUsd - input.amount
        };
      }),

    // Claim rewards
    claimRewards: protectedProcedure.mutation(async ({ ctx }) => {
      const { rewardScheduler } = await import('./_core/rewardScheduler');
      const reward = await rewardScheduler.claimRewards(ctx.user.id);
      return { success: true, reward };
    })
  })
});

export type AppRouter = typeof appRouter;
