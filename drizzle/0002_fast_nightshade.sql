CREATE TABLE `group_call_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupCallId` int NOT NULL,
	`userId` int NOT NULL,
	`joinedAt` timestamp NULL DEFAULT NULL,
	`leftAt` timestamp NULL DEFAULT NULL,
	`duration` int,
	CONSTRAINT `group_call_participants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `group_calls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`initiatorId` int NOT NULL,
	`callType` enum('audio','video') NOT NULL,
	`startedAt` timestamp NULL DEFAULT NULL,
	`endedAt` timestamp NULL DEFAULT NULL,
	`duration` int,
	`participantCount` int DEFAULT 1,
	`maxParticipants` int DEFAULT 100,
	CONSTRAINT `group_calls_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `group_invites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`invitedUserId` int NOT NULL,
	`invitedBy` int NOT NULL,
	`status` enum('pending','accepted','rejected','expired') DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`respondedAt` timestamp NULL DEFAULT NULL,
	CONSTRAINT `group_invites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `group_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('admin','moderator','member') NOT NULL DEFAULT 'member',
	`joinedAt` timestamp NULL DEFAULT NULL,
	`lastReadMessageId` int,
	CONSTRAINT `group_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_member` UNIQUE(`groupId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `group_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`senderId` int NOT NULL,
	`content` text NOT NULL,
	`mentions` text,
	`messageType` enum('text','image','video','file','system') DEFAULT 'text',
	`mediaUrl` varchar(512),
	`isEdited` boolean DEFAULT false,
	`editedAt` timestamp NULL DEFAULT NULL,
	`isDeleted` boolean DEFAULT false,
	`deletedAt` timestamp NULL DEFAULT NULL,
	`timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `group_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`avatar` varchar(512),
	`createdBy` int NOT NULL,
	`memberCount` int DEFAULT 1,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NULL DEFAULT NULL,
	CONSTRAINT `groups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `call_idx` ON `group_call_participants` (`groupCallId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `group_call_participants` (`userId`);--> statement-breakpoint
CREATE INDEX `group_idx` ON `group_calls` (`groupId`);--> statement-breakpoint
CREATE INDEX `initiator_idx` ON `group_calls` (`initiatorId`);--> statement-breakpoint
CREATE INDEX `started_at_idx` ON `group_calls` (`startedAt`);--> statement-breakpoint
CREATE INDEX `group_idx` ON `group_invites` (`groupId`);--> statement-breakpoint
CREATE INDEX `invited_user_idx` ON `group_invites` (`invitedUserId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `group_invites` (`status`);--> statement-breakpoint
CREATE INDEX `group_idx` ON `group_members` (`groupId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `group_members` (`userId`);--> statement-breakpoint
CREATE INDEX `group_idx` ON `group_messages` (`groupId`);--> statement-breakpoint
CREATE INDEX `sender_idx` ON `group_messages` (`senderId`);--> statement-breakpoint
CREATE INDEX `timestamp_idx` ON `group_messages` (`timestamp`);--> statement-breakpoint
CREATE INDEX `created_by_idx` ON `groups` (`createdBy`);--> statement-breakpoint
CREATE INDEX `is_active_idx` ON `groups` (`isActive`);