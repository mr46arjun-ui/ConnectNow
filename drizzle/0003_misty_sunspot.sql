CREATE TABLE `message_reactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageId` int NOT NULL,
	`userId` int NOT NULL,
	`emoji` varchar(10) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `message_reactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_reaction` UNIQUE(`messageId`,`userId`,`emoji`)
);
--> statement-breakpoint
CREATE INDEX `message_idx` ON `message_reactions` (`messageId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `message_reactions` (`userId`);--> statement-breakpoint
CREATE INDEX `emoji_idx` ON `message_reactions` (`emoji`);