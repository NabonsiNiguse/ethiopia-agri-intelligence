import { useState } from "react";
import { useDetectCropDisease } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Camera, AlertTriangle, ShieldCheck, Loader2 } from "lucide-react";
import { DiseaseDetectionResult } from "@workspace/api-zod";

export default function Disease() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [result, setResult] = useState<DiseaseDetectionResult | null>(null);
  
  const detectMutation = useDetectCropDisease();

  const handleSimulateUpload = () => {
    setSelectedImage("https://images.unsplash.com/photo-1593356875225-b8a927d3b2f8?auto=format&fit=crop&q=80&w=800");
    detectMutation.mutate({
      data: {
        farmerId: 1,
        cropType: "coffee",
        imageUrl: "simulated"
      }
    }, {
      onSuccess: (data) => setResult(data)
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Computer Vision Diagnostics</h1>
        <p className="text-muted-foreground mt-1">Upload leaf imagery for AI-powered disease identification</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle>Input Image</CardTitle>
            <CardDescription>Take a clear photo of the affected plant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedImage ? (
              <div className="aspect-video relative rounded-lg overflow-hidden border bg-muted">
                <img src={selectedImage} alt="Crop" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="aspect-video rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors bg-muted/20 flex flex-col items-center justify-center gap-4 cursor-pointer" onClick={handleSimulateUpload}>
                <div className="p-4 bg-background rounded-full shadow-sm">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-medium">Click to upload or drag and drop</p>
                  <p className="text-sm text-muted-foreground">High resolution JPEG/PNG</p>
                </div>
              </div>
            )}
            
            <div className="flex gap-4">
              <Button className="flex-1 gap-2" variant="outline" onClick={handleSimulateUpload}>
                <Camera className="w-4 h-4" /> Use Camera
              </Button>
              {selectedImage && (
                <Button className="flex-1 gap-2" variant="secondary" onClick={() => { setSelectedImage(null); setResult(null); }}>
                  Reset
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>AI Confidence & Treatment Plan</CardDescription>
          </CardHeader>
          <CardContent>
            {detectMutation.isPending ? (
              <div className="h-[300px] flex flex-col items-center justify-center gap-4 text-muted-foreground">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p>Running neural network analysis...</p>
              </div>
            ) : result ? (
              <div className="space-y-6 animate-in slide-in-from-bottom-2">
                <div className={`p-4 rounded-lg border ${result.severity === 'critical' ? 'bg-destructive/10 border-destructive/20 text-destructive-foreground' : 'bg-primary/10 border-primary/20 text-primary-foreground'}`}>
                  <div className="flex items-center gap-3">
                    {result.severity === 'critical' ? <AlertTriangle className="w-6 h-6 text-destructive" /> : <ShieldCheck className="w-6 h-6 text-primary" />}
                    <div>
                      <h3 className="font-bold text-lg text-foreground">{result.diseaseName}</h3>
                      <p className="text-sm opacity-90 text-muted-foreground">{result.diseaseNameAmharic} • {(result.confidence * 100).toFixed(1)}% Confidence</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">Recommended Treatment</h4>
                  <ul className="space-y-2">
                    {result.treatment.map((t, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <div className="w-5 h-5 rounded bg-secondary/20 text-secondary-foreground flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">{i+1}</div>
                        <span className="leading-relaxed">{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">Prevention Tips</h4>
                  <ul className="space-y-2">
                    {result.preventionTips.map((t, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2"></div>
                        <span className="leading-relaxed text-muted-foreground">{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-border rounded-lg bg-muted/10 text-muted-foreground">
                Awaiting imagery...
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}