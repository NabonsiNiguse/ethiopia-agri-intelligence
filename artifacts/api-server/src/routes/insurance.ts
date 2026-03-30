import { Router, type IRouter } from "express";
import { db, insurancePoliciesTable, insuranceClaimsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

const PREMIUM_RATES: Record<string, number> = {
  drought: 0.04,
  flood: 0.035,
  frost: 0.025,
  pest: 0.05,
  disease: 0.045,
};

router.get("/insurance/policies", async (req, res): Promise<void> => {
  const { farmerId, status } = req.query as Record<string, string>;
  const policies = await db.select().from(insurancePoliciesTable).orderBy(desc(insurancePoliciesTable.createdAt)).limit(100);

  const filtered = policies
    .filter((p) => !farmerId || p.farmerId === parseInt(farmerId, 10))
    .filter((p) => !status || p.status === status)
    .map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      triggerThreshold: p.triggerThreshold ?? undefined,
    }));

  res.json({ policies: filtered, total: filtered.length });
});

router.post("/insurance/policies", async (req, res): Promise<void> => {
  const { farmerId, coverageType, cropCovered, coverageAmountETB, startDate, endDate } = req.body;
  if (!farmerId || !coverageType || !cropCovered || !coverageAmountETB) {
    res.status(400).json({ error: "farmerId, coverageType, cropCovered, coverageAmountETB required" });
    return;
  }

  const rate = PREMIUM_RATES[coverageType] ?? 0.04;
  const premiumMonthlyETB = Math.round((parseFloat(coverageAmountETB) * rate) / 12);

  const triggers: Record<string, string> = {
    drought: "Rainfall < 30% of seasonal average for 3+ consecutive weeks",
    flood: "Rainfall > 200% of seasonal average in 48 hours",
    frost: "Temperature < 0°C for 3+ consecutive nights",
    pest: "Pest damage confirmed by satellite imagery (>40% crop loss)",
    disease: "Disease outbreak confirmed by AI detection (>30% crop affected)",
  };

  const [policy] = await db.insert(insurancePoliciesTable).values({
    farmerId,
    farmerName: req.body.farmerName ?? "Farmer",
    coverageType,
    cropCovered,
    coverageAmountETB: parseFloat(coverageAmountETB),
    premiumMonthlyETB,
    startDate: startDate ?? new Date().toISOString().split("T")[0],
    endDate: endDate ?? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    status: "active",
    triggerThreshold: triggers[coverageType] ?? null,
    autoPayoutEnabled: true,
  }).returning();

  res.status(201).json({ ...policy, createdAt: policy.createdAt.toISOString(), triggerThreshold: policy.triggerThreshold ?? undefined });
});

router.get("/insurance/claims", async (req, res): Promise<void> => {
  const { farmerId, status } = req.query as Record<string, string>;
  const claims = await db.select().from(insuranceClaimsTable).orderBy(desc(insuranceClaimsTable.createdAt)).limit(100);

  const filtered = claims
    .filter((c) => !farmerId || c.farmerId === parseInt(farmerId, 10))
    .filter((c) => !status || c.status === status)
    .map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      processedAt: c.processedAt?.toISOString() ?? undefined,
      weatherDataEvidence: c.weatherDataEvidence ?? undefined,
    }));

  res.json({ claims: filtered, total: filtered.length });
});

export default router;
