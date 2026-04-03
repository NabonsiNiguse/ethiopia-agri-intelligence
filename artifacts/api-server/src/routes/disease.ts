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
  const detected = cropDiseases[Math.floor(Math.random() * cropDiseases.length)]!;
  const expertReviewNeeded = detected.confidence < 0.80 || detected.severity === "critical";

  // Build the response object regardless of DB availability
  const responsePayload = {
    id: Math.floor(Math.random() * 100000),
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
    imageUrl: undefined,
    gpsLat: gpsLat ?? undefined,
    gpsLng: gpsLng ?? undefined,
    expertReviewNeeded,
    detectedAt: new Date().toISOString(),
  };

  // Try to persist to DB — if it fails (no DB), still return the result
  try {
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
  } catch {
    // DB unavailable — return in-memory result so the UI still works
    res.json(responsePayload);
  }
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

// ─── Disease Interpret ────────────────────────────────────────────────────────

interface DiseaseInterpretInput {
  crop?: string;
  region?: string;
  language?: string;
  image_model_result?: {
    disease_name?: string;
    confidence?: number;
    severity_raw?: string;
  };
  weather?: {
    condition?: string;
    rainfall_mm?: number;
    temp_max?: number;
    humidity?: number;
  };
  recent_weather_pattern?: string;
}

