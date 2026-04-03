import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle2, Upload, AlertCircle, Loader2, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SEED_RECORDS = [
  { id: -1, farmerId: 1, cropType: "coffee",  grade: "Specialty", score: 92, moistureContent: 11.2, defectRate: 2.1, certificationEligible: true,  gradedAt: "2026-03-15T10:00:00Z", batchId: "BATCH-001", weightKg: 250, feedback: ["Excellent quality! Eligible for export and specialty markets"] },
  { id: -2, farmerId: 1, cropType: "teff",    grade: "Grade1",    score: 83, moistureContent: 12.0, defectRate: 4.5, certificationEligible: true,  gradedAt: "2026-03-10T10:00:00Z", batchId: "BATCH-002", weightKg: 180, feedback: ["Good quality — suitable for premium local market"] },
  { id: -3, farmerId: 2, cropType: "sesame",  grade: "Grade2",    score: 71, moistureContent: 13.1, defectRate: 7.8, certificationEligible: false, gradedAt: "2026-03-05T10:00:00Z", batchId: "BATCH-003", weightKg: 120, feedback: ["Moisture content is above optimal — dry further before storage", "Defect rate is elevated — improve sorting"] },
  { id: -4, farmerId: 2, cropType: "coffee",  grade: "Grade1",    score: 81, moistureContent: 11.8, defectRate: 3.9, certificationEligible: true,  gradedAt: "2026-02-28T10:00:00Z", batchId: "BATCH-004", weightKg: 300, feedback: ["Good quality! Eligible for export markets"] },
];

async function apiFetch(url: string, opts?: RequestInit) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

const GRADE_COLORS: Record<string, string> = {
  Specialty: "bg-emerald-600",
  Grade1:    "bg-primary",
  Grade2:    "bg-amber-500",
  Grade3:    "bg-orange-500",
  Grade4:    "bg-muted-foreground",
  Grade5:    "bg-destructive",
};

function NewGradingDialog({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({ cropType: "coffee", weightKg: "", batchId: "" });

  const mutation = useMutation({
    mutationFn: () => apiFetch("/api/grading/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ farmerId: 1, ...form, weightKg: parseFloat(form.weightKg) }),
    }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["grading-records"] });
      toast({ title: `Grading complete — ${data.grade}`, description: `Score: ${data.score}/100 • ${data.certificationEligible ? "Export eligible" : "Local market"}` });
      onClose();
    },
    onError: () => toast({ title: "Grading failed", variant: "destructive" }),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Award className="w-5 h-5" /> New Grading Request</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>Crop Type</Label>
            <Select value={form.cropType} onValueChange={(v) => setForm(f => ({ ...f, cropType: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="coffee">Coffee</SelectItem>
                <SelectItem value="teff">Teff</SelectItem>
                <SelectItem value="sesame">Sesame</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Weight (kg)</Label>
            <Input type="number" min="1" placeholder="e.g. 250" value={form.weightKg}
              onChange={(e) => setForm(f => ({ ...f, weightKg: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>Batch ID (optional)</Label>
            <Input placeholder="e.g. BATCH-005" value={form.batchId}
              onChange={(e) => setForm(f => ({ ...f, batchId: e.target.value }))} />
          </div>
          <p className="text-xs text-muted-foreground">The AI model will analyze moisture content, defect rate, color, and size uniformity to assign a grade.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!form.weightKg || mutation.isPending} className="gap-2">
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {mutation.isPending ? "Analyzing..." : "Submit Sample"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Grading() {
  const [showNew, setShowNew] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["grading-records"],
    queryFn: () => apiFetch("/api/grading/records"),
  });

  const records = (data?.records?.length > 0 ? data.records : SEED_RECORDS) as typeof SEED_RECORDS;
  const avgScore = records.length ? Math.round(records.reduce((s, r) => s + r.score, 0) / records.length) : 0;
  const exportReady = records.filter(r => r.certificationEligible).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">AI Crop Quality Grading</h1>
          <p className="text-muted-foreground mt-1">Computer vision assessment for export readiness</p>
        </div>
        <Button className="gap-2" onClick={() => setShowNew(true)}>
          <Upload className="w-4 h-4" /> New Grading Request
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary text-primary-foreground border-transparent shadow-md">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-full"><CheckCircle2 className="w-7 h-7 text-white" /></div>
            <div>
              <p className="text-primary-foreground/80 text-sm">Avg Quality Score</p>
              <h2 className="text-3xl font-bold">{avgScore}/100</h2>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/50">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-full"><Award className="w-7 h-7 text-emerald-600" /></div>
            <div>
              <p className="text-muted-foreground text-sm">Export Eligible</p>
              <h2 className="text-3xl font-bold">{exportReady} <span className="text-sm font-normal text-muted-foreground">batches</span></h2>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm">Supported Crops</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="flex flex-wrap gap-2">
              {["Coffee Beans", "Teff Grains", "Sesame Seeds"].map(c => (
                <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-border/50">
        <CardHeader>
          <CardTitle>Grading Records</CardTitle>
          <CardDescription>AI quality assessments — click "New Grading Request" to analyze a batch</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground animate-pulse">Loading records...</div>
          ) : records.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl gap-3">
              <AlertCircle className="w-8 h-8 opacity-50" />
              <p>No grading records yet.</p>
              <Button variant="outline" onClick={() => setShowNew(true)}>Submit First Sample</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map(record => (
                <div key={record.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg gap-4 hover:bg-muted/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-sm font-black text-white ${GRADE_COLORS[record.grade] ?? "bg-muted"}`}>
                      {record.score}
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground capitalize">{record.cropType} — {record.grade}</h4>
                      <p className="text-xs text-muted-foreground">
                        {record.batchId ? `Batch: ${record.batchId} • ` : ""}
                        {record.weightKg ? `${record.weightKg} kg • ` : ""}
                        {new Date(record.gradedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm flex-wrap">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Moisture</p>
                      <p className={`font-bold ${record.moistureContent > 12.5 ? "text-amber-500" : "text-foreground"}`}>{record.moistureContent}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Defects</p>
                      <p className={`font-bold ${record.defectRate > 5 ? "text-destructive" : "text-foreground"}`}>{record.defectRate}%</p>
                    </div>
                    {record.certificationEligible
                      ? <Badge className="bg-emerald-600 hover:bg-emerald-700">Export Ready</Badge>
                      : <Badge variant="secondary">Local Market</Badge>
                    }
                  </div>
                  {record.feedback?.length > 0 && (
                    <div className="md:hidden text-xs text-muted-foreground italic">{record.feedback[0]}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showNew && <NewGradingDialog onClose={() => setShowNew(false)} />}
    </div>
  );
}
