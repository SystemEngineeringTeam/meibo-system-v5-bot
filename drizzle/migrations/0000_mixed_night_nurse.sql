CREATE TABLE `slack_users` (
	`id` text PRIMARY KEY NOT NULL,
	`slack_user_id` text NOT NULL,
	`joined_at` integer NOT NULL,
	`left_at` integer
);
