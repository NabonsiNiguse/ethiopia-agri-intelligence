import { useGetWeatherForecast, getGetWeatherForecastQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CloudRain, Sun, Wind, Droplets, MapPin, AlertCircle } from "lucide-react";

export default function Weather() {
  const { data: weather, isLoading } = useGetWeatherForecast(
    { region: "Oromia", days: 7 },
    { query: { queryKey: getGetWeatherForecastQueryKey({ region: "Oromia", days: 7 }) } }
  );

  if (isLoading) return <div className="p-8 text-center animate-pulse">Loading atmospheric data...</div>;
  if (!weather) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Climate & Weather Intelligence</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> {weather.region} Region Outlook
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
          <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8">
            <div className="shrink-0 text-primary">
              <CloudRain className="w-24 h-24" />
            </div>
            <div className="flex-1 space-y-4 text-center md:text-left">
              <div>
                <h2 className="text-5xl font-bold text-foreground">{weather.current.tempMax}°C</h2>
                <p className="text-xl font-medium text-muted-foreground mt-1">{weather.current.condition}</p>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm">
                <div className="flex items-center gap-2"><Droplets className="w-4 h-4 text-primary" /> {weather.current.humidity}% Humidity</div>
                <div className="flex items-center gap-2"><Wind className="w-4 h-4 text-primary" /> {weather.current.windSpeed} km/h Wind</div>
                <div className="flex items-center gap-2"><CloudRain className="w-4 h-4 text-primary" /> {weather.current.rainfall}mm Rain</div>
              </div>
              <div className="mt-4 p-4 bg-background/50 rounded-lg border border-primary/10">
                <p className="font-medium text-sm">🌾 Impact: {weather.current.farmingImpact}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-destructive/5 border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" /> Climate Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {weather.alerts.map((alert, i) => (
                <li key={i} className="text-sm font-medium leading-relaxed bg-background p-3 rounded border border-destructive/10">
                  {alert}
                </li>
              ))}
              {weather.alerts.length === 0 && <li className="text-sm text-muted-foreground">No active alerts for this region.</li>}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="text-xl font-bold mb-4">7-Day Projection</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {weather.forecast.map((day, i) => (
            <Card key={i} className="text-center shadow-sm hover:border-primary/50 transition-colors">
              <CardContent className="p-4 py-6 space-y-3">
                <p className="text-sm font-bold text-muted-foreground uppercase">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</p>
                <div className="flex justify-center text-primary">
                  {day.rainfall > 0 ? <CloudRain className="w-8 h-8" /> : <Sun className="w-8 h-8 text-secondary" />}
                </div>
                <div>
                  <p className="text-lg font-bold">{day.tempMax}°</p>
                  <p className="text-xs text-muted-foreground">{day.tempMin}°</p>
                </div>
                {day.rainfall > 0 && (
                  <p className="text-xs font-medium text-primary mt-2">{day.rainfall}mm</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}