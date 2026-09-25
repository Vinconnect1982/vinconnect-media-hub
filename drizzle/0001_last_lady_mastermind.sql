CREATE TABLE `hub_secrets` (
	`id` text PRIMARY KEY NOT NULL,
	`ciphertext` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `social_publications` (
	`id` text PRIMARY KEY NOT NULL,
	`article_id` text NOT NULL,
	`channel` text NOT NULL,
	`status` text NOT NULL,
	`receipt` text,
	`updated_at` text NOT NULL
);
