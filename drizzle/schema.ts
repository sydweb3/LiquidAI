import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/**
 * Core user table backing auth flow.
 */
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role").default("user").notNull(),
  evmAddress: text("evmAddress"),
  cronosAddress: text("cronosAddress"),
  // Wallet balance (in USD)
  balanceUsd: text("balanceUsd").default("10000"), // $10K starting balance
  investedUsd: text("investedUsd").default("0"),
  totalRewardsUsd: text("totalRewardsUsd").default("0"),
  createdAt: text("createdAt"),
  updatedAt: text("updatedAt"),
  lastSignedIn: text("lastSignedIn").notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Strategy configurations for AI-driven DeFi strategies
 */
export const strategies = sqliteTable("strategies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  status: text("status").default("paused").notNull(),
  parameters: text("parameters", { mode: "json" }).$type<{
    threshold?: number;
    frequency?: string;
    maxSlippage?: number;
    targetAllocation?: Record<string, number>;
    minProfitPercent?: number;
    gasLimit?: number;
  }>(),
  allocatedTokens: text("allocatedTokens", { mode: "json" }).$type<{
    token: string;
    amount: string;
    chain: string;
  }[]>(),
  estimatedApy: text("estimatedApy"),
  totalDeposited: text("totalDeposited").default("0"),
  totalProfit: text("totalProfit").default("0"),
  createdAt: text("createdAt"),
  updatedAt: text("updatedAt"),
});

export type Strategy = typeof strategies.$inferSelect;
export type InsertStrategy = typeof strategies.$inferInsert;

/**
 * Portfolio positions across chains
 */
export const positions = sqliteTable("positions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  chain: text("chain").notNull(),
  tokenSymbol: text("tokenSymbol").notNull(),
  tokenAddress: text("tokenAddress"),
  balance: text("balance").notNull(),
  valueUsd: text("valueUsd"),
  isLpToken: integer("isLpToken").default(0),
  lpPoolAddress: text("lpPoolAddress"),
  lpToken0: text("lpToken0"),
  lpToken1: text("lpToken1"),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export type Position = typeof positions.$inferSelect;
export type InsertPosition = typeof positions.$inferInsert;

/**
 * Transaction and activity logs
 */
export const activityLogs = sqliteTable("activity_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  strategyId: integer("strategyId"),
  type: text("type").notNull(),
  status: text("status").default("pending").notNull(),
  chain: text("chain").notNull(),
  txHash: text("txHash"),
  fromToken: text("fromToken"),
  toToken: text("toToken"),
  fromAmount: text("fromAmount"),
  toAmount: text("toAmount"),
  valueUsd: text("valueUsd"),
  gasUsed: integer("gasUsed"),
  metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),
  createdAt: text("createdAt"),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;

/**
 * User transactions (deposits, withdrawals, rewards)
 */
export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  type: text("type").notNull(), // deposit, withdrawal, reward, invest, withdraw_invest
  amountUsd: text("amountUsd").notNull(),
  balanceBefore: text("balanceBefore"),
  balanceAfter: text("balanceAfter"),
  description: text("description"),
  metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),
  createdAt: text("createdAt").notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;
