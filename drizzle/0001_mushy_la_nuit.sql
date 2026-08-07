CREATE TABLE `analytics_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`eventType` varchar(64) NOT NULL,
	`eventData` text,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `analytics_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `blocked_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`blockerId` int NOT NULL,
	`blockedId` int NOT NULL,
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `blocked_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_block` UNIQUE(`blockerId`,`blockedId`)
);
--> statement-breakpoint
CREATE TABLE `chat_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user1Id` int NOT NULL,
	`user2Id` int NOT NULL,
	`sessionType` enum('text','voice','video') NOT NULL,
	`status` enum('active','ended') NOT NULL DEFAULT 'active',
	`startedAt` timestamp NULL DEFAULT NULL,
	`endedAt` timestamp NULL DEFAULT NULL,
	`duration` int,
	`messageCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `chat_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_flags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageId` int NOT NULL,
	`flagReason` varchar(255) NOT NULL,
	`aiConfidence` decimal(3,2),
	`flaggedAt` timestamp NULL DEFAULT NULL,
	`isHumanReviewed` boolean DEFAULT false,
	`humanVerdict` enum('approved','rejected','pending') DEFAULT 'pending',
	`moderatorId` int,
	`reviewedAt` timestamp NULL DEFAULT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `content_flags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `friend_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`senderId` int NOT NULL,
	`receiverId` int NOT NULL,
	`status` enum('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NULL DEFAULT NULL,
	CONSTRAINT `friend_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_request` UNIQUE(`senderId`,`receiverId`)
);
--> statement-breakpoint
CREATE TABLE `friends` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId1` int NOT NULL,
	`userId2` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `friends_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_friendship` UNIQUE(`userId1`,`userId2`)
);
--> statement-breakpoint
CREATE TABLE `matching_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`genderFilter` varchar(64),
	`countryFilter` text,
	`languageFilter` text,
	`ageMin` int DEFAULT 18,
	`ageMax` int DEFAULT 65,
	`interestTags` text,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NULL DEFAULT NULL,
	CONSTRAINT `matching_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `matching_preferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`senderId` int NOT NULL,
	`receiverId` int NOT NULL,
	`content` text NOT NULL,
	`isRead` boolean DEFAULT false,
	`readAt` timestamp NULL DEFAULT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NULL DEFAULT NULL,
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `moderation_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`moderatorId` int NOT NULL,
	`action` varchar(64) NOT NULL,
	`targetUserId` int,
	`targetReportId` int,
	`reason` text,
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `moderation_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('friend_request','message','system','report_update') NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text,
	`relatedUserId` int,
	`relatedItemId` int,
	`isRead` boolean DEFAULT false,
	`readAt` timestamp NULL DEFAULT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `online_status` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`status` enum('online','away','offline') NOT NULL DEFAULT 'offline',
	`lastSeen` timestamp NULL DEFAULT NULL,
	`currentSessionId` int,
	`updatedAt` timestamp NULL DEFAULT NULL,
	CONSTRAINT `online_status_id` PRIMARY KEY(`id`),
	CONSTRAINT `online_status_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `private_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`senderId` int NOT NULL,
	`receiverId` int NOT NULL,
	`content` text NOT NULL,
	`isRead` boolean DEFAULT false,
	`readAt` timestamp NULL DEFAULT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NULL DEFAULT NULL,
	CONSTRAINT `private_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reporterId` int NOT NULL,
	`reportedUserId` int NOT NULL,
	`sessionId` int,
	`reason` varchar(255) NOT NULL,
	`description` text,
	`status` enum('pending','reviewing','resolved','dismissed') NOT NULL DEFAULT 'pending',
	`action` enum('none','warning','suspend','ban') DEFAULT 'none',
	`moderatorId` int,
	`moderationNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NULL DEFAULT NULL,
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_interests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`interest` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `user_interests_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_interest` UNIQUE(`userId`,`interest`)
);
--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`interests` text,
	`languages` text,
	`verificationBadge` boolean DEFAULT false,
	`verificationDate` timestamp NULL DEFAULT NULL,
	`profileCompleteness` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NULL DEFAULT NULL,
	CONSTRAINT `user_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','moderator') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `username` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `users` ADD `avatar` varchar(512);--> statement-breakpoint
