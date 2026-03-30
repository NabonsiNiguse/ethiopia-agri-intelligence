import { useState } from "react";
import { useListFarmers, getListFarmersQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Phone, Smartphone, UserPlus } from "lucide-react";

export default function Farmers() {
  const [search, setSearch] = useState("");
  
  const { data: farmersData, isLoading } = useListFarmers(
    {},
    { query: { queryKey: getListFarmersQueryKey({}) } }
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Farmer Registry</h1>
          <p className="text-muted-foreground mt-1">Directory of registered smallholder farmers</p>
        </div>
        <Button className="gap-2"><UserPlus className="w-4 h-4" /> Register Farmer</Button>
      </div>

      <Card className="shadow-sm border-border/50">
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Search by name, phone, or region..." 
              className="pl-9 bg-muted/50 border-transparent focus-visible:ring-primary/20 focus-visible:bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
           Array.from({ length: 6 }).map((_, i) => (
             <Card key={i} className="animate-pulse h-48"></Card>
           ))
        ) : (
          farmersData?.farmers.map(farmer => (
            <Card key={farmer.id} className="shadow-sm hover:border-primary/30 transition-colors border-border/50">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                      {farmer.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{farmer.name}</h3>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">{farmer.preferredLanguage} • {farmer.landSizeHectares} HA</p>
                    </div>
                  </div>
                  {farmer.hasSmartphone && <Smartphone className="w-4 h-4 text-muted-foreground" title="Has Smartphone" />}
                </div>
                
                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" /> {farmer.phone}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> {farmer.region}, {farmer.zone || farmer.woreda}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mt-auto">
                  {farmer.primaryCrops.map(crop => (
                    <Badge key={crop} variant="secondary" className="text-xs font-normal bg-muted/50">{crop}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}