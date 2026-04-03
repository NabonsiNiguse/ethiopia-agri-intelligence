import { Router, type IRouter } from "express";
import { db, marketPricesTable } from "@workspace/db";
import { desc, sql } from "drizzle-orm";

const router: IRouter = Router();

// ─── Static seed data (used when DB is empty) ────────────────────────────────

const COMMODITY_META: Record<string, { amharic: string; oromo: string; unit: string; basePrices: Record<string, number> }> = {
  Coffee:  { amharic: "ቡና",   oromo: "Buna",       unit: "kg", basePrices: { Oromia: 88, Amhara: 82, SNNPR: 91, Tigray: 79 } },
  Teff:    { amharic: "ጤፍ",   oromo: "Xaafii",     unit: "kg", basePrices: { Oromia: 46, Amhara: 44, SNNPR: 48, Tigray: 42 } },
  Wheat:   { amharic: "ስንዴ",  oromo: "Qamadii",    unit: "kg", basePrices: { Oromia: 28, Amhara: 27, SNNPR: 29, Tigray: 26 } },
  Sesame:  { amharic: "ሰሊጥ",  oromo: "Simsima",    unit: "kg", basePrices: { Oromia: 62, Amhara: 58, SNNPR: 55, Tigray: 65 } },
  Maize:   { amharic: "በቆሎ",  oromo: "Boqqolloo",  unit: "kg", basePrices: { Oromia: 18, Amhara: 17, SNNPR: 19, Tigray: 16 } },
  Sorghum: { amharic: "ማሽላ",  oromo: "Daguusa",    unit: "kg", basePrices: { Oromia: 15, Amhara: 14, SNNPR: 16, Tigray: 13 } },
  Barley:  { amharic: "ገብስ",  oromo: "Garbuu",     unit: "kg", basePrices: { Oromia: 22, Amhara: 21, SNNPR: 23, Tigray: 20 } },
};

const MARKETS_BY_REGION: Record<string, string[]> = {
  Oromia: ["Addis Ababa ECX", "Jimma Market", "Dire Dawa Market", "Nekemte Market", "Shashemene Market"],
  Amhara: ["Bahir Dar Market", "Gondar Market", "Dessie Market", "Debre Markos Market"],
  SNNPR:  ["Hawassa Market", "Wolaita Sodo Market", "Arba Minch Market", "Dilla Market"],
  Tigray: ["Mekelle Market", "Axum Market", "Adwa Market"],
};

/** Generate deterministic-ish price variation per market */
function marketVariation(market: string, commodity: string, dayOffset = 0): number {
  const seed = (market.charCodeAt(0) + commodity.charCodeAt(0) + dayOffset) % 17;
  return (seed - 8) * 0.4; // -3.2 to +3.2 ETB variation
}

/** Build synthetic price history for 30 days */
function buildPriceHistory(commodity: string, region: string, days = 30) {
  const meta = COMMODITY_META[commodity];
  const base = meta?.basePrices[region] ?? 40;
  const history: { date: string; price: number }[] = [];

  let price = base * 0.92; // start slightly below current
  for (let i = days; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    // Random walk with slight upward drift
    price += (Math.random() - 0.47) * (base * 0.03);
    price = Math.max(base * 0.75, Math.min(base * 1.25, price));
    history.push({ date: d.toISOString().split("T")[0]!, price: Math.round(price * 100) / 100 });
  }
  return history;
}

