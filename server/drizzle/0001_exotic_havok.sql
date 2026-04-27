ALTER TABLE `exercises` ADD `kind` text DEFAULT 'strength' NOT NULL;--> statement-breakpoint
ALTER TABLE `session_sets` ADD `duration_seconds` integer;--> statement-breakpoint
ALTER TABLE `session_sets` ADD `distance_km` real;--> statement-breakpoint
ALTER TABLE `workout_exercises` ADD `duration_seconds_target` integer;--> statement-breakpoint
ALTER TABLE `workout_exercises` ADD `distance_km_target` real;