import { pgTable, text, integer, decimal, jsonb, timestamp, varchar } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  openId: text("open_id").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("login_method"),
  role: varchar("role", { length: 20 }).default("user").notNull(),
  evmAddress: text("evm_address"),
  cronosAddress: text("cronos_address"),
  balanceUsd: decimal("balance_usd", { precision: 20, scale: 8 }).default("10000"),
  investedUsd: decimal("invested_usd", { precision: 20, scale: 8 }).default("0"),
  totalRewardsUsd: decimal("total_rewards_usd", { precision: 20, scale: 8 }).default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Strategy configurations for AI-driven DeFi strategies
 */
export const strategies = pgTable("strategies", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  status: text("status").default("paused").notNull(),
  parameters: jsonb("parameters").$type<{
    threshold?: number;
    frequency?: string;
    maxSlippage?: number;
    targetAllocation?: Record<string, number>;
    minProfitPercent?: number;
    gasLimit?: number;
    selectedProduct?: string;
  }>(),
  allocatedTokens: jsonb("allocated_tokens").$type<{
    token: string;
    amount: string;
    chain: string;
  }[]>(),
  estimatedApy: decimal("estimated_apy", { precision: 10, scale: 4 }),
  totalDeposited: decimal("total_deposited", { precision: 20, scale: 8 }).default("0"),
  totalProfit: decimal("total_profit", { precision: 20, scale: 8 }).default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Strategy = typeof strategies.$inferSelect;
export type InsertStrategy = typeof strategies.$inferInsert;

/**
 * Portfolio positions across chains
 */
export const positions = pgTable("positions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull(),
  chain: text("chain").notNull(),
  tokenSymbol: text("token_symbol").notNull(),
  tokenAddress: text("token_address"),
  balance: text("balance").notNull(),
  valueUsd: text("value_usd"),
  isLpToken: integer("is_lp_token").default(0),
  lpPoolAddress: text("lp_pool_address"),
  lpToken0: text("lp_token0"),
  lpToken1: text("lp_token1"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Position = typeof positions.$inferSelect;
export type InsertPosition = typeof positions.$inferInsert;

/**
 * Transaction and activity logs
 */
export const activityLogs = pgTable("activity_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull(),
  strategyId: integer("strategy_id"),
  type: text("type").notNull(),
  status: text("status").default("pending").notNull(),
  chain: text("chain").notNull(),
  txHash: text("tx_hash"),
  fromToken: text("from_token"),
  toToken: text("to_token"),
  fromAmount: text("from_amount"),
  toAmount: text("to_amount"),
  valueUsd: text("value_usd"),
  gasUsed: integer("gas_used"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;

/**
 * User transactions (deposits, withdrawals, rewards)
 */
export const transactions = pgTable("transactions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(),
  amountUsd: text("amount_usd").notNull(),
  balanceBefore: text("balance_before"),
  balanceAfter: text("balance_after"),
  description: text("description"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;