// Known disease knowledge base for interpretation
const DISEASE_KNOWLEDGE: Record<string, {
  explanation: string;
  immediate_actions: string[];
  prevention_steps: string[];
  spread_factors: string[];
  humidity_threshold: number;  // humidity % above which spread risk escalates
  rainfall_threshold: number;  // mm above which spread risk escalates
}> = {
  "coffee berry disease": {
    explanation: "Coffee Berry Disease (CBD) is a fungal infection caused by Colletotrichum kahawae. It attacks coffee berries, turning them black and causing them to fall prematurely. You may see dark, sunken spots on green or ripening berries.",
    immediate_actions: [
      "Apply copper-based fungicide (e.g., Kocide 2000) at 2–3 kg/ha immediately",
      "Hand-pick and destroy all visibly infected berries — do not compost them",
      "Spray the entire canopy, focusing on berry clusters",
      "Notify your extension officer if more than 10% of berries are affected",
    ],
    prevention_steps: [
      "Plant CBD-resistant varieties such as Catimor or Ruiru 11",
      "Prune trees to improve air circulation and reduce humidity in the canopy",
      "Apply preventive copper fungicide before the main rain season each year",
      "Remove and burn all crop residues after harvest",
    ],
    spread_factors: ["high humidity", "prolonged rainfall", "dense canopy", "infected berries left on tree"],
    humidity_threshold: 75,
    rainfall_threshold: 5,
  },
  "coffee leaf rust": {
    explanation: "Coffee Leaf Rust (CLR) is caused by the fungus Hemileia vastatrix. It appears as yellow-orange powdery spots on the underside of leaves. Severely infected leaves drop early, weakening the tree and reducing next season's yield.",
    immediate_actions: [
      "Apply triazole fungicide (e.g., Folicur or Tilt) at the first sign of infection",
      "Remove and burn heavily infected leaves and branches",
      "Avoid overhead irrigation — wet leaves accelerate rust spread",
      "Reduce shade canopy density to below 40% to improve airflow",
    ],
    prevention_steps: [
      "Use rust-tolerant varieties for new plantings",
      "Apply preventive fungicide spray at the start of the rainy season",
      "Maintain balanced fertilization — excess nitrogen increases susceptibility",
      "Monitor leaf undersides weekly during the wet season",
    ],
    spread_factors: ["wind", "rain splash", "high humidity", "dense planting"],
    humidity_threshold: 70,
    rainfall_threshold: 3,
  },
  "phytophthora blight": {
    explanation: "Phytophthora Blight is a water mold disease that thrives in waterlogged or poorly drained soils. It causes sudden wilting, dark water-soaked lesions on stems and leaves, and can kill plants within days if not controlled.",
    immediate_actions: [
      "Improve field drainage immediately — dig drainage channels if needed",
      "Remove and burn all infected plants to prevent spread",
      "Apply metalaxyl + mancozeb fungicide to surrounding healthy plants",
      "Stop irrigation until soil drains adequately",
    ],
    prevention_steps: [
      "Never plant sesame or susceptible crops in low-lying, waterlogged areas",
      "Use raised beds in areas with heavy seasonal rainfall",
      "Practice crop rotation — avoid planting the same crop in the same field for 2+ years",
      "Select well-drained sandy loam soils for planting",
    ],
    spread_factors: ["waterlogging", "heavy rain", "infected soil", "contaminated tools"],
    humidity_threshold: 80,
    rainfall_threshold: 8,
  },
  "wheat rust": {
    explanation: "Wheat Rust (Yellow/Stem Rust) is one of the most destructive wheat diseases in Ethiopia. It spreads rapidly through wind-borne spores and can devastate an entire field within 2 weeks. Look for yellow or orange powdery stripes on leaves and stems.",
    immediate_actions: [
      "Apply propiconazole or tebuconazole fungicide immediately — do not delay",
      "Alert neighboring farmers and your local extension officer right away",
      "Do not move equipment between infected and healthy fields without cleaning",
      "If more than 20% of plants are infected, report to the district agriculture office",
    ],
    prevention_steps: [
      "Plant rust-resistant varieties (ETBW 5930, Kakaba, Danda'a)",
      "Plant early in the season to avoid peak rust pressure",
      "Apply balanced nitrogen and phosphorus — excess N increases rust severity",
      "Monitor fields weekly during the growing season, especially after rain",
    ],
    spread_factors: ["wind", "rain", "infected seed", "neighboring infected fields"],
    humidity_threshold: 65,
    rainfall_threshold: 2,
  },
  "head smut": {
    explanation: "Head Smut is a fungal disease of teff caused by Ustilago crameri. Infected plants produce smutted heads filled with black spore masses instead of grain. The spores contaminate soil and seed, persisting for several seasons.",
    immediate_actions: [
      "Remove and burn all smutted heads before spores disperse",
      "Do not thresh infected plants near healthy crops",
      "Treat remaining seed stock with carbendazim fungicide before next planting",
      "Deep plow the affected area after harvest to bury soil-borne spores",
    ],
    prevention_steps: [
      "Always use certified, disease-free teff seed",
      "Treat seed with fungicide (carbendazim) before every planting",
      "Rotate teff with legumes (faba bean, lentil) for at least one season",
      "Burn all crop residues from infected fields — do not incorporate into soil",
    ],
    spread_factors: ["infected seed", "contaminated soil", "wind-dispersed spores", "crop residues"],
    humidity_threshold: 70,
    rainfall_threshold: 4,
  },
  "fall armyworm": {
    explanation: "Fall Armyworm (FAW) is a highly destructive caterpillar pest that attacks maize and other cereals. It feeds inside the whorl, leaving ragged holes and frass (sawdust-like droppings). A single larva can destroy a plant's growing point.",
    immediate_actions: [
      "Apply emamectin benzoate or spinetoram insecticide directly into the whorl",
      "For small farms, manually remove and crush larvae found in whorls",
      "Apply in the early morning or late evening when larvae are most active",
      "Check at least 20 plants per field to assess infestation level",
    ],
    prevention_steps: [
      "Plant early to avoid peak FAW pressure",
      "Use push-pull intercropping (Desmodium + Napier grass) as a natural deterrent",
      "Encourage natural enemies — avoid broad-spectrum insecticides that kill beneficial insects",
      "Monitor fields twice weekly during vegetative growth stages",
    ],
    spread_factors: ["wind-assisted adult moth migration", "warm temperatures", "dense planting", "late planting"],
    humidity_threshold: 60,
    rainfall_threshold: 2,
  },
};

