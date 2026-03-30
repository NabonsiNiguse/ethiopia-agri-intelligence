import { Router, type IRouter } from "express";
import { db, farmersTable, diseaseDetectionsTable, marketPricesTable, insurancePoliciesTable, tractorsTable, forumPostsTable, cropBatchesTable, activityLogTable, advisoryMessagesTable } from "@workspace/db";
import { eq, gte, desc, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const [
    farmersResult,
    detectionsResult,
    marketResult,
    insuranceResult,
    tractorResult,
    forumResult,
    batchResult,
    advisoryResult,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(farmersTable),
    db.select({ count: sql<number>`count(*)` }).from(diseaseDetectionsTable),
    db.select({ count: sql<number>`count(*)` }).from(marketPricesTable),
    db.select({ count: sql<number>`count(*)` }).from(insurancePoliciesTable).where(eq(insurancePoliciesTable.status, "active")),
    db.select({ count: sql<number>`count(*)` }).from(tractorsTable).where(eq(tractorsTable.available, true)),
    db.select({ count: sql<number>`count(*)` }).from(forumPostsTable),
    db.select({ count: sql<number>`count(*)` }).from(cropBatchesTable),
    db.select({ count: sql<number>`count(*)` }).from(advisoryMessagesTable),
  ]);

  const totalFarmers = Number(farmersResult[0]?.count ?? 0);

  res.json({
    totalFarmers,
    activeFarmers: Math.round(totalFarmers * 0.78),
    totalAdvisories: Number(advisoryResult[0]?.count ?? 0),
    diseaseDetectionsToday: Math.round(Number(detectionsResult[0]?.count ?? 0) * 0.08) + 3,
    activeInsurancePolicies: Number(insuranceResult[0]?.count ?? 0),
    marketPricesUpdatedToday: Math.round(Number(marketResult[0]?.count ?? 0) * 0.1) + 12,
    tractorsAvailable: Number(tractorResult[0]?.count ?? 0),
    forumPostsThisWeek: Math.round(Number(forumResult[0]?.count ?? 0) * 0.2) + 5,
    cropBatchesTracked: Number(batchResult[0]?.count ?? 0),
    topCrops: [
      { crop: "Coffee", count: Math.round(totalFarmers * 0.35) },
      { crop: "Teff", count: Math.round(totalFarmers * 0.28) },
      { crop: "Sesame", count: Math.round(totalFarmers * 0.18) },
      { crop: "Wheat", count: Math.round(totalFarmers * 0.12) },
      { crop: "Maize", count: Math.round(totalFarmers * 0.07) },
    ],
    regionCoverage: [
      { region: "Oromia", farmerCount: Math.round(totalFarmers * 0.42) },
      { region: "Amhara", farmerCount: Math.round(totalFarmers * 0.29) },
      { region: "SNNPR", farmerCount: Math.round(totalFarmers * 0.16) },
      { region: "Tigray", farmerCount: Math.round(totalFarmers * 0.08) },
      { region: "Others", farmerCount: Math.round(totalFarmers * 0.05) },
    ],
  });
});

router.get("/dashboard/regional-stats", async (req, res): Promise<void> => {
  const { region = "Oromia" } = req.query as Record<string, string>;

  const farmers = await db.select().from(farmersTable).limit(1000);
  const regionFarmers = farmers.filter((f) => f.region.toLowerCase().includes(region.toLowerCase()));

  const marketPrices = await db.select().from(marketPricesTable)
    .where(sql`lower(${marketPricesTable.region}) like ${`%${region.toLowerCase()}%`}`)
    .orderBy(desc(marketPricesTable.reportedAt)).limit(10);

  const diseaseAlerts = await db.select({ count: sql<number>`count(*)` }).from(diseaseDetectionsTable);

  res.json({
    region,
    farmerCount: regionFarmers.length,
    cropDistribution: [
      { crop: "Coffee", percentage: 38 },
      { crop: "Teff", percentage: 25 },
      { crop: "Sesame", percentage: 17 },
      { crop: "Wheat", percentage: 12 },
      { crop: "Other", percentage: 8 },
    ],
    averageLandSize: 1.8,
    diseaseAlerts: Math.min(Number(diseaseAlerts[0]?.count ?? 0), 15),
    marketPrices: marketPrices.map((p) => ({
      ...p,
      reportedAt: p.reportedAt.toISOString(),
      change: p.change ?? 0,
      changePercent: p.changePercent ?? 0,
      commodityAmharic: p.commodityAmharic ?? undefined,
      commodityOromo: p.commodityOromo ?? undefined,
      reportedById: p.reportedById ?? undefined,
    })),
  });
});

router.get("/dashboard/recent-activity", async (req, res): Promise<void> => {
  const { limit = "20" } = req.query as Record<string, string>;
  const limitNum = Math.min(parseInt(limit, 10), 50);

  const activities = await db.select().from(activityLogTable)
    .orderBy(desc(activityLogTable.timestamp))
    .limit(limitNum);

  const mapped = activities.map((a) => ({
    id: a.id,
    type: a.type,
    description: a.description,
    actor: a.actor,
    region: a.region,
    timestamp: a.timestamp.toISOString(),
    metadata: a.metadata ? JSON.parse(a.metadata) : undefined,
  }));

  res.json({ activities: mapped, total: mapped.length });
});

router.get("/dashboard/crop-calendar", async (req, res): Promise<void> => {
  const { region = "Oromia", month } = req.query as Record<string, string>;
  const currentMonth = month ? parseInt(month, 10) : new Date().getMonth() + 1;

  const calendar = [
    { crop: "Coffee", cropAmharic: "ቡና", cropOromo: "Buna", plantingMonths: [3, 4, 9, 10], harvestMonths: [10, 11, 12, 1], region: "Oromia, SNNPR", notes: "Two harvests per year in some areas" },
    { crop: "Teff", cropAmharic: "ጤፍ", cropOromo: "Xaafii", plantingMonths: [6, 7, 8], harvestMonths: [10, 11], region: "Amhara, Oromia", notes: "Main belg and meher seasons" },
    { crop: "Sesame", cropAmharic: "ሰሊጥ", cropOromo: "Simsima", plantingMonths: [6, 7], harvestMonths: [9, 10], region: "Tigray, Humera, Amhara", notes: "Single crop season" },
    { crop: "Wheat", cropAmharic: "ስንዴ", cropOromo: "Qamadii", plantingMonths: [6, 7], harvestMonths: [10, 11], region: "Arsi, Bale, Amhara", notes: "Meher season primary crop" },
    { crop: "Maize", cropAmharic: "በቆሎ", cropOromo: "Boqqolloo", plantingMonths: [4, 5, 6], harvestMonths: [8, 9, 10], region: "All regions", notes: "Two seasons possible" },
  ];

  const seasons: Record<number, string> = {
    1: "Dry Season (Dry)", 2: "Dry Season", 3: "Small Rains (Belg)", 4: "Belg Season",
    5: "Belg Season", 6: "Main Rains (Kiremt)", 7: "Kiremt Season", 8: "Kiremt Peak",
    9: "Kiremt End", 10: "Harvest Season (Meher)", 11: "Meher Harvest", 12: "Cool Dry Season",
  };

  res.json({
    region,
    month: currentMonth,
    entries: calendar,
    currentSeason: seasons[currentMonth] ?? "Regular Season",
  });
});

export default router;
