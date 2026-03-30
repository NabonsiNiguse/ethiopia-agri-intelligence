import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const marketPricesTable = pgTable("market_prices", {
  id: serial("id").primaryKey(),
  commodity: text("commodity").notNull(),
  commodityAmharic: text("commodity_amharic"),
  commodityOromo: text("commodity_oromo"),
  market: text("market").notNull(),
  region: text("region").notNull(),
  pricePerKg: real("price_per_kg").notNull(),
  currency: text("currency").notNull().default("ETB"),
  unit: text("unit").notNull().default("kg"),
  change: real("change").default(0),
  changePercent: real("change_percent").default(0),
  reportedById: integer("reported_by_id"),
  source: text("source").notNull().default("manual"),
  reportedAt: timestamp("reported_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMarketPriceSchema = createInsertSchema(marketPricesTable).omit({ id: true, reportedAt: true });
export type InsertMarketPrice = z.infer<typeof insertMarketPriceSchema>;
export type MarketPrice = typeof marketPricesTable.$inferSelect;
