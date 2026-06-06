CREATE TABLE `collect_checkpoints` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source_code` text NOT NULL,
	`scope_key` text NOT NULL,
	`cursor` text,
	`last_success_at` integer,
	`state` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `data_sources` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`base_url` text,
	`license_status` text DEFAULT 'unconfirmed' NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `data_sources_code_unique` ON `data_sources` (`code`);--> statement-breakpoint
CREATE TABLE `evergreens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `evergreens_slug_unique` ON `evergreens` (`slug`);--> statement-breakpoint
CREATE TABLE `fillers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `fillers_slug_unique` ON `fillers` (`slug`);--> statement-breakpoint
CREATE TABLE `hubs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`category` text,
	`region_code` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `hubs_slug_unique` ON `hubs` (`slug`);--> statement-breakpoint
CREATE TABLE `item_codes` (
	`item_code` text PRIMARY KEY NOT NULL,
	`item_name` text NOT NULL,
	`kind_code` text NOT NULL,
	`kind_name` text NOT NULL,
	`category` text NOT NULL,
	`source_id` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`source_id`) REFERENCES `data_sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `item_meta` (
	`item_code` text PRIMARY KEY NOT NULL,
	`unit` text NOT NULL,
	`unit_type` text DEFAULT 'unknown' NOT NULL,
	`weight_g` real,
	`is_discount_capable` integer DEFAULT false NOT NULL,
	`category` text NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`item_code`) REFERENCES `item_codes`(`item_code`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `pages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`item_code` text,
	`hub_id` integer,
	`title` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`quality_score` real,
	`gate_passed` integer DEFAULT false NOT NULL,
	`active_sections` text NOT NULL,
	`unique_points` text NOT NULL,
	`first_published_at` integer,
	`raw_data` text,
	`ai_commentary` text,
	`faq` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`item_code`) REFERENCES `item_codes`(`item_code`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`hub_id`) REFERENCES `hubs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pages_slug_unique` ON `pages` (`slug`);--> statement-breakpoint
CREATE TABLE `price_daily` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`item_code` text NOT NULL,
	`kind_code` text NOT NULL,
	`rank` text DEFAULT 'unknown' NOT NULL,
	`wsrt` text NOT NULL,
	`region_code` text,
	`price` integer,
	`price_per_kg` real,
	`is_discount` integer DEFAULT false NOT NULL,
	`prev_day` integer,
	`m1_ma5` real,
	`y1_ma5` real,
	`normal_3yr` real,
	`raw_payload` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`item_code`) REFERENCES `item_codes`(`item_code`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `price_daily_item_date_idx` ON `price_daily` (`item_code`,`date`);--> statement-breakpoint
CREATE UNIQUE INDEX `price_daily_unique_observation` ON `price_daily` (`date`,`item_code`,`kind_code`,`rank`,`wsrt`,`region_code`);--> statement-breakpoint
CREATE TABLE `price_monthly` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`month` text NOT NULL,
	`item_code` text NOT NULL,
	`kind_code` text NOT NULL,
	`rank` text DEFAULT 'unknown' NOT NULL,
	`wsrt` text NOT NULL,
	`region_code` text,
	`price` integer,
	`raw_payload` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`item_code`) REFERENCES `item_codes`(`item_code`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `price_yearly` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`year` text NOT NULL,
	`item_code` text NOT NULL,
	`kind_code` text NOT NULL,
	`rank` text DEFAULT 'unknown' NOT NULL,
	`wsrt` text NOT NULL,
	`region_code` text,
	`price` integer,
	`raw_payload` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`item_code`) REFERENCES `item_codes`(`item_code`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `publish_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`page_id` integer NOT NULL,
	`from_status` text NOT NULL,
	`to_status` text NOT NULL,
	`reason` text NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`page_id`) REFERENCES `pages`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `season_calendar` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event` text NOT NULL,
	`lead_weeks` integer NOT NULL,
	`target_items` text NOT NULL,
	`target_hubs` text NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `substitutes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`item_code` text NOT NULL,
	`sub_item_code` text NOT NULL,
	`relation` text NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`item_code`) REFERENCES `item_codes`(`item_code`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sub_item_code`) REFERENCES `item_codes`(`item_code`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `substitutes_unique_pair` ON `substitutes` (`item_code`,`sub_item_code`);