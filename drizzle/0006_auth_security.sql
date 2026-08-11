-- Migration 0006: security & auth additions
-- Adds passwordHash/emailVerified/isDeleted/isEdited fields required for the
-- argon2id-based auth flow, the soft-delete semantics for private messages, and
-- lastSeenAt for the new presence broadcast used by the messaging hub.

--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `emailVerified` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `lastSeenAt` timestamp NULL DEFAULT NULL;--> statement-breakpoint
ALTER TABLE `private_messages` ADD COLUMN `isDeleted` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `private_messages` ADD COLUMN `isEdited` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `private_messages` ADD COLUMN `editedAt` timestamp NULL DEFAULT NULL;
