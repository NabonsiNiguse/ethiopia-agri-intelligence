import { Router, type IRouter } from "express";
import { db, tractorsTable, bookingsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

// ─── Seed data when DB is empty ───────────────────────────────────────────────
const SEED_TRACTORS = [
  { id: -1, ownerId: 1, ownerName: "Girma Bekele", ownerPhone: "0911234567", model: "John Deere 5075E", year: 2021, horsepower: 75, region: "Oromia", woreda: "Jimma", pricePerDay: 2800, pricePerHectare: 650, available: true, rating: 4.8, totalJobs: 42, services: ["Plowing", "Harrowing", "Planting"], gpsLat: 7.67, gpsLng: 36.83 },
  { id: -2, ownerId: 2, ownerName: "Tadesse Alemu", ownerPhone: "0922345678", model: "Massey Ferguson 375", year: 2019, horsepower: 65, region: "Amhara", woreda: "Bahir Dar", pricePerDay: 2400, pricePerHectare: 580, available: true, rating: 4.5, totalJobs: 31, services: ["Plowing", "Harrowing", "Threshing"], gpsLat: 11.59, gpsLng: 37.39 },
  { id: -3, ownerId: 3, ownerName: "Chaltu Daba", ownerPhone: "0933456789", model: "New Holland TD5.75", year: 2022, horsepower: 75, region: "SNNPR", woreda: "Hawassa", pricePerDay: 3000, pricePerHectare: 700, available: true, rating: 4.9, totalJobs: 18, services: ["Plowing", "Harrowing", "Spraying", "Harvesting"], gpsLat: 7.06, gpsLng: 38.48 },
  { id: -4, ownerId: 4, ownerName: "Kebede Haile", ownerPhone: "0944567890", model: "Kubota M7060", year: 2020, horsepower: 70, region: "Oromia", woreda: "Nekemte", pricePerDay: 2600, pricePerHectare: 620, available: false, rating: 4.3, totalJobs: 55, services: ["Plowing", "Harrowing"], gpsLat: 9.09, gpsLng: 36.55 },
  { id: -5, ownerId: 5, ownerName: "Mulu Tesfaye", ownerPhone: "0955678901", model: "John Deere 5055E", year: 2018, horsepower: 55, region: "Tigray", woreda: "Mekelle", pricePerDay: 2200, pricePerHectare: 520, available: true, rating: 4.1, totalJobs: 27, services: ["Plowing", "Threshing"], gpsLat: 13.49, gpsLng: 39.47 },
  { id: -6, ownerId: 6, ownerName: "Abebe Worku", ownerPhone: "0966789012", model: "Massey Ferguson 290", year: 2017, horsepower: 60, region: "Amhara", woreda: "Gondar", pricePerDay: 2100, pricePerHectare: 500, available: true, rating: 4.0, totalJobs: 63, services: ["Plowing", "Harrowing", "Planting"], gpsLat: 12.60, gpsLng: 37.47 },
];

router.get("/logistics/tractors", async (req, res): Promise<void> => {
  const { region, available } = req.query as Record<string, string>;
  const tractors = await db.select().from(tractorsTable).orderBy(desc(tractorsTable.rating));

  if (tractors.length === 0) {
    // Return seed data
    let seed = SEED_TRACTORS;
    if (region) seed = seed.filter(t => t.region.toLowerCase().includes(region.toLowerCase()));
    if (available !== undefined) seed = seed.filter(t => t.available === (available === "true"));
    res.json({ tractors: seed, total: seed.length, synthetic: true });
    return;
  }

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
    .map((b) => ({ ...b, createdAt: b.createdAt.toISOString(), notes: b.notes ?? undefined }));

  res.json({ bookings: filtered, total: filtered.length });
});

router.post("/logistics/bookings", async (req, res): Promise<void> => {
  const { tractorId, farmerId, farmerName, serviceType, scheduledDate, durationDays, hectares, notes } = req.body;
  if (!tractorId || !farmerId || !serviceType || !scheduledDate) {
    res.status(400).json({ error: "tractorId, farmerId, serviceType, scheduledDate required" });
    return;
  }

  // Handle seed tractor bookings (negative IDs) — return mock confirmation
  if (parseInt(tractorId, 10) < 0) {
    const seed = SEED_TRACTORS.find(t => t.id === parseInt(tractorId, 10));
    const pricePerHa = seed?.pricePerHectare ?? 600;
    const totalCost = pricePerHa * (parseFloat(hectares) || 1) * (parseInt(durationDays, 10) || 1);
    res.status(201).json({
      id: Math.floor(Math.random() * -9000) - 1000,
      tractorId: parseInt(tractorId, 10), farmerId: parseInt(farmerId, 10),
      farmerName: farmerName ?? "Farmer", serviceType, scheduledDate,
      durationDays: parseInt(durationDays, 10) || 1,
      hectares: parseFloat(hectares) || 1,
      totalCost, status: "pending", notes: notes ?? null,
      createdAt: new Date().toISOString(),
    });
    return;
  }

  const [tractor] = await db.select().from(tractorsTable).where(eq(tractorsTable.id, tractorId));
  const totalCost = tractor ? tractor.pricePerHectare * (parseFloat(hectares) || 1) * (parseInt(durationDays, 10) || 1) : 1000;

  const [booking] = await db.insert(bookingsTable).values({
    tractorId, farmerId,
    farmerName: farmerName ?? "Farmer",
    serviceType, scheduledDate,
    durationDays: parseInt(durationDays, 10),
    hectares: parseFloat(hectares),
    totalCost, status: "pending",
    notes: notes ?? null,
  }).returning();

  res.status(201).json({ ...booking, createdAt: booking.createdAt.toISOString(), notes: booking.notes ?? undefined });
});

export default router;
