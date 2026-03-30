import { pgTable, text, serial, timestamp, integer, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const diseaseDetectionsTable = pgTable("disease_detections", {
  id: serial("id").primaryKey(),
  farmerId: integer("farmer_id").notNull(),
  cropType: text("crop_type").notNull(),
  diseaseName: text("disease_name").notNull(),
  diseaseNameAmharic: text("disease_name_amharic"),
  diseaseNameOromo: text("disease_name_oromo"),
  confidence: real("confidence").notNull(),
  severity: text("severity").notNull(),
  treatment: text("treatment").array().notNull().default([]),
  treatmentAmharic: text("treatment_amharic").array().notNull().default([]),
  preventionTips: text("prevention_tips").array().notNull().default([]),
  imageUrl: text("image_url"),
  gpsLat: real("gps_lat"),
  gpsLng: real("gps_lng"),
  expertReviewNeeded: boolean("expert_review_needed").notNull().default(false),
  detectedAt: timestamp("detected_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDiseaseDetectionSchema = createInsertSchema(diseaseDetectionsTable).omit({ id: true, detectedAt: true });
export type InsertDiseaseDetection = z.infer<typeof insertDiseaseDetectionSchema>;
export type DiseaseDetection = typeof diseaseDetectionsTable.$inferSelect;
