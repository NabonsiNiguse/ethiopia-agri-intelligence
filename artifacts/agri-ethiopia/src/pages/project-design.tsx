import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, Target, CheckCircle2, ShieldCheck, Database, LayoutGrid, Layers, GitBranch, ArrowRight } from "lucide-react";

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="relative rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 my-4">
      <pre className="p-4 overflow-x-auto text-sm font-mono text-zinc-300 leading-relaxed">
        {code}
      </pre>
    </div>
  );
}

export default function ProjectDesign() {
  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-16 max-w-4xl mx-auto">
      
      {/* SECTION 1: Project Title */}
      <section className="text-center space-y-6 pt-8 pb-4">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-2">
          <BookOpen className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
          AgriConnect Ethiopia: AI-Powered Smart Agriculture Advisory and Decision Support System
        </h1>
        <div className="space-y-2 text-muted-foreground">
          <p className="text-xl font-medium text-foreground/80">Final Year Research & Software Project</p>
          <p className="text-lg">Department of Computer Science and Information Technology</p>
          <p className="font-mono bg-muted inline-block px-3 py-1 rounded-md text-sm mt-2">2025/2026</p>
        </div>
      </section>

      <Separator />

      {/* SECTION 2: Problem Statement */}
      <section className="space-y-4 scroll-m-20" id="problem-statement">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-2xl font-bold tracking-tight">1. Problem Statement</h2>
        </div>
        <div className="prose prose-zinc dark:prose-invert max-w-none text-muted-foreground leading-relaxed space-y-4 text-lg">
          <p>
            Ethiopian farmers, who make up approximately 85% of the national workforce, face persistent challenges in accessing timely agricultural information, accurate market data, and expert farming advisory. This information asymmetry directly impacts crop yields, post-harvest losses, and financial outcomes for millions of smallholder families.
          </p>
          <p>
            Existing agricultural information systems are highly fragmented, typically require constant high-speed internet connections, and fail to serve low-literacy or low-connectivity users. Many modern solutions assume smartphone ownership and reliable broadband, entirely alienating the rural farming demographic who rely primarily on basic feature phones.
          </p>
          <p>
            This project addresses this critical gap through a unified, AI-driven, multi-channel platform. By combining web dashboards, USSD interfaces, and SMS capabilities, the system ensures that vital agricultural intelligence is accessible to all farmers, regardless of their device type or internet connectivity status.
          </p>
        </div>
      </section>

      {/* SECTION 3: Objectives */}
      <section className="space-y-6 scroll-m-20" id="objectives">
        <h2 className="text-2xl font-bold tracking-tight">2. Research Objectives</h2>
        <Card className="border-primary/20 shadow-sm bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg text-primary flex items-center gap-2">
              <Target className="w-5 h-5" /> General Objective
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground font-medium leading-relaxed">
              To design, develop, and evaluate an AI-powered smart agriculture advisory and decision support system that provides Ethiopian smallholder farmers with timely, accessible, and multilingual agricultural information through multiple communication channels.
            </p>
          </CardContent>
        </Card>
        
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-4 text-foreground/90">Specific Objectives</h3>
          <ul className="space-y-3">
            {[
              "Design and implement a farmer registration and farm profiling module",
              "Develop an AI-based agricultural advisory system using rule-based and API-integrated AI",
              "Integrate real-time market price intelligence with trend analysis",
              "Implement weather API integration with farming-specific advisory",
              "Create USSD and mobile interfaces for low-connectivity access",
              "Build a basic crop disease detection module using image classification"
            ].map((objective, i) => (
              <li key={i} className="flex items-start gap-3 text-muted-foreground">
                <span className="flex items-center justify-center shrink-0 w-6 h-6 rounded-full bg-muted text-sm font-bold text-foreground">{i + 1}</span>
                <span className="leading-tight pt-0.5">{objective}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* SECTION 4: Scope */}
      <section className="space-y-6 scroll-m-20" id="scope">
        <h2 className="text-2xl font-bold tracking-tight">3. Project Scope</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/10 dark:border-emerald-900/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> In-Scope
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3" /> Web dashboard</li>
                <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3" /> USSD interface</li>
                <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3" /> Farmer registration</li>
                <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3" /> AI advisory</li>
                <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3" /> Market prices</li>
                <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3" /> Weather integration</li>
                <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3" /> Disease detection</li>
                <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3" /> Multilingual support</li>
                <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3" /> Offline sync</li>
              </ul>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/10 dark:border-red-900/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-red-700 dark:text-red-400 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Out-of-Scope
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3" /> Blockchain supply chain</li>
                <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3" /> Micro-insurance auto-payout</li>
                <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3" /> IoT sensors</li>
                <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3" /> Satellite monitoring</li>
                <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3" /> Automated irrigation</li>
                <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3" /> Farmer credit scoring</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECTION 5: Feature Classification */}
      <section className="space-y-6 scroll-m-20" id="feature-classification">
        <h2 className="text-2xl font-bold tracking-tight">4. Feature Classification</h2>
        <div className="grid gap-6">
          <Card className="border-emerald-500/30 shadow-sm">
            <CardHeader className="bg-emerald-500/5 border-b border-emerald-500/10">
              <CardTitle className="text-emerald-700 dark:text-emerald-400">CORE FEATURES</CardTitle>
              <CardDescription>Fully implemented modules critical to the system</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">Farmer Registration & Profile Management</Badge>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">AI Advisory System (planting, spraying, irrigation, harvesting)</Badge>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">Market Price Intelligence (real-time prices, trends, regional comparison)</Badge>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">Weather Advisory (API integration, farming recommendations, alerts)</Badge>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">USSD Interface via *844#</Badge>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">Crop Disease Detection</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-500/30 shadow-sm">
            <CardHeader className="bg-amber-500/5 border-b border-amber-500/10">
              <CardTitle className="text-amber-700 dark:text-amber-400">ADVANCED FEATURES</CardTitle>
              <CardDescription>Partially implemented prototype modules</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">AI Crop Quality Grading (coffee/teff/sesame)</Badge>
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">Smart Logistics / Tractor Hub</Badge>
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">Farmer Community Forum</Badge>
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">Voice Advisory (demo only)</Badge>
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">Crop Recommendation Engine</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-500/30 shadow-sm">
            <CardHeader className="bg-zinc-500/5 border-b border-zinc-500/10">
              <CardTitle className="text-zinc-700 dark:text-zinc-400">FUTURE RESEARCH EXTENSIONS</CardTitle>
              <CardDescription>Proposed modules for future development</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800">Blockchain Crop Traceability</Badge>
                <Badge variant="outline" className="bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800">Micro-Insurance Auto-Payout</Badge>
                <Badge variant="outline" className="bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800">IoT Sensor Integration</Badge>
                <Badge variant="outline" className="bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800">Satellite-Based Monitoring</Badge>
                <Badge variant="outline" className="bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800">Farmer Credit Scoring</Badge>
                <Badge variant="outline" className="bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800">Automated Irrigation Systems</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECTION 6: System Architecture */}
      <section className="space-y-6 scroll-m-20" id="architecture">
        <h2 className="text-2xl font-bold tracking-tight">5. System Architecture</h2>
        <Card className="overflow-hidden">
          <CodeBlock code={`CLIENT TIER:
Feature Phones → USSD/SMS Gateway (*844#)
Android/iOS App → React Native (Offline-first)
Web Browser → React + Vite Dashboard

API GATEWAY (Nginx)
→ Auth Service (JWT/Session)
→ Advisory Engine (AI / Rule-based)
→ Market Intelligence Service
→ Weather Integration Service
→ Disease Detection Service (CNN/TFLite)
→ USSD Session Handler

DATABASE TIER:
PostgreSQL → Structured data (farmers, prices, bookings)
MongoDB → Unstructured data (images, chat logs)
Redis → Cache (weather, market prices, sessions)

AI/ML TIER (Python):
TensorFlow/Keras → Disease Detection Model
OpenCV → Image Preprocessing
TFLite → Edge deployment for offline`} />
        </Card>
      </section>

      {/* SECTION 7: System Flow */}
      <section className="space-y-6 scroll-m-20" id="system-flow">
        <h2 className="text-2xl font-bold tracking-tight">6. System Flow</h2>
        <div className="grid gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><GitBranch className="w-4 h-4 text-primary" /> Flow 1: Advisory via USSD</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground font-medium">
                <Badge variant="secondary">Farmer</Badge>
                <ArrowRight className="w-4 h-4 text-muted-foreground/50" />
                <span>dials *844#</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground/50" />
                <span>Selects crop</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground/50" />
                <span>AI Engine processes</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground/50" />
                <span>Advisory generated</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground/50" />
                <Badge variant="default" className="bg-primary">SMS response sent</Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><GitBranch className="w-4 h-4 text-primary" /> Flow 2: Disease Detection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground font-medium">
                <Badge variant="secondary">Farmer</Badge>
                <ArrowRight className="w-4 h-4 text-muted-foreground/50" />
                <span>Uploads image</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground/50" />
                <span>OpenCV preprocessing</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground/50" />
                <span>CNN model inference</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground/50" />
                <span>Disease classified</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground/50" />
                <span>Treatment advice</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground/50" />
                <Badge variant="default" className="bg-primary">Stored in DB</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECTION 8: Use Cases */}
      <section className="space-y-6 scroll-m-20" id="use-cases">
        <h2 className="text-2xl font-bold tracking-tight">7. Key Use Cases</h2>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[150px]">Use Case</TableHead>
                  <TableHead className="w-[120px]">Actor</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Precondition</TableHead>
                  <TableHead>Postcondition</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Register as Farmer</TableCell>
                  <TableCell>Farmer</TableCell>
                  <TableCell>Create profile with location, crops, farm size</TableCell>
                  <TableCell className="text-muted-foreground">None</TableCell>
                  <TableCell className="text-muted-foreground">Profile saved, USSD access granted</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Request Advisory</TableCell>
                  <TableCell>Farmer</TableCell>
                  <TableCell>Ask AI advisor about crop management</TableCell>
                  <TableCell className="text-muted-foreground">Registered</TableCell>
                  <TableCell className="text-muted-foreground">Advisory delivered via preferred channel</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Check Market Prices</TableCell>
                  <TableCell>Farmer/Trader</TableCell>
                  <TableCell>View current prices by commodity</TableCell>
                  <TableCell className="text-muted-foreground">USSD or internet</TableCell>
                  <TableCell className="text-muted-foreground">Prices displayed with trend indicators</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Submit Disease Image</TableCell>
                  <TableCell>Farmer</TableCell>
                  <TableCell>Upload crop photo for detection</TableCell>
                  <TableCell className="text-muted-foreground">Registered + camera</TableCell>
                  <TableCell className="text-muted-foreground">Diagnosis and treatment delivered</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Get Weather Advisory</TableCell>
                  <TableCell>Extension Officer</TableCell>
                  <TableCell>Weather-based farming recommendations</TableCell>
                  <TableCell className="text-muted-foreground">Weather API connected</TableCell>
                  <TableCell className="text-muted-foreground">Advisory with risk level shown</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Manage Farmer Registry</TableCell>
                  <TableCell>Admin</TableCell>
                  <TableCell>Register, update, deactivate farmer accounts</TableCell>
                  <TableCell className="text-muted-foreground">Admin credentials</TableCell>
                  <TableCell className="text-muted-foreground">Farmer database updated</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </Card>
      </section>

      {/* SECTION 9: Database Entities */}
      <section className="space-y-6 scroll-m-20" id="database">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Database className="w-6 h-6 text-primary" /> 8. Database Entities</h2>
        <Card>
          <CodeBlock code={`FARMER: id, name, phone, region, woreda, zone, land_size_ha, primary_crops[], preferred_language, has_smartphone, gps_lat, gps_lng, registered_at
ADVISORY_SESSION: id, farmer_id, farmer_name, started_at, last_message_at, message_count, primary_topic
DISEASE_DETECTION: id, farmer_id, crop_type, disease_name, confidence, severity, treatment[], prevention_tips[], detected_at
MARKET_PRICE: id, commodity, market, region, price_per_kg, currency, change, change_percent, source, reported_at
GRADING_RECORD: id, farmer_id, crop_type, grade, score, moisture_content, defect_rate, estimated_price, graded_at
INSURANCE_POLICY: id, farmer_id, coverage_type, crop_covered, coverage_amount_etb, trigger_threshold, auto_payout_enabled`} />
        </Card>
      </section>

      {/* SECTION 10: Technology Stack */}
      <section className="space-y-6 scroll-m-20" id="tech-stack">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Layers className="w-6 h-6 text-primary" /> 9. Technology Stack</h2>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[200px]">Component</TableHead>
                  <TableHead className="w-[250px]">Technology</TableHead>
                  <TableHead>Purpose</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Frontend Web</TableCell>
                  <TableCell>React + TypeScript + Vite</TableCell>
                  <TableCell className="text-muted-foreground">Dashboard for officers/admins</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Frontend Mobile</TableCell>
                  <TableCell>React Native (Expo)</TableCell>
                  <TableCell className="text-muted-foreground">Offline-first mobile app</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Backend API</TableCell>
                  <TableCell>Express.js (Node) / Django (Python)</TableCell>
                  <TableCell className="text-muted-foreground">REST API services</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">AI Advisory</TableCell>
                  <TableCell>OpenAI API / Rule Engine</TableCell>
                  <TableCell className="text-muted-foreground">Chat-based recommendations</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Disease Detection</TableCell>
                  <TableCell>TensorFlow / Keras / TFLite</TableCell>
                  <TableCell className="text-muted-foreground">CNN image classification</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Image Processing</TableCell>
                  <TableCell>OpenCV (Python)</TableCell>
                  <TableCell className="text-muted-foreground">Preprocessing before inference</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Database SQL</TableCell>
                  <TableCell>PostgreSQL + Drizzle ORM</TableCell>
                  <TableCell className="text-muted-foreground">Structured data</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Database NoSQL</TableCell>
                  <TableCell>MongoDB</TableCell>
                  <TableCell className="text-muted-foreground">Images, chat logs</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Cache</TableCell>
                  <TableCell>Redis</TableCell>
                  <TableCell className="text-muted-foreground">Market prices, weather, sessions</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">USSD Gateway</TableCell>
                  <TableCell>Africa's Talking API</TableCell>
                  <TableCell className="text-muted-foreground">Feature phone interaction</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Weather</TableCell>
                  <TableCell>OpenWeatherMap API</TableCell>
                  <TableCell className="text-muted-foreground">Forecast and alerts</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Deployment</TableCell>
                  <TableCell>Docker + Nginx</TableCell>
                  <TableCell className="text-muted-foreground">Container-based deployment</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">CI/CD</TableCell>
                  <TableCell>GitHub Actions</TableCell>
                  <TableCell className="text-muted-foreground">Automated test and deploy</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </Card>
      </section>

      {/* SECTION 11: Evaluation Plan */}
      <section className="space-y-6 scroll-m-20" id="evaluation">
        <h2 className="text-2xl font-bold tracking-tight">10. Evaluation Plan</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-foreground">Functional Testing</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-sm text-muted-foreground list-disc list-inside ml-4">
                <li>Farmer registration with valid/invalid inputs</li>
                <li>AI advisory response generation and accuracy</li>
                <li>Market price retrieval and display</li>
                <li>USSD menu navigation (all levels)</li>
                <li>Disease image upload and classification</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-foreground">Usability Testing</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-sm text-muted-foreground list-disc list-inside ml-4">
                <li>20 test users: farmers (10), extension officers (5), admin (5)</li>
                <li>SUS (System Usability Scale) questionnaire</li>
                <li>Task completion rate measurement</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-foreground">Response Time Testing</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-sm text-muted-foreground list-disc list-inside ml-4">
                <li>API response &lt; 2 seconds for all endpoints</li>
                <li>USSD session response &lt; 5 seconds</li>
                <li>Disease detection &lt; 10 seconds</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-foreground">Accuracy Testing (Disease Detection)</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-sm text-muted-foreground list-disc list-inside ml-4">
                <li>Dataset: PlantVillage (Ethiopian crop subset)</li>
                <li>Target accuracy: &gt;= 80%</li>
                <li>Confusion matrix and F1 score evaluation</li>
              </ul>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-foreground">User Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-sm text-muted-foreground list-disc list-inside ml-4">
                <li>Farmer satisfaction survey (Likert scale 1-5)</li>
                <li>Expert review by agricultural extension officers</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECTION 12: Research Contribution */}
      <section className="space-y-6 scroll-m-20" id="contribution">
        <h2 className="text-2xl font-bold tracking-tight">11. Research Contribution</h2>
        <div className="space-y-4">
          <Card className="bg-muted/30 border-border/50">
            <CardContent className="p-6 space-y-6">
              <div>
                <h4 className="font-bold text-foreground flex items-center gap-2 mb-2">
                  <span className="text-primary bg-primary/10 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                  Offline-accessible services
                </h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  USSD/SMS ensures connectivity is never a complete barrier; rule-based advisory works without internet.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-foreground flex items-center gap-2 mb-2">
                  <span className="text-primary bg-primary/10 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                  Multi-channel access
                </h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Single platform serves feature phone users (USSD), smartphone users (app), and extension officers (web) - the first unified system designed for Ethiopian agri context.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-foreground flex items-center gap-2 mb-2">
                  <span className="text-primary bg-primary/10 w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
                  Multilingual AI advisory
                </h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Responses in Amharic and Afaan Oromo lower language barriers for 90M+ speakers.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-foreground flex items-center gap-2 mb-2">
                  <span className="text-primary bg-primary/10 w-6 h-6 rounded-full flex items-center justify-center text-xs">4</span>
                  Decision support for smallholders
                </h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Combining advisory, market intelligence, and weather guidance reduces information asymmetry for planting and selling decisions.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECTION 13: Conclusion */}
      <section className="space-y-4 scroll-m-20" id="conclusion">
        <h2 className="text-2xl font-bold tracking-tight">12. Conclusion</h2>
        <div className="prose prose-zinc dark:prose-invert max-w-none text-muted-foreground leading-relaxed text-lg">
          <p>
            AgriConnect Ethiopia represents a comprehensive approach to modernizing agricultural support for smallholder farmers. By explicitly targeting the lowest common denominator in technology—feature phones—while maintaining advanced web and app capabilities, the system bridges the digital divide in rural communities. The integration of AI advisory, market intelligence, and computer vision for disease detection provides farmers with enterprise-level decision support without enterprise-level costs or connectivity requirements.
          </p>
          <p>
            While the core modules demonstrate significant immediate value, the system is designed with a realistic scope and a clear future extension pathway. The prototyped advanced features establish a foundation toward integrating IoT, blockchain traceability, and parametric micro-insurance, positioning the platform to scale alongside the eventual modernization of Ethiopia's telecommunications infrastructure.
          </p>
        </div>
      </section>

    </div>
  );
}