CREATE TABLE `ai_usage` (
	`user_id` text NOT NULL,
	`day` text NOT NULL,
	`count` integer NOT NULL,
	PRIMARY KEY(`user_id`, `day`)
);
--> statement-breakpoint
CREATE TABLE `blocks` (
	`source` text NOT NULL,
	`target` text NOT NULL,
	PRIMARY KEY(`source`, `target`)
);
--> statement-breakpoint
CREATE TABLE `likes` (
	`source` text NOT NULL,
	`target` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`source`, `target`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`sender` text NOT NULL,
	`recipient` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`nickname` text NOT NULL,
	`age` integer NOT NULL,
	`purpose` text NOT NULL,
	`tags` text NOT NULL,
	`axes` text NOT NULL,
	`photo_key` text,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text NOT NULL,
	`target` text NOT NULL,
	`reason` text NOT NULL,
	`created_at` integer NOT NULL
);
