import { useState, useRef } from "react";
import { useDetectCropDisease } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, Camera, AlertTriangle, ShieldCheck, Loader2, X, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CROPS = ["coffee", "teff", "sesame", "wheat", "maize", "sorghum", "barley"];

const SEVERITY_CONFIG = {
  critical: { color: "bg-destructive/10 border-destructive/30", badge: "destructive", icon: AlertTriangle, iconColor: "text-destructive" },
  high:     { color: "bg-orange-500/10 border-orange-500/30", badge: "outline", icon: AlertTriangle, iconColor: "text-orange-500" },
  medium:   { color: "bg-amber-500/10 border-amber-500/30", badge: "outline", icon: ShieldCheck, iconColor: "text-amber-500" },
  low:      { color: "bg-emerald-500/10 border-emerald-500/30", badge: "outline", icon: ShieldCheck, iconColor: "text-emerald-600" },
};

export default function Disease() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [cropType, setCropType] = useState("coffee");
  const [result, setResult] = useState<Record<string, any> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const detectMutation = useDetectCropDisease();

  const runDetection = (imageDataUrl: string) => {
    setSelectedImage(imageDataUrl);
    setResult(null);
    detectMutation.mutate(
      { data: { farmerId: 1, cropType, imageUrl: imageDataUrl.substring(0, 100) } },
      {
        onSuccess: (data) => setResult(data),
        onError: () =>
          toast({ title: "Detection failed", description: "Could not reach the server. Is the backend running?", variant: "destructive" }),
      }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select a JPEG or PNG image.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => runDetection(ev.target?.result as string);
    reader.readAsDataURL(file);
    // reset so same file can be re-selected
    e.target.value = "";
  };

  const handleReset = () => {
    setSelectedImage(null);
    setResult(null);
    detectMutation.reset();
  };

  const sevCfg = result ? (SEVERITY_CONFIG[result.severity as keyof typeof SEVERITY_CONFIG] ?? SEVERITY_CONFIG.medium) : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Computer Vision Diagnostics</h1>
          <p className="text-muted-foreground mt-1">Upload or capture a leaf photo for AI-powered disease identification</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Crop:</span>
          <Select value={cropType} onValueChange={setCropType}>
            <SelectTrigger className="w-[140px] bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CROPS.map(c => (
                <SelectItem key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Panel */}
        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle>Input Image</CardTitle>
            <CardDescription>Take a clear photo of the affected plant part</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedImage ? (
              <div className="aspect-video relative rounded-lg overflow-hidden border bg-muted group">
                <img src={selectedImage} alt="Crop sample" className="w-full h-full object-cover" />
                <button
                  onClick={handleReset}
                  className="absolute top-2 right-2 bg-background/80 hover:bg-background rounded-full p-1.5 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
                {detectMutation.isPending && (
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2 text-foreground">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <span className="text-sm font-medium">Analyzing...</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div
                className="aspect-video rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors bg-muted/20 flex flex-col items-center justify-center gap-4 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file?.type.startsWith("image/")) {
                    const reader = new FileReader();
                    reader.onload = (ev) => runDetection(ev.target?.result as string);
                    reader.readAsDataURL(file);
                  }
                }}
              >
                <div className="p-4 bg-background rounded-full shadow-sm">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-medium">Click to upload or drag & drop</p>
                  <p className="text-sm text-muted-foreground">JPEG, PNG, WebP supported</p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                className="flex-1 gap-2"
                variant="outline"
                onClick={() => cameraInputRef.current?.click()}
                disabled={detectMutation.isPending}
              >
                <Camera className="w-4 h-4" /> Camera
              </Button>
              <Button
                className="flex-1 gap-2"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={detectMutation.isPending}
              >
                <Upload className="w-4 h-4" /> Upload File
              </Button>
              {selectedImage && (
                <Button variant="ghost" size="icon" onClick={handleReset} title="Reset">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Tips for best results:</p>
              <p>• Focus on the most affected leaf or fruit</p>
              <p>• Use natural daylight, avoid flash</p>
              <p>• Keep the camera steady and close (20–30 cm)</p>
            </div>
          </CardContent>
        </Card>

        {/* Results Panel */}
        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>AI diagnosis, confidence score & treatment plan</CardDescription>
          </CardHeader>
          <CardContent>
            {detectMutation.isPending ? (
              <div className="h-[360px] flex flex-col items-center justify-center gap-4 text-muted-foreground">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <div className="text-center">
                  <p className="font-medium text-foreground">Running neural network analysis...</p>
                  <p className="text-sm mt-1">Comparing against disease database</p>
                </div>
              </div>
            ) : result && sevCfg ? (
              <div className="space-y-5 animate-in slide-in-from-bottom-2 duration-300">
                {/* Disease header */}
                <div className={`p-4 rounded-lg border ${sevCfg.color}`}>
                  <div className="flex items-start gap-3">
                    <sevCfg.icon className={`w-6 h-6 mt-0.5 shrink-0 ${sevCfg.iconColor}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-lg text-foreground leading-tight">{result.diseaseName}</h3>
                        <Badge variant={sevCfg.badge as any} className="capitalize text-xs">{result.severity}</Badge>
                      </div>
                      {result.diseaseNameAmharic && (
                        <p className="text-sm text-muted-foreground mt-0.5">{result.diseaseNameAmharic}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex-1 bg-background/60 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-700"
                            style={{ width: `${(result.confidence * 100).toFixed(0)}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-foreground shrink-0">
                          {(result.confidence * 100).toFixed(1)}% confidence
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Treatment */}
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3">Immediate Treatment</h4>
                  <ul className="space-y-2">
                    {(result.treatment as string[]).map((t: string, i: number) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <div className="w-5 h-5 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">{i + 1}</div>
                        <span className="leading-relaxed">{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Prevention */}
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3">Prevention</h4>
                  <ul className="space-y-1.5">
                    {(result.preventionTips as string[]).map((t: string, i: number) => (
                      <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
                        <span className="leading-relaxed">{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {result.expertReviewNeeded && (
                  <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm text-amber-700">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    Expert field review recommended — contact your extension officer.
                  </div>
                )}
              </div>
            ) : (
              <div className="h-[360px] flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border rounded-lg bg-muted/10 text-muted-foreground">
                <Upload className="w-10 h-10 opacity-30" />
                <p className="text-sm">Upload or capture a plant image to begin</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
