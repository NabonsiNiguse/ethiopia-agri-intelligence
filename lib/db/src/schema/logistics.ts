import { pgTable, text, serial, timestamp, integer, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tractorsTable = pgTable("tractors", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull(),
  ownerName: text("owner_name").notNull(),
  ownerPhone: text("owner_phone").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  horsepower: integer("horsepower").notNull(),
  region: text("region").notNull(),
  woreda: text("woreda"),
  pricePerDay: real("price_per_day").notNull(),
  pricePerHectare: real("price_per_hectare").notNull(),
  available: boolean("available").notNull().default(true),
  rating: real("rating").notNull().default(4.0),
  totalJobs: integer("total_jobs").notNull().default(0),
  gpsLat: real("gps_lat"),
  gpsLng: real("gps_lng"),
  services: text("services").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  tractorId: integer("tractor_id").notNull(),
  farmerId: integer("farmer_id").notNull(),
  farmerName: text("farmer_name").notNull(),
  serviceType: text("service_type").notNull(),
  scheduledDate: text("scheduled_date").notNull(),
  durationDays: integer("duration_days").notNull(),
  hectares: real("hectares").notNull(),
  totalCost: real("total_cost").notNull(),
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTractorSchema = createInsertSchema(tractorsTable).omit({ id: true, createdAt: true, totalJobs: true });
export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ id: true, createdAt: true });
export type InsertTractor = z.infer<typeof insertTractorSchema>;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Tractor = typeof tractorsTable.$inferSelect;
export type Booking = typeof bookingsTable.$inferSelect;
