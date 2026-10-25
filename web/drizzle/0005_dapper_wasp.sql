CREATE TABLE `friend_invites` (
	`token` text PRIMARY KEY NOT NULL,
	`creator` text NOT NULL,
	`recipient` text,
	`expires_at` integer NOT NULL
);
