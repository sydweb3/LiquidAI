import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  InsertUser, users,
  strategies, InsertStrategy, Strategy,
  positions, InsertPosition, Position,
  activityLogs, InsertActivityLog, ActivityLog,
  transactions, InsertTransaction, Transaction
} from "../drizzle/schema.pg";

let _db: ReturnType<typeof drizzle> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _client = postgres(process.env.DATABASE_URL, { max: 10 });
      _db = drizzle(_client);
      console.log("[Database] Connected to PostgreSQL");
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ User Queries ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const now = new Date();
    const values: InsertUser = {
      openId: user.openId,
      name: user.name ?? null,
      email: user.email ?? null,
      loginMethod: user.loginMethod ?? null,
      role: user.role ?? "user",
      lastSignedIn: user.lastSignedIn instanceof Date ? user.lastSignedIn : now,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: {
        name: values.name,
        email: values.email,
        loginMethod: values.loginMethod,
        lastSignedIn: values.lastSignedIn,
        updatedAt: values.updatedAt,
      },
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserWallets(userId: number, evmAddress: string, cronosAddress?: string) {
  const db = await getDb();
  if (!db) return;

  await db.update(users)
    .set({
      evmAddress,
      cronosAddress: cronosAddress || evmAddress,
      updatedAt: new Date().toISOString()
    })
    .where(eq(users.id, userId));
}

// ============ Strategy Queries ============

export async function getUserStrategies(userId: number): Promise<Strategy[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(strategies)
    .where(eq(strategies.userId, userId))
    .orderBy(desc(strategies.createdAt));
}

export async function getStrategyById(strategyId: number, userId: number): Promise<Strategy | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select()
    .from(strategies)
    .where(and(eq(strategies.id, strategyId), eq(strategies.userId, userId)))
    .limit(1);
  
  return result[0];
}

export async function createStrategy(strategy: InsertStrategy): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date().toISOString();
  const result = await db.insert(strategies).values({
    ...strategy,
    createdAt: now,
    updatedAt: now,
  });
  return result.lastInsertRowid as number;
}

export async function updateStrategy(
  strategyId: number,
  userId: number,
  updates: Partial<InsertStrategy>
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(strategies)
    .set({ ...updates, updatedAt: new Date().toISOString() })
    .where(and(eq(strategies.id, strategyId), eq(strategies.userId, userId)));
}

export async function updateStrategyStatus(
  strategyId: number,
  userId: number,
  status: "active" | "paused" | "stopped"
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(strategies)
    .set({ status, updatedAt: new Date().toISOString() })
    .where(and(eq(strategies.id, strategyId), eq(strategies.userId, userId)));
}

// ============ Position Queries ============

export async function getUserPositions(userId: number): Promise<Position[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(positions)
    .where(eq(positions.userId, userId))
    .orderBy(desc(positions.valueUsd));
}

export async function getPositionsByChain(userId: number, chain: "crypto_com" | "cronos"): Promise<Position[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(positions)
    .where(and(eq(positions.userId, userId), eq(positions.chain, chain)));
}

export async function upsertPosition(position: InsertPosition): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.insert(positions).values(position).onConflictDoUpdate({
    target: positions.id,
    set: {
      balance: position.balance,
      valueUsd: position.valueUsd,
      updatedAt: new Date().toISOString()
    }
  });
}

// ============ Activity Log Queries ============

export async function getUserActivityLogs(
  userId: number, 
  limit: number = 50,
  offset: number = 0
): Promise<ActivityLog[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(activityLogs)
    .where(eq(activityLogs.userId, userId))
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getStrategyActivityLogs(
  strategyId: number,
  limit: number = 20
): Promise<ActivityLog[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(activityLogs)
    .where(eq(activityLogs.strategyId, strategyId))
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit);
}

export async function createActivityLog(log: InsertActivityLog): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date().toISOString();
  const result = await db.insert(activityLogs).values({
    ...log,
    createdAt: now,
  });
  return result.lastInsertRowid as number;
}

export async function updateActivityLogStatus(
  logId: number,
  status: "pending" | "confirmed" | "failed",
  txHash?: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const updates: Record<string, unknown> = { status };
  if (txHash) updates.txHash = txHash;

  await db.update(activityLogs)
    .set(updates)
    .where(eq(activityLogs.id, logId));
}

// ============ Dashboard Aggregation ============

export async function getDashboardData(userId: number) {
  const [userPositions, userStrategies, recentActivity] = await Promise.all([
    getUserPositions(userId),
    getUserStrategies(userId),
    getUserActivityLogs(userId, 10)
  ]);

  // Calculate totals
  const totalValueUsd = userPositions.reduce((sum, p) => sum + parseFloat(p.valueUsd || "0"), 0);
  const cronosValue = userPositions
    .filter(p => p.chain === "cronos")
    .reduce((sum, p) => sum + parseFloat(p.valueUsd || "0"), 0);
  const cryptoComValue = userPositions
    .filter(p => p.chain === "crypto_com")
    .reduce((sum, p) => sum + parseFloat(p.valueUsd || "0"), 0);

  const activeStrategies = userStrategies.filter(s => s.status === "active").length;
  const totalProfit = userStrategies.reduce((sum, s) => sum + parseFloat(s.totalProfit || "0"), 0);
  const avgApy = userStrategies.length > 0
    ? userStrategies.reduce((sum, s) => sum + parseFloat(s.estimatedApy || "0"), 0) / userStrategies.length
    : 0;

  return {
    portfolio: {
      totalValueUsd,
      cronosValue,
      cryptoComValue,
      positions: userPositions
    },
    strategies: {
      total: userStrategies.length,
      active: activeStrategies,
      totalProfit,
      avgApy,
      list: userStrategies
    },
    recentActivity
  };
}

// ============ Wallet/Transaction Queries ============

export async function getUserWallet(userId: number): Promise<{
  balanceUsd: number;
  investedUsd: number;
  totalRewardsUsd: number;
} | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select({
    balanceUsd: users.balanceUsd,
    investedUsd: users.investedUsd,
    totalRewardsUsd: users.totalRewardsUsd
  }).from(users).where(eq(users.id, userId)).limit(1);

  if (result.length === 0) return null;

  return {
    balanceUsd: parseFloat(result[0].balanceUsd || "0"),
    investedUsd: parseFloat(result[0].investedUsd || "0"),
    totalRewardsUsd: parseFloat(result[0].totalRewardsUsd || "0")
  };
}

export async function updateUserBalance(
  userId: number,
  balanceDelta: number,
  investedDelta: number,
  rewardsDelta: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (user.length === 0) return;

  const newBalance = parseFloat(user[0].balanceUsd || "0") + balanceDelta;
  const newInvested = parseFloat(user[0].investedUsd || "0") + investedDelta;
  const newRewards = parseFloat(user[0].totalRewardsUsd || "0") + rewardsDelta;

  await db.update(users)
    .set({
      balanceUsd: newBalance.toString(),
      investedUsd: newInvested.toString(),
      totalRewardsUsd: newRewards.toString(),
      updatedAt: new Date().toISOString()
    })
    .where(eq(users.id, userId));
}

export async function createTransaction(tx: {
  userId: number;
  type: string;
  amountUsd: number;
  balanceBefore?: number;
  balanceAfter?: number;
  description?: string;
  metadata?: Record<string, unknown>;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date().toISOString();
  const result = await db.insert(transactions).values({
    ...tx,
    amountUsd: tx.amountUsd.toString(),
    balanceBefore: tx.balanceBefore?.toString(),
    balanceAfter: tx.balanceAfter?.toString(),
    createdAt: now
  });
  
  return result.lastInsertRowid as number;
}

export async function getUserTransactions(
  userId: number,
  limit: number = 50
): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.createdAt))
    .limit(limit);
}

export async function getAllStrategies(): Promise<Strategy[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(strategies);
}
