import { useListInsurancePolicies, getListInsurancePoliciesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CloudRain, Bug, AlertTriangle, ArrowRight, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Insurance() {
  const { data: policies, isLoading } = useListInsurancePolicies(
    {},
    { query: { queryKey: getListInsurancePoliciesQueryKey({}) } }
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Parametric Micro-Insurance</h1>
          <p className="text-muted-foreground mt-1">Weather-indexed automated coverage for smallholders</p>
        </div>
        <Button className="gap-2"><Shield className="w-4 h-4" /> Apply for Coverage</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         <Card className="bg-primary text-primary-foreground border-0 shadow-md">
           <CardContent className="p-6">
             <h3 className="font-medium opacity-90 text-sm">Active Coverage</h3>
             <p className="text-3xl font-bold mt-2">124.5k ETB</p>
             <p className="text-sm opacity-80 mt-1">Across 3 active policies</p>
           </CardContent>
         </Card>
         <Card className="shadow-sm">
           <CardContent className="p-6 flex flex-col justify-center h-full">
             <h3 className="font-medium text-muted-foreground text-sm flex items-center gap-2">
               <Activity className="w-4 h-4" /> Auto-payout Triggers
             </h3>
             <p className="text-sm mt-3 leading-relaxed">Policies are linked to regional weather stations. Payouts trigger automatically if rainfall drops below threshold.</p>
           </CardContent>
         </Card>
      </div>

      <h2 className="text-xl font-bold">Your Policies</h2>
      
      <div className="space-y-4">
        {isLoading ? (
           <div className="p-8 text-center text-muted-foreground animate-pulse">Loading policies...</div>
        ) : policies?.policies.length === 0 ? (
           <div className="p-12 text-center text-muted-foreground border rounded-xl bg-card">No active insurance policies.</div>
        ) : (
          policies?.policies.map(policy => (
            <Card key={policy.id} className="shadow-sm border-border/50 overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className={`p-6 md:w-64 shrink-0 flex flex-col justify-between ${policy.status === 'active' ? 'bg-primary/5 border-r border-primary/10' : 'bg-muted border-r'}`}>
                  <div>
                    <Badge variant={policy.status === 'active' ? 'default' : 'secondary'} className="mb-4 uppercase text-[10px] tracking-wider">
                      {policy.status}
                    </Badge>
                    <div className="flex items-center gap-3 mb-2">
                      {policy.coverageType === 'drought' || policy.coverageType === 'flood' ? <CloudRain className="w-6 h-6 text-primary" /> : 
                       policy.coverageType === 'pest' ? <Bug className="w-6 h-6 text-accent" /> : <AlertTriangle className="w-6 h-6 text-destructive" />}
                      <h3 className="font-bold text-lg capitalize">{policy.coverageType}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">Crop: <span className="font-medium text-foreground">{policy.cropCovered}</span></p>
                  </div>
                </div>
                
                <div className="p-6 flex-1 grid grid-cols-2 md:grid-cols-4 gap-6 items-center">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Coverage Amount</p>
                    <p className="font-bold text-lg">{policy.coverageAmountETB.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">ETB</span></p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Premium</p>
                    <p className="font-bold">{policy.premiumMonthlyETB} <span className="text-sm font-normal text-muted-foreground">ETB/mo</span></p>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <p className="text-xs text-muted-foreground mb-1">Duration</p>
                    <p className="text-sm font-medium">{new Date(policy.startDate).toLocaleDateString()} - <br/>{new Date(policy.endDate).toLocaleDateString()}</p>
                  </div>
                  <div className="col-span-2 md:col-span-1 flex justify-end">
                    <Button variant="outline" className="w-full md:w-auto gap-2 text-xs">Details <ArrowRight className="w-3 h-3" /></Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}