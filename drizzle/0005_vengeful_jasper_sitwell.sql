CREATE TABLE `media_uploads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uploadedBy` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileType` varchar(50) NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`fileSize` int NOT NULL,
	`s3Key` varchar(512) NOT NULL,
	`s3Url` varchar(512) NOT NULL,
	`messageId` int,
	`groupMessageId` int,
	`thumbnail` varchar(512),
	`duration` int,
	`width` int,
	`height` int,
	`isDeleted` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NULL DEFAULT NULL,
	CONSTRAINT `media_uploads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `uploaded_by_idx` ON `media_uploads` (`uploadedBy`);--> statement-breakpoint
CREATE INDEX `message_idx` ON `media_uploads` (`messageId`);--> statement-breakpoint
CREATE INDEX `group_message_idx` ON `media_uploads` (`groupMessageId`);--> statement-breakpoint
CREATE INDEX `s3_key_idx` ON `media_uploads` (`s3Key`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `media_uploads` (`createdAt`);