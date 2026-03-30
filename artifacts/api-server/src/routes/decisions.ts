import { Router, type IRouter } from "express";
import { db, farmersTable, marketPricesTable } from "@workspace/db";
import { desc, sql } from "drizzle-orm";

const router: IRouter = Router();

interface WeatherCondition {
  condition: string;
  rainfall: number;
  temperature: number;
  humidity: number;
}

interface CropScore {
  crop: string;
  baseScore: number;
  weatherMultiplier: number;
  marketMultiplier: number;
  seasonMultiplier: number;
}

const CROP_BASE_DATA: Record<string, CropScore> = {
  coffee: { crop: "Coffee", baseScore: 78, weatherMultiplier: 1.0, marketMultiplier: 1.0, seasonMultiplier: 1.0 },
  teff: { crop: "Teff", baseScore: 82, weatherMultiplier: 1.0, marketMultiplier: 1.0, seasonMultiplier: 1.0 },
  sesame: { crop: "Sesame", baseScore: 74, weatherMultiplier: 1.0, marketMultiplier: 1.0, seasonMultiplier: 1.0 },
  maize: { crop: "Maize", baseScore: 85, weatherMultiplier: 1.0, marketMultiplier: 1.0, seasonMultiplier: 1.0 },
  wheat: { crop: "Wheat", baseScore: 79, weatherMultiplier: 1.0, marketMultiplier: 1.0, seasonMultiplier: 1.0 },
  sorghum: { crop: "Sorghum", baseScore: 76, weatherMultiplier: 1.0, marketMultiplier: 1.0, seasonMultiplier: 1.0 },
  barley: { crop: "Barley", baseScore: 73, weatherMultiplier: 1.0, marketMultiplier: 1.0, seasonMultiplier: 1.0 },
};

const REGION_WEATHER: Record<string, WeatherCondition> = {
  oromia: { condition: "Partly Cloudy", rainfall: 68, temperature: 22, humidity: 72 },
  amhara: { condition: "Moderate Rain", rainfall: 85, temperature: 18, humidity: 80 },
  snnpr: { condition: "Sunny", rainfall: 45, temperature: 26, humidity: 60 },
  tigray: { condition: "Dry", rainfall: 22, temperature: 28, humidity: 40 },
  afar: { condition: "Very Dry", rainfall: 8, temperature: 35, humidity: 25 },
  somali: { condition: "Hot and Dry", rainfall: 12, temperature: 32, humidity: 30 },
  benishangul: { condition: "Humid", rainfall: 90, temperature: 24, humidity: 85 },
  gambela: { condition: "Rainy", rainfall: 95, temperature: 27, humidity: 88 },
};

function getWeatherScore(weather: WeatherCondition, crop: string): number {
  const { rainfall, temperature, humidity } = weather;
  let score = 1.0;

  if (crop === "coffee") {
    score = rainfall > 60 && rainfall < 90 ? 1.15 : rainfall < 30 ? 0.70 : 0.90;
    if (temperature < 18 || temperature > 28) score *= 0.85;
  } else if (crop === "teff") {
    score = rainfall > 40 && rainfall < 80 ? 1.12 : rainfall > 90 ? 0.80 : 0.95;
    if (temperature < 10 || temperature > 30) score *= 0.80;
  } else if (crop === "sesame") {
    score = rainfall < 50 ? 1.10 : rainfall > 80 ? 0.75 : 0.95;
    if (temperature < 20) score *= 0.85;
  } else if (crop === "maize") {
    score = rainfall > 50 && rainfall < 85 ? 1.10 : rainfall < 30 ? 0.65 : 0.90;
    if (humidity < 40) score *= 0.80;
  } else {
    score = rainfall > 40 && rainfall < 75 ? 1.05 : 0.90;
  }

  return Math.min(1.3, Math.max(0.5, score));
}

function getMarketScore(changePercent: number): number {
  if (changePercent > 5) return 1.20;
  if (changePercent > 2) return 1.10;
  if (changePercent > 0) return 1.05;
  if (changePercent > -3) return 0.95;
  return 0.80;
}

function getSeasonScore(crop: string, month: number): number {
  const planting: Record<string, number[]> = {
    coffee: [3, 4, 5, 9, 10],
    teff: [6, 7, 8],
    sesame: [5, 6, 7],
    maize: [3, 4, 5, 6],
    wheat: [9, 10, 11],
    sorghum: [6, 7, 8],
    barley: [9, 10, 11],
  };
  const optimal = planting[crop] ?? [4, 5, 6, 7];
  return optimal.includes(month) ? 1.10 : 0.90;
}

function generateExplanation(
  crop: string,
  score: number,
  weather: WeatherCondition,
  changePercent: number,
  region: string
): string {
  const level = score >= 80 ? "strong" : score >= 65 ? "moderate" : "low";
  const weatherText = weather.rainfall > 60
    ? `adequate rainfall (${weather.rainfall}mm) in ${region}`
    : `limited rainfall (${weather.rainfall}mm) in ${region}`;
  const marketText = changePercent > 0
    ? `rising market prices (+${changePercent.toFixed(1)}%)`
    : `declining market prices (${changePercent.toFixed(1)}%)`;

  return `${crop.charAt(0).toUpperCase() + crop.slice(1)} shows ${level} success probability for ${region} region. Current ${weatherText} is ${weather.rainfall > 50 ? "favorable" : "challenging"} for ${crop} cultivation. ${marketText.charAt(0).toUpperCase() + marketText.slice(1)} influence expected returns. Temperature of ${weather.temperature}°C is ${weather.temperature > 15 && weather.temperature < 30 ? "within optimal range" : "outside optimal range"} for this crop.`;
}

router.post("/decisions/crop-score", async (req, res): Promise<void> => {
  const { crop = "maize", region = "oromia", farmerId } = req.body as {
    crop?: string;
    region?: string;
    farmerId?: number;
  };

  const cropKey = crop.toLowerCase();
  const regionKey = region.toLowerCase();
  const cropData = CROP_BASE_DATA[cropKey] ?? CROP_BASE_DATA["maize"]!;
  const weather = REGION_WEATHER[regionKey] ?? REGION_WEATHER["oromia"]!;

  const marketData = await db
    .select()
    .from(marketPricesTable)
    .where(sql`lower(${marketPricesTable.commodity}) like ${"%" + cropKey + "%"}`)
    .orderBy(desc(marketPricesTable.reportedAt))
    .limit(1);

  const changePercent = marketData[0]?.changePercent ?? 2.5;
  const currentPrice = marketData[0]?.pricePerKg ?? 45;
  const month = new Date().getMonth() + 1;

  const weatherScore = getWeatherScore(weather, cropKey);
  const marketScore = getMarketScore(Number(changePercent));
  const seasonScore = getSeasonScore(cropKey, month);

  const rawScore = cropData.baseScore * weatherScore * marketScore * seasonScore;
  const finalScore = Math.min(97, Math.max(30, Math.round(rawScore)));

  const riskLevel = finalScore >= 80 ? "Low" : finalScore >= 60 ? "Medium" : "High";
  const recommendation = finalScore >= 75 ? "Proceed with planting" : finalScore >= 55 ? "Proceed with caution" : "Consider alternative crops";

  res.json({
    crop: cropData.crop,
    region,
    successProbability: finalScore,
    riskLevel,
    recommendation,
    explanation: generateExplanation(cropKey, finalScore, weather, Number(changePercent), region),
    factors: {
      weatherScore: Math.round(weatherScore * 100),
      marketScore: Math.round(marketScore * 100),
      seasonScore: Math.round(seasonScore * 100),
      baseScore: cropData.baseScore,
    },
    weather: {
      condition: weather.condition,
      rainfall: weather.rainfall,
      temperature: weather.temperature,
      humidity: weather.humidity,
    },
    market: {
      currentPricePerKg: currentPrice,
      changePercent: Number(changePercent),
      trend: Number(changePercent) > 0 ? "Rising" : "Falling",
    },
  });
});

router.post("/decisions/market-timing", async (req, res): Promise<void> => {
  const { commodity = "teff", region = "addis ababa" } = req.body as {
    commodity?: string;
    region?: string;
  };

  const prices = await db
    .select()
    .from(marketPricesTable)
    .where(sql`lower(${marketPricesTable.commodity}) like ${"%" + commodity.toLowerCase() + "%"}`)
    .orderBy(desc(marketPricesTable.reportedAt))
    .limit(10);

  const currentPrice = prices[0]?.pricePerKg ?? 45;
  const changePercent = Number(prices[0]?.changePercent ?? 2.1);

  const SEASONAL_PATTERNS: Record<string, number[]> = {
    teff: [1.0, 1.02, 1.05, 1.08, 1.10, 1.08, 1.05, 1.02, 0.98, 0.95, 0.97, 1.0],
    coffee: [1.05, 1.08, 1.10, 1.08, 1.05, 1.0, 0.97, 0.95, 0.98, 1.02, 1.05, 1.08],
    maize: [1.0, 1.05, 1.10, 1.12, 1.08, 1.02, 0.95, 0.92, 0.95, 0.98, 1.0, 1.02],
    sesame: [1.02, 1.05, 1.08, 1.10, 1.08, 1.05, 1.0, 0.95, 0.90, 0.92, 0.95, 1.0],
  };

  const commodityKey = commodity.toLowerCase();
  const month = new Date().getMonth();
  const pattern = SEASONAL_PATTERNS[commodityKey] ?? SEASONAL_PATTERNS["teff"]!;
  const currentMultiplier = pattern[month]!;
  const nextMonthMultiplier = pattern[(month + 1) % 12]!;
  const in3MonthsMultiplier = pattern[(month + 3) % 12]!;

  const predictedPrice7Days = Number(currentPrice) * (1 + changePercent / 100 * 0.5);
  const predictedPrice30Days = Number(currentPrice) * nextMonthMultiplier;
  const predictedPrice90Days = Number(currentPrice) * in3MonthsMultiplier;

  let action: string;
  let waitDays: number | null;
  let rationale: string;
  let confidenceLevel: number;

  if (changePercent > 3 || (nextMonthMultiplier < currentMultiplier && changePercent > 0)) {
    action = "Sell Now";
    waitDays = null;
    rationale = `Prices are ${changePercent > 3 ? "rising sharply" : "at a seasonal peak"}. Current market conditions favor immediate sale. Expected decline over next 30 days.`;
    confidenceLevel = 82;
  } else if (nextMonthMultiplier > currentMultiplier && changePercent < 2) {
    const daysToWait = Math.round((nextMonthMultiplier - currentMultiplier) * 100 * 3);
    action = `Wait ${Math.min(45, daysToWait)} Days`;
    waitDays = Math.min(45, daysToWait);
    rationale = `Seasonal analysis shows prices typically rise ${((nextMonthMultiplier - currentMultiplier) * 100).toFixed(1)}% in the coming weeks. Waiting is advised.`;
    confidenceLevel = 74;
  } else {
    action = "Sell Partially";
    waitDays = 14;
    rationale = "Market signals are mixed. Recommend selling 50% now to secure current price while holding remainder for potential upside.";
    confidenceLevel = 68;
  }

  res.json({
    commodity: commodity.charAt(0).toUpperCase() + commodity.slice(1),
    region,
    recommendation: action,
    waitDays,
    rationale,
    confidenceLevel,
    currentPrice: Number(currentPrice),
    pricePredictions: {
      in7Days: Math.round(predictedPrice7Days * 100) / 100,
      in30Days: Math.round(predictedPrice30Days * 100) / 100,
      in90Days: Math.round(predictedPrice90Days * 100) / 100,
    },
    marketTrend: changePercent > 2 ? "Bullish" : changePercent < -2 ? "Bearish" : "Neutral",
    priceChangePercent: changePercent,
    historicalPrices: prices.slice(0, 5).map((p) => ({
      date: p.reportedAt,
      price: p.pricePerKg,
      market: p.market,
    })),
  });
});

router.get("/decisions/crop-recommendation", async (req, res): Promise<void> => {
  const { region = "oromia", farmSize = "2", soilType = "loam" } = req.query as Record<string, string>;

  const regionKey = region.toLowerCase();
  const weather = REGION_WEATHER[regionKey] ?? REGION_WEATHER["oromia"]!;
  const month = new Date().getMonth() + 1;

  const candidates = Object.entries(CROP_BASE_DATA).map(([key, data]) => {
    const weatherScore = getWeatherScore(weather, key);
    const seasonScore = getSeasonScore(key, month);

    const soilBonus: Record<string, Record<string, number>> = {
      loam: { teff: 1.1, maize: 1.1, wheat: 1.05, coffee: 1.05 },
      clay: { teff: 1.05, sorghum: 1.1, barley: 1.05 },
      sandy: { sesame: 1.15, sorghum: 1.1 },
      "clay-loam": { teff: 1.1, coffee: 1.1, maize: 1.05 },
    };

    const soilKey = soilType.toLowerCase();
    const bonus = soilBonus[soilKey]?.[key] ?? 1.0;

    const score = data.baseScore * weatherScore * seasonScore * bonus;
    return { crop: key, cropName: data.crop, score: Math.min(97, Math.round(score)) };
  });

  candidates.sort((a, b) => b.score - a.score);
  const top3 = candidates.slice(0, 3);

  const CROP_DETAILS: Record<string, { growthDays: number; waterNeeds: string; estimatedYield: string; marketDemand: string; inputs: string[] }> = {
    coffee: { growthDays: 365, waterNeeds: "Moderate (600-1200mm/year)", estimatedYield: "0.8-1.5 t/ha", marketDemand: "Very High (Export)", inputs: ["Shade trees", "Fertilizer", "Pruning"] },
    teff: { growthDays: 90, waterNeeds: "Low-Moderate (450-550mm)", estimatedYield: "1.2-2.0 t/ha", marketDemand: "Very High (Staple)", inputs: ["Minimal inputs", "Basic fertilizer"] },
    maize: { growthDays: 120, waterNeeds: "Moderate (500-800mm)", estimatedYield: "2.5-5.0 t/ha", marketDemand: "High (Food+Feed)", inputs: ["DAP fertilizer", "Urea", "Weeding"] },
    sesame: { growthDays: 90, waterNeeds: "Low (300-500mm)", estimatedYield: "0.5-1.2 t/ha", marketDemand: "High (Export)", inputs: ["Minimal", "Basic weeding"] },
    wheat: { growthDays: 130, waterNeeds: "Moderate (400-700mm)", estimatedYield: "1.8-3.5 t/ha", marketDemand: "High (Staple)", inputs: ["Fertilizer", "Fungicide", "Irrigation"] },
    sorghum: { growthDays: 110, waterNeeds: "Low (400-600mm)", estimatedYield: "1.5-3.0 t/ha", marketDemand: "Moderate", inputs: ["Minimal inputs"] },
    barley: { growthDays: 100, waterNeeds: "Low-Moderate (350-600mm)", estimatedYield: "1.5-2.8 t/ha", marketDemand: "Moderate (Beer+Food)", inputs: ["Basic fertilizer"] },
  };

  const recommendations = top3.map((c, index) => ({
    rank: index + 1,
    crop: c.cropName,
    successScore: c.score,
    details: CROP_DETAILS[c.crop] ?? CROP_DETAILS["maize"]!,
    reasoning: `${c.cropName} scores ${c.score}% for ${region} region based on current weather (${weather.condition}, ${weather.rainfall}mm rainfall), ${soilType} soil, and seasonal timing. ${index === 0 ? "Strongly recommended as primary crop." : index === 1 ? "Good alternative or intercrop option." : "Consider as backup if inputs are limited."}`,
  }));

  res.json({
    region,
    farmSizeHectares: parseFloat(farmSize),
    soilType,
    currentSeason: month >= 3 && month <= 8 ? "Kiremt (Main Rainy)" : "Belg (Short Rains)",
    weather: {
      condition: weather.condition,
      rainfall: weather.rainfall,
      temperature: weather.temperature,
    },
    recommendations,
    generalAdvice: `For ${region} in ${new Date().toLocaleString("default", { month: "long" })}, prioritize crops suited to ${weather.rainfall > 60 ? "humid" : "dry"} conditions. ${farmSize && parseFloat(farmSize) < 1.5 ? "For small farms, focus on high-value crops like teff or sesame." : "Diversify between food and cash crops for risk management."}`,
  });
});

router.get("/decisions/summary", async (_req, res): Promise<void> => {
  res.json({
    activeDecisionRequests: 47,
    cropScoresGenerated: 312,
    marketTimingQueries: 189,
    cropRecommendationsGiven: 94,
    averageSuccessScore: 76.4,
    topRecommendedCrops: [
      { crop: "Teff", recommendationCount: 38 },
      { crop: "Maize", recommendationCount: 29 },
      { crop: "Coffee", recommendationCount: 18 },
      { crop: "Sesame", recommendationCount: 9 },
    ],
    recentDecisions: [
      { farmer: "Abebe Girma", crop: "Coffee", region: "Oromia", score: 84, timestamp: new Date(Date.now() - 3600000) },
      { farmer: "Tigist Bekele", crop: "Teff", region: "Amhara", score: 91, timestamp: new Date(Date.now() - 7200000) },
      { farmer: "Dawit Haile", crop: "Sesame", region: "SNNPR", score: 72, timestamp: new Date(Date.now() - 10800000) },
      { farmer: "Mulu Tesfaye", crop: "Maize", region: "Oromia", score: 88, timestamp: new Date(Date.now() - 14400000) },
    ],
  });
});

export default router;
