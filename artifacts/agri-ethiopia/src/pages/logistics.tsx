import { useListTractors, getListTractorsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, CheckCircle2, Star, Clock, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Logistics() {
  const { data: tractors, isLoading } = useListTractors(
    { available: true },
    { query: { queryKey: getListTractorsQueryKey({ available: true }) } }
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Alert className="bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400">
        <AlertTriangle className="h-4 w-4 !text-amber-600 dark:!text-amber-400" />
        <AlertTitle className="font-bold">Advanced Feature</AlertTitle>
        <AlertDescription>
          This module is partially implemented as a prototype. Core system features are fully functional.
        </AlertDescription>
      </Alert>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Smart Tractor Hub</h1>
          <p className="text-muted-foreground mt-1">Book mechanization services on-demand</p>
        </div>
        <Button className="gap-2">Register Tractor</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-muted rounded-t-lg"></div>
              <CardContent className="p-6 space-y-4">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))
        ) : tractors?.tractors.length === 0 ? (
          <div className="col-span-full p-12 text-center text-muted-foreground">No tractors available in your region at the moment.</div>
        ) : (
          tractors?.tractors.map(tractor => (
            <Card key={tractor.id} className="overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow border-border/50">
              <div className="h-48 bg-muted relative">
                {/* Fallback image representing a tractor */}
                <div className="absolute inset-0 bg-primary/10 flex items-center justify-center text-primary/40 font-bold text-xl uppercase tracking-widest">
                  {tractor.model}
                </div>
                <div className="absolute top-4 right-4 flex gap-2">
                  <Badge className="bg-emerald-600 shadow-sm border-0"><CheckCircle2 className="w-3 h-3 mr-1" /> Available</Badge>
                </div>
              </div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{tractor.model}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" /> {tractor.region}, {tractor.woreda}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1 font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded text-sm">
                    <Star className="w-3 h-3 fill-current" /> {tractor.rating}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="flex flex-wrap gap-1">
                  {tractor.services.map((s, i) => (
                    <Badge key={i} variant="outline" className="text-xs bg-background">{s}</Badge>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t">
                  <div>
                    <p className="text-muted-foreground mb-1">Price / Day</p>
                    <p className="font-bold">{tractor.pricePerDay} ETB</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Price / Hectare</p>
                    <p className="font-bold">{tractor.pricePerHectare} ETB</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/20 border-t p-4 flex gap-3">
                <Button variant="outline" className="w-full gap-2"><Clock className="w-4 h-4" /> Schedule</Button>
                <Button className="w-full gap-2"><Calendar className="w-4 h-4" /> Book Now</Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}