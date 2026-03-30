import { Router, type IRouter } from "express";
import { db, farmersTable } from "@workspace/db";
import { eq, like, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/farmers", async (req, res): Promise<void> => {
  const { region, cropType, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = parseInt(page, 10);
  const limitNum = Math.min(parseInt(limit, 10), 100);
  const offset = (pageNum - 1) * limitNum;

  let query = db.select().from(farmersTable);
  const conditions = [];
  if (region) conditions.push(like(farmersTable.region, `%${region}%`));

  const total = await db.select({ count: sql<number>`count(*)` }).from(farmersTable);
  const farmers = await db.select().from(farmersTable).limit(limitNum).offset(offset);

  const mapped = farmers.map((f) => ({
    ...f,
    primaryCrops: f.primaryCrops ?? [],
    landSizeHectares: f.landSizeHectares ?? undefined,
    woreda: f.woreda ?? undefined,
    zone: f.zone ?? undefined,
    gpsLat: f.gpsLat ?? undefined,
    gpsLng: f.gpsLng ?? undefined,
    registeredAt: f.registeredAt.toISOString(),
  }));

  res.json({ farmers: mapped, total: Number(total[0]?.count ?? 0), page: pageNum, limit: limitNum });
});

router.get("/farmers/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [farmer] = await db.select().from(farmersTable).where(eq(farmersTable.id, id));
  if (!farmer) { res.status(404).json({ error: "Farmer not found" }); return; }

  res.json({
    ...farmer,
    primaryCrops: farmer.primaryCrops ?? [],
    registeredAt: farmer.registeredAt.toISOString(),
    landSizeHectares: farmer.landSizeHectares ?? undefined,
    woreda: farmer.woreda ?? undefined,
    zone: farmer.zone ?? undefined,
    gpsLat: farmer.gpsLat ?? undefined,
    gpsLng: farmer.gpsLng ?? undefined,
  });
});

router.post("/farmers", async (req, res): Promise<void> => {
  const { name, phone, region, woreda, zone, landSizeHectares, primaryCrops, preferredLanguage, hasSmartphone, gpsLat, gpsLng } = req.body;
  if (!name || !phone || !region) { res.status(400).json({ error: "name, phone, region required" }); return; }

  const [farmer] = await db.insert(farmersTable).values({
    name, phone, region,
    woreda: woreda ?? null,
    zone: zone ?? null,
    landSizeHectares: landSizeHectares ?? null,
    primaryCrops: primaryCrops ?? [],
    preferredLanguage: preferredLanguage ?? "en",
    hasSmartphone: hasSmartphone ?? false,
    gpsLat: gpsLat ?? null,
    gpsLng: gpsLng ?? null,
  }).returning();

  res.status(201).json({ ...farmer, primaryCrops: farmer.primaryCrops ?? [], registeredAt: farmer.registeredAt.toISOString() });
});

export default router;
