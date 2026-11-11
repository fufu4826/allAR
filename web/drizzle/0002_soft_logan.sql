CREATE TABLE `page_stats` (
	`day` date NOT NULL,
	`event` varchar(8) NOT NULL,
	`slug` varchar(64) NOT NULL,
	`item_id` varchar(32) NOT NULL DEFAULT '',
	`count` int NOT NULL DEFAULT 0,
	CONSTRAINT `page_stats_day_event_slug_item_id_pk` PRIMARY KEY(`day`,`event`,`slug`,`item_id`)
);
--> statement-breakpoint
CREATE INDEX `page_stats_slug_item_idx` ON `page_stats` (`slug`,`item_id`);