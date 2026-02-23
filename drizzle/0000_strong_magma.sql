CREATE TABLE `activity_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`strategyId` integer,
	`type` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`chain` text NOT NULL,
	`txHash` text,
	`fromToken` text,
	`toToken` text,
	`fromAmount` text,
	`toAmount` text,
	`valueUsd` text,
	`gasUsed` integer,
	`metadata` text,
	`createdAt` text
);
--> statement-breakpoint
CREATE TABLE `positions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`chain` text NOT NULL,
	`tokenSymbol` text NOT NULL,
	`tokenAddress` text,
	`balance` text NOT NULL,
	`valueUsd` text,
	`isLpToken` integer DEFAULT 0,
	`lpPoolAddress` text,
	`lpToken0` text,
	`lpToken1` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `strategies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'paused' NOT NULL,
	`parameters` text,
	`allocatedTokens` text,
	`estimatedApy` text,
	`totalDeposited` text DEFAULT '0',
	`totalProfit` text DEFAULT '0',
	`createdAt` text,
	`updatedAt` text
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`type` text NOT NULL,
	`amountUsd` text NOT NULL,
	`balanceBefore` text,
	`balanceAfter` text,
	`description` text,
	`metadata` text,
	`createdAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`openId` text NOT NULL,
	`name` text,
	`email` text,
	`loginMethod` text,
	`role` text DEFAULT 'user' NOT NULL,
	`evmAddress` text,
	`cronosAddress` text,
	`balanceUsd` text DEFAULT '10000',
	`investedUsd` text DEFAULT '0',
	`totalRewardsUsd` text DEFAULT '0',
	`createdAt` text,
	`updatedAt` text,
	`lastSignedIn` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_openId_unique` ON `users` (`openId`);