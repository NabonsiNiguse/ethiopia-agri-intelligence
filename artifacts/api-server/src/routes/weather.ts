import { Router, type IRouter } from "express";

const router: IRouter = Router();

const REGIONAL_DATA: Record<string, { tempMin: number; tempMax: number; rainfallMm: number; humidity: number }> = {
  oromia: { tempMin: 15, tempMax: 28, rainfallMm: 4.2, humidity: 72 },
  amhara: { tempMin: 12, tempMax: 24, rainfallMm: 5.8, humidity: 68 },
  snnpr: { tempMin: 18, tempMax: 30, rainfallMm: 6.1, humidity: 78 },
  tigray: { tempMin: 10, tempMax: 26, rainfallMm: 1.8, humidity: 55 },
  afar: { tempMin: 22, tempMax: 38, rainfallMm: 0.5, humidity: 35 },
  somali: { tempMin: 20, tempMax: 36, rainfallMm: 0.8, humidity: 40 },
  default: { tempMin: 14, tempMax: 27, rainfallMm: 3.5, humidity: 65 },
};

const CONDITIONS = ["Sunny", "Partly cloudy", "Cloudy", "Light rain", "Heavy rain", "Thunderstorm"];
const CONDITIONS_AM = ["ፀሐያማ", "በከፊል ደመናማ", "ደመናማ", "ቀላል ዝናብ", "ከባድ ዝናብ", "ነጎድጓዳ"];
const CONDITIONS_OR = ["Aduu", "Diriiraa", "Duumessa", "Rooba xinnoo", "Rooba gudaa", "Dhukaatii"];
const FARMING_IMPACTS = [
  "Ideal conditions for field work and spray applications",
  "Good for irrigation – monitor soil moisture",
  "Postpone spraying operations – wait for dry weather",
  "Excellent conditions for planting – soil moisture adequate",
  "Delay harvesting – risk of grain mold",
  "Critical alert: stay indoors, protect equipment",
];

function generateForecast(region: string, days: number) {
  const base = REGIONAL_DATA[region.toLowerCase()] ?? REGIONAL_DATA.default;
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const condIdx = Math.floor(Math.random() * CONDITIONS.length);
    const variation = (Math.random() - 0.5) * 4;
    return {
      date: date.toISOString().split("T")[0],
      tempMin: Math.round(base.tempMin + variation),
      tempMax: Math.round(base.tempMax + variation),
      rainfall: condIdx >= 3 ? base.rainfallMm * (1 + Math.random()) : 0,
      humidity: base.humidity + Math.round((Math.random() - 0.5) * 10),
      windSpeed: Math.round(8 + Math.random() * 15),
      condition: CONDITIONS[condIdx],
      conditionAmharic: CONDITIONS_AM[condIdx],
      conditionOromo: CONDITIONS_OR[condIdx],
      farmingImpact: FARMING_IMPACTS[condIdx],
    };
  });
}

router.get("/weather/forecast", async (req, res): Promise<void> => {
  const { region, days = "7" } = req.query as Record<string, string>;
  if (!region) { res.status(400).json({ error: "region is required" }); return; }

  const daysNum = Math.min(parseInt(days, 10), 14);
  const forecast = generateForecast(region, daysNum);
  const current = forecast[0];
  const restForecast = forecast.slice(1);

  const alerts = [];
  if (forecast.some((f) => f.rainfall > 8)) alerts.push("Heavy rainfall warning: delay planting and harvesting operations");
  if (forecast.some((f) => f.tempMax > 35)) alerts.push("Heat stress alert: ensure adequate irrigation for crops");

  res.json({
    region,
    current,
    forecast: restForecast,
    alerts,
    updatedAt: new Date().toISOString(),
  });
});

router.get("/weather/advisory", async (req, res): Promise<void> => {
  const { region, cropType } = req.query as Record<string, string>;
  if (!region) { res.status(400).json({ error: "region is required" }); return; }

  const base = REGIONAL_DATA[region.toLowerCase()] ?? REGIONAL_DATA.default;
  const irrigationNeeded = base.humidity < 60;
  const riskLevel = base.rainfallMm < 1 ? "high" : base.rainfallMm < 3 ? "medium" : "low";

  const advisory = cropType
    ? `For ${cropType} farming in ${region}: Current conditions are ${riskLevel} risk. ${irrigationNeeded ? "Irrigation is recommended due to low soil moisture." : "Natural rainfall should be sufficient."} Monitor for pest activity following recent weather patterns.`
    : `General advisory for ${region}: Conditions are ${riskLevel} risk for most crops. Plan field activities accordingly.`;

  res.json({
    region,
    cropType: cropType ?? undefined,
    advisory,
    advisoryAmharic: `[Amharic] ${advisory}`,
    advisoryOromo: `[Afaan Oromo] ${advisory}`,
    plantingRecommendation: riskLevel === "low" ? "Good time for planting – soil moisture is adequate" : "Wait for improved conditions before planting",
    irrigationNeeded,
    sprayingAdvisory: "Spray during early morning or late evening for best results",
    harvestWindow: "Next 2 weeks appear suitable for harvesting",
    riskLevel,
  });
});

export default router;
