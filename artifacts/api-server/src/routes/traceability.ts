import { Router, type IRouter } from "express";
import { db, cropBatchesTable, supplyChainEventsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { randomUUID, createHash } from "crypto";

const router: IRouter = Router();

function generateBlockchainHash(data: string): string {
  return createHash("sha256").update(data + Date.now()).digest("hex");
}

router.get("/traceability/batches", async (req, res): Promise<void> => {
  const { farmerId, cropType } = req.query as Record<string, string>;
  const batches = await db.select().from(cropBatchesTable).orderBy(desc(cropBatchesTable.createdAt)).limit(100);

  const filtered = batches
    .filter((b) => !farmerId || b.farmerId === parseInt(farmerId, 10))
    .filter((b) => !cropType || b.cropType === cropType)
    .map((b) => ({
      ...b,
      createdAt: b.createdAt.toISOString(),
      variety: b.variety ?? undefined,
      grade: b.grade ?? undefined,
      blockchainHash: b.blockchainHash ?? undefined,
      blockchainTxId: b.blockchainTxId ?? undefined,
      woreda: b.woreda ?? undefined,
    }));

  res.json({ batches: filtered, total: filtered.length });
});

router.post("/traceability/batches", async (req, res): Promise<void> => {
  const { farmerId, cropType, variety, quantityKg, harvestDate, region, woreda } = req.body;
  if (!farmerId || !cropType || !quantityKg || !harvestDate || !region) {
    res.status(400).json({ error: "farmerId, cropType, quantityKg, harvestDate, region required" });
    return;
  }

  const blockchainHash = generateBlockchainHash(`${farmerId}${cropType}${harvestDate}${quantityKg}`);

  const [batch] = await db.insert(cropBatchesTable).values({
    farmerId,
    farmerName: req.body.farmerName ?? "Farmer",
    cropType, variety: variety ?? null,
    quantityKg: parseFloat(quantityKg),
    harvestDate, region,
    woreda: woreda ?? null,
    blockchainHash,
    blockchainTxId: `0x${blockchainHash.substring(0, 40)}`,
    status: "harvested",
  }).returning();

  await db.insert(supplyChainEventsTable).values({
    batchId: batch.id,
    eventType: "HARVEST",
    description: `${cropType} harvested in ${region}`,
    location: woreda ? `${woreda}, ${region}` : region,
    actor: req.body.farmerName ?? "Farmer",
    blockchainHash,
    verified: "true",
  });

  res.status(201).json({
    ...batch,
    createdAt: batch.createdAt.toISOString(),
    variety: batch.variety ?? undefined,
    grade: batch.grade ?? undefined,
    blockchainHash: batch.blockchainHash ?? undefined,
    blockchainTxId: batch.blockchainTxId ?? undefined,
    woreda: batch.woreda ?? undefined,
  });
});

router.get("/traceability/batches/:id/trace", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const [batch] = await db.select().from(cropBatchesTable).where(eq(cropBatchesTable.id, raw));
  if (!batch) { res.status(404).json({ error: "Batch not found" }); return; }

  const events = await db.select().from(supplyChainEventsTable)
    .where(eq(supplyChainEventsTable.batchId, raw))
    .orderBy(supplyChainEventsTable.timestamp);

  const mapped = events.map((e) => ({
    ...e,
    timestamp: e.timestamp.toISOString(),
    verified: e.verified === "true",
    blockchainHash: e.blockchainHash ?? undefined,
  }));

  res.json({
    batchId: raw,
    cropType: batch.cropType,
    farmerName: batch.farmerName,
    originRegion: batch.region,
    events: mapped,
    currentStatus: batch.status,
    verificationUrl: `https://explorer.agri-eth.example.com/batch/${raw}`,
  });
});

export default router;
