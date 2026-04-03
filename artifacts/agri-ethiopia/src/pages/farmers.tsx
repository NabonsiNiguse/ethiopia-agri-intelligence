import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, MapPin, Phone, Smartphone, UserPlus, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const REGIONS  = ["Oromia", "Amhara", "SNNPR", "Tigray", "Afar", "Somali", "Gambela"];
const CROPS    = ["Coffee", "Teff", "Wheat", "Sesame", "Maize", "Sorghum", "Barley"];
const LANGS    = [{ value: "en", label: "English" }, { value: "am", label: "Amharic" }, { value: "om", label: "Afaan Oromo" }];

// Seed data shown when DB is empty
const SEED_FARMERS = [
  { id: -1, name: "Abebe Girma",    phone: "0911234567", region: "Oromia", zone: "Jimma",      woreda: "Jimma Town",   landSizeHectares: 2.5, primaryCrops: ["Coffee", "Maize"],  preferredLanguage: "en", hasSmartphone: true,  registeredAt: "2025-10-01T00:00:00Z" },
  { id: -2, name: "Tigist Bekele",  phone: "0922345678", region: "Amhara", zone: "South Gondar", woreda: "Bahir Dar",  landSizeHectares: 1.8, primaryCrops: ["Teff", "Wheat"],    preferredLanguage: "am", hasSmartphone: false, registeredAt: "2025-10-15T00:00:00Z" },
  { id: -3, name: "Chaltu Daba",    phone: "0933456789", region: "SNNPR",  zone: "Sidama",      woreda: "Hawassa",      landSizeHectares: 3.2, primaryCrops: ["Coffee", "Sesame"], preferredLanguage: "om", hasSmartphone: true,  registeredAt: "2025-11-01T00:00:00Z" },
  { id: -4, name: "Dawit Haile",    phone: "0944567890", region: "Tigray", zone: "Central",     woreda: "Axum",         landSizeHectares: 1.2, primaryCrops: ["Teff", "Sorghum"],  preferredLanguage: "am", hasSmartphone: false, registeredAt: "2025-11-10T00:00:00Z" },
  { id: -5, name: "Mulu Tesfaye",   phone: "0955678901", region: "SNNPR",  zone: "Wolaita",     woreda: "Sodo",         landSizeHectares: 2.0, primaryCrops: ["Sesame", "Maize"],  preferredLanguage: "en", hasSmartphone: true,  registeredAt: "2025-11-20T00:00:00Z" },
  { id: -6, name: "Kebede Tadesse", phone: "0966789012", region: "Amhara", zone: "North Gondar", woreda: "Gondar",      landSizeHectares: 4.5, primaryCrops: ["Wheat", "Barley"],  preferredLanguage: "am", hasSmartphone: false, registeredAt: "2025-12-01T00:00:00Z" },
  { id: -7, name: "Fatuma Hassen",  phone: "0977890123", region: "Oromia", zone: "West Hararghe", woreda: "Chiro",     landSizeHectares: 1.5, primaryCrops: ["Coffee", "Teff"],    preferredLanguage: "om", hasSmartphone: true,  registeredAt: "2025-12-10T00:00:00Z" },
  { id: -8, name: "Gemechu Wakjira",phone: "0988901234", region: "Oromia", zone: "Bale",        woreda: "Robe",         landSizeHectares: 3.0, primaryCrops: ["Wheat", "Maize"],   preferredLanguage: "om", hasSmartphone: true,  registeredAt: "2026-01-05T00:00:00Z" },
];

async function apiFetch(url: string, opts?: RequestInit) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function RegisterDialog({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "", phone: "", region: "Oromia", woreda: "", zone: "",
    landSizeHectares: "", preferredLanguage: "en",
    hasSmartphone: false, primaryCrops: [] as string[],
  });

  const toggleCrop = (c: string) =>
    setForm(f => ({ ...f, primaryCrops: f.primaryCrops.includes(c) ? f.primaryCrops.filter(x => x !== c) : [...f.primaryCrops, c] }));

  const mutation = useMutation({
    mutationFn: () => apiFetch("/api/farmers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, landSizeHectares: parseFloat(form.landSizeHectares) || null }),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["farmers"] });
      toast({ title: "Farmer registered successfully!" });
      onClose();
    },
    onError: () => toast({ title: "Registration failed — check required fields", variant: "destructive" }),
  });

  const valid = form.name.trim() && form.phone.trim() && form.region;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5" /> Register Farmer</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2 max-h-[65vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 col-span-2">
              <Label>Full Name *</Label>
              <Input placeholder="e.g. Abebe Girma" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Phone *</Label>
              <Input placeholder="09XXXXXXXX" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Language</Label>
              <Select value={form.preferredLanguage} onValueChange={(v) => setForm(f => ({ ...f, preferredLanguage: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LANGS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Region *</Label>
              <Select value={form.region} onValueChange={(v) => setForm(f => ({ ...f, region: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Zone</Label>
              <Input placeholder="e.g. Jimma" value={form.zone} onChange={(e) => setForm(f => ({ ...f, zone: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Woreda</Label>
              <Input placeholder="e.g. Jimma Town" value={form.woreda} onChange={(e) => setForm(f => ({ ...f, woreda: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Farm Size (ha)</Label>
              <Input type="number" step="0.1" min="0.1" placeholder="e.g. 2.5" value={form.landSizeHectares}
                onChange={(e) => setForm(f => ({ ...f, landSizeHectares: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Primary Crops</Label>
            <div className="flex flex-wrap gap-2">
              {CROPS.map(c => (
                <button key={c} type="button" onClick={() => toggleCrop(c)}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${form.primaryCrops.includes(c) ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-primary/50"}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setForm(f => ({ ...f, hasSmartphone: !f.hasSmartphone }))}
              className={`w-10 h-6 rounded-full transition-colors relative ${form.hasSmartphone ? "bg-primary" : "bg-muted"}`}>
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.hasSmartphone ? "translate-x-5" : "translate-x-1"}`} />
            </button>
            <Label className="cursor-pointer" onClick={() => setForm(f => ({ ...f, hasSmartphone: !f.hasSmartphone }))}>
              Has Smartphone
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!valid || mutation.isPending} className="gap-2">
            <UserPlus className="w-4 h-4" />
            {mutation.isPending ? "Registering..." : "Register"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Farmers() {
  const [search, setSearch] = useState("");
  const [filterRegion, setFilterRegion] = useState("all");
  const [showRegister, setShowRegister] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["farmers"],
    queryFn: () => apiFetch("/api/farmers?limit=100"),
  });

  const allFarmers = (data?.farmers?.length > 0 ? data.farmers : SEED_FARMERS) as typeof SEED_FARMERS;

  const filtered = allFarmers.filter(f => {
    const q = search.toLowerCase();
    const matchSearch = !q || f.name.toLowerCase().includes(q) || f.phone.includes(q) || f.region.toLowerCase().includes(q) || (f.woreda ?? "").toLowerCase().includes(q);
    const matchRegion = filterRegion === "all" || f.region === filterRegion;
    return matchSearch && matchRegion;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Farmer Registry</h1>
          <p className="text-muted-foreground mt-1">Directory of registered smallholder farmers</p>
        </div>
        <Button className="gap-2" onClick={() => setShowRegister(true)}>
          <UserPlus className="w-4 h-4" /> Register Farmer
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Registered", value: allFarmers.length },
          { label: "With Smartphone", value: allFarmers.filter(f => f.hasSmartphone).length },
          { label: "Regions Covered", value: new Set(allFarmers.map(f => f.region)).size },
        ].map((s, i) => (
          <Card key={i} className="shadow-none border-border/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by name, phone, region, or woreda..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterRegion} onValueChange={setFilterRegion}>
          <SelectTrigger className="w-[150px] bg-card"><SelectValue placeholder="All Regions" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            {REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {filtered.length} of {allFarmers.length} farmers
        {(search || filterRegion !== "all") && " (filtered)"}
      </p>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <Card key={i} className="animate-pulse h-48" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground bg-card rounded-lg border space-y-3">
          <Users className="w-10 h-10 mx-auto opacity-30" />
          <p>No farmers found matching your search.</p>
          <Button variant="outline" size="sm" onClick={() => { setSearch(""); setFilterRegion("all"); }}>Clear filters</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(farmer => (
            <Card key={farmer.id} className="shadow-sm hover:border-primary/30 transition-colors border-border/50">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shrink-0">
                      {farmer.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{farmer.name}</h3>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        {farmer.preferredLanguage === "am" ? "አማርኛ" : farmer.preferredLanguage === "om" ? "Oromoo" : "EN"}
                        {farmer.landSizeHectares ? ` • ${farmer.landSizeHectares} ha` : ""}
                      </p>
                    </div>
                  </div>
                  {farmer.hasSmartphone && <Smartphone className="w-4 h-4 text-muted-foreground shrink-0" title="Has Smartphone" />}
                </div>

                <div className="space-y-1.5 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 shrink-0" /> {farmer.phone}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    {farmer.region}{farmer.zone ? `, ${farmer.zone}` : ""}{farmer.woreda ? ` — ${farmer.woreda}` : ""}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {farmer.primaryCrops.map(crop => (
                    <Badge key={crop} variant="secondary" className="text-xs font-normal">{crop}</Badge>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground mt-3">
                  Registered {new Date(farmer.registeredAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showRegister && <RegisterDialog onClose={() => setShowRegister(false)} />}
    </div>
  );
}
