import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { uuid } from "drizzle-orm/pg-core";

export const cropBatchesTable = pgTable("crop_batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  farmerId: integer("farmer_id").notNull(),
  farmerName: text("farmer_name").notNull(),
  cropType: text("crop_type").notNull(),
  variety: text("variety"),
  quantityKg: real("quantity_kg").notNull(),
  harvestDate: text("harvest_date").notNull(),
  region: text("region").notNull(),
  woreda: text("woreda"),
  grade: text("grade"),
  blockchainHash: text("blockchain_hash"),
  blockchainTxId: text("blockchain_tx_id"),
  status: text("status").notNull().default("harvested"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const supplyChainEventsTable = pgTable("supply_chain_events", {
  id: serial("id").primaryKey(),
  batchId: text("batch_id").notNull(),
  eventType: text("event_type").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  actor: text("actor").notNull(),
  blockchainHash: text("blockchain_hash"),
  verified: text("verified").notNull().default("true"),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCropBatchSchema = createInsertSchema(cropBatchesTable).omit({ id: true, createdAt: true });
export const insertSupplyChainEventSchema = createInsertSchema(supplyChainEventsTable).omit({ id: true, timestamp: true });
export type InsertCropBatch = z.infer<typeof insertCropBatchSchema>;
export type CropBatch = typeof cropBatchesTable.$inferSelect;
export type SupplyChainEvent = typeof supplyChainEventsTable.$inferSelect;
