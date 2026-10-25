ALTER TABLE `account_details` ADD `ai_diagnosed_at` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `account_details` ADD `ai_diagnosis` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE `account_details` ADD `ai_confirmed` integer DEFAULT 0 NOT NULL;