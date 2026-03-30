import { Router, type IRouter } from "express";
import { db, tractorsTable, bookingsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/logistics/tractors", async (req, res): Promise<void> => {
  const { region, available } = req.query as Record<string, string>;
  const tractors = await db.select().from(tractorsTable).orderBy(desc(tractorsTable.rating));

  const filtered = tractors
    .filter((t) => !region || t.region.toLowerCase().includes(region.toLowerCase()))
    .filter((t) => available === undefined || t.available === (available === "true"))
    .map((t) => ({
      ...t,
      services: t.services ?? [],
      woreda: t.woreda ?? undefined,
      gpsLat: t.gpsLat ?? undefined,
      gpsLng: t.gpsLng ?? undefined,
    }));

  res.json({ tractors: filtered, total: filtered.length });
});

router.post("/logistics/tractors", async (req, res): Promise<void> => {
  const { ownerId, ownerName, ownerPhone, model, year, horsepower, region, woreda, pricePerDay, pricePerHectare, services } = req.body;
  if (!ownerId || !model || !region || !pricePerDay) {
    res.status(400).json({ error: "ownerId, model, region, pricePerDay required" });
    return;
  }

  const [tractor] = await db.insert(tractorsTable).values({
    ownerId, ownerName: ownerName ?? "Owner", ownerPhone: ownerPhone ?? "",
    model, year: year ?? 2020, horsepower: horsepower ?? 60,
    region, woreda: woreda ?? null,
    pricePerDay: parseFloat(pricePerDay),
    pricePerHectare: parseFloat(pricePerHectare ?? pricePerDay),
    services: services ?? ["Plowing", "Harrowing"],
    available: true, rating: 4.0, totalJobs: 0,
  }).returning();

  res.status(201).json({ ...tractor, services: tractor.services ?? [], woreda: tractor.woreda ?? undefined });
});

router.get("/logistics/bookings", async (req, res): Promise<void> => {
  const { farmerId, status } = req.query as Record<string, string>;
  const bookings = await db.select().from(bookingsTable).orderBy(desc(bookingsTable.createdAt)).limit(100);

  const filtered = bookings
    .filter((b) => !farmerId || b.farmerId === parseInt(farmerId, 10))
    .filter((b) => !status || b.status === status)
    .map((b) => ({
      ...b,
      createdAt: b.createdAt.toISOString(),
      notes: b.notes ?? undefined,
    }));

  res.json({ bookings: filtered, total: filtered.length });
});

router.post("/logistics/bookings", async (req, res): Promise<void> => {
  const { tractorId, farmerId, farmerName, serviceType, scheduledDate, durationDays, hectares, notes } = req.body;
  if (!tractorId || !farmerId || !serviceType || !scheduledDate) {
    res.status(400).json({ error: "tractorId, farmerId, serviceType, scheduledDate required" });
    return;
  }

  const [tractor] = await db.select().from(tractorsTable).where(eq(tractorsTable.id, tractorId));
  const totalCost = tractor ? tractor.pricePerHectare * (parseFloat(hectares) || 1) * parseInt(durationDays, 10) : 1000;

  const [booking] = await db.insert(bookingsTable).values({
    tractorId, farmerId,
    farmerName: farmerName ?? "Farmer",
    serviceType, scheduledDate,
    durationDays: parseInt(durationDays, 10),
    hectares: parseFloat(hectares),
    totalCost,
    status: "pending",
    notes: notes ?? null,
  }).returning();

  res.status(201).json({ ...booking, createdAt: booking.createdAt.toISOString(), notes: booking.notes ?? undefined });
});

export default router;