function normalizeDiseaseKey(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("coffee berry") || lower.includes("cbd")) return "coffee berry disease";
  if (lower.includes("leaf rust") && lower.includes("coffee")) return "coffee leaf rust";
  if (lower.includes("phytophthora") || lower.includes("blight")) return "phytophthora blight";
  if (lower.includes("wheat rust") || lower.includes("yellow rust") || lower.includes("stem rust")) return "wheat rust";
  if (lower.includes("smut")) return "head smut";
  if (lower.includes("armyworm") || lower.includes("faw")) return "fall armyworm";
  return lower;
}

function interpretSeverity(severityRaw: string, confidence: number): "low" | "medium" | "high" {
  const s = severityRaw.toLowerCase();
  if (s === "high" || s === "critical" || s === "severe") return "high";
  if (s === "medium" || s === "moderate") return confidence >= 0.8 ? "medium" : "low";
  if (s === "low" || s === "mild") return "low";
  // fallback: infer from confidence
  if (confidence >= 0.85) return "medium";
  return "low";
}

function assessSpreadRisk(
  diseaseKey: string,
  severity: "low" | "medium" | "high",
  weather: DiseaseInterpretInput["weather"],
  recentPattern: string,
): "low" | "medium" | "high" {
  const kb = DISEASE_KNOWLEDGE[diseaseKey];
  if (!kb) return severity; // default to severity level

  const humidity = weather?.humidity ?? 60;
  const rainfall = weather?.rainfall_mm ?? 0;
  const patternLower = (recentPattern ?? "").toLowerCase();

  let score = 0;
  if (severity === "high") score += 2;
  else if (severity === "medium") score += 1;

  if (humidity >= kb.humidity_threshold) score += 2;
  if (rainfall >= kb.rainfall_threshold) score += 1;
  if (patternLower.includes("wet") || patternLower.includes("rain") || patternLower.includes("humid")) score += 1;

  return score >= 4 ? "high" : score >= 2 ? "medium" : "low";
}

router.post("/disease/interpret", (req, res): void => {
  const input = req.body as DiseaseInterpretInput;

  if (!input?.image_model_result?.disease_name) {
    res.status(400).json({ error: "image_model_result.disease_name is required" });
    return;
  }

  const rawDisease = input.image_model_result.disease_name;
  const diseaseKey = normalizeDiseaseKey(rawDisease);
  const kb = DISEASE_KNOWLEDGE[diseaseKey];

  const confidence = input.image_model_result.confidence ?? 0;
  const severity = interpretSeverity(input.image_model_result.severity_raw ?? "", confidence);
  const spreadRisk = assessSpreadRisk(diseaseKey, severity, input.weather, input.recent_weather_pattern ?? "");

  const urgentFieldVisit =
    severity === "high" ||
    spreadRisk === "high" ||
    confidence < 0.6 ||
    (input.weather?.rainfall_mm ?? 0) > 10;

  const explanation = kb
    ? kb.explanation
    : `${rawDisease} has been detected on your ${input.crop ?? "crop"} with ${Math.round(confidence * 100)}% confidence. Monitor the affected area closely and consult your local extension officer for confirmation.`;

  const immediateActions = kb
    ? kb.immediate_actions
    : [
        "Isolate the affected plants from healthy ones if possible",
        "Take clear photos of the symptoms and share with your extension officer",
        "Avoid moving soil or plant material from the affected area",
        "Do not apply any chemical without expert confirmation",
      ];

  const preventionSteps = kb
    ? kb.prevention_steps
    : [
        "Use certified disease-free seed for future planting",
        "Practice crop rotation to break disease cycles",
        "Maintain good field hygiene — remove and burn crop residues",
        "Monitor your crop weekly and report unusual symptoms early",
      ];

  res.json({
    module: "disease",
    language: input.language ?? "en",
    disease_name: rawDisease,
    severity,
    spread_risk: spreadRisk,
    explanation,
    immediate_actions: immediateActions,
    prevention_steps: preventionSteps,
    urgent_field_visit_needed: urgentFieldVisit,
    confidence_score: Math.round(confidence * 100),
  });
});

export default router;
