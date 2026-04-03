import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MapPin, Calendar, CheckCircle2, Star, Clock, Tractor, Phone, Plus, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TractorData {
  id: number; model: string; ownerName: string; ownerPhone: string;
  region: string; woreda?: string; horsepower: number; year: number;
  pricePerDay: number; pricePerHectare: number; available: boolean;
  rating: number; totalJobs: number; services: string[];
}

const SERVICES = ["Plowing", "Harrowing", "Planting", "Spraying", "Threshing", "Harvesting"];
const REGIONS  = ["Oromia", "Amhara", "SNNPR", "Tigray", "Afar", "Gambela"];

async function apiFetch(url: string, opts?: RequestInit) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function BookingDialog({ tractor, mode, onClose }: { tractor: TractorData; mode: "book" | "schedule"; onClose: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    serviceType: tractor.services[0] ?? "Plowing",
    scheduledDate: new Date(Date.now() + 86400000).toISOString().split("T")[0]!,
    durationDays: "1",
    hectares: "1",
    notes: "",
  });

  const mutation = useMutation({
    mutationFn: () => apiFetch("/api/logistics/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tractorId: tractor.id, farmerId: 1, farmerName: "You",
        ...form,
      }),
    }),
    onSuccess: (data) => {
      toast({
        title: mode === "book" ? "Booking confirmed!" : "Schedule request sent!",
        description: `${tractor.model} booked for ${form.scheduledDate}. Total: ${data.totalCost?.toLocaleString()} ETB`,
      });
      onClose();
    },
    onError: () => toast({ title: "Booking failed", variant: "destructive" }),
  });

  const totalCost = Math.round(tractor.pricePerHectare * parseFloat(form.hectares || "1") * parseInt(form.durationDays || "1", 10));

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "book" ? <Calendar className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
            {mode === "book" ? "Book Now" : "Schedule"} — {tractor.model}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="p-3 bg-muted/30 rounded-lg text-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
              {tractor.ownerName.charAt(0)}
            </div>
            <div>
              <p className="font-medium">{tractor.ownerName}</p>
              <p className="text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {tractor.ownerPhone}</p>
            </div>
            <div className="ml-auto flex items-center gap-1 text-amber-500 font-bold">
              <Star className="w-3 h-3 fill-current" /> {tractor.rating}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Service Type</Label>
              <Select value={form.serviceType} onValueChange={(v) => setForm(f => ({ ...f, serviceType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {tractor.services.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Date</Label>
              <Input type="date" value={form.scheduledDate} min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setForm(f => ({ ...f, scheduledDate: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Duration (days)</Label>
              <Input type="number" min="1" max="30" value={form.durationDays}
                onChange={(e) => setForm(f => ({ ...f, durationDays: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Hectares</Label>
              <Input type="number" min="0.5" step="0.5" value={form.hectares}
                onChange={(e) => setForm(f => ({ ...f, hectares: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Notes (optional)</Label>
            <Input placeholder="Any special requirements..." value={form.notes}
              onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>

          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg flex justify-between items-center">
            <span className="text-sm font-medium">Estimated Total</span>
            <span className="text-xl font-bold text-primary">{totalCost.toLocaleString()} ETB</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="gap-2">
            <Send className="w-4 h-4" />
            {mutation.isPending ? "Confirming..." : mode === "book" ? "Confirm Booking" : "Send Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RegisterTractorDialog({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    ownerName: "", ownerPhone: "", model: "", year: "2020",
    horsepower: "60", region: "Oromia", woreda: "",
    pricePerDay: "", pricePerHectare: "",
    services: ["Plowing", "Harrowing"] as string[],
  });

  const toggleService = (s: string) =>
    setForm(f => ({ ...f, services: f.services.includes(s) ? f.services.filter(x => x !== s) : [...f.services, s] }));

  const mutation = useMutation({
    mutationFn: () => apiFetch("/api/logistics/tractors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, ownerId: 1, year: parseInt(form.year), horsepower: parseInt(form.horsepower) }),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tractors"] });
      toast({ title: "Tractor registered successfully!" });
      onClose();
    },
    onError: () => toast({ title: "Registration failed", variant: "destructive" }),
  });

  const valid = form.ownerName && form.model && form.pricePerDay && form.pricePerHectare;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Tractor className="w-5 h-5" /> Register Your Tractor</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 col-span-2">
              <Label>Owner Name</Label>
              <Input placeholder="Your full name" value={form.ownerName} onChange={(e) => setForm(f => ({ ...f, ownerName: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input placeholder="09XXXXXXXX" value={form.ownerPhone} onChange={(e) => setForm(f => ({ ...f, ownerPhone: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Tractor Model</Label>
              <Input placeholder="e.g. John Deere 5075E" value={form.model} onChange={(e) => setForm(f => ({ ...f, model: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Year</Label>
              <Input type="number" min="2000" max="2025" value={form.year} onChange={(e) => setForm(f => ({ ...f, year: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Horsepower</Label>
              <Input type="number" min="30" max="200" value={form.horsepower} onChange={(e) => setForm(f => ({ ...f, horsepower: e.target.value }))} />
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
            <div className="space-y-1">
              <Label>Price / Day (ETB)</Label>
              <Input type="number" placeholder="2500" value={form.pricePerDay} onChange={(e) => setForm(f => ({ ...f, pricePerDay: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Price / Hectare (ETB)</Label>
              <Input type="number" placeholder="600" value={form.pricePerHectare} onChange={(e) => setForm(f => ({ ...f, pricePerHectare: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Services Offered</Label>
            <div className="flex flex-wrap gap-2">
              {SERVICES.map(s => (
                <button key={s} type="button" onClick={() => toggleService(s)}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${form.services.includes(s) ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-primary/50"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!valid || mutation.isPending} className="gap-2">
            <Plus className="w-4 h-4" />
            {mutation.isPending ? "Registering..." : "Register Tractor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Logistics() {
  const [filterRegion, setFilterRegion] = useState("all");
  const [showAvailableOnly, setShowAvailableOnly] = useState(true);
  const [booking, setBooking] = useState<{ tractor: TractorData; mode: "book" | "schedule" } | null>(null);
  const [showRegister, setShowRegister] = useState(false);

  const params = new URLSearchParams({
    ...(filterRegion !== "all" && { region: filterRegion }),
    ...(showAvailableOnly && { available: "true" }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["tractors", filterRegion, showAvailableOnly],
    queryFn: () => apiFetch(`/api/logistics/tractors?${params}`),
  });

  const tractors: TractorData[] = data?.tractors ?? [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Smart Tractor Hub</h1>
          <p className="text-muted-foreground mt-1">Book mechanization services on-demand across Ethiopia</p>
        </div>
        <Button className="gap-2" onClick={() => setShowRegister(true)}>
          <Plus className="w-4 h-4" /> Register Tractor
        </Button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Available Now", value: tractors.filter(t => t.available).length },
          { label: "Total Listed", value: tractors.length },
          { label: "Avg Rating", value: tractors.length ? (tractors.reduce((s, t) => s + t.rating, 0) / tractors.length).toFixed(1) : "—" },
        ].map((s, i) => (
          <Card key={i} className="shadow-none border-border/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={filterRegion} onValueChange={setFilterRegion}>
          <SelectTrigger className="w-[150px] bg-card"><SelectValue placeholder="All Regions" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            {REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <button
          onClick={() => setShowAvailableOnly(v => !v)}
          className={`px-4 py-2 rounded-md text-sm border transition-colors ${showAvailableOnly ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"}`}
        >
          Available Only
        </button>
      </div>

      {/* Tractor grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse h-72" />
          ))
        ) : tractors.length === 0 ? (
          <div className="col-span-full p-12 text-center text-muted-foreground bg-card rounded-lg border space-y-3">
            <Tractor className="w-10 h-10 mx-auto opacity-30" />
            <p>No tractors found for the selected filters.</p>
            <Button variant="outline" size="sm" onClick={() => { setFilterRegion("all"); setShowAvailableOnly(false); }}>Clear filters</Button>
          </div>
        ) : (
          tractors.map(tractor => (
            <Card key={tractor.id} className="overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow border-border/50">
              {/* Header image area */}
              <div className="h-36 bg-gradient-to-br from-primary/10 to-muted relative flex items-center justify-center">
                <Tractor className="w-16 h-16 text-primary/30" />
                <div className="absolute top-3 right-3 flex gap-2">
                  <Badge className={tractor.available ? "bg-emerald-600 border-0" : "bg-muted-foreground border-0"}>
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {tractor.available ? "Available" : "Busy"}
                  </Badge>
                </div>
                <div className="absolute bottom-3 left-3 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
                  {tractor.year} • {tractor.horsepower}HP
                </div>
              </div>

              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{tractor.model}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-0.5 text-xs">
                      <MapPin className="w-3 h-3" /> {tractor.region}{tractor.woreda ? `, ${tractor.woreda}` : ""}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1 font-bold text-amber-500 text-sm shrink-0">
                    <Star className="w-3 h-3 fill-current" /> {tractor.rating}
                    <span className="text-xs text-muted-foreground font-normal">({tractor.totalJobs})</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center font-bold text-foreground text-[10px]">
                    {tractor.ownerName.charAt(0)}
                  </div>
                  {tractor.ownerName}
                  <span className="ml-auto flex items-center gap-1"><Phone className="w-3 h-3" />{tractor.ownerPhone}</span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {tractor.services.map((s, i) => (
                    <Badge key={i} variant="outline" className="text-xs bg-background">{s}</Badge>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm pt-2 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">Per Day</p>
                    <p className="font-bold">{tractor.pricePerDay.toLocaleString()} ETB</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Per Hectare</p>
                    <p className="font-bold">{tractor.pricePerHectare.toLocaleString()} ETB</p>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="bg-muted/20 border-t p-3 flex gap-2">
                <Button
                  variant="outline" size="sm" className="flex-1 gap-1 text-xs"
                  disabled={!tractor.available}
                  onClick={() => setBooking({ tractor, mode: "schedule" })}
                >
                  <Clock className="w-3 h-3" /> Schedule
                </Button>
                <Button
                  size="sm" className="flex-1 gap-1 text-xs"
                  disabled={!tractor.available}
                  onClick={() => setBooking({ tractor, mode: "book" })}
                >
                  <Calendar className="w-3 h-3" /> Book Now
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      {booking && <BookingDialog tractor={booking.tractor} mode={booking.mode} onClose={() => setBooking(null)} />}
      {showRegister && <RegisterTractorDialog onClose={() => setShowRegister(false)} />}
    </div>
  );
}
