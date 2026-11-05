CREATE TABLE `gallery_images` (
	`id` varchar(32) NOT NULL,
	`community_id` varchar(32),
	`image_path` varchar(500) NOT NULL,
	`caption` text NOT NULL,
	`category` varchar(32) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	`is_published` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gallery_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `news` (
	`id` varchar(32) NOT NULL,
	`community_id` varchar(32),
	`title` varchar(255) NOT NULL,
	`summary` text NOT NULL,
	`body` text NOT NULL,
	`category` varchar(64) NOT NULL,
	`cover_path` varchar(500),
	`published_at` datetime,
	`is_published` boolean NOT NULL DEFAULT false,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `news_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `communities` ADD `english_name` varchar(120);--> statement-breakpoint
ALTER TABLE `communities` ADD `tagline` varchar(255);--> statement-breakpoint
ALTER TABLE `communities` ADD `tags` varchar(255);--> statement-breakpoint
ALTER TABLE `communities` ADD `theme` varchar(32) DEFAULT 'default' NOT NULL;--> statement-breakpoint
ALTER TABLE `gallery_images` ADD CONSTRAINT `gallery_images_community_id_communities_id_fk` FOREIGN KEY (`community_id`) REFERENCES `communities`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `news` ADD CONSTRAINT `news_community_id_communities_id_fk` FOREIGN KEY (`community_id`) REFERENCES `communities`(`id`) ON DELETE set null ON UPDATE no action;