import { Router, type IRouter } from "express";
import { db, gradingRecordsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

const GRADE_THRESHOLDS = [
  { grade: "Specialty", minScore: 90, estimatedPriceMultiplier: 2.5 },
  { grade: "Grade1", minScore: 80, estimatedPriceMultiplier: 2.0 },
  { grade: "Grade2", minScore: 70, estimatedPriceMultiplier: 1.6 },
  { grade: "Grade3", minScore: 60, estimatedPriceMultiplier: 1.2 },
  { grade: "Grade4", minScore: 50, estimatedPriceMultiplier: 1.0 },
  { grade: "Grade5", minScore: 0, estimatedPriceMultiplier: 0.8 },
];

const BASE_PRICES: Record<string, number> = { coffee: 85, teff: 45, sesame: 62 };

function gradeScore(moisture: number, defect: number, color: number, size: number) {
  let score = 100;
  if (moisture > 12.5) score -= (moisture - 12.5) * 5;
  if (defect > 5) score -= (defect - 5) * 2;
  score += (color - 50) * 0.2;
  score += (size - 50) * 0.1;
  return Math.max(0, Math.min(100, Math.round(score)));
}

router.post("/grading/analyze", async (req, res): Promise<void> => {
  const { farmerId, cropType, batchId, weightKg } = req.body;
  if (!farmerId || !cropType || !weightKg) {
    res.status(400).json({ error: "farmerId, cropType, weightKg required" });
    return;
  }

  const moisture = 10 + Math.random() * 5;
  const defect = Math.random() * 15;
  const colorScore = 60 + Math.random() * 35;
  const sizeUniformity = 55 + Math.random() * 40;

  const score = gradeScore(moisture, defect, colorScore, sizeUniformity);
  const gradeInfo = GRADE_THRESHOLDS.find((g) => score >= g.minScore) ?? GRADE_THRESHOLDS[GRADE_THRESHOLDS.length - 1];
  const basePrice = BASE_PRICES[cropType.toLowerCase()] ?? 50;
  const estimatedPrice = basePrice * gradeInfo.estimatedPriceMultiplier;

  const feedback: string[] = [];
  if (moisture > 12) feedback.push("Moisture content is above optimal — dry further before storage");
  if (defect > 8) feedback.push("Defect rate is elevated — improve sorting and handling");
  if (colorScore < 70) feedback.push("Color uniformity below standard — review drying process");
  if (score >= 80) feedback.push("Excellent quality! Eligible for export and specialty markets");

  const [record] = await db.insert(gradingRecordsTable).values({
    farmerId,
    cropType,
    batchId: batchId ?? null,
    grade: gradeInfo.grade,
    score,
    moistureContent: Math.round(moisture * 10) / 10,
    defectRate: Math.round(defect * 10) / 10,
    colorScore: Math.round(colorScore),
    sizeUniformity: Math.round(sizeUniformity),
    weightKg: parseFloat(weightKg),
    estimatedPrice: Math.round(estimatedPrice),
    currency: "ETB",
    feedback,
    certificationEligible: gradeInfo.grade === "Specialty" || gradeInfo.grade === "Grade1",
  }).returning();

  res.json({
    ...record,
    feedback: record.feedback ?? [],
    gradedAt: record.gradedAt.toISOString(),
    batchId: record.batchId ?? undefined,
    weightKg: record.weightKg ?? undefined,
    colorScore: record.colorScore ?? 0,
    sizeUniformity: record.sizeUniformity ?? 0,
  });
});

router.get("/grading/records", async (req, res): Promise<void> => {
  const { farmerId, cropType } = req.query as Record<string, string>;
  const records = await db.select().from(gradingRecordsTable)
    .orderBy(desc(gradingRecordsTable.gradedAt))
    .limit(100);

  const filtered = records
    .filter((r) => !farmerId || r.farmerId === parseInt(farmerId, 10))
    .filter((r) => !cropType || r.cropType === cropType)
    .map((r) => ({
      ...r,
      feedback: r.feedback ?? [],
      gradedAt: r.gradedAt.toISOString(),
      batchId: r.batchId ?? undefined,
      colorScore: r.colorScore ?? 0,
      sizeUniformity: r.sizeUniformity ?? 0,
    }));

  res.json({ records: filtered, total: filtered.length });
});

export default router;