ALTER TABLE `users` ADD `country` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `age` int;--> statement-breakpoint
ALTER TABLE `users` ADD `isVerified` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `isSuspended` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `isBanned` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_username_unique` UNIQUE(`username`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `analytics_events` (`userId`);--> statement-breakpoint
CREATE INDEX `event_type_idx` ON `analytics_events` (`eventType`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `analytics_events` (`createdAt`);--> statement-breakpoint
CREATE INDEX `blocker_idx` ON `blocked_users` (`blockerId`);--> statement-breakpoint
CREATE INDEX `blocked_idx` ON `blocked_users` (`blockedId`);--> statement-breakpoint
CREATE INDEX `user1_idx` ON `chat_sessions` (`user1Id`);--> statement-breakpoint
CREATE INDEX `user2_idx` ON `chat_sessions` (`user2Id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `chat_sessions` (`status`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `chat_sessions` (`sessionType`);--> statement-breakpoint
CREATE INDEX `message_idx` ON `content_flags` (`messageId`);--> statement-breakpoint
CREATE INDEX `moderator_idx` ON `content_flags` (`moderatorId`);--> statement-breakpoint
CREATE INDEX `flag_reason_idx` ON `content_flags` (`flagReason`);--> statement-breakpoint
CREATE INDEX `sender_idx` ON `friend_requests` (`senderId`);--> statement-breakpoint
CREATE INDEX `receiver_idx` ON `friend_requests` (`receiverId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `friend_requests` (`status`);--> statement-breakpoint
CREATE INDEX `user1_idx` ON `friends` (`userId1`);--> statement-breakpoint
CREATE INDEX `user2_idx` ON `friends` (`userId2`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `matching_preferences` (`userId`);--> statement-breakpoint
CREATE INDEX `session_idx` ON `messages` (`sessionId`);--> statement-breakpoint
CREATE INDEX `sender_idx` ON `messages` (`senderId`);--> statement-breakpoint
CREATE INDEX `receiver_idx` ON `messages` (`receiverId`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `messages` (`createdAt`);--> statement-breakpoint
CREATE INDEX `moderator_idx` ON `moderation_logs` (`moderatorId`);--> statement-breakpoint
CREATE INDEX `target_user_idx` ON `moderation_logs` (`targetUserId`);--> statement-breakpoint
CREATE INDEX `action_idx` ON `moderation_logs` (`action`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `notifications` (`userId`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `notifications` (`type`);--> statement-breakpoint
CREATE INDEX `is_read_idx` ON `notifications` (`isRead`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `online_status` (`userId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `online_status` (`status`);--> statement-breakpoint
CREATE INDEX `sender_idx` ON `private_messages` (`senderId`);--> statement-breakpoint
CREATE INDEX `receiver_idx` ON `private_messages` (`receiverId`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `private_messages` (`createdAt`);--> statement-breakpoint
CREATE INDEX `reporter_idx` ON `reports` (`reporterId`);--> statement-breakpoint
CREATE INDEX `reported_idx` ON `reports` (`reportedUserId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `reports` (`status`);--> statement-breakpoint
CREATE INDEX `moderator_idx` ON `reports` (`moderatorId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `user_interests` (`userId`);--> statement-breakpoint
CREATE INDEX `interest_idx` ON `user_interests` (`interest`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `user_profiles` (`userId`);--> statement-breakpoint
CREATE INDEX `email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `username_idx` ON `users` (`username`);--> statement-breakpoint
CREATE INDEX `role_idx` ON `users` (`role`);--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `loginMethod`;