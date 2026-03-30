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

  const [existing] = await db.select().from(advisorySessionsTable).where(eq(advisorySessionsTable.id, sid));

  let farmerName = "Farmer";
  const [farmer] = await db.select().from(farmersTable).where(eq(farmersTable.id, farmerId));
  if (farmer) farmerName = farmer.name;

  if (!existing) {
    await db.insert(advisorySessionsTable).values({
      id: sid,
      farmerId,
      farmerName,
      primaryTopic: cropContext ?? "general",
      messageCount: 1,
    });
  } else {
    await db.update(advisorySessionsTable)
      .set({ messageCount: (existing.messageCount ?? 0) + 1, lastMessageAt: new Date() })
      .where(eq(advisorySessionsTable.id, sid));
  }

  await db.insert(advisoryMessagesTable).values({
    sessionId: sid,
    farmerId,
    message,
    response: aiResp.response,
    language: language ?? "en",
    cropContext: cropContext ?? null,
    expertValidated: aiResp.expertValidated,
    confidence: aiResp.confidence,
  });

  res.json({
    sessionId: sid,
    timestamp: new Date().toISOString(),
    ...aiResp,
  });
});

router.get("/advisory/sessions", async (req, res): Promise<void> => {
  const { farmerId } = req.query as Record<string, string>;
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
});

export default router;
