import { useGetDashboardSummary, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, AlertTriangle, TrendingUp, ShieldCheck, Tractor, MessageSquare } from "lucide-react";

export default function Dashboard() {
  const { data: summary, isLoading } = useGetDashboardSummary({
    query: {
      queryKey: getGetDashboardSummaryQueryKey()
    }
  });

  if (isLoading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-8 w-64 bg-muted rounded"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-32 bg-muted rounded"></div>)}
      </div>
    </div>;
  }

  if (!summary) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">National Agricultural Command Center</h1>
        <p className="text-muted-foreground mt-2 text-lg">Real-time intelligence across all integrated regions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-primary/5 border-primary/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-primary">Active Farmers</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{summary?.activeFarmers?.toLocaleString() ?? "0"}</div>
            <p className="text-xs text-muted-foreground mt-1">Out of {summary?.totalFarmers?.toLocaleString() ?? "0"} registered</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Disease Alerts (Today)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{summary.diseaseDetectionsToday}</div>
            <p className="text-xs text-muted-foreground mt-1">Requiring immediate extension support</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">AI Advisories Given</CardTitle>
            <MessageSquare className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{summary?.totalAdvisories?.toLocaleString() ?? "0"}</div>
            <p className="text-xs text-muted-foreground mt-1">Across SMS, USSD, and App</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Micro-Insurance</CardTitle>
            <ShieldCheck className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{summary?.activeInsurancePolicies?.toLocaleString() ?? "0"}</div>
            <p className="text-xs text-muted-foreground mt-1">Policies currently active</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Market Updates</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{summary.marketPricesUpdatedToday}</div>
            <p className="text-xs text-muted-foreground mt-1">Prices refreshed today</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tractors Deployed</CardTitle>
            <Tractor className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{summary.tractorsAvailable}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently in the field</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Regional Coverage</CardTitle>
            <CardDescription>Farmer adoption by region</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary.regionCoverage?.map((region) => (
                <div key={region.region} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{region.region}</span>
                  <div className="flex items-center gap-4 flex-1 ml-4">
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${(region.farmerCount / summary.totalFarmers) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {region.farmerCount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Monitored Crops</CardTitle>
            <CardDescription>Most frequently queried crops</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary.topCrops?.map((crop) => (
                <div key={crop.crop} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <span className="text-sm font-medium capitalize">{crop.crop}</span>
                  <span className="text-sm font-bold text-primary">{crop?.count?.toLocaleString() ?? "0"} queries</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}