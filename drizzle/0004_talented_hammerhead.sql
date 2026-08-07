CREATE TABLE `password_reset_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` varchar(255) NOT NULL,
	`expiresAt` timestamp NULL DEFAULT NULL,
	`usedAt` timestamp NULL DEFAULT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `password_reset_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `password_reset_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE INDEX `user_idx` ON `password_reset_tokens` (`userId`);--> statement-breakpoint
CREATE INDEX `token_idx` ON `password_reset_tokens` (`token`);--> statement-breakpoint
CREATE INDEX `expires_at_idx` ON `password_reset_tokens` (`expiresAt`);