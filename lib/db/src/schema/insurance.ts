import { pgTable, text, serial, timestamp, integer, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const insurancePoliciesTable = pgTable("insurance_policies", {
  id: serial("id").primaryKey(),
  farmerId: integer("farmer_id").notNull(),
  farmerName: text("farmer_name").notNull(),
  coverageType: text("coverage_type").notNull(),
  cropCovered: text("crop_covered").notNull(),
  coverageAmountETB: real("coverage_amount_etb").notNull(),
  premiumMonthlyETB: real("premium_monthly_etb").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  status: text("status").notNull().default("active"),
  triggerThreshold: text("trigger_threshold"),
  autoPayoutEnabled: boolean("auto_payout_enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insuranceClaimsTable = pgTable("insurance_claims", {
  id: serial("id").primaryKey(),
  policyId: integer("policy_id").notNull(),
  farmerId: integer("farmer_id").notNull(),
  claimType: text("claim_type").notNull(),
  description: text("description").notNull(),
  claimAmountETB: real("claim_amount_etb").notNull(),
  status: text("status").notNull().default("pending"),
  weatherDataEvidence: text("weather_data_evidence"),
  autoTriggered: boolean("auto_triggered").notNull().default(false),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertInsurancePolicySchema = createInsertSchema(insurancePoliciesTable).omit({ id: true, createdAt: true });
export const insertInsuranceClaimSchema = createInsertSchema(insuranceClaimsTable).omit({ id: true, createdAt: true, processedAt: true });
export type InsertInsurancePolicy = z.infer<typeof insertInsurancePolicySchema>;
export type InsertInsuranceClaim = z.infer<typeof insertInsuranceClaimSchema>;
export type InsurancePolicy = typeof insurancePoliciesTable.$inferSelect;
export type InsuranceClaim = typeof insuranceClaimsTable.$inferSelect;
