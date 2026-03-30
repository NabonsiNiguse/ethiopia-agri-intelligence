import { Router, type IRouter } from "express";
import { db, diseaseDetectionsTable, marketPricesTable, farmersTable } from "@workspace/db";
import { sql, desc } from "drizzle-orm";

const router: IRouter = Router();

interface RegionRiskData {
  region: string;
  lat: number;
  lng: number;
  diseaseRisk: number;
  weatherRisk: number;
  marketRisk: number;
  overallRisk: number;
  riskLevel: "Low" | "Medium" | "High";
  farmerCount: number;
  activeCrops: string[];
  alerts: string[];
}

const REGIONS: Record<string, { lat: number; lng: number; defaultCrops: string[]; weatherRisk: number }> = {
  Oromia: { lat: 8.5, lng: 39.5, defaultCrops: ["Coffee", "Maize", "Teff"], weatherRisk: 35 },
  Amhara: { lat: 11.5, lng: 38.0, defaultCrops: ["Teff", "Wheat", "Barley"], weatherRisk: 28 },
  SNNPR: { lat: 6.5, lng: 37.5, defaultCrops: ["Coffee", "Enset", "Sesame"], weatherRisk: 22 },
  Tigray: { lat: 14.0, lng: 38.5, defaultCrops: ["Teff", "Sorghum", "Barley"], weatherRisk: 68 },
  Afar: { lat: 12.0, lng: 41.5, defaultCrops: ["Sorghum", "Sesame"], weatherRisk: 85 },
  Somali: { lat: 7.5, lng: 45.0, defaultCrops: ["Sorghum", "Sesame"], weatherRisk: 80 },
  "Benishangul-Gumuz": { lat: 10.5, lng: 35.5, defaultCrops: ["Sesame", "Maize", "Sorghum"], weatherRisk: 20 },
  Gambela: { lat: 8.0, lng: 34.5, defaultCrops: ["Maize", "Sorghum", "Rice"], weatherRisk: 30 },
  Harari: { lat: 9.3, lng: 42.1, defaultCrops: ["Coffee", "Khat", "Sorghum"], weatherRisk: 42 },
  "Dire Dawa": { lat: 9.6, lng: 41.9, defaultCrops: ["Khat", "Sorghum", "Maize"], weatherRisk: 55 },
};

const DISEASE_ALERTS: Record<string, string[]> = {
  Oromia: ["Coffee Berry Disease detected in Jimma zone", "Teff blast reported in West Wellega"],
  Amhara: ["Wheat rust early warning in South Gondar", "Stem borer in maize - Awi zone"],
  SNNPR: ["Coffee leaf rust in Sidama", "Enset Xanthomonas Wilt cases rising"],
  Tigray: ["Locust activity along Eastern border", "Teff smut reported in Central Tigray"],
  Afar: ["Severe drought stress - livestock feed shortage", "Fall armyworm in sorghum"],
  Somali: ["Extreme drought conditions", "Vegetation loss in border areas"],
  "Benishangul-Gumuz": ["Maize streak virus reports increasing", "Striga weed pressure in sesame fields"],
  Gambela: ["Flooding damage to standing crops", "Rice blast under monitoring"],
  Harari: ["Khat quality decline from moisture stress"],
  "Dire Dawa": ["Heat stress reducing yields across all crops"],
};

function calculateRiskLevel(score: number): "Low" | "Medium" | "High" {
  if (score >= 65) return "High";
  if (score >= 35) return "Medium";
  return "Low";
}

function calculateOverallRisk(disease: number, weather: number, market: number): number {
  return Math.round(disease * 0.35 + weather * 0.40 + market * 0.25);
}

router.get("/riskmap/regions", async (_req, res): Promise<void> => {
  const farmers = await db.select().from(farmersTable).limit(500);
  const detections = await db
    .select({ count: sql<number>`count(*)` })
    .from(diseaseDetectionsTable);
  const marketPrices = await db
    .select()
    .from(marketPricesTable)
    .orderBy(desc(marketPricesTable.reportedAt))
    .limit(50);

  const totalDetections = Number(detections[0]?.count ?? 0);

  const regionData: RegionRiskData[] = Object.entries(REGIONS).map(([region, meta]) => {
    const regionFarmers = farmers.filter((f) =>
      f.region.toLowerCase().includes(region.toLowerCase().split("-")[0]!)
    );

    const farmerCount = regionFarmers.length;

    const diseaseRisk = Math.min(90, Math.round(
      (totalDetections / (farmers.length || 1)) * 100 * (DISEASE_ALERTS[region]?.length ?? 1) * 0.4 +
      Math.random() * 15 + (meta.weatherRisk > 60 ? 20 : 5)
    ));

    const regionPrices = marketPrices.filter((p) =>
      p.region?.toLowerCase().includes(region.toLowerCase().split(" ")[0]!)
    );
    const avgChange = regionPrices.length > 0
      ? regionPrices.reduce((sum, p) => sum + Number(p.changePercent ?? 0), 0) / regionPrices.length
      : -1.5;
    const marketRisk = Math.min(85, Math.max(10, Math.round(50 - avgChange * 5)));

    const overallRisk = calculateOverallRisk(diseaseRisk, meta.weatherRisk, marketRisk);

    return {
      region,
      lat: meta.lat,
      lng: meta.lng,
      diseaseRisk: Math.min(90, Math.max(5, diseaseRisk)),
      weatherRisk: meta.weatherRisk,
      marketRisk: Math.min(85, Math.max(5, marketRisk)),
      overallRisk: Math.min(90, Math.max(5, overallRisk)),
      riskLevel: calculateRiskLevel(overallRisk),
      farmerCount: Math.max(farmerCount, Math.round(Math.random() * 3)),
      activeCrops: meta.defaultCrops,
      alerts: DISEASE_ALERTS[region] ?? [],
    };
  });

  res.json({
    regions: regionData,
    summary: {
      highRiskRegions: regionData.filter((r) => r.riskLevel === "High").map((r) => r.region),
      mediumRiskRegions: regionData.filter((r) => r.riskLevel === "Medium").map((r) => r.region),
      lowRiskRegions: regionData.filter((r) => r.riskLevel === "Low").map((r) => r.region),
      totalAlertsActive: Object.values(DISEASE_ALERTS).flat().length,
      lastUpdated: new Date(),
    },
  });
});

