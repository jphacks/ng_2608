CREATE TABLE `account_details` (
	`user_id` text PRIMARY KEY NOT NULL,
	`real_name` text NOT NULL,
	`income_range` text DEFAULT '' NOT NULL,
	`income_public` integer DEFAULT 0 NOT NULL,
	`ai_assist` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE `profiles` ADD `region` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `profiles` ADD `occupation` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `profiles` ADD `income_range` text DEFAULT '' NOT NULL;