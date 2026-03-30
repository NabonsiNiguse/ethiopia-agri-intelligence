import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const forumPostsTable = pgTable("forum_posts", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id").notNull(),
  authorName: text("author_name").notNull(),
  authorRegion: text("author_region").notNull(),
  category: text("category").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  language: text("language").notNull().default("en"),
  tags: text("tags").array().notNull().default([]),
  likes: integer("likes").notNull().default(0),
  replyCount: integer("reply_count").notNull().default(0),
  expertVerified: boolean("expert_verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const forumRepliesTable = pgTable("forum_replies", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  authorId: integer("author_id").notNull(),
  authorName: text("author_name").notNull(),
  content: text("content").notNull(),
  language: text("language").notNull().default("en"),
  isExpertReply: boolean("is_expert_reply").notNull().default(false),
  likes: integer("likes").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertForumPostSchema = createInsertSchema(forumPostsTable).omit({ id: true, createdAt: true, likes: true, replyCount: true, expertVerified: true });
export const insertForumReplySchema = createInsertSchema(forumRepliesTable).omit({ id: true, createdAt: true, likes: true });
export type InsertForumPost = z.infer<typeof insertForumPostSchema>;
export type InsertForumReply = z.infer<typeof insertForumReplySchema>;
export type ForumPost = typeof forumPostsTable.$inferSelect;
export type ForumReply = typeof forumRepliesTable.$inferSelect;
