import { bigint, boolean, char, datetime, decimal, index, int, json, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

const timestamps = () => ({
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export const communities = mysqlTable("communities", {
  id: varchar("id", { length: 32 }).primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  shortName: varchar("short_name", { length: 120 }).notNull(),
  englishName: varchar("english_name", { length: 120 }),
  tagline: varchar("tagline", { length: 255 }),
  tags: varchar("tags", { length: 255 }),
  theme: varchar("theme", { length: 32 }).notNull().default("default"),
  location: varchar("location", { length: 255 }).notNull(),
  description: text("description").notNull(),
  lat: decimal("lat", { precision: 9, scale: 6 }).notNull(),
  lng: decimal("lng", { precision: 9, scale: 6 }).notNull(),
  color: varchar("color", { length: 7 }).notNull(),
  coverPath: varchar("cover_path", { length: 500 }),
  sortOrder: int("sort_order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(false),
  ...timestamps(),
});

export const news = mysqlTable("news", {
  id: varchar("id", { length: 32 }).primaryKey(),
  communityId: varchar("community_id", { length: 32 }).references(() => communities.id, { onDelete: "set null" }),
  title: varchar("title", { length: 255 }).notNull(),
  summary: text("summary").notNull(),
  body: text("body").notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  coverPath: varchar("cover_path", { length: 500 }),
  publishedAt: datetime("published_at"),
  isPublished: boolean("is_published").notNull().default(false),
  sortOrder: int("sort_order").notNull().default(0),
  ...timestamps(),
});

export const galleryImages = mysqlTable("gallery_images", {
  id: varchar("id", { length: 32 }).primaryKey(),
  communityId: varchar("community_id", { length: 32 }).references(() => communities.id, { onDelete: "set null" }),
  imagePath: varchar("image_path", { length: 500 }).notNull(),
  caption: text("caption").notNull(),
  category: varchar("category", { length: 32 }).notNull(),
  sortOrder: int("sort_order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const collections = mysqlTable("collections", {
  id: varchar("id", { length: 32 }).primaryKey(),
  communityId: varchar("community_id", { length: 32 }).notNull().references(() => communities.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  imagePath: varchar("image_path", { length: 500 }),
  sortOrder: int("sort_order").notNull().default(0),
  ...timestamps(),
}, (table) => [index("collections_community_id_idx").on(table.communityId)]);

export const items = mysqlTable("items", {
  id: varchar("id", { length: 32 }).primaryKey(),
  collectionId: varchar("collection_id", { length: 32 }).notNull().references(() => collections.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  modelPath: varchar("model_path", { length: 500 }),
  usdzPath: varchar("usdz_path", { length: 500 }),
  thumbnailPath: varchar("thumbnail_path", { length: 500 }),
  audioPath: varchar("audio_path", { length: 500 }),
  isFeatured: boolean("is_featured").notNull().default(false),
  sortOrder: int("sort_order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(true),
  ...timestamps(),
}, (table) => [index("items_collection_id_idx").on(table.collectionId), index("items_is_featured_idx").on(table.isFeatured)]);

export const admins = mysqlTable("admins", {
  id: varchar("id", { length: 32 }).primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  displayName: varchar("display_name", { length: 120 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at"),
  ...timestamps(),
});

export const sessions = mysqlTable("sessions", {
  id: char("id", { length: 64 }).primaryKey(), // SHA-256 token hash, never the raw token.
  adminId: varchar("admin_id", { length: 32 }).notNull().references(() => admins.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  ip: varchar("ip", { length: 45 }).notNull(),
  userAgent: varchar("user_agent", { length: 255 }).notNull(),
  ...timestamps(),
}, (table) => [index("sessions_admin_id_idx").on(table.adminId)]);

export const loginAttempts = mysqlTable("login_attempts", {
  id: bigint("id", { mode: "bigint" }).autoincrement().primaryKey(),
  username: varchar("username", { length: 64 }).notNull(),
  ip: varchar("ip", { length: 45 }).notNull(),
  success: boolean("success").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [index("login_attempts_username_created_at_idx").on(table.username, table.createdAt), index("login_attempts_ip_created_at_idx").on(table.ip, table.createdAt)]);

export const auditLogs = mysqlTable("audit_logs", {
  id: bigint("id", { mode: "bigint" }).autoincrement().primaryKey(),
  adminId: varchar("admin_id", { length: 32 }).references(() => admins.id, { onDelete: "set null" }),
  action: varchar("action", { length: 32 }).notNull(),
  entity: varchar("entity", { length: 32 }).notNull(),
  entityId: varchar("entity_id", { length: 64 }),
  detail: json("detail"),
  ip: varchar("ip", { length: 45 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [index("audit_logs_admin_id_idx").on(table.adminId)]);
