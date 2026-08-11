ALTER TABLE `private_messages` ADD `isDeleted` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `private_messages` ADD `isEdited` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `private_messages` ADD `editedAt` timestamp NULL DEFAULT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerified` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `lastSeenAt` timestamp NULL DEFAULT NULL;