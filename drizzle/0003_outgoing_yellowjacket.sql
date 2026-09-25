CREATE TABLE `media_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`path` text NOT NULL,
	`size` integer NOT NULL,
	`is_public` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `articles` ADD `media_json` text;--> statement-breakpoint
ALTER TABLE `articles` ADD `job_json` text;