import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Link2, ShieldCheck, MapPin, Box, QrCode, Plus, CheckCircle, Clock, Truck, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SEED_BATCHES = [
  { id: "seed-001", farmerId: 1, farmerName: "Abebe Girma",  cropType: "coffee", variety: "Jimma 74110", quantityKg: 450, harvestDate: "2025-11-15", region: "Oromia", woreda: "Jimma", grade: "Specialty", blockchainHash: "a3f8c2d1e9b4f7a2c5d8e1f4b7c0d3e6f9a2b5c8d1e4f7a0b3c6d9e2f5a8b1c4", blockchainTxId: "0xa3f8c2d1e9b4f7a2c5d8e1f4b7c0d3e6f9a2b5c8", status: "exported",    createdAt: "2025-11-16T00:00:00Z" },
  { id: "seed-002", farmerId: 2, farmerName: "Tigist Bekele", cropType: "teff",   variety: "Quncho",      quantityKg: 280, harvestDate: "2025-10-20", region: "Amhara", woreda: "Bahir Dar", grade: "Grade1", blockchainHash: "b4e9d3c8f2a7e1d6c0b5f9a4e8d2c7b1f5a0e4d9c3b8f2a6e0d5c9b4f8a3e7d1", blockchainTxId: "0xb4e9d3c8f2a7e1d6c0b5f9a4e8d2c7b1f5a0e4d9", status: "processing", createdAt: "2025-10-21T00:00:00Z" },
  { id: "seed-003", farmerId: 3, farmerName: "Chaltu Daba",  cropType: "sesame",  variety: "Humera",      quantityKg: 180, harvestDate: "2025-09-30", region: "SNNPR",  woreda: "Hawassa",  grade: "Grade2", blockchainHash: "c5f0e4d9c3b8f2a7e1d6c0b5f9a4e8d2c7b1f5a0e4d9c3b8f2a6e0d5c9b4f8a3", blockchainTxId: "0xc5f0e4d9c3b8f2a7e1d6c0b5f9a4e8d2c7b1f5a0", status: "harvested",  createdAt: "2025-10-01T00:00:00Z" },
];

const SEED_EVENTS: Record<string, Array<{ eventType: string; description: string; location: string; actor: string; timestamp: string; verified: boolean }>> = {
  "seed-001": [
    { eventType: "HARVEST",    description: "Coffee harvested — selective picking, red cherries only", location: "Jimma, Oromia",          actor: "Abebe Girma",          timestamp: "2025-11-15T08:00:00Z", verified: true },
    { eventType: "PROCESSING", description: "Wet processing — pulping and fermentation (36h)",         location: "Jimma Washing Station",   actor: "Jimma Coop",           timestamp: "2025-11-16T10:00:00Z", verified: true },
    { eventType: "GRADING",    description: "AI grading — Specialty grade, score 92/100",              location: "Jimma Quality Lab",       actor: "AI Grading System",    timestamp: "2025-11-20T14:00:00Z", verified: true },
    { eventType: "EXPORT",     description: "Shipped to Rotterdam via Djibouti port",                  location: "Addis Ababa ECX → Djibouti", actor: "Ethiopia Export PLC", timestamp: "2025-12-01T06:00:00Z", verified: true },
  ],
  "seed-002": [
    { eventType: "HARVEST",    description: "Teff harvested — Quncho variety, Meher season",           location: "Bahir Dar, Amhara",       actor: "Tigist Bekele",        timestamp: "2025-10-20T07:00:00Z", verified: true },
    { eventType: "PROCESSING", description: "Threshing and cleaning — 280 kg net weight",              location: "Bahir Dar Cooperative",   actor: "Amhara Coop",          timestamp: "2025-10-22T09:00:00Z", verified: true },
    { eventType: "GRADING",    description: "Grade 1 certified — moisture 12%, defects 4.5%",          location: "Bahir Dar Quality Center", actor: "AI Grading System",   timestamp: "2025-10-25T11:00:00Z", verified: true },
  ],
};

const STATUS_CONFIG: Record<string, { color: string; icon: typeof CheckCircle; label: string }> = {
  harvested:  { color: "bg-primary",      icon: Package,      label: "Harvested" },
  processing: { color: "bg-amber-500",    icon: Clock,        label: "Processing" },
  graded:     { color: "bg-blue-500",     icon: ShieldCheck,  label: "Graded" },
  exported:   { color: "bg-emerald-600",  icon: Truck,        label: "Exported" },
};

const CROPS   = ["Coffee", "Teff", "Wheat", "Sesame", "Maize"];
const REGIONS = ["Oromia", "Amhara", "SNNPR", "Tigray"];

async function apiFetch(url: string, opts?: RequestInit) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function NewBatchDialog({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({ cropType: "coffee", variety: "", quantityKg: "", harvestDate: new Date().toISOString().split("T")[0]!, region: "Oromia", woreda: "" });

  const mutation = useMutation({
    mutationFn: () => apiFetch("/api/traceability/batches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ farmerId: 1, farmerName: "You", ...form, quantityKg: parseFloat(form.quantityKg) }),
    }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["crop-batches"] });
      toast({ title: "Batch registered on blockchain!", description: `Hash: ${data.blockchainHash?.substring(0, 16)}...` });
      onClose();
    },
    onError: () => toast({ title: "Registration failed", variant: "destructive" }),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Plus className="w-5 h-5" /> Register Crop Batch</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Crop</Label>
              <Select value={form.cropType} onValueChange={(v) => setForm(f => ({ ...f, cropType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CROPS.map(c => <SelectItem key={c} value={c.toLowerCase()}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Variety</Label>
              <Input placeholder="e.g. Jimma 74110" value={form.variety} onChange={(e) => setForm(f => ({ ...f, variety: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Quantity (kg)</Label>
              <Input type="number" min="1" placeholder="e.g. 250" value={form.quantityKg} onChange={(e) => setForm(f => ({ ...f, quantityKg: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Harvest Date</Label>
              <Input type="date" value={form.harvestDate} onChange={(e) => setForm(f => ({ ...f, harvestDate: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Region</Label>
              <Select value={form.region} onValueChange={(v) => setForm(f => ({ ...f, region: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Woreda</Label>
              <Input placeholder="e.g. Jimma" value={form.woreda} onChange={(e) => setForm(f => ({ ...f, woreda: e.target.value }))} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">A SHA-256 blockchain hash will be generated and recorded for this batch.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!form.quantityKg || mutation.isPending} className="gap-2">
            <Link2 className="w-4 h-4" />
            {mutation.isPending ? "Registering..." : "Register on Chain"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function JourneyDialog({ batchId, cropType, onClose }: { batchId: string; cropType: string; onClose: () => void }) {
  const { data } = useQuery({
    queryKey: ["batch-trace", batchId],
    queryFn: () => {
      if (batchId.startsWith("seed-")) {
        return Promise.resolve({ events: SEED_EVENTS[batchId] ?? [], batchId, cropType });
      }
      return apiFetch(`/api/traceability/batches/${batchId}/trace`);
    },
  });

  const events = data?.events ?? [];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 capitalize"><ShieldCheck className="w-5 h-5" /> {cropType} Supply Chain Journey</DialogTitle>
        </DialogHeader>
        <div className="py-2 max-h-[60vh] overflow-y-auto">
          {events.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No supply chain events recorded yet.</p>
          ) : (
            <div className="relative pl-6">
              <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border" />
              {events.map((e: any, i: number) => (
                <div key={i} className="relative mb-6 last:mb-0">
                  <div className={`absolute -left-4 w-4 h-4 rounded-full border-2 border-background ${e.verified ? "bg-emerald-500" : "bg-muted-foreground"}`} />
                  <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">{e.eventType}</span>
                      {e.verified && <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200 text-[10px]"><CheckCircle className="w-2.5 h-2.5 mr-1" />Verified</Badge>}
                    </div>
                    <p className="text-sm text-foreground">{e.description}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{e.location}</span>
                      <span>{new Date(e.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">By: {e.actor}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Traceability() {
  const [showNew, setShowNew] = useState(false);
  const [journey, setJourney] = useState<{ id: string; cropType: string } | null>(null);
  const [scanInput, setScanInput] = useState("");
  const [showScan, setShowScan] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["crop-batches"],
    queryFn: () => apiFetch("/api/traceability/batches"),
  });

  const batches = (data?.batches?.length > 0 ? data.batches : SEED_BATCHES) as typeof SEED_BATCHES;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Blockchain Traceability</h1>
          <p className="text-muted-foreground mt-1">Farm-to-export transparent supply chain</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setShowScan(true)}>
            <QrCode className="w-4 h-4" /> Scan / Lookup
          </Button>
          <Button className="gap-2" onClick={() => setShowNew(true)}>
            <Plus className="w-4 h-4" /> Register Batch
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Batches", value: batches.length },
          { label: "Exported", value: batches.filter(b => b.status === "exported").length },
          { label: "Total Volume", value: `${batches.reduce((s, b) => s + b.quantityKg, 0).toLocaleString()} kg` },
        ].map((s, i) => (
          <Card key={i} className="shadow-none border-border/50">
            <CardContent className="p-4 text-center">
              <div className="text-xl font-bold text-primary">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Batch grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <Card key={i} className="animate-pulse h-48" />)
        ) : batches.length === 0 ? (
          <div className="col-span-full p-12 text-center text-muted-foreground bg-card rounded-lg border space-y-3">
            <Link2 className="w-10 h-10 mx-auto opacity-30" />
            <p>No tracked batches yet.</p>
            <Button variant="outline" size="sm" onClick={() => setShowNew(true)}>Register First Batch</Button>
          </div>
        ) : (
          batches.map(batch => {
            const statusCfg = STATUS_CONFIG[batch.status] ?? STATUS_CONFIG.harvested!;
            const StatusIcon = statusCfg.icon;
            return (
              <Card key={batch.id} className="relative overflow-hidden border-border/50 hover:border-primary/40 transition-colors shadow-sm">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                <CardHeader className="pb-2 pl-5">
                  <div className="flex justify-between items-start mb-1">
                    <Badge variant="outline" className="font-mono text-xs">{batch.id.substring(0, 8)}</Badge>
                    <Badge className={`${statusCfg.color} border-0 gap-1 text-xs`}>
                      <StatusIcon className="w-3 h-3" /> {statusCfg.label}
                    </Badge>
                  </div>
                  <CardTitle className="capitalize text-base">{batch.cropType} {batch.variety ? `(${batch.variety})` : ""}</CardTitle>
                  <CardDescription className="flex items-center gap-1 text-xs">
                    <MapPin className="w-3 h-3" /> {batch.region}{batch.woreda ? `, ${batch.woreda}` : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pl-5 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm bg-muted/20 p-3 rounded-lg border">
                    <div>
                      <p className="text-xs text-muted-foreground">Quantity</p>
                      <p className="font-bold flex items-center gap-1"><Box className="w-3 h-3" />{batch.quantityKg.toLocaleString()} kg</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Grade</p>
                      <p className="font-bold">{batch.grade ?? "Pending"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Farmer</p>
                      <p className="font-medium text-xs">{batch.farmerName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Harvest</p>
                      <p className="font-medium text-xs">{new Date(batch.harvestDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-muted p-2 rounded break-all">
                    <Link2 className="w-3 h-3 shrink-0" />
                    <span className="truncate">{batch.blockchainHash ? batch.blockchainHash.substring(0, 32) + "..." : "Pending"}</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full text-xs gap-1"
                    onClick={() => setJourney({ id: batch.id, cropType: batch.cropType })}>
                    <ShieldCheck className="w-3 h-3" /> View Supply Chain Journey
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Scan/Lookup dialog */}
      {showScan && (
        <Dialog open onOpenChange={() => setShowScan(false)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><QrCode className="w-5 h-5" /> Lookup Batch</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <p className="text-sm text-muted-foreground">Enter a batch ID or blockchain hash to trace its supply chain journey.</p>
              <Input placeholder="Batch ID or hash..." value={scanInput} onChange={(e) => setScanInput(e.target.value)} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowScan(false)}>Cancel</Button>
              <Button onClick={() => {
                const found = batches.find(b => b.id.includes(scanInput) || b.blockchainHash?.includes(scanInput));
                if (found) { setJourney({ id: found.id, cropType: found.cropType }); setShowScan(false); }
              }} disabled={!scanInput.trim()}>
                Lookup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {showNew && <NewBatchDialog onClose={() => setShowNew(false)} />}
      {journey && <JourneyDialog batchId={journey.id} cropType={journey.cropType} onClose={() => setJourney(null)} />}
    </div>
  );
}
