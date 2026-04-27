PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_personal_records` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`weight_kg` real NOT NULL,
	`reps` integer NOT NULL,
	`estimated_1rm` real NOT NULL,
	`session_id` text NOT NULL,
	`date` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_personal_records`("id", "user_id", "exercise_id", "weight_kg", "reps", "estimated_1rm", "session_id", "date") SELECT "id", "user_id", "exercise_id", "weight_kg", "reps", "estimated_1rm", "session_id", "date" FROM `personal_records`;--> statement-breakpoint
DROP TABLE `personal_records`;--> statement-breakpoint
ALTER TABLE `__new_personal_records` RENAME TO `personal_records`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_plan_days` (
	`id` text PRIMARY KEY NOT NULL,
	`plan_id` text NOT NULL,
	`day_of_week` integer NOT NULL,
	`workout_id` text,
	FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workout_id`) REFERENCES `workouts`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_plan_days`("id", "plan_id", "day_of_week", "workout_id") SELECT "id", "plan_id", "day_of_week", "workout_id" FROM `plan_days`;--> statement-breakpoint
DROP TABLE `plan_days`;--> statement-breakpoint
ALTER TABLE `__new_plan_days` RENAME TO `plan_days`;--> statement-breakpoint
CREATE TABLE `__new_session_sets` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`set_number` integer NOT NULL,
	`weight_kg` real NOT NULL,
	`reps` integer NOT NULL,
	`duration_seconds` integer,
	`distance_km` real,
	`rpe` real,
	`completed` integer DEFAULT false NOT NULL,
	`is_pr` integer DEFAULT false NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_session_sets`("id", "session_id", "exercise_id", "set_number", "weight_kg", "reps", "duration_seconds", "distance_km", "rpe", "completed", "is_pr", "completed_at") SELECT "id", "session_id", "exercise_id", "set_number", "weight_kg", "reps", "duration_seconds", "distance_km", "rpe", "completed", "is_pr", "completed_at" FROM `session_sets`;--> statement-breakpoint
DROP TABLE `session_sets`;--> statement-breakpoint
ALTER TABLE `__new_session_sets` RENAME TO `session_sets`;--> statement-breakpoint
CREATE TABLE `__new_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`workout_id` text NOT NULL,
	`plan_id` text,
	`started_at` integer NOT NULL,
	`finished_at` integer,
	`duration_seconds` integer,
	`total_volume_kg` real,
	`notes` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workout_id`) REFERENCES `workouts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_sessions`("id", "user_id", "workout_id", "plan_id", "started_at", "finished_at", "duration_seconds", "total_volume_kg", "notes") SELECT "id", "user_id", "workout_id", "plan_id", "started_at", "finished_at", "duration_seconds", "total_volume_kg", "notes" FROM `sessions`;--> statement-breakpoint
DROP TABLE `sessions`;--> statement-breakpoint
ALTER TABLE `__new_sessions` RENAME TO `sessions`;--> statement-breakpoint
CREATE TABLE `__new_workout_exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`workout_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`order_index` integer NOT NULL,
	`sets_target` integer NOT NULL,
	`reps_min` integer NOT NULL,
	`reps_max` integer NOT NULL,
	`rest_seconds` integer NOT NULL,
	`weight_target_kg` real,
	`duration_seconds_target` integer,
	`distance_km_target` real,
	`notes` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`workout_id`) REFERENCES `workouts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_workout_exercises`("id", "workout_id", "exercise_id", "order_index", "sets_target", "reps_min", "reps_max", "rest_seconds", "weight_target_kg", "duration_seconds_target", "distance_km_target", "notes") SELECT "id", "workout_id", "exercise_id", "order_index", "sets_target", "reps_min", "reps_max", "rest_seconds", "weight_target_kg", "duration_seconds_target", "distance_km_target", "notes" FROM `workout_exercises`;--> statement-breakpoint
DROP TABLE `workout_exercises`;--> statement-breakpoint
ALTER TABLE `__new_workout_exercises` RENAME TO `workout_exercises`;