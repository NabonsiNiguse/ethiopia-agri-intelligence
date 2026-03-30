import { pgTable, text, serial, timestamp, integer, real, boolean, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const advisorySessionsTable = pgTable("advisory_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  farmerId: integer("farmer_id").notNull(),
  farmerName: text("farmer_name").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }).notNull().defaultNow(),
  messageCount: integer("message_count").notNull().default(0),
  primaryTopic: text("primary_topic").notNull().default("general"),
});

export const advisoryMessagesTable = pgTable("advisory_messages", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  farmerId: integer("farmer_id").notNull(),
  message: text("message").notNull(),
  response: text("response").notNull(),
  language: text("language").notNull().default("en"),
  cropContext: text("crop_context"),
  expertValidated: boolean("expert_validated").notNull().default(false),
  confidence: real("confidence").notNull().default(0.85),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAdvisoryMessageSchema = createInsertSchema(advisoryMessagesTable).omit({ id: true, createdAt: true });
export type InsertAdvisoryMessage = z.infer<typeof insertAdvisoryMessageSchema>;
export type AdvisoryMessage = typeof advisoryMessagesTable.$inferSelect;
export type AdvisorySession = typeof advisorySessionsTable.$inferSelect;