// ─── Function 1: Real-time commodity prices across regions ───────────────────
// GET /api/market/realtime?regions=Oromia,Amhara,SNNPR
router.get("/market/realtime", async (req, res): Promise<void> => {
  const regionsParam = (req.query.regions as string) ?? "Oromia,Amhara,SNNPR";
  const targetRegions = regionsParam.split(",").map((r) => r.trim());
  const commodities = Object.keys(COMMODITY_META);

  // Pull latest price per commodity+region from DB
  const dbPrices = await db
    .select()
    .from(marketPricesTable)
    .orderBy(desc(marketPricesTable.reportedAt))
    .limit(500);

  const result: Record<string, {
    commodity: string; commodityAmharic: string; commodityOromo: string;
    regions: Record<string, { price: number; unit: string; change: number; changePercent: number; lastUpdated: string; market: string; source: string }>;
  }> = {};

  for (const commodity of commodities) {
    const meta = COMMODITY_META[commodity]!;
    result[commodity] = {
      commodity,
      commodityAmharic: meta.amharic,
      commodityOromo: meta.oromo,
      regions: {},
    };

    for (const region of targetRegions) {
      // Find latest DB entry for this commodity+region
      const dbEntry = dbPrices.find(
        (p) =>
          p.commodity.toLowerCase() === commodity.toLowerCase() &&
          p.region.toLowerCase().includes(region.toLowerCase()),
      );

      if (dbEntry) {
        result[commodity]!.regions[region] = {
          price: dbEntry.pricePerKg,
          unit: dbEntry.unit,
          change: dbEntry.change ?? 0,
          changePercent: Math.round((dbEntry.changePercent ?? 0) * 100) / 100,
          lastUpdated: dbEntry.reportedAt.toISOString(),
          market: dbEntry.market,
          source: dbEntry.source,
        };
      } else {
        // Synthetic fallback with realistic variation
        const base = meta.basePrices[region] ?? 40;
        const variation = marketVariation(region, commodity);
        const price = Math.round((base + variation) * 100) / 100;
        const prevPrice = Math.round((base + marketVariation(region, commodity, 1)) * 100) / 100;
        const change = Math.round((price - prevPrice) * 100) / 100;
        const changePercent = Math.round((change / prevPrice) * 10000) / 100;

        result[commodity]!.regions[region] = {
          price,
          unit: meta.unit,
          change,
          changePercent,
          lastUpdated: new Date().toISOString(),
          market: MARKETS_BY_REGION[region]?.[0] ?? `${region} Central Market`,
          source: "synthetic",
        };
      }
    }
  }

  res.json({
    data: Object.values(result),
    regions: targetRegions,
    generatedAt: new Date().toISOString(),
    note: dbPrices.length === 0 ? "No DB data — showing synthetic prices. Add real prices via POST /api/market/prices." : undefined,
  });
});

// ─── Function 2: 30-day price trend for commodity+region ────────────────────
// GET /api/market/trend?commodity=Coffee&region=Oromia&days=30
router.get("/market/trend", async (req, res): Promise<void> => {
  const { commodity, region, days: daysParam = "30" } = req.query as Record<string, string>;
  if (!commodity || !region) {
    res.status(400).json({ error: "commodity and region are required" });
    return;
  }

  const days = Math.min(90, Math.max(7, parseInt(daysParam, 10)));
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const dbPrices = await db
    .select()
    .from(marketPricesTable)
    .orderBy(desc(marketPricesTable.reportedAt))
    .limit(500);

  const filtered = dbPrices.filter(
    (p) =>
      p.commodity.toLowerCase() === commodity.toLowerCase() &&
      p.region.toLowerCase().includes(region.toLowerCase()) &&
      new Date(p.reportedAt) >= cutoff,
  );

  // Build daily price series — use DB data if available, else synthetic
  let history: { date: string; price: number }[];

  if (filtered.length >= 3) {
    // Group by date, take average per day
    const byDate: Record<string, number[]> = {};
    for (const p of filtered) {
      const d = p.reportedAt.toISOString().split("T")[0]!;
      if (!byDate[d]) byDate[d] = [];
      byDate[d]!.push(p.pricePerKg);
    }
    history = Object.entries(byDate)
      .map(([date, prices]) => ({
        date,
        price: Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } else {
    history = buildPriceHistory(commodity, region, days);
  }

  if (history.length < 2) {
    res.status(404).json({ error: "Insufficient price history for trend calculation" });
    return;
  }

  const firstPrice = history[0]!.price;
  const lastPrice = history[history.length - 1]!.price;
  const changePercent = Math.round(((lastPrice - firstPrice) / firstPrice) * 10000) / 100;

  // Trend direction with hysteresis
  const direction: "up" | "down" | "stable" =
    changePercent > 2 ? "up" : changePercent < -2 ? "down" : "stable";

  // Simple linear regression for confidence
  const n = history.length;
  const xMean = (n - 1) / 2;
  const yMean = history.reduce((s, p) => s + p.price, 0) / n;
  const slope =
    history.reduce((s, p, i) => s + (i - xMean) * (p.price - yMean), 0) /
    history.reduce((s, _, i) => s + (i - xMean) ** 2, 0);

  const weeklyChange = Math.round(slope * 7 * 100) / 100;

  // Seasonal insight
  const month = new Date().getMonth() + 1;
  const seasonalInsights: Record<string, string> = {
    Coffee:  month >= 10 ? "Harvest season — supply increasing, prices may soften" : "Pre-harvest — supply tight, prices firm",
    Teff:    month >= 10 && month <= 11 ? "Meher harvest — peak supply period" : "Off-season — prices typically higher",
    Sesame:  month >= 9 && month <= 10 ? "Harvest season — sell promptly" : "Off-season — limited supply",
    Wheat:   month >= 10 && month <= 11 ? "Harvest season — prices at seasonal low" : "Growing season — prices rising",
    default: "Monitor ECX for official benchmark prices",
  };

  res.json({
    commodity,
    region,
    days,
    trend: {
      direction,
      changePercent,
      firstPrice,
      lastPrice,
      weeklyProjectedChange: weeklyChange,
    },
    history,
    insight: seasonalInsights[commodity] ?? seasonalInsights.default,
    dataSource: filtered.length >= 3 ? "database" : "synthetic",
  });
});

// ─── Function 3: Cross-market price comparison for commodity in region ───────
// GET /api/market/compare?commodity=Coffee&region=Oromia
router.get("/market/compare", async (req, res): Promise<void> => {
  const { commodity, region } = req.query as Record<string, string>;
  if (!commodity || !region) {
    res.status(400).json({ error: "commodity and region are required" });
    return;
  }

  const meta = COMMODITY_META[commodity];
  const markets = MARKETS_BY_REGION[region] ?? [`${region} Central Market`];

  const dbPrices = await db
    .select()
    .from(marketPricesTable)
    .orderBy(desc(marketPricesTable.reportedAt))
    .limit(300);

  const regionPrices = dbPrices.filter(
    (p) =>
      p.commodity.toLowerCase() === commodity.toLowerCase() &&
      p.region.toLowerCase().includes(region.toLowerCase()),
  );

  // Build one entry per market
  const tableData = markets.map((market) => {
    const dbEntry = regionPrices.find((p) => p.market.toLowerCase().includes(market.split(" ")[0]!.toLowerCase()));

    if (dbEntry) {
      return {
        market: dbEntry.market,
        price: dbEntry.pricePerKg,
        unit: dbEntry.unit,
        change: dbEntry.change ?? 0,
        changePercent: Math.round((dbEntry.changePercent ?? 0) * 100) / 100,
        lastUpdated: dbEntry.reportedAt.toISOString(),
        source: "database",
      };
    }

    // Synthetic per-market variation
    const base = meta?.basePrices[region] ?? 40;
    const v = marketVariation(market, commodity);
    const price = Math.round((base + v) * 100) / 100;
    const prevPrice = Math.round((base + marketVariation(market, commodity, 1)) * 100) / 100;
    const change = Math.round((price - prevPrice) * 100) / 100;
    const changePercent = Math.round((change / prevPrice) * 10000) / 100;

    return {
      market,
      price,
      unit: meta?.unit ?? "kg",
      change,
      changePercent,
      lastUpdated: new Date().toISOString(),
      source: "synthetic",
    };
  });

  // Sort by price descending (best market first)
  tableData.sort((a, b) => b.price - a.price);

  const prices = tableData.map((d) => d.price);
  const avgPrice = Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100;
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  const bestMarket = tableData[0]!.market;
  const spread = Math.round((maxPrice - minPrice) * 100) / 100;

  res.json({
    commodity,
    commodityAmharic: meta?.amharic,
    region,
    markets: tableData,
    summary: {
      avgPrice,
      maxPrice,
      minPrice,
      spread,
      bestMarket,
      recommendation: spread > avgPrice * 0.05
        ? `Price spread of ${spread} ETB/kg across markets — sell at ${bestMarket} for best return`
        : `Prices are consistent across ${region} markets — choose nearest market`,
    },
    generatedAt: new Date().toISOString(),
  });
});

// ─── Existing endpoints (preserved) ─────────────────────────────────────────

router.get("/market/prices", async (req, res): Promise<void> => {
  const { commodity, region } = req.query as Record<string, string>;

  const all = await db.select().from(marketPricesTable).orderBy(desc(marketPricesTable.reportedAt)).limit(200);

  const filtered = all
    .filter((p) => !commodity || p.commodity.toLowerCase().includes(commodity.toLowerCase()))
    .filter((p) => !region || p.region.toLowerCase().includes(region.toLowerCase()));

  // If DB is empty, return synthetic prices for the region
  if (filtered.length === 0 && region) {
    const syntheticPrices = Object.entries(COMMODITY_META).flatMap(([comm, meta], idx) => {
      const regionMarkets = MARKETS_BY_REGION[region] ?? [`${region} Market`];
      return regionMarkets.slice(0, 2).map((market, mi) => {
        const base = meta.basePrices[region] ?? 40;
        const v = marketVariation(market, comm, mi);
        const price = Math.round((base + v) * 100) / 100;
        const prevPrice = Math.round((base + marketVariation(market, comm, mi + 1)) * 100) / 100;
        const change = Math.round((price - prevPrice) * 100) / 100;
        const changePercent = Math.round((change / prevPrice) * 10000) / 100;
        return {
          id: -(idx * 10 + mi + 1),
          commodity: comm,
          commodityAmharic: meta.amharic,
          commodityOromo: meta.oromo,
          market,
          region,
          pricePerKg: price,
          currency: "ETB",
          unit: meta.unit,
          change,
          changePercent,
          reportedAt: new Date().toISOString(),
          source: "synthetic",
        };
      });
    });
    res.json({ prices: syntheticPrices, total: syntheticPrices.length, lastUpdated: new Date().toISOString(), synthetic: true });
    return;
  }

  const mapped = filtered.map((p) => ({
    ...p,
    reportedAt: p.reportedAt.toISOString(),
    change: p.change ?? 0,
    changePercent: p.changePercent ?? 0,
    commodityAmharic: p.commodityAmharic ?? undefined,
    commodityOromo: p.commodityOromo ?? undefined,
    reportedById: p.reportedById ?? undefined,
  }));

  res.json({ prices: mapped, total: mapped.length, lastUpdated: new Date().toISOString() });
});

router.post("/market/prices", async (req, res): Promise<void> => {
  const { commodity, market, region, pricePerKg, unit, reportedById } = req.body;
  if (!commodity || !market || !region || !pricePerKg) {
    res.status(400).json({ error: "commodity, market, region, pricePerKg required" });
    return;
  }

  const recentPrices = await db
    .select()
    .from(marketPricesTable)
    .where(sql`lower(${marketPricesTable.commodity}) = lower(${commodity}) and lower(${marketPricesTable.region}) like ${"%" + region.toLowerCase() + "%"}`)
    .orderBy(desc(marketPricesTable.reportedAt))
    .limit(1);

  const prevPrice = recentPrices[0]?.pricePerKg;
  const parsedPrice = parseFloat(pricePerKg);
  const change = prevPrice ? Math.round((parsedPrice - prevPrice) * 100) / 100 : 0;
  const changePercent = prevPrice ? Math.round(((change / prevPrice) * 100) * 100) / 100 : 0;

  const meta = COMMODITY_META[commodity];

  const [price] = await db.insert(marketPricesTable).values({
    commodity,
    commodityAmharic: meta?.amharic ?? null,
    commodityOromo: meta?.oromo ?? null,
    market,
    region,
    pricePerKg: parsedPrice,
    unit: unit ?? meta?.unit ?? "kg",
    currency: "ETB",
    change,
    changePercent,
    reportedById: reportedById ?? null,
    source: "farmer_report",
  }).returning();

  res.status(201).json({
    ...price,
    reportedAt: price.reportedAt.toISOString(),
    change: price.change ?? 0,
    changePercent: price.changePercent ?? 0,
  });
});

router.get("/market/trends", async (req, res): Promise<void> => {
  const { commodity, period = "month", region } = req.query as Record<string, string>;
  if (!commodity) { res.status(400).json({ error: "commodity is required" }); return; }

  const targetRegion = region ?? "Oromia";
  const days = period === "week" ? 7 : period === "quarter" ? 90 : 30;

  // Delegate to the trend function logic
  const history = buildPriceHistory(commodity, targetRegion, days);
  const firstPrice = history[0]!.price;
  const lastPrice = history[history.length - 1]!.price;
  const changePercent = ((lastPrice - firstPrice) / firstPrice) * 100;
  const trend = changePercent > 2 ? "rising" : changePercent < -2 ? "falling" : "stable";

  const dataPoints = history.map((h) => ({
    date: h.date,
    avgPrice: h.price,
    minPrice: Math.round((h.price * 0.94) * 100) / 100,
    maxPrice: Math.round((h.price * 1.08) * 100) / 100,
  }));

  const prediction30Days = Math.round(lastPrice * (1 + (changePercent / 100) * 0.5) * 100) / 100;

  res.json({
    commodity,
    region: targetRegion,
    period,
    dataPoints,
    prediction30Days,
    trend,
    changePercent: Math.round(changePercent * 100) / 100,
    insights: [
      `${commodity} prices are ${trend} in ${targetRegion} over the past ${period} (${changePercent > 0 ? "+" : ""}${changePercent.toFixed(1)}%)`,
      trend === "rising"
        ? "Consider holding stock for 1–2 weeks if storage is available"
        : trend === "falling"
        ? "Sell promptly — prices are declining"
        : "Stable market — sell at your convenience",
      "Monitor Addis Ababa Mercantile Exchange (ECX) for official benchmark prices",
    ],
  });
});

// ─── Market Strategy (preserved) ─────────────────────────────────────────────

interface PricePoint { date?: string; price?: number }
interface MarketStrategyInput {
  crop?: string; region?: string; language?: string;
  current_price?: number; price_history?: PricePoint[];
  supply_trend?: string; demand_trend?: string; harvest_period?: string;
}

function detectTrend(currentPrice: number, history: PricePoint[]): "rising" | "falling" | "stable" {
  if (!history || history.length < 2) return "stable";
  const prices = history.filter((p) => p.price != null).map((p) => p.price as number);
  if (prices.length < 2) return "stable";
  const third = Math.max(1, Math.floor(prices.length / 3));
  const earlyAvg = prices.slice(0, third).reduce((a, b) => a + b, 0) / third;
  const recentAvg = prices.slice(-third).reduce((a, b) => a + b, 0) / third;
  const changePct = ((recentAvg - earlyAvg) / earlyAvg) * 100;
  const lastHistorical = prices[prices.length - 1]!;
  const currentVsLast = ((currentPrice - lastHistorical) / lastHistorical) * 100;
  const combined = (changePct + currentVsLast) / 2;
  return combined > 3 ? "rising" : combined < -3 ? "falling" : "stable";
}

function computeOpportunityScore(trend: "rising" | "falling" | "stable", supply: string, demand: string, currentPrice: number, history: PricePoint[]): number {
  let score = 50;
  if (trend === "rising") score += 20; else if (trend === "falling") score -= 20;
  if (supply === "decreasing") score += 10; if (supply === "increasing") score -= 10;
  if (demand === "increasing") score += 10; if (demand === "decreasing") score -= 10;
  if (history.length > 0) {
    const valid = history.filter((p) => p.price != null).map((p) => p.price as number);
    if (valid.length > 0) {
      const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
      const vsAvg = ((currentPrice - avg) / avg) * 100;
      if (vsAvg > 10) score += 10; else if (vsAvg < -10) score -= 10;
    }
  }
  return Math.min(100, Math.max(0, Math.round(score)));
}

router.post("/market/strategy", (req, res): void => {
  const input = req.body as MarketStrategyInput;
  if (!input?.crop || input?.current_price == null) {
    res.status(400).json({ error: "crop and current_price are required" });
    return;
  }

  const crop = input.crop;
  const currentPrice = input.current_price;
  const history = input.price_history ?? [];
  const supply = (input.supply_trend ?? "stable").toLowerCase();
  const demand = (input.demand_trend ?? "stable").toLowerCase();
  const harvest = input.harvest_period ?? "the current season";
  const language = input.language ?? "en";
  const trend = detectTrend(currentPrice, history);
  const opportunityScore = computeOpportunityScore(trend, supply, demand, currentPrice, history);

  let recommendation: string, reason: string, bestSellWindow: string, riskNote: string;

  if (trend === "rising" && opportunityScore >= 65) {
    recommendation = "Wait 1–2 weeks before selling";
    reason = `${crop} prices are rising${demand === "increasing" ? " and buyer demand is growing" : ""}. Supply is ${supply}.`;
    bestSellWindow = `Sell within the next 2–3 weeks, before post-harvest supply pressure builds`;
    riskNote = `Do not hold beyond ${harvest} — supply surge will push prices down.`;
  } else if (trend === "falling" && opportunityScore <= 40) {
    recommendation = "Sell now — prices are declining";
    reason = `${crop} prices are falling${supply === "increasing" ? " as supply increases" : ""}. ${demand === "decreasing" ? "Demand is also weakening." : ""}`;
    bestSellWindow = `Sell within the next 3–5 days`;
    riskNote = `Continued holding risks a 10–20% further price drop plus storage costs.`;
  } else if (trend === "stable" && opportunityScore >= 50) {
    recommendation = "Sell gradually over the next 2–4 weeks";
    reason = `Prices are stable. Spreading sales reduces risk and captures any upside.`;
    bestSellWindow = `Sell 30–40% now, reassess weekly`;
    riskNote = `Post-harvest supply in ${harvest} may soften prices.`;
  } else if (trend === "rising") {
    recommendation = "Sell gradually — modest improvement expected";
    reason = `Prices are rising slightly but signal is weak. Sell part now, hold the rest.`;
    bestSellWindow = `Sell 50% now, remainder within 2 weeks`;
    riskNote = `Price rises can reverse quickly if supply increases.`;
  } else {
    recommendation = "Sell now at current market price";
    reason = `Conditions do not favor waiting. Lock in current price.`;
    bestSellWindow = `Sell within the next week`;
    riskNote = `Holding carries storage cost and quality risk.`;
  }

  res.json({ module: "market", language, trend, recommendation, reason, best_sell_window: bestSellWindow, opportunity_score: opportunityScore, risk_note: riskNote });
});

export default router;
