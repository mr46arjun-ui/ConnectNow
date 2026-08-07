ALTER TABLE `group_members` MODIFY COLUMN `role` enum('admin','co_admin','moderator','member') NOT NULL DEFAULT 'member';
--> statement-breakpoint
CREATE TABLE `group_bans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`userId` int NOT NULL,
	`bannedBy` int NOT NULL,
	`banType` enum('temporary','permanent') NOT NULL,
	`reason` text,
	`expiresAt` timestamp NULL DEFAULT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `group_bans_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_group_ban` UNIQUE(`groupId`,`userId`)
);
--> statement-breakpoint
CREATE INDEX `group_bans_group_idx` ON `group_bans` (`groupId`);
--> statement-breakpoint
CREATE INDEX `group_bans_user_idx` ON `group_bans` (`userId`);
--> statement-breakpoint
CREATE INDEX `group_bans_expires_at_idx` ON `group_bans` (`expiresAt`);
