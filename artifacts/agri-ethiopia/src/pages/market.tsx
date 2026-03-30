import { useState } from "react";
import { useGetMarketPrices, getGetMarketPricesQueryKey, useGetMarketTrends, getGetMarketTrendsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Market() {
  const [commodity, setCommodity] = useState("Coffee");
  const [region, setRegion] = useState("Oromia");

  const { data: prices, isLoading: isLoadingPrices } = useGetMarketPrices(
    { region },
    { query: { queryKey: getGetMarketPricesQueryKey({ region }) } }
  );

  const { data: trends, isLoading: isLoadingTrends } = useGetMarketTrends(
    { commodity, period: "month" },
    { query: { queryKey: getGetMarketTrendsQueryKey({ commodity, period: "month" }) } }
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Market Intelligence</h1>
          <p className="text-muted-foreground mt-1">Real-time commodity prices and trend analysis</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger className="w-[180px] bg-card">
              <SelectValue placeholder="Select Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Oromia">Oromia</SelectItem>
              <SelectItem value="Amhara">Amhara</SelectItem>
              <SelectItem value="SNNPR">SNNPR</SelectItem>
              <SelectItem value="Tigray">Tigray</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Price Trends</CardTitle>
              <CardDescription>30-day historical data for {commodity}</CardDescription>
            </div>
            <Select value={commodity} onValueChange={setCommodity}>
              <SelectTrigger className="w-[140px] bg-background">
                <SelectValue placeholder="Commodity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Coffee">Coffee</SelectItem>
                <SelectItem value="Teff">Teff</SelectItem>
                <SelectItem value="Wheat">Wheat</SelectItem>
                <SelectItem value="Sesame">Sesame</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="h-[350px]">
            {isLoadingTrends ? (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">Loading chart data...</div>
            ) : trends ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends.dataPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric'})} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(val) => `${val} ETB`} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Line type="monotone" dataKey="avgPrice" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle>Market Forecast</CardTitle>
            <CardDescription>Next 30 days projection</CardDescription>
          </CardHeader>
          <CardContent>
            {trends && (
              <div className="space-y-6">
                <div className="p-6 bg-muted/20 rounded-xl border flex flex-col items-center justify-center text-center gap-2">
                  <div className="text-4xl font-bold text-foreground">{trends.prediction30Days} ETB</div>
                  <div className="text-sm font-medium text-muted-foreground">Estimated Average Price</div>
                  {trends.trend === 'rising' && <div className="mt-2 flex items-center gap-1 text-emerald-600 bg-emerald-600/10 px-3 py-1 rounded-full text-xs font-bold"><TrendingUp className="w-3 h-3" /> RISING</div>}
                  {trends.trend === 'falling' && <div className="mt-2 flex items-center gap-1 text-destructive bg-destructive/10 px-3 py-1 rounded-full text-xs font-bold"><TrendingDown className="w-3 h-3" /> FALLING</div>}
                  {trends.trend === 'stable' && <div className="mt-2 flex items-center gap-1 text-muted-foreground bg-muted px-3 py-1 rounded-full text-xs font-bold"><Minus className="w-3 h-3" /> STABLE</div>}
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-muted-foreground uppercase">Key Insights</h4>
                  <ul className="space-y-2 text-sm">
                    {trends.insights?.map((insight, i) => (
                      <li key={i} className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />{insight}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-border/50">
        <CardHeader>
          <CardTitle>Regional Commodity Prices</CardTitle>
          <CardDescription>Current market rates across {region}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Commodity</th>
                  <th className="px-4 py-3">Market</th>
                  <th className="px-4 py-3">Price (ETB)</th>
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3">24h Change</th>
                  <th className="px-4 py-3 rounded-tr-lg">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingPrices ? (
                   <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading prices...</td></tr>
                ) : prices?.prices.length === 0 ? (
                   <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No price data reported yet.</td></tr>
                ) : (
                  prices?.prices.map((price) => (
                    <tr key={price.id} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-4 font-medium">{price.commodity} <span className="text-xs text-muted-foreground block">{price.commodityAmharic}</span></td>
                      <td className="px-4 py-4 text-muted-foreground">{price.market}</td>
                      <td className="px-4 py-4 font-bold text-foreground">{price.pricePerKg.toLocaleString()}</td>
                      <td className="px-4 py-4 text-muted-foreground">per {price.unit}</td>
                      <td className="px-4 py-4">
                        {price.changePercent && price.changePercent > 0 ? (
                           <span className="text-emerald-600 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {price.changePercent}%</span>
                        ) : price.changePercent && price.changePercent < 0 ? (
                           <span className="text-destructive flex items-center gap-1"><TrendingDown className="w-3 h-3" /> {Math.abs(price.changePercent)}%</span>
                        ) : (
                           <span className="text-muted-foreground flex items-center gap-1"><Minus className="w-3 h-3" /> 0%</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground text-xs">{new Date(price.reportedAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}