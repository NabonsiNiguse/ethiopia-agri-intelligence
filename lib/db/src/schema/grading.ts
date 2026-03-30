import { pgTable, text, serial, timestamp, integer, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const gradingRecordsTable = pgTable("grading_records", {
  id: serial("id").primaryKey(),
  farmerId: integer("farmer_id").notNull(),
  cropType: text("crop_type").notNull(),
  batchId: text("batch_id"),
  grade: text("grade").notNull(),
  score: real("score").notNull(),
  moistureContent: real("moisture_content").notNull(),
  defectRate: real("defect_rate").notNull(),
  colorScore: real("color_score").notNull().default(0),
  sizeUniformity: real("size_uniformity").notNull().default(0),
  weightKg: real("weight_kg"),
  estimatedPrice: real("estimated_price").notNull(),
  currency: text("currency").notNull().default("ETB"),
  feedback: text("feedback").array().notNull().default([]),
  certificationEligible: boolean("certification_eligible").notNull().default(false),
  gradedAt: timestamp("graded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGradingRecordSchema = createInsertSchema(gradingRecordsTable).omit({ id: true, gradedAt: true });
export type InsertGradingRecord = z.infer<typeof insertGradingRecordSchema>;
export type GradingRecord = typeof gradingRecordsTable.$inferSelect;
