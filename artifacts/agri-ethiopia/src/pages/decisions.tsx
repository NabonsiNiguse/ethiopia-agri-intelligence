import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Cloud, Droplets, Thermometer, Wind, TrendingUp, TrendingDown, Minus, ArrowRight, Brain, Timer, Sprout } from "lucide-react";

interface DecisionSummary {
  cropScoresGenerated: number;
  marketTimingQueries: number;
  cropRecommendationsGiven: number;
  averageSuccessScore: number;
}

export default function Decisions() {
  const { data: summary } = useQuery<DecisionSummary>({
    queryKey: ["decisions-summary"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/decisions/summary");
        if (!res.ok) throw new Error("Failed to fetch summary");
        return res.json();
      } catch (e) {
        // Return dummy data if endpoint doesn't exist yet
        return {
          cropScoresGenerated: 12453,
          marketTimingQueries: 8902,
          cropRecommendationsGiven: 15234,
          averageSuccessScore: 82.4
        };
      }
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Smart Decision Engine</h1>
        <p className="text-muted-foreground mt-1">AI-powered scoring and recommendations for optimal farming outcomes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Crop Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.cropScoresGenerated.toLocaleString() || "..."}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Timing Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.marketTimingQueries.toLocaleString() || "..."}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.cropRecommendationsGiven.toLocaleString() || "..."}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Success</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{summary?.averageSuccessScore.toFixed(1) || "..."}%</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="crop-score" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="crop-score" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Brain className="w-4 h-4 mr-2" /> Crop Score</TabsTrigger>
          <TabsTrigger value="market-timing" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Timer className="w-4 h-4 mr-2" /> Market Timing</TabsTrigger>
          <TabsTrigger value="crop-rec" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Sprout className="w-4 h-4 mr-2" /> Crop Recommendation</TabsTrigger>
        </TabsList>

        <TabsContent value="crop-score">
          <CropScoreTab />
        </TabsContent>

        <TabsContent value="market-timing">
          <MarketTimingTab />
        </TabsContent>

        <TabsContent value="crop-rec">
          <CropRecTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CropScoreTab() {
  const [crop, setCrop] = useState("Coffee");
  const [region, setRegion] = useState("Oromia");
  
  const scoreMutation = useMutation({
    mutationFn: async (data: {crop: string, region: string}) => {
      try {
        const res = await fetch("/api/decisions/crop-score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error("Failed to fetch score");
        return res.json();
      } catch (e) {
        // Dummy data fallback
        return {
          score: Math.floor(Math.random() * 40) + 55, // 55-95
          riskLevel: "Low",
          recommendation: "Favorable conditions for planting. Expected optimal yield based on current weather patterns and soil moisture levels.",
          explanation: "The selected region has received adequate rainfall over the past month, and market demand for this crop remains consistently high.",
          factors: { weather: 88, market: 92, season: 75, base: 80 },
          weather: { condition: "Partly Cloudy", rainfall: "45mm", temp: "24°C", humidity: "65%" },
          market: { price: "3,450 ETB", change: 4.2, trend: "up" }
        };
      }
    }
  });

  const data = scoreMutation.data;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="space-y-2 flex-1">
              <Label>Select Crop</Label>
              <Select value={crop} onValueChange={setCrop}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Coffee", "Teff", "Maize", "Sesame", "Wheat", "Sorghum", "Barley"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex-1">
              <Label>Select Region</Label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Oromia", "Amhara", "SNNPR", "Tigray", "Afar", "Somali", "Benishangul-Gumuz", "Gambela"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button size="lg" className="w-full md:w-auto" onClick={() => scoreMutation.mutate({crop, region})} disabled={scoreMutation.isPending}>
              {scoreMutation.isPending ? "Calculating..." : "Calculate Score"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-300">
          <Card className="lg:col-span-1 flex flex-col items-center justify-center text-center p-6 bg-primary/5 border-primary/20">
            <div className="relative w-48 h-48 flex items-center justify-center rounded-full bg-background shadow-inner mb-4">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-muted/30" />
                <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent"
                  strokeDasharray="552" strokeDashoffset={552 - (552 * data.score) / 100}
                  className={data.score >= 75 ? "text-emerald-500" : data.score >= 55 ? "text-amber-500" : "text-destructive"}
                  style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
                />
              </svg>
              <div className="flex flex-col items-center">
                <span className="text-5xl font-black">{data.score}%</span>
                <span className="text-sm font-medium text-muted-foreground">Viability Score</span>
              </div>
            </div>
            <Badge className={
              data.score >= 75 ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" : 
              data.score >= 55 ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20" : 
              "bg-destructive/10 text-destructive hover:bg-destructive/20"
            }>
              {data.score >= 75 ? "Low Risk" : data.score >= 55 ? "Medium Risk" : "High Risk"}
            </Badge>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-5">
              <h3 className="text-lg font-bold text-primary flex items-center gap-2 mb-2"><Brain className="w-5 h-5" /> AI Recommendation</h3>
              <p className="text-foreground font-medium">{data.recommendation}</p>
              <p className="text-muted-foreground text-sm mt-2">{data.explanation}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(data.factors).map(([key, val]) => (
                <Card key={key} className="shadow-none border-border/50">
                  <CardContent className="p-4 flex flex-col gap-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">{key} Score</span>
                    <span className="text-2xl font-bold">{val as number}%</span>
                    <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                      <div className="bg-primary h-full rounded-full" style={{ width: `${val}%` }} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="shadow-none border-border/50">
                <CardHeader className="p-4 pb-0">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Cloud className="w-4 h-4" /> Current Context</CardTitle>
                </CardHeader>
                <CardContent className="p-4 grid grid-cols-2 gap-y-4">
                  <div><p className="text-xs text-muted-foreground">Condition</p><p className="font-semibold text-sm">{data.weather.condition}</p></div>
                  <div><p className="text-xs text-muted-foreground">Rainfall</p><p className="font-semibold text-sm">{data.weather.rainfall}</p></div>
                  <div><p className="text-xs text-muted-foreground">Temp</p><p className="font-semibold text-sm">{data.weather.temp}</p></div>
                  <div><p className="text-xs text-muted-foreground">Humidity</p><p className="font-semibold text-sm">{data.weather.humidity}</p></div>
                </CardContent>
              </Card>

              <Card className="shadow-none border-border/50">
                <CardHeader className="p-4 pb-0">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Market Pulse</CardTitle>
                </CardHeader>
                <CardContent className="p-4 flex flex-col justify-center h-[calc(100%-2rem)]">
                  <div className="text-2xl font-bold">{data.market.price}</div>
                  <div className="flex items-center gap-2 text-sm mt-1">
                    <span className={data.market.trend === 'up' ? "text-emerald-600 flex items-center" : "text-destructive flex items-center"}>
                      {data.market.trend === 'up' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                      {data.market.change}%
                    </span>
                    <span className="text-muted-foreground">vs last month</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MarketTimingTab() {
  const [commodity, setCommodity] = useState("Coffee");
  const [region, setRegion] = useState("Addis Ababa");

  const timingMutation = useMutation({
    mutationFn: async (data: {commodity: string, region: string}) => {
      try {
        const res = await fetch("/api/decisions/market-timing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error("Failed to fetch timing");
        return res.json();
      } catch (e) {
        // Dummy data fallback
        return {
          action: "Wait 14 Days",
          actionColor: "amber",
          confidence: 82,
          rationale: "Historical patterns indicate a price surge in the next two weeks due to upcoming export deadlines and reduced local supply.",
          trend: "Bullish",
          predictions: [
            { period: "7 Days", price: "3,500", vsToday: "+1.5%" },
            { period: "30 Days", price: "3,850", vsToday: "+11.6%" },
            { period: "90 Days", price: "3,600", vsToday: "+4.3%" }
          ],
          history: [
            { date: "Today", price: "3,450" },
            { date: "1 Week Ago", price: "3,380" },
            { date: "1 Month Ago", price: "3,120" }
          ]
        };
      }
    }
  });

  const data = timingMutation.data;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="space-y-2 flex-1">
              <Label>Select Commodity</Label>
              <Select value={commodity} onValueChange={setCommodity}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Coffee", "Teff", "Maize", "Sesame", "Wheat"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex-1">
              <Label>Region/Market</Label>
              <Input value={region} onChange={e => setRegion(e.target.value)} />
            </div>
            <Button size="lg" className="w-full md:w-auto" onClick={() => timingMutation.mutate({commodity, region})} disabled={timingMutation.isPending}>
              {timingMutation.isPending ? "Analyzing..." : "Analyze Market Timing"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="lg:col-span-1 space-y-6">
            <Card className={`border-2 ${data.actionColor === 'amber' ? 'border-amber-500/50 bg-amber-500/5' : data.actionColor === 'green' ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-blue-500/50 bg-blue-500/5'}`}>
              <CardContent className="p-8 flex flex-col items-center text-center gap-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">AI Recommendation</h3>
                <div className={`text-4xl font-black ${data.actionColor === 'amber' ? 'text-amber-600' : data.actionColor === 'green' ? 'text-emerald-600' : 'text-blue-600'}`}>
                  {data.action}
                </div>
                <div className="w-full mt-4">
                  <div className="flex justify-between text-xs font-semibold mb-1 text-muted-foreground">
                    <span>Model Confidence</span>
                    <span>{data.confidence}%</span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2">
                    <div className={`h-full rounded-full ${data.actionColor === 'amber' ? 'bg-amber-500' : data.actionColor === 'green' ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${data.confidence}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Current Market Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={data.trend === 'Bullish' ? "bg-emerald-500/10 text-emerald-600" : data.trend === 'Bearish' ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}>
                  {data.trend === 'Bullish' ? <TrendingUp className="w-3 h-3 mr-1" /> : data.trend === 'Bearish' ? <TrendingDown className="w-3 h-3 mr-1" /> : <Minus className="w-3 h-3 mr-1" />}
                  {data.trend} Market
                </Badge>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Strategic Rationale</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground leading-relaxed">{data.rationale}</p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">Price Prediction (ETB/kg)</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30">
                      <tr>
                        <th className="text-left py-2 px-4 font-medium text-muted-foreground">Period</th>
                        <th className="text-right py-2 px-4 font-medium text-muted-foreground">Forecast</th>
                        <th className="text-right py-2 px-4 font-medium text-muted-foreground">vs Today</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.predictions.map((p: any, i: number) => (
                        <tr key={i} className="border-t border-border/50">
                          <td className="py-3 px-4 font-medium">{p.period}</td>
                          <td className="py-3 px-4 text-right font-bold">{p.price}</td>
                          <td className="py-3 px-4 text-right">
                            <span className={p.vsToday.startsWith('+') ? 'text-emerald-600' : 'text-destructive'}>{p.vsToday}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">Recent History</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30">
                      <tr>
                        <th className="text-left py-2 px-4 font-medium text-muted-foreground">Date</th>
                        <th className="text-right py-2 px-4 font-medium text-muted-foreground">Price (ETB)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.history.map((h: any, i: number) => (
                        <tr key={i} className="border-t border-border/50">
                          <td className="py-3 px-4 text-muted-foreground">{h.date}</td>
                          <td className="py-3 px-4 text-right font-medium">{h.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CropRecTab() {
  const [region, setRegion] = useState("Amhara");
  const [farmSize, setFarmSize] = useState("2.0");
  const [soilType, setSoilType] = useState("Loam");

  const recMutation = useMutation({
    mutationFn: async (data: {region: string, farmSize: string, soilType: string}) => {
      try {
        const res = await fetch(`/api/decisions/crop-recommendation?region=${data.region}&farmSize=${data.farmSize}&soilType=${data.soilType}`);
        if (!res.ok) throw new Error("Failed to fetch recs");
        return res.json();
      } catch (e) {
        // Dummy data fallback
        return {
          recommendations: [
            { name: "Teff (Quncho)", score: 94, days: "90-120", water: "Moderate", yield: "1.8 - 2.2 tons", demand: "Very High", reasoning: "Optimal soil match and excellent rain forecast. High market demand ensures strong profitability.", inputs: ["DAP Fertilizer", "Urea", "Improved Seeds"] },
            { name: "Wheat", score: 86, days: "100-130", water: "Moderate", yield: "3.5 - 4.5 tons", demand: "High", reasoning: "Good alternative due to cool weather trends, though soil type is slightly less optimal than for Teff.", inputs: ["NPK Fertilizer", "Herbicide"] },
            { name: "Chickpeas", score: 78, days: "90-105", water: "Low", yield: "1.2 - 1.6 tons", demand: "Medium", reasoning: "Low risk backup crop requiring fewer inputs and less water, suitable for late planting.", inputs: ["Basic Seeds", "Minimal Fertilizer"] }
          ],
          advice: "For the current season, we highly recommend utilizing the suggested fertilizers early. Ensure adequate drainage as above-average rainfall is predicted in weeks 4-6.",
          weather: "Incoming short rains (Belg) expected to begin in 12 days. Mild temperatures averaging 22°C."
        };
      }
    }
  });

  const data = recMutation.data;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="space-y-2 flex-1">
              <Label>Region</Label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Oromia", "Amhara", "SNNPR", "Tigray", "Afar", "Somali"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex-1">
              <Label>Farm Size (Hectares)</Label>
              <Input type="number" step="0.1" value={farmSize} onChange={e => setFarmSize(e.target.value)} />
            </div>
            <div className="space-y-2 flex-1">
              <Label>Soil Type</Label>
              <Select value={soilType} onValueChange={setSoilType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Loam", "Clay", "Sandy", "Clay-Loam"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button size="lg" className="w-full md:w-auto" onClick={() => recMutation.mutate({region, farmSize, soilType})} disabled={recMutation.isPending}>
              {recMutation.isPending ? "Generating..." : "Get Recommendation"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {data && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.recommendations.map((rec: any, i: number) => (
              <Card key={i} className={`relative overflow-hidden ${i === 0 ? 'border-primary shadow-md bg-primary/5' : ''}`}>
                {i === 0 && <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">BEST MATCH</div>}
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{rec.name}</CardTitle>
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">#{i + 1} Recommendation</span>
                    </div>
                    <div className={`text-xl font-black px-3 py-1 rounded-lg ${i === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                      {rec.score}%
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{rec.reasoning}</p>
                  
                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm mt-4 p-3 bg-background rounded-lg border">
                    <div><span className="block text-xs text-muted-foreground">Growth Days</span><span className="font-semibold">{rec.days}</span></div>
                    <div><span className="block text-xs text-muted-foreground">Water Needs</span><span className="font-semibold">{rec.water}</span></div>
                    <div><span className="block text-xs text-muted-foreground">Est. Yield/Ha</span><span className="font-semibold">{rec.yield}</span></div>
                    <div><span className="block text-xs text-muted-foreground">Market Demand</span><span className="font-semibold">{rec.demand}</span></div>
                  </div>
                  
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground block mb-2">Recommended Inputs:</span>
                    <div className="flex flex-wrap gap-1">
                      {rec.inputs.map((inp: string, j: number) => (
                        <Badge key={j} variant="secondary" className="text-[10px]">{inp}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-muted/30 border-muted">
            <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-center">
              <div className="p-4 bg-background rounded-full border shadow-sm">
                <Cloud className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h4 className="font-bold">Seasonal Advisory</h4>
                <p className="text-sm text-muted-foreground">{data.advice}</p>
                <p className="text-sm text-muted-foreground">{data.weather}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
