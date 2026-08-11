CREATE TABLE `group_message_reactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageId` int NOT NULL,
	`groupId` int NOT NULL,
	`userId` int NOT NULL DEFAULT 0,
	`participantKey` varchar(128) NOT NULL,
	`emoji` varchar(32) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `group_message_reactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_user_reaction` UNIQUE(`messageId`,`participantKey`,`emoji`)
);
--> statement-breakpoint
ALTER TABLE `group_messages` MODIFY COLUMN `messageType` enum('text','image','video','file','audio','system') DEFAULT 'text';--> statement-breakpoint
ALTER TABLE `groups` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `groups` ADD `isPrivate` boolean DEFAULT false;--> statement-breakpoint
CREATE INDEX `message_idx` ON `group_message_reactions` (`messageId`);--> statement-breakpoint
CREATE INDEX `group_idx` ON `group_message_reactions` (`groupId`);