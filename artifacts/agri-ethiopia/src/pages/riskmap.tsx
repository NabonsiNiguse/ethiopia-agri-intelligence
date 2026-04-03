import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip as LeafletTooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, Info, ShieldAlert, Sprout, TrendingDown, CloudRain } from "lucide-react";
import { Label } from "@/components/ui/label";

// Fix Leaflet icons
L.Marker.prototype.options.icon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

interface RiskRegion {
  id: string;
  name: string;
  lat: number;
  lng: number;
  riskLevel: "High" | "Medium" | "Low";
  farmerCount: number;
  scores: { disease: number; weather: number; market: number };
  // API may also return flat fields
  diseaseRisk?: number;
  weatherRisk?: number;
  marketRisk?: number;
  alerts: string[];
  activeCrops: string[];
}

export default function RiskMap() {
  const [layers, setLayers] = useState({ disease: true, weather: true, market: true });
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const { data: regionsData } = useQuery<{ regions: RiskRegion[]; summary: any }>({
    queryKey: ["riskmap-regions"],
    queryFn: async () => {
      const res = await fetch("/api/riskmap/regions");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    // fallback static data if backend is down
    placeholderData: {
      regions: [
        { id: "1", name: "Oromia",            lat: 8.5,  lng: 39.5, riskLevel: "Medium", farmerCount: 45000, scores: { disease: 45, weather: 35, market: 52 }, alerts: ["Coffee Berry Disease detected in Jimma zone", "Teff blast reported in West Wellega"], activeCrops: ["Coffee", "Maize", "Teff"] },
        { id: "2", name: "Amhara",            lat: 11.5, lng: 38.0, riskLevel: "High",   farmerCount: 32000, scores: { disease: 72, weather: 28, market: 65 }, alerts: ["Wheat rust early warning in South Gondar", "Stem borer in maize - Awi zone"], activeCrops: ["Teff", "Wheat", "Barley"] },
        { id: "3", name: "SNNPR",             lat: 6.5,  lng: 37.5, riskLevel: "Low",    farmerCount: 28000, scores: { disease: 18, weather: 22, market: 30 }, alerts: ["Coffee leaf rust in Sidama"], activeCrops: ["Coffee", "Enset", "Sesame"] },
        { id: "4", name: "Tigray",            lat: 14.0, lng: 38.5, riskLevel: "High",   farmerCount: 15000, scores: { disease: 40, weather: 68, market: 80 }, alerts: ["Locust activity along Eastern border", "Teff smut reported in Central Tigray"], activeCrops: ["Teff", "Sorghum", "Barley"] },
        { id: "5", name: "Afar",              lat: 12.0, lng: 41.5, riskLevel: "High",   farmerCount: 8000,  scores: { disease: 25, weather: 85, market: 60 }, alerts: ["Severe drought stress", "Fall armyworm in sorghum"], activeCrops: ["Sorghum", "Sesame"] },
        { id: "6", name: "Somali",            lat: 7.5,  lng: 45.0, riskLevel: "High",   farmerCount: 6000,  scores: { disease: 20, weather: 80, market: 55 }, alerts: ["Extreme drought conditions"], activeCrops: ["Sorghum", "Sesame"] },
        { id: "7", name: "Benishangul-Gumuz", lat: 10.5, lng: 35.5, riskLevel: "Low",    farmerCount: 5000,  scores: { disease: 30, weather: 20, market: 40 }, alerts: ["Maize streak virus reports increasing"], activeCrops: ["Sesame", "Maize", "Sorghum"] },
        { id: "8", name: "Gambela",           lat: 8.0,  lng: 34.5, riskLevel: "Medium", farmerCount: 4000,  scores: { disease: 35, weather: 30, market: 45 }, alerts: ["Flooding damage to standing crops"], activeCrops: ["Maize", "Sorghum", "Rice"] },
      ],
      summary: {}
    }
  });

  const regions = regionsData?.regions ?? [];

  const { data: alertsData } = useQuery({
    queryKey: ["riskmap-alerts"],
    queryFn: async () => {
      const res = await fetch("/api/riskmap/alerts");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    placeholderData: {
      alerts: [
        { region: "Amhara", alert: "Severe wheat rust outbreak spreading rapidly in North Gondar.", severity: "High" },
        { region: "Tigray", alert: "Critical soil moisture deficit affecting early planting.", severity: "High" },
        { region: "Afar",   alert: "Extreme drought — livestock and crop losses reported.", severity: "High" },
        { region: "Oromia", alert: "Delay in input distribution affecting maize sowing schedules.", severity: "Medium" },
      ]
    }
  });

  const alerts = alertsData?.alerts ?? [];

  const { data: regionDetail } = useQuery({
    queryKey: ["riskmap-region", selectedRegion],
    enabled: !!selectedRegion,
    queryFn: async () => {
      const res = await fetch(`/api/riskmap/region/${encodeURIComponent(selectedRegion!)}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      // normalize riskScores -> scores for the template
      return {
        ...data,
        scores: data.riskScores ?? data.scores ?? { disease: 0, weather: 0, market: 0 },
        marketPrices: (data.marketPrices ?? []).map((p: any) => ({
          commodity: p.commodity,
          price: p.pricePerKg ?? p.price,
          trend: (p.changePercent ?? 0) > 0 ? "up" : (p.changePercent ?? 0) < 0 ? "down" : "stable",
        })),
      };
    },
  });

  const calculatedRegions = useMemo(() => {
    if (!regions) return [];
    return regions.map((r, idx) => {
      const activeScores = [];
      if (layers.disease) activeScores.push(r.scores?.disease ?? r.diseaseRisk ?? 0);
      if (layers.weather) activeScores.push(r.scores?.weather ?? r.weatherRisk ?? 0);
      if (layers.market) activeScores.push(r.scores?.market ?? r.marketRisk ?? 0);

      const avgScore = activeScores.length > 0 ? activeScores.reduce((a, b) => a + b, 0) / activeScores.length : 0;

      let calcLevel = "Low";
      if (avgScore >= 65) calcLevel = "High";
      else if (avgScore >= 35) calcLevel = "Medium";

      return { ...r, id: r.id ?? String(idx), calculatedLevel: calcLevel, calculatedScore: Math.round(avgScore) };
    });
  }, [regions, layers]);

  const summaryCounts = useMemo(() => {
    const counts = { High: 0, Medium: 0, Low: 0 };
    calculatedRegions.forEach(r => {
      if (r.calculatedLevel === "High") counts.High++;
      else if (r.calculatedLevel === "Medium") counts.Medium++;
      else counts.Low++;
    });
    return counts;
  }, [calculatedRegions]);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-in fade-in duration-500 gap-6">
      <div className="flex flex-col lg:flex-row gap-6 h-full">
        
        {/* Left Panel */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6 h-full overflow-y-auto pr-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <ShieldAlert className="w-8 h-8 text-primary" /> Risk Map
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">Ethiopia — Real-time regional risk assessment</p>
          </div>

          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Risk Layers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="layer-disease" checked={layers.disease} onCheckedChange={(c) => setLayers(l => ({ ...l, disease: !!c }))} />
                <Label htmlFor="layer-disease" className="flex items-center gap-2 cursor-pointer"><Sprout className="w-4 h-4 text-emerald-600"/> Disease Risk</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="layer-weather" checked={layers.weather} onCheckedChange={(c) => setLayers(l => ({ ...l, weather: !!c }))} />
                <Label htmlFor="layer-weather" className="flex items-center gap-2 cursor-pointer"><CloudRain className="w-4 h-4 text-blue-500"/> Weather Risk</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="layer-market" checked={layers.market} onCheckedChange={(c) => setLayers(l => ({ ...l, market: !!c }))} />
                <Label htmlFor="layer-market" className="flex items-center gap-2 cursor-pointer"><TrendingDown className="w-4 h-4 text-amber-500"/> Market Risk</Label>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="flex items-center gap-1 text-destructive"><div className="w-3 h-3 rounded-full bg-destructive" /> {summaryCounts.High} High</span>
                <span className="flex items-center gap-1 text-amber-500"><div className="w-3 h-3 rounded-full bg-amber-500" /> {summaryCounts.Medium} Medium</span>
                <span className="flex items-center gap-1 text-emerald-500"><div className="w-3 h-3 rounded-full bg-emerald-500" /> {summaryCounts.Low} Low</span>
              </div>
            </CardContent>
          </Card>

          <div className="flex-1 min-h-[200px]">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Active Alerts</h3>
            <div className="space-y-3">
              {alerts?.map((alert: any, i: number) => (
                <Card key={i} className={`border-l-4 shadow-none ${alert.severity === 'High' ? 'border-l-destructive bg-destructive/5' : 'border-l-amber-500 bg-amber-500/5'}`}>
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-sm">{alert.region}</span>
                      <Badge variant="outline" className={`text-[10px] ${alert.severity === 'High' ? 'text-destructive border-destructive' : 'text-amber-600 border-amber-500'}`}>{alert.severity}</Badge>
                    </div>
                    <p className="text-xs text-foreground/80 leading-snug">{alert.alert ?? alert.text}</p>
                  </CardContent>
                </Card>
              ))}
              {alerts?.length === 0 && <div className="text-sm text-muted-foreground text-center py-4">No active alerts at this time.</div>}
            </div>
          </div>
        </div>

        {/* Right Panel - Map */}
        <div className="w-full lg:w-2/3 h-[400px] lg:h-full rounded-xl overflow-hidden border border-border shadow-sm relative flex flex-col">
          <div className="flex-1 relative z-0">
            <MapContainer center={[9.145, 40.489]} zoom={6} className="w-full h-full" zoomControl={false}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              {calculatedRegions.map(region => (
                <CircleMarker
                  key={region.id}
                  center={[region.lat, region.lng]}
                  radius={Math.max(15, Math.min(35, region.farmerCount / 1000))}
                  pathOptions={{
                    color: region.calculatedLevel === 'High' ? '#ef4444' : region.calculatedLevel === 'Medium' ? '#f59e0b' : '#22c55e',
                    fillColor: region.calculatedLevel === 'High' ? '#ef4444' : region.calculatedLevel === 'Medium' ? '#f59e0b' : '#22c55e',
                    fillOpacity: 0.6,
                    weight: 2
                  }}
                  eventHandlers={{ click: () => setSelectedRegion(region.name) }}
                >
                  <Popup className="custom-popup">
                    <div className="p-1 min-w-[200px]">
                      <h3 className="font-bold text-lg border-b pb-1 mb-2">{region.name}</h3>
                      <div className="space-y-1 mb-3">
                        <div className="flex justify-between text-xs"><span className="text-muted-foreground">Aggregated Risk:</span> <span className="font-bold">{region.calculatedScore}%</span></div>
                        <div className="flex justify-between text-xs"><span className="text-muted-foreground">Farmers Affected:</span> <span className="font-bold">{region.farmerCount.toLocaleString()}</span></div>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {region.activeCrops.map(c => <Badge key={c} variant="secondary" className="text-[9px]">{c}</Badge>)}
                      </div>
                      <div className="text-xs text-primary font-medium mt-2 pt-2 border-t text-center cursor-pointer">Click to view detailed analysis</div>
                    </div>
                  </Popup>
                  <LeafletTooltip direction="top" offset={[0, -10]} opacity={1}>
                    <span className="font-bold">{region.name}</span> • Risk: {region.calculatedScore}%
                  </LeafletTooltip>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>

          {/* Region Detail Overlay */}
          {selectedRegion && regionDetail && (
            <div className="absolute bottom-0 left-0 right-0 bg-background border-t shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-4 z-[1000] animate-in slide-in-from-bottom-8 max-h-[50%] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">{regionDetail.name} <span className="text-sm font-normal text-muted-foreground">Detailed Analysis</span></h2>
                <button onClick={() => setSelectedRegion(null)} className="text-muted-foreground hover:text-foreground">✕</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Risk Breakdown</h4>
                  <div>
                    <div className="flex justify-between text-xs mb-1"><span>Disease Risk</span><span>{regionDetail.scores.disease}%</span></div>
                    <div className="w-full bg-muted h-1.5 rounded-full"><div className="bg-destructive h-full rounded-full" style={{width: `${regionDetail.scores.disease}%`}}/></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1"><span>Weather Risk</span><span>{regionDetail.scores.weather}%</span></div>
                    <div className="w-full bg-muted h-1.5 rounded-full"><div className="bg-blue-500 h-full rounded-full" style={{width: `${regionDetail.scores.weather}%`}}/></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1"><span>Market Risk</span><span>{regionDetail.scores.market}%</span></div>
                    <div className="w-full bg-muted h-1.5 rounded-full"><div className="bg-amber-500 h-full rounded-full" style={{width: `${regionDetail.scores.market}%`}}/></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Action Plan</h4>
                  <ul className="space-y-1.5">
                    {regionDetail.recommendations.map((rec: string, i: number) => (
                      <li key={i} className="text-xs flex gap-2"><span className="text-primary mt-0.5">•</span><span className="leading-tight">{rec}</span></li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Key Markets</h4>
                  <div className="bg-muted/30 rounded p-2 text-xs">
                    {regionDetail.marketPrices.map((m: any, i: number) => (
                      <div key={i} className="flex justify-between py-1 border-b last:border-0 border-border/50">
                        <span className="font-medium">{m.commodity}</span>
                        <span>{m.price} ETB <span className={m.trend === 'up' ? "text-emerald-500" : "text-muted-foreground"}>{m.trend === 'up' ? '↑' : '-'}</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
