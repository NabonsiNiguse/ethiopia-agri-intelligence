import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Shield, CloudRain, Bug, AlertTriangle, ArrowRight, Activity, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SEED_POLICIES = [
  { id: -1, farmerId: 1, farmerName: "Abebe Girma",  coverageType: "drought", cropCovered: "Coffee", coverageAmountETB: 50000, premiumMonthlyETB: 167, startDate: "2026-01-01", endDate: "2026-12-31", status: "active",  triggerThreshold: "Rainfall < 30% of seasonal average for 3+ consecutive weeks", autoPayoutEnabled: true,  createdAt: "2026-01-01T00:00:00Z" },
  { id: -2, farmerId: 1, farmerName: "Abebe Girma",  coverageType: "pest",    cropCovered: "Maize",  coverageAmountETB: 25000, premiumMonthlyETB: 104, startDate: "2026-03-01", endDate: "2026-09-30", status: "active",  triggerThreshold: "Pest damage confirmed by AI detection (>40% crop loss)",    autoPayoutEnabled: true,  createdAt: "2026-03-01T00:00:00Z" },
  { id: -3, farmerId: 2, farmerName: "Tigist Bekele", coverageType: "flood",   cropCovered: "Teff",   coverageAmountETB: 30000, premiumMonthlyETB: 88,  startDate: "2025-06-01", endDate: "2025-12-31", status: "expired", triggerThreshold: "Rainfall > 200% of seasonal average in 48 hours",           autoPayoutEnabled: true,  createdAt: "2025-06-01T00:00:00Z" },
];

const COVERAGE_TYPES = [
  { value: "drought",  label: "Drought",  icon: AlertTriangle, rate: "4%" },
  { value: "flood",    label: "Flood",    icon: CloudRain,     rate: "3.5%" },
  { value: "pest",     label: "Pest",     icon: Bug,           rate: "5%" },
  { value: "disease",  label: "Disease",  icon: AlertTriangle, rate: "4.5%" },
  { value: "frost",    label: "Frost",    icon: CloudRain,     rate: "2.5%" },
];
const CROPS = ["Coffee", "Teff", "Wheat", "Sesame", "Maize", "Sorghum", "Barley"];

async function apiFetch(url: string, opts?: RequestInit) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function ApplyDialog({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({ coverageType: "drought", cropCovered: "Coffee", coverageAmountETB: "30000" });

  const selectedType = COVERAGE_TYPES.find(t => t.value === form.coverageType);
  const rate = parseFloat(selectedType?.rate ?? "4") / 100;
  const monthlyPremium = Math.round((parseFloat(form.coverageAmountETB) || 0) * rate / 12);

  const mutation = useMutation({
    mutationFn: () => apiFetch("/api/insurance/policies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ farmerId: 1, farmerName: "You", ...form, coverageAmountETB: parseFloat(form.coverageAmountETB) }),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["insurance-policies"] });
      toast({ title: "Policy created!", description: `Monthly premium: ${monthlyPremium.toLocaleString()} ETB` });
      onClose();
    },
    onError: () => toast({ title: "Application failed", variant: "destructive" }),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Shield className="w-5 h-5" /> Apply for Coverage</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>Coverage Type</Label>
            <Select value={form.coverageType} onValueChange={(v) => setForm(f => ({ ...f, coverageType: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {COVERAGE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label} ({t.rate}/yr)</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Crop Covered</Label>
            <Select value={form.cropCovered} onValueChange={(v) => setForm(f => ({ ...f, cropCovered: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CROPS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Coverage Amount (ETB)</Label>
            <Input type="number" min="5000" step="5000" value={form.coverageAmountETB}
              onChange={(e) => setForm(f => ({ ...f, coverageAmountETB: e.target.value }))} />
          </div>
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Annual Rate</span>
              <span className="font-medium">{selectedType?.rate}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Monthly Premium</span>
              <span className="font-bold text-primary">{monthlyPremium.toLocaleString()} ETB</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!form.coverageAmountETB || mutation.isPending} className="gap-2">
            <Shield className="w-4 h-4" />
            {mutation.isPending ? "Applying..." : "Apply Now"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Insurance() {
  const [showApply, setShowApply] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["insurance-policies"],
    queryFn: () => apiFetch("/api/insurance/policies"),
  });

  const policies = (data?.policies?.length > 0 ? data.policies : SEED_POLICIES) as typeof SEED_POLICIES;
  const active = policies.filter(p => p.status === "active");
  const totalCoverage = active.reduce((s, p) => s + p.coverageAmountETB, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Parametric Micro-Insurance</h1>
          <p className="text-muted-foreground mt-1">Weather-indexed automated coverage for smallholders</p>
        </div>
        <Button className="gap-2" onClick={() => setShowApply(true)}>
          <Plus className="w-4 h-4" /> Apply for Coverage
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary text-primary-foreground border-0 shadow-md">
          <CardContent className="p-5">
            <p className="text-primary-foreground/80 text-sm">Total Active Coverage</p>
            <p className="text-3xl font-bold mt-1">{(totalCoverage / 1000).toFixed(1)}k ETB</p>
            <p className="text-sm opacity-80 mt-1">{active.length} active {active.length === 1 ? "policy" : "policies"}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm col-span-2">
          <CardContent className="p-5 flex items-start gap-3">
            <Activity className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-sm">Auto-payout Triggers</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Policies are linked to regional weather stations. Payouts trigger automatically when conditions breach the threshold — no claim filing needed.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground animate-pulse">Loading policies...</div>
        ) : policies.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground border rounded-xl bg-card space-y-3">
            <Shield className="w-10 h-10 mx-auto opacity-30" />
            <p>No insurance policies yet.</p>
            <Button variant="outline" onClick={() => setShowApply(true)}>Apply for Coverage</Button>
          </div>
        ) : (
          policies.map(policy => {
            const typeInfo = COVERAGE_TYPES.find(t => t.value === policy.coverageType);
            const Icon = typeInfo?.icon ?? Shield;
            return (
              <Card key={policy.id} className="shadow-sm border-border/50 overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className={`p-5 md:w-56 shrink-0 flex flex-col gap-3 ${policy.status === "active" ? "bg-primary/5 border-r border-primary/10" : "bg-muted/30 border-r"}`}>
                    <Badge variant={policy.status === "active" ? "default" : "secondary"} className="w-fit uppercase text-[10px] tracking-wider">
                      {policy.status}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5 text-primary" />
                      <h3 className="font-bold capitalize">{policy.coverageType}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">Crop: <span className="font-medium text-foreground">{policy.cropCovered}</span></p>
                    {policy.autoPayoutEnabled && (
                      <Badge variant="outline" className="w-fit text-[10px] text-emerald-600 border-emerald-300">Auto-payout ON</Badge>
                    )}
                  </div>
                  <div className="p-5 flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Coverage</p>
                      <p className="font-bold">{policy.coverageAmountETB.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">ETB</span></p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Monthly Premium</p>
                      <p className="font-bold">{policy.premiumMonthlyETB.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">ETB</span></p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Period</p>
                      <p className="text-sm font-medium">{new Date(policy.startDate).toLocaleDateString()} – {new Date(policy.endDate).toLocaleDateString()}</p>
                    </div>
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm" className="gap-1 text-xs">
                        Details <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                {policy.triggerThreshold && (
                  <div className="px-5 pb-4 text-xs text-muted-foreground border-t pt-3 bg-muted/10">
                    Trigger: {policy.triggerThreshold}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {showApply && <ApplyDialog onClose={() => setShowApply(false)} />}
    </div>
  );
}
