import { pgTable, text, serial, timestamp, integer, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const farmersTable = pgTable("farmers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  region: text("region").notNull(),
  woreda: text("woreda"),
  zone: text("zone"),
  landSizeHectares: real("land_size_hectares"),
  primaryCrops: text("primary_crops").array().notNull().default([]),
  preferredLanguage: text("preferred_language").notNull().default("en"),
  hasSmartphone: boolean("has_smartphone").notNull().default(false),
  gpsLat: real("gps_lat"),
  gpsLng: real("gps_lng"),
  totalAdvisories: integer("total_advisories").notNull().default(0),
  totalDetections: integer("total_detections").notNull().default(0),
  registeredAt: timestamp("registered_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFarmerSchema = createInsertSchema(farmersTable).omit({ id: true, registeredAt: true, totalAdvisories: true, totalDetections: true });
export type InsertFarmer = z.infer<typeof insertFarmerSchema>;
export type Farmer = typeof farmersTable.$inferSelect;
