CREATE TABLE `gate_decisions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`check_id` text NOT NULL,
	`label` text NOT NULL,
	`status` text NOT NULL,
	`decision` text NOT NULL,
	`measured_value` text,
	`source_run_id` integer,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`source_run_id`) REFERENCES `gate_runs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `gate_decisions_check_id_unique` ON `gate_decisions` (`check_id`);--> statement-breakpoint
CREATE INDEX `gate_decisions_status_idx` ON `gate_decisions` (`status`);--> statement-breakpoint
CREATE TABLE `gate_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source` text NOT NULL,
	`status` text NOT NULL,
	`raw_report` text NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `gate_runs_created_at_idx` ON `gate_runs` (`created_at`);