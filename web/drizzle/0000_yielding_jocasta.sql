CREATE TABLE `admins` (
	`id` varchar(32) NOT NULL,
	`username` varchar(64) NOT NULL,
	`display_name` varchar(120) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`last_login_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `admins_id` PRIMARY KEY(`id`),
	CONSTRAINT `admins_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`admin_id` varchar(32),
	`action` varchar(32) NOT NULL,
	`entity` varchar(32) NOT NULL,
	`entity_id` varchar(64),
	`detail` json,
	`ip` varchar(45),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `collections` (
	`id` varchar(32) NOT NULL,
	`community_id` varchar(32) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`image_path` varchar(500),
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `collections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `communities` (
	`id` varchar(32) NOT NULL,
	`slug` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`short_name` varchar(120) NOT NULL,
	`location` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`lat` decimal(9,6) NOT NULL,
	`lng` decimal(9,6) NOT NULL,
	`color` varchar(7) NOT NULL,
	`cover_path` varchar(500),
	`sort_order` int NOT NULL DEFAULT 0,
	`is_published` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `communities_id` PRIMARY KEY(`id`),
	CONSTRAINT `communities_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `items` (
	`id` varchar(32) NOT NULL,
	`collection_id` varchar(32) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`model_path` varchar(500),
	`usdz_path` varchar(500),
	`thumbnail_path` varchar(500),
	`audio_path` varchar(500),
	`is_featured` boolean NOT NULL DEFAULT false,
	`sort_order` int NOT NULL DEFAULT 0,
	`is_published` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `login_attempts` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`username` varchar(64) NOT NULL,
	`ip` varchar(45) NOT NULL,
	`success` boolean NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `login_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` char(64) NOT NULL,
	`admin_id` varchar(32) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`ip` varchar(45) NOT NULL,
	`user_agent` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_admin_id_admins_id_fk` FOREIGN KEY (`admin_id`) REFERENCES `admins`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `collections` ADD CONSTRAINT `collections_community_id_communities_id_fk` FOREIGN KEY (`community_id`) REFERENCES `communities`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `items` ADD CONSTRAINT `items_collection_id_collections_id_fk` FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_admin_id_admins_id_fk` FOREIGN KEY (`admin_id`) REFERENCES `admins`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `audit_logs_admin_id_idx` ON `audit_logs` (`admin_id`);--> statement-breakpoint
CREATE INDEX `collections_community_id_idx` ON `collections` (`community_id`);--> statement-breakpoint
CREATE INDEX `items_collection_id_idx` ON `items` (`collection_id`);--> statement-breakpoint
CREATE INDEX `items_is_featured_idx` ON `items` (`is_featured`);--> statement-breakpoint
CREATE INDEX `login_attempts_username_created_at_idx` ON `login_attempts` (`username`,`created_at`);--> statement-breakpoint
CREATE INDEX `login_attempts_ip_created_at_idx` ON `login_attempts` (`ip`,`created_at`);--> statement-breakpoint
CREATE INDEX `sessions_admin_id_idx` ON `sessions` (`admin_id`);