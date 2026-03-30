import { useListCropBatches, getListCropBatchesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link2, ShieldCheck, MapPin, Box, QrCode, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Traceability() {
  const { data: batches, isLoading } = useListCropBatches(
    {},
    { query: { queryKey: getListCropBatchesQueryKey({}) } }
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Alert className="bg-zinc-500/10 border-zinc-500/30 text-zinc-700 dark:text-zinc-400">
        <Info className="h-4 w-4 !text-zinc-600 dark:!text-zinc-400" />
        <AlertTitle className="font-bold">Future Research Extension</AlertTitle>
        <AlertDescription>
          This module is proposed and prototyped for demonstration. It represents planned future development.
        </AlertDescription>
      </Alert>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Blockchain Traceability</h1>
          <p className="text-muted-foreground mt-1">Farm-to-export transparent supply chain</p>
        </div>
        <Button className="gap-2" variant="outline"><QrCode className="w-4 h-4" /> Scan QR</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse h-48"></Card>
          ))
        ) : batches?.batches.length === 0 ? (
           <div className="col-span-full p-12 text-center text-muted-foreground">No tracked batches found.</div>
        ) : (
          batches?.batches.map(batch => (
            <Card key={batch.id} className="relative overflow-hidden group border-border/50 hover:border-primary/50 transition-colors shadow-sm">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="font-mono text-xs">{batch.id.substring(0, 8)}</Badge>
                  <Badge className={
                    batch.status === 'exported' ? 'bg-emerald-600' :
                    batch.status === 'processing' ? 'bg-amber-500' : 'bg-primary'
                  }>{batch.status}</Badge>
                </div>
                <CardTitle className="capitalize">{batch.cropType} {batch.variety ? `(${batch.variety})` : ''}</CardTitle>
                <CardDescription className="flex items-center gap-1 text-xs">
                  <MapPin className="w-3 h-3" /> {batch.region}, {batch.woreda}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm bg-muted/20 p-3 rounded-lg border">
                  <div>
                    <p className="text-muted-foreground text-xs">Quantity</p>
                    <p className="font-bold flex items-center gap-1"><Box className="w-3 h-3" />{batch.quantityKg.toLocaleString()} kg</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Grade</p>
                    <p className="font-bold">{batch.grade || 'Pending'}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-muted p-2 rounded break-all">
                    <Link2 className="w-3 h-3 shrink-0" />
                    {batch.blockchainHash ? batch.blockchainHash : 'Pending Verification'}
                  </div>
                  <Button variant="ghost" size="sm" className="w-full text-xs gap-1">
                    <ShieldCheck className="w-3 h-3" /> View Journey
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}