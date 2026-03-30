import { useState } from "react";
import { useListGradingRecords, getListGradingRecordsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Upload, AlertCircle } from "lucide-react";

export default function Grading() {
  const { data: records, isLoading } = useListGradingRecords(
    {},
    { query: { queryKey: getListGradingRecordsQueryKey({}) } }
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">AI Crop Quality Grading</h1>
          <p className="text-muted-foreground mt-1">Computer vision assessment for export readiness</p>
        </div>
        <Button className="gap-2"><Upload className="w-4 h-4" /> New Grading Request</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-primary text-primary-foreground border-transparent shadow-md">
          <CardContent className="p-6 flex items-center gap-6">
            <div className="bg-white/20 p-4 rounded-full">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-primary-foreground/80 font-medium">Export Standard Reached</p>
              <h2 className="text-3xl font-bold mt-1">Grade 1 Specialty</h2>
              <p className="text-sm mt-2 text-primary-foreground/80">Average across last 5 coffee batches</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle>Supported Commodities</CardTitle>
            <CardDescription>AI models currently available for</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="px-3 py-1">Coffee Beans</Badge>
              <Badge variant="secondary" className="px-3 py-1">Teff Grains</Badge>
              <Badge variant="secondary" className="px-3 py-1">Sesame Seeds</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-border/50">
        <CardHeader>
          <CardTitle>Recent Grading Records</CardTitle>
          <CardDescription>Historical AI quality assessments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground animate-pulse">Loading records...</div>
            ) : records?.records.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl">
                <AlertCircle className="w-8 h-8 mb-4 opacity-50" />
                <p>No grading records found.</p>
                <Button variant="outline" className="mt-4">Submit First Sample</Button>
              </div>
            ) : (
              records?.records.map(record => (
                <div key={record.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg gap-4 hover:bg-muted/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-lg font-bold text-foreground">
                      {record.score}
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground capitalize">{record.cropType} • {record.grade}</h4>
                      <p className="text-sm text-muted-foreground">Batch: {record.batchId || 'N/A'} • {new Date(record.gradedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">Moisture</span>
                      <span className="font-medium">{record.moistureContent}%</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">Defects</span>
                      <span className="font-medium text-destructive">{record.defectRate}%</span>
                    </div>
                    {record.certificationEligible ? (
                      <Badge className="bg-emerald-600 hover:bg-emerald-700">Export Ready</Badge>
                    ) : (
                      <Badge variant="secondary">Local Market</Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}