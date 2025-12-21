CREATE TABLE `activity_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`strategyId` int,
	`type` enum('bridge','swap','add_liquidity','remove_liquidity','deposit','withdraw','strategy_execution','approval') NOT NULL,
	`status` enum('pending','confirmed','failed') NOT NULL DEFAULT 'pending',
	`chain` enum('crypto_com','cronos') NOT NULL,
	`txHash` varchar(66),
	`fromToken` varchar(32),
	`toToken` varchar(32),
	`fromAmount` decimal(36,18),
	`toAmount` decimal(36,18),
	`valueUsd` decimal(20,8),
	`gasUsed` bigint,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `positions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`chain` enum('crypto_com','cronos') NOT NULL,
	`tokenSymbol` varchar(32) NOT NULL,
	`tokenAddress` varchar(42),
	`balance` decimal(36,18) NOT NULL,
	`valueUsd` decimal(20,8),
	`isLpToken` int DEFAULT 0,
	`lpPoolAddress` varchar(42),
	`lpToken0` varchar(32),
	`lpToken1` varchar(32),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `positions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `strategies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`type` enum('arbitrage','liquidity_provision','yield_farming','rebalancing') NOT NULL,
	`status` enum('active','paused','stopped') NOT NULL DEFAULT 'paused',
	`parameters` json,
	`allocatedTokens` json,
	`estimatedApy` decimal(10,4),
	`totalDeposited` decimal(20,8) DEFAULT '0',
	`totalProfit` decimal(20,8) DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `strategies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `evmAddress` varchar(42);--> statement-breakpoint
ALTER TABLE `users` ADD `cronosAddress` varchar(42);