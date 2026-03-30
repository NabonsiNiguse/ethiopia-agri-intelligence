import { Router, type IRouter } from "express";
import { db, diseaseDetectionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

const DISEASE_DATABASE: Record<string, Array<{name: string; nameAm: string; nameOr: string; severity: "low"|"medium"|"high"|"critical"; treatment: string[]; treatmentAm: string[]; prevention: string[]; confidence: number}>> = {
  coffee: [
    {
      name: "Coffee Berry Disease (CBD)", nameAm: "የቡና ፍሬ በሽታ", nameOr: "Dhukkuba Fuduraa Bunaa",
      severity: "high", confidence: 0.88,
      treatment: ["Apply copper fungicide (Kocide 2000) at 2-3 kg/ha", "Remove and destroy infected berries", "Spray during flowering and berry formation stages"],
      treatmentAm: ["ኮፐር ፈንጊሳይድ ተጠቀም", "የተጠቁ ፍሬዎች አስወግድ"],
      prevention: ["Plant resistant varieties (Catimor, Ruiru 11)", "Maintain proper shade", "Regular pruning for air circulation"],
    },
    {
      name: "Coffee Leaf Rust (CLR)", nameAm: "የቡና ቅጠል ዝገት", nameOr: "Rugaa Hamma Bunaa",
      severity: "medium", confidence: 0.92,
      treatment: ["Apply triazole fungicide (Folicur)", "Remove heavily infected leaves", "Improve drainage"],
      treatmentAm: ["ፈንጊሳይድ ተጠቀም", "የተጠቁ ቅጠሎች ቁረጥ"],
      prevention: ["Plant tolerant varieties", "Maintain canopy density below 50%", "Balanced fertilization"],
    },
  ],
  teff: [
    {
      name: "Head smut", nameAm: "የጤፍ ጭቅ", nameOr: "Dhibee Tafii",
      severity: "medium", confidence: 0.79,
      treatment: ["Seed treatment with carbendazim", "Remove infected plants immediately", "Deep plow after harvest"],
      treatmentAm: ["ዘር ህክምና ተጠቀም"],
      prevention: ["Use certified disease-free seeds", "Crop rotation with legumes", "Burn crop residues"],
    },
  ],
  sesame: [
    {
      name: "Phytophthora Blight", nameAm: "የሰሊጥ ቅጠል ብስባሽ", nameOr: "Dhukkuba Furii Simsimaa",
      severity: "high", confidence: 0.85,
      treatment: ["Apply metalaxyl + mancozeb fungicide", "Improve field drainage urgently", "Remove and burn infected plants"],
      treatmentAm: ["ፈንጊሳይድ ተጠቀም", "ፍሳሽ አሻሽል"],
      prevention: ["Avoid planting in waterlogged areas", "Use raised beds in heavy-rain areas", "Crop rotation"],
    },
  ],
  wheat: [
    {
      name: "Wheat Rust (Yellow Rust)", nameAm: "ዝገት", nameOr: "Ruugaa Gannama",
      severity: "critical", confidence: 0.95,
      treatment: ["Apply propiconazole fungicide immediately", "Alert neighboring farmers", "Report to extension officer"],
      treatmentAm: ["ፈንጊሳይድ ወዲያው ተጠቀም", "ቅርብ ገበሬዎችን አሳውቅ"],
      prevention: ["Plant resistant varieties (ETBW 5930, Kakaba)", "Early planting", "Balanced N/P fertilization"],
    },
  ],
};

router.post("/disease/detect", async (req, res): Promise<void> => {
  const { farmerId, cropType, gpsLat, gpsLng } = req.body;
  if (!farmerId || !cropType) { res.status(400).json({ error: "farmerId and cropType required" }); return; }

  const cropDiseases = DISEASE_DATABASE[cropType.toLowerCase()] ?? DISEASE_DATABASE.wheat;
  const detected = cropDiseases[Math.floor(Math.random() * cropDiseases.length)];
  const expertReviewNeeded = detected.confidence < 0.80 || detected.severity === "critical";

  const [record] = await db.insert(diseaseDetectionsTable).values({
    farmerId,
    cropType,
    diseaseName: detected.name,
    diseaseNameAmharic: detected.nameAm,
    diseaseNameOromo: detected.nameOr,
    confidence: detected.confidence,
    severity: detected.severity,
    treatment: detected.treatment,
    treatmentAmharic: detected.treatmentAm,
    preventionTips: detected.prevention,
    gpsLat: gpsLat ?? null,
    gpsLng: gpsLng ?? null,
    expertReviewNeeded,
  }).returning();

  res.json({
    ...record,
    treatment: record.treatment ?? [],
    treatmentAmharic: record.treatmentAmharic ?? [],
    preventionTips: record.preventionTips ?? [],
    detectedAt: record.detectedAt.toISOString(),
    imageUrl: record.imageUrl ?? undefined,
    gpsLat: record.gpsLat ?? undefined,
    gpsLng: record.gpsLng ?? undefined,
    diseaseNameAmharic: record.diseaseNameAmharic ?? undefined,
    diseaseNameOromo: record.diseaseNameOromo ?? undefined,
  });
});

router.get("/disease/history", async (req, res): Promise<void> => {
  const { farmerId, cropType } = req.query as Record<string, string>;
  let query = db.select().from(diseaseDetectionsTable).orderBy(desc(diseaseDetectionsTable.detectedAt)).limit(50);

  const detections = await db.select().from(diseaseDetectionsTable)
    .orderBy(desc(diseaseDetectionsTable.detectedAt))
    .limit(100);

  const filtered = detections
    .filter((d) => !farmerId || d.farmerId === parseInt(farmerId, 10))
    .filter((d) => !cropType || d.cropType === cropType)
    .map((d) => ({
      ...d,
      treatment: d.treatment ?? [],
      treatmentAmharic: d.treatmentAmharic ?? [],
      preventionTips: d.preventionTips ?? [],
      detectedAt: d.detectedAt.toISOString(),
      imageUrl: d.imageUrl ?? undefined,
    }));

  res.json({ detections: filtered, total: filtered.length });
});

export default router;
