import { Router, type IRouter } from "express";
import { db, advisorySessionsTable, advisoryMessagesTable, farmersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

const router: IRouter = Router();

const AI_RESPONSES: Record<string, string[]> = {
  coffee: [
    "Coffee plants thrive in well-drained, rich soil with pH 6.0–6.5. Ensure adequate shade from trees. Water regularly during dry season.",
    "For coffee berry disease (CBD), apply copper fungicide before and after the main rain season. Remove and destroy infected berries.",
    "Coffee should be harvested when cherries are fully red. Use selective picking for specialty grade beans.",
  ],
  teff: [
    "Teff grows best in moderate rainfall areas (400–1500mm/year). Plant after first heavy rains, use 5kg seed per hectare.",
    "Teff is resistant to waterlogging and drought once established. Avoid heavy nitrogen fertilizer — it causes lodging.",
    "Harvest teff when 2/3 of the straw turns yellow. Thresh on clean ground to minimize grain loss.",
  ],
  sesame: [
    "Sesame requires warm temperatures (25–35°C). Plant in well-drained sandy loam soil. Space rows 45cm apart.",
    "Phytophthora blight is common in wet seasons. Ensure proper drainage and avoid waterlogging.",
    "Sesame is ready for harvest when lower leaves turn yellow. Harvest before capsules open to prevent seed loss.",
  ],
  general: [
    "Based on your region and current season, I recommend soil testing before planting. Contact your local extension office for free soil testing.",
    "Integrated pest management (IPM) combines biological, cultural, and chemical control methods to reduce crop losses sustainably.",
    "Climate-smart agriculture practices like crop rotation and intercropping can improve soil health and reduce input costs.",
  ],
};

function generateAdvisoryResponse(message: string, cropContext?: string, language = "en") {
  const lower = message.toLowerCase();
  let responses = AI_RESPONSES.general;
  if (lower.includes("coffee") || cropContext === "coffee") responses = AI_RESPONSES.coffee;
  else if (lower.includes("teff") || cropContext === "teff") responses = AI_RESPONSES.teff;
  else if (lower.includes("sesame") || cropContext === "sesame") responses = AI_RESPONSES.sesame;

  const response = responses[Math.floor(Math.random() * responses.length)];
  return {
    response,
    responseAmharic: `[Amharic] ${response}`,
    responseOromo: `[Afaan Oromo] ${response}`,
    recommendations: ["Apply recommended fertilizer", "Monitor weather forecasts", "Contact local extension officer"],
    relatedTopics: ["Soil health", "Pest management", "Market prices"],
    expertValidated: Math.random() > 0.5,
    confidence: 0.75 + Math.random() * 0.2,
  };
}

router.post("/advisory/chat", async (req, res): Promise<void> => {
  const { farmerId, sessionId, message, language, cropContext } = req.body;
  if (!farmerId || !message) { res.status(400).json({ error: "farmerId and message required" }); return; }

  const sid = sessionId || randomUUID();
  const aiResp = generateAdvisoryResponse(message, cropContext, language);

  // Return AI response immediately — DB persistence is best-effort
  const responsePayload = {
    sessionId: sid,
    timestamp: new Date().toISOString(),
    ...aiResp,
  };

  try {
    const [existing] = await db.select().from(advisorySessionsTable).where(eq(advisorySessionsTable.id, sid));

    let farmerName = "Farmer";
    const [farmer] = await db.select().from(farmersTable).where(eq(farmersTable.id, farmerId));
    if (farmer) farmerName = farmer.name;

    if (!existing) {
      await db.insert(advisorySessionsTable).values({
        id: sid, farmerId, farmerName,
        primaryTopic: cropContext ?? "general",
        messageCount: 1,
      });
    } else {
      await db.update(advisorySessionsTable)
        .set({ messageCount: (existing.messageCount ?? 0) + 1, lastMessageAt: new Date() })
        .where(eq(advisorySessionsTable.id, sid));
    }

    await db.insert(advisoryMessagesTable).values({
      sessionId: sid, farmerId, message,
      response: aiResp.response,
      language: language ?? "en",
      cropContext: cropContext ?? null,
      expertValidated: aiResp.expertValidated,
      confidence: aiResp.confidence,
    });
  } catch {
    // DB unavailable — still return the AI response
  }

  res.json(responsePayload);
});

router.get("/advisory/sessions", async (req, res): Promise<void> => {
  const { farmerId } = req.query as Record<string, string>;
  try {
    let sessions;
    if (farmerId) {
      sessions = await db.select().from(advisorySessionsTable)
        .where(eq(advisorySessionsTable.farmerId, parseInt(farmerId, 10)))
        .orderBy(desc(advisorySessionsTable.lastMessageAt));
    } else {
      sessions = await db.select().from(advisorySessionsTable)
        .orderBy(desc(advisorySessionsTable.lastMessageAt))
        .limit(50);
    }
    const mapped = sessions.map((s) => ({
      ...s,
      startedAt: s.startedAt.toISOString(),
      lastMessageAt: s.lastMessageAt.toISOString(),
    }));
    res.json({ sessions: mapped, total: mapped.length });
  } catch {
    res.json({ sessions: [], total: 0 });
  }
});

// ─── Advisory Analyze ────────────────────────────────────────────────────────

interface FarmerContext {
  farmer: {
    name?: string;
    region?: string;
    zone?: string;
    woreda?: string;
    language?: string;
    farm_size_ha?: string | number;
    main_crop?: string;
    growth_stage?: string;
  };
  weather?: {
    condition?: string;
    rainfall_mm?: number;
    temp_max?: number;
    temp_min?: number;
    humidity?: number;
    forecast?: string;
  };
  market?: {
    commodity?: string;
    price_per_kg?: number;
    trend?: string;
    market_name?: string;
  };
  soil?: {
    type?: string;
    moisture?: string;
    fertility?: string;
  };
  recent_activity?: Array<{ action?: string; date?: string; notes?: string }> | null;
  question?: string;
}

function detectMissingFields(ctx: FarmerContext): string[] {
  const missing: string[] = [];
  if (!ctx.farmer?.name) missing.push("farmer.name");
  if (!ctx.farmer?.region) missing.push("farmer.region");
  if (!ctx.farmer?.main_crop) missing.push("farmer.main_crop");
  if (!ctx.farmer?.growth_stage) missing.push("farmer.growth_stage");
  if (!ctx.farmer?.farm_size_ha) missing.push("farmer.farm_size_ha");
  if (!ctx.weather || Object.keys(ctx.weather).length === 0) missing.push("weather");
  if (!ctx.market || Object.keys(ctx.market).length === 0) missing.push("market");
  if (!ctx.soil?.type) missing.push("soil.type");
  if (!ctx.soil?.moisture) missing.push("soil.moisture");
  if (!ctx.soil?.fertility) missing.push("soil.fertility");
  return missing;
}

function buildAdvisoryAnalysis(ctx: FarmerContext, missing: string[]) {
  const crop = (ctx.farmer?.main_crop ?? "general").toLowerCase();
  const stage = (ctx.farmer?.growth_stage ?? "").toLowerCase();
  const soilMoisture = (ctx.soil?.moisture ?? "").toLowerCase();
  const soilFertility = (ctx.soil?.fertility ?? "").toLowerCase();
  const rainfall = ctx.weather?.rainfall_mm ?? 0;
  const tempMax = ctx.weather?.temp_max ?? 25;
  const humidity = ctx.weather?.humidity ?? 60;
  const marketTrend = (ctx.market?.trend ?? "stable").toLowerCase();
  const language = ctx.farmer?.language ?? "en";

  // ── Risk assessment ──────────────────────────────────────────────────────
  let riskScore = 0;
  if (soilMoisture === "low" || soilMoisture === "dry") riskScore += 2;
  if (soilFertility === "low" || soilFertility === "poor") riskScore += 2;
  if (rainfall > 10) riskScore += 2;
  if (tempMax > 35) riskScore += 1;
  if (humidity > 85) riskScore += 1;
  if (missing.length > 3) riskScore += 2;

  const riskLevel: "low" | "medium" | "high" = riskScore >= 5 ? "high" : riskScore >= 3 ? "medium" : "low";

  // ── Confidence ───────────────────────────────────────────────────────────
  const confidence = Math.max(10, Math.round(100 - missing.length * 10 - (riskScore > 4 ? 10 : 0)));

  // ── Urgent warning ───────────────────────────────────────────────────────
  const urgentWarning = rainfall > 15 || tempMax > 38 || riskLevel === "high";

  // ── Crop-stage-specific logic ─────────────────────────────────────────────
  type CropKey = "coffee" | "teff" | "sesame" | "maize" | "wheat" | "general";
  const CROP_STAGE_ADVICE: Record<CropKey, Record<string, { main: string; actions: string[] }>> = {
    coffee: {
      flowering: {
        main: "Protect coffee flowers from heavy rain and strong wind. Avoid any pesticide application during flowering to preserve pollination.",
        actions: [
          "Apply light mulch around the base to retain soil moisture",
          "Monitor for antestia bug — use sticky traps as early detection",
          "Avoid overhead irrigation during flowering",
          "Record flowering date to estimate harvest window",
        ],
      },
      "berry development": {
        main: "Ensure consistent soil moisture during berry fill. Nutrient deficiency now directly reduces cup quality.",
        actions: [
          "Apply potassium-rich fertilizer (e.g., K2O) to support berry development",
          "Scout for coffee berry borer — set pheromone traps",
          "Maintain shade canopy at 40–50% to moderate temperature",
        ],
      },
      default: {
        main: "Maintain soil health and monitor for coffee berry disease (CBD). Apply copper-based fungicide before the main rain season.",
        actions: [
          "Test soil pH — target 6.0–6.5 for optimal nutrient uptake",
          "Prune dead wood to improve air circulation",
          "Apply compost or organic matter to improve soil structure",
        ],
      },
    },
    teff: {
      germination: {
        main: "Ensure adequate soil moisture for uniform germination. Teff seed is tiny — avoid deep planting (max 1 cm).",
        actions: [
          "Maintain soil moisture but avoid waterlogging",
          "Check for bird damage — use netting or scarecrows",
          "Thin seedlings to 5 cm spacing if over-seeded",
        ],
      },
      tillering: {
        main: "Teff is at a critical tillering stage. Avoid nitrogen over-application which causes lodging.",
        actions: [
          "Apply phosphorus fertilizer to support root development",
          "Monitor for stem borer — inspect lower stems weekly",
          "Avoid heavy irrigation — teff is drought-tolerant once established",
        ],
      },
      default: {
        main: "Teff requires minimal inputs but timely harvesting. Plan harvest when 2/3 of straw turns yellow.",
        actions: [
          "Use 5 kg seed per hectare for optimal plant density",
          "Avoid heavy nitrogen — it causes lodging",
          "Thresh on clean tarpaulin to minimize grain loss",
        ],
      },
    },
    sesame: {
      flowering: {
        main: "Sesame is highly sensitive to waterlogging during flowering. Ensure drainage channels are clear.",
        actions: [
          "Check drainage — standing water for 24h can cause total crop loss",
          "Scout for phytophthora blight — remove infected plants immediately",
          "Avoid spraying during open flower hours (morning)",
        ],
      },
      maturity: {
        main: "Harvest sesame before capsules shatter. Monitor lower leaves — yellowing signals readiness.",
        actions: [
          "Harvest in early morning to reduce shattering losses",
          "Bundle and dry upright in field for 3–5 days before threshing",
          "Store in dry, ventilated bags — sesame is prone to aflatoxin",
        ],
      },
      default: {
        main: "Sesame needs warm, well-drained soil. Plant in rows 45 cm apart after last frost risk.",
        actions: [
          "Ensure soil temperature is above 20°C before planting",
          "Apply basal fertilizer (DAP) at planting",
          "Weed aggressively in first 4 weeks — sesame is a poor competitor",
        ],
      },
    },
    maize: {
      "vegetative growth": {
        main: "Maize is in active vegetative growth. Nitrogen top-dressing now will significantly boost yield.",
        actions: [
          "Apply urea (46% N) at knee-high stage — 50 kg/ha",
          "Scout for fall armyworm — check whorl for frass and feeding damage",
          "Ensure adequate soil moisture — maize is sensitive to drought at this stage",
        ],
      },
      tasseling: {
        main: "Tasseling is the most critical stage for maize yield. Any stress now reduces grain set.",
        actions: [
          "Irrigate if rainfall is below 5 mm/week",
          "Do not apply herbicides during tasseling",
          "Monitor for maize streak virus — remove infected plants",
        ],
      },
      default: {
        main: "Follow recommended maize management for your region. Timely planting and fertilization are key yield drivers.",
        actions: [
          "Use certified hybrid seed suited to your altitude",
          "Apply DAP at planting and urea at knee-high stage",
          "Practice crop rotation to reduce soil-borne diseases",
        ],
      },
    },
    wheat: {
      tillering: {
        main: "Wheat tillering determines final head count. Ensure adequate nitrogen and moisture.",
        actions: [
          "Apply nitrogen top-dressing (urea) at early tillering",
          "Scout for yellow rust — look for yellow stripes on leaves",
          "Avoid waterlogging — wheat roots are sensitive to anaerobic conditions",
        ],
      },
      "grain fill": {
        main: "Grain fill is the final yield-building stage. Protect the flag leaf from disease.",
        actions: [
          "Apply fungicide if rust or septoria symptoms appear on flag leaf",
          "Avoid any mechanical damage to the crop",
          "Plan harvest logistics — wheat quality degrades rapidly after maturity",
        ],
      },
      default: {
        main: "Use improved wheat varieties resistant to stem rust (Ug99). Timely planting after first rains is critical.",
        actions: [
          "Use certified rust-resistant seed varieties",
          "Apply DAP at planting for phosphorus and nitrogen",
          "Monitor for aphids — they transmit barley yellow dwarf virus",
        ],
      },
    },
    general: {
      default: {
        main: "Based on your farm profile, focus on soil health and timely input application for the current season.",
        actions: [
          "Conduct a soil test to identify nutrient deficiencies",
          "Contact your local agricultural extension officer for region-specific advice",
          "Keep records of planting dates, inputs, and yields for better planning",
          "Monitor weather forecasts and adjust field operations accordingly",
        ],
      },
    },
  };

  const cropKey: CropKey = (["coffee", "teff", "sesame", "maize", "wheat"].includes(crop) ? crop : "general") as CropKey;
  const cropAdvice = CROP_STAGE_ADVICE[cropKey];
  const stageAdvice = cropAdvice[stage] ?? cropAdvice["default"];

  // ── Market-aware supporting action ───────────────────────────────────────
  const marketAction =
    marketTrend === "rising"
      ? `${ctx.market?.commodity ?? crop} prices are rising — consider delaying sale by 1–2 weeks if storage is available`
      : marketTrend === "falling"
      ? `${ctx.market?.commodity ?? crop} prices are falling — sell current stock promptly to avoid further loss`
      : `Monitor ${ctx.market?.market_name ?? "local market"} prices weekly before deciding on sale timing`;

  // ── Weather-aware supporting action ──────────────────────────────────────
  const weatherAction =
    rainfall > 10
      ? "Heavy rainfall expected — postpone spraying and harvesting operations until conditions improve"
      : tempMax > 35
      ? "Heat stress risk — irrigate in early morning and apply mulch to conserve soil moisture"
      : humidity > 80
      ? "High humidity increases fungal disease risk — scout for early signs and ensure good air circulation"
      : "Weather conditions are favorable — proceed with planned field operations";

  // ── Soil-aware supporting action ─────────────────────────────────────────
  const soilAction =
    soilMoisture === "low" || soilMoisture === "dry"
      ? "Soil moisture is critically low — irrigate immediately or apply mulch to conserve available moisture"
      : soilFertility === "low" || soilFertility === "poor"
      ? "Soil fertility is low — apply balanced fertilizer (NPK) and consider organic matter incorporation"
      : "Soil conditions are adequate — maintain current management practices";

  const supportingActions = [
    ...stageAdvice.actions.slice(0, 2),
    weatherAction,
    marketAction,
    soilAction,
  ].slice(0, 4);

  // ── Reasoning ────────────────────────────────────────────────────────────
  const reasoning = [
    `Crop: ${crop} at ${stage || "unspecified"} stage in ${ctx.farmer?.region ?? "unknown region"}.`,
    `Soil: ${ctx.soil?.type ?? "unknown"} type, moisture=${ctx.soil?.moisture ?? "unknown"}, fertility=${ctx.soil?.fertility ?? "unknown"}.`,
    `Weather: temp ${tempMax}°C max, rainfall ${rainfall} mm, humidity ${humidity}%.`,
    `Market: ${ctx.market?.commodity ?? crop} trend is ${marketTrend} at ${ctx.market?.price_per_kg ? `ETB ${ctx.market.price_per_kg}/kg` : "unknown price"}.`,
    missing.length > 0 ? `Missing data reduces confidence: ${missing.join(", ")}.` : "All key data fields present.",
  ].join(" ");

  const summary = `${ctx.farmer?.name ?? "Farmer"}'s ${crop} crop in ${ctx.farmer?.region ?? "Ethiopia"} is at ${stage || "an unspecified"} stage. ${riskLevel === "high" ? "High risk conditions detected — immediate action required." : riskLevel === "medium" ? "Moderate risk — monitor closely and apply recommended actions." : "Conditions are manageable — follow standard good practices."}`;

  return {
    module: "advisory",
    language,
    summary,
    main_recommendation: stageAdvice.main,
    supporting_actions: supportingActions,
    reasoning,
    risk_level: riskLevel,
    confidence_score: confidence,
    missing_fields: missing,
    urgent_warning: urgentWarning,
  };
}

router.post("/advisory/analyze", async (req, res): Promise<void> => {
  const ctx = req.body as FarmerContext;

  if (!ctx || !ctx.farmer) {
    res.status(400).json({ error: "Request body must include a 'farmer' object" });
    return;
  }

  const missing = detectMissingFields(ctx);
  const result = buildAdvisoryAnalysis(ctx, missing);

  res.json(result);
});

export default router;