router.get("/riskmap/region/:region", async (req, res): Promise<void> => {
  const { region } = req.params as { region: string };
  const decodedRegion = decodeURIComponent(region);

  const meta = Object.entries(REGIONS).find(
    ([key]) => key.toLowerCase().includes(decodedRegion.toLowerCase()) ||
               decodedRegion.toLowerCase().includes(key.toLowerCase().split("-")[0]!)
  );

  if (!meta) {
    res.status(404).json({ error: "Region not found" });
    return;
  }

  const [regionKey, regionMeta] = meta;

  const farmers = await db
    .select()
    .from(farmersTable)
    .where(sql`lower(${farmersTable.region}) like ${"%" + decodedRegion.toLowerCase().slice(0, 4) + "%"}`)
    .limit(100);

  const marketPrices = await db
    .select()
    .from(marketPricesTable)
    .where(sql`lower(${marketPricesTable.region}) like ${"%" + decodedRegion.toLowerCase().slice(0, 4) + "%"}`)
    .orderBy(desc(marketPricesTable.reportedAt))
    .limit(10);

  const diseaseRisk = Math.min(85, Math.round(
    (DISEASE_ALERTS[regionKey]?.length ?? 0) * 15 + (regionMeta.weatherRisk > 60 ? 20 : 5)
  ));
  const avgChange = marketPrices.length > 0
    ? marketPrices.reduce((sum, p) => sum + Number(p.changePercent ?? 0), 0) / marketPrices.length
    : -1.5;
  const marketRisk = Math.min(80, Math.max(10, Math.round(50 - avgChange * 5)));
  const overallRisk = calculateOverallRisk(diseaseRisk, regionMeta.weatherRisk, marketRisk);

  res.json({
    region: regionKey,
    lat: regionMeta.lat,
    lng: regionMeta.lng,
    riskScores: {
      disease: diseaseRisk,
      weather: regionMeta.weatherRisk,
      market: marketRisk,
      overall: overallRisk,
    },
    riskLevel: calculateRiskLevel(overallRisk),
    farmerCount: Math.max(farmers.length, 1),
    activeCrops: regionMeta.defaultCrops,
    alerts: DISEASE_ALERTS[regionKey] ?? [],
    marketPrices: marketPrices.slice(0, 5),
    topFarmers: farmers.slice(0, 5).map((f) => ({
      name: f.name,
      crops: f.primaryCrops,
      landSize: f.landSizeHectares,
    })),
    recommendations: [
      diseaseRisk > 60 ? "Deploy mobile extension officers for disease surveillance immediately." : "Continue routine disease monitoring.",
      regionMeta.weatherRisk > 60 ? "Issue drought advisory and activate emergency water conservation programs." : "Weather conditions are manageable — monitor weekly.",
      marketRisk > 60 ? "Alert farmers to market volatility; advise staged selling strategy." : "Market conditions are stable.",
    ],
  });
});

router.get("/riskmap/alerts", async (_req, res): Promise<void> => {
  const allAlerts = Object.entries(DISEASE_ALERTS).flatMap(([region, alerts]) =>
    alerts.map((alert, idx) => ({
      id: `${region}-${idx}`,
      region,
      alert,
      severity: region === "Afar" || region === "Somali" || region === "Tigray" ? "High" : "Medium",
      timestamp: new Date(Date.now() - Math.random() * 86400000 * 3),
    }))
  );

  allAlerts.sort((a, b) => {
    const severityOrder = { High: 0, Medium: 1, Low: 2 };
    return (severityOrder[a.severity as keyof typeof severityOrder] ?? 2) -
           (severityOrder[b.severity as keyof typeof severityOrder] ?? 2);
  });

  res.json({ alerts: allAlerts, totalCount: allAlerts.length });
});

export default router;
