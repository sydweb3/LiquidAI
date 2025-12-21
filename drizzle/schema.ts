import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json, bigint } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  // Wallet addresses
  evmAddress: varchar("evmAddress", { length: 42 }),
  cronosAddress: varchar("cronosAddress", { length: 42 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Strategy configurations for AI-driven DeFi strategies
 */
export const strategies = mysqlTable("strategies", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  type: mysqlEnum("type", ["arbitrage", "liquidity_provision", "yield_farming", "rebalancing"]).notNull(),
  status: mysqlEnum("status", ["active", "paused", "stopped"]).default("paused").notNull(),
  // Strategy parameters stored as JSON
  parameters: json("parameters").$type<{
    threshold?: number;
    frequency?: string;
    maxSlippage?: number;
    targetAllocation?: Record<string, number>;
    minProfitPercent?: number;
    gasLimit?: number;
  }>(),
  // Token allocations
  allocatedTokens: json("allocatedTokens").$type<{
    token: string;
    amount: string;
    chain: string;
  }[]>(),
  estimatedApy: decimal("estimatedApy", { precision: 10, scale: 4 }),
  totalDeposited: decimal("totalDeposited", { precision: 20, scale: 8 }).default("0"),
  totalProfit: decimal("totalProfit", { precision: 20, scale: 8 }).default("0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Strategy = typeof strategies.$inferSelect;
export type InsertStrategy = typeof strategies.$inferInsert;

/**
 * Portfolio positions across chains
 */
export const positions = mysqlTable("positions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  chain: mysqlEnum("chain", ["crypto_com", "cronos"]).notNull(),
  tokenSymbol: varchar("tokenSymbol", { length: 32 }).notNull(),
  tokenAddress: varchar("tokenAddress", { length: 42 }),
  balance: decimal("balance", { precision: 36, scale: 18 }).notNull(),
  valueUsd: decimal("valueUsd", { precision: 20, scale: 8 }),
  // For LP positions
  isLpToken: int("isLpToken").default(0),
  lpPoolAddress: varchar("lpPoolAddress", { length: 42 }),
  lpToken0: varchar("lpToken0", { length: 32 }),
  lpToken1: varchar("lpToken1", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Position = typeof positions.$inferSelect;
export type InsertPosition = typeof positions.$inferInsert;

/**
 * Transaction and activity logs
 */
export const activityLogs = mysqlTable("activity_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  strategyId: int("strategyId"),
  type: mysqlEnum("type", [
    "bridge",
    "swap",
    "add_liquidity",
    "remove_liquidity",
    "deposit",
    "withdraw",
    "strategy_execution",
    "approval"
  ]).notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "failed"]).default("pending").notNull(),
  chain: mysqlEnum("chain", ["crypto_com", "cronos"]).notNull(),
  txHash: varchar("txHash", { length: 66 }),
  // Transaction details
  fromToken: varchar("fromToken", { length: 32 }),
  toToken: varchar("toToken", { length: 32 }),
  fromAmount: decimal("fromAmount", { precision: 36, scale: 18 }),
  toAmount: decimal("toAmount", { precision: 36, scale: 18 }),
  valueUsd: decimal("valueUsd", { precision: 20, scale: 8 }),
  gasUsed: bigint("gasUsed", { mode: "number" }),
  // Additional metadata
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;
