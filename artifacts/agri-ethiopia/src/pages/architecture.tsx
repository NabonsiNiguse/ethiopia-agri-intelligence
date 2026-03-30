import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Network, Cpu, Lock, Smartphone, FolderTree, Code, Globe, Shield, TerminalSquare, Database, Cloud } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function CodeBlock({ code, language }: { code: string, language: string }) {
  return (
    <div className="relative group rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
        <span className="text-xs font-mono text-zinc-400">{language}</span>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
        </div>
      </div>
      <pre className="p-4 overflow-x-auto text-sm font-mono text-zinc-300 leading-relaxed">
        {code}
      </pre>
    </div>
  );
}

export default function Architecture() {
  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-12 max-w-6xl mx-auto">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">System Architecture</h1>
        <p className="text-muted-foreground mt-3 text-lg max-w-3xl leading-relaxed">
          Technical overview of the AI-Powered Smart Agriculture Advisory and Market Intelligence System. 
          Built to scale across millions of smallholder farmers with intermittent connectivity using edge computing, 
          offline-first mobile architectures, and USSD fallbacks.
        </p>
      </div>

      {/* 1. System Architecture Diagram */}
      <section>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Network className="w-6 h-6 text-primary" /> Multi-Tier Architecture</h2>
        <Card className="border-border/50 shadow-sm overflow-hidden">
          <div className="bg-zinc-950 p-8 overflow-x-auto">
            <pre className="font-mono text-sm leading-relaxed text-zinc-300">
{`[ CLIENT TIER - FARMER TOUCHPOINTS ]
       │
       ├─► Feature Phones ─────── [ USSD / SMS Gateway ] ──────┐
       ├─► Android/iOS ────────── [ React Native (Offline) ] ──┼──► [ API Gateway / Load Balancer ]
       └─► Extension Offices ──── [ React Web Dashboard ] ─────┘           (Nginx / Traefik)
                                                                               │
┌──────────────────────────────────────────────────────────────────────────────┼──────────────────────────┐
│                            CORE BACKEND (Django / Node.js Express)           │                          │
│                                                                              ▼                          │
│  [ Auth / Authz ]     [ Market Intel ]     [ USSD Session Manager ]     [ Farmer Registry ]         │
│                                                                                                         │
│  [ Traceability ]     [ Logistics ]        [ Micro-Insurance ]          [ Forum / Community ]       │
└──────┬──────────────────────┬────────────────────────┬───────────────────────┬────────────────────────┘
       │                      │                        │                       │
       ▼                      ▼                        ▼                       ▼
[ PostgreSQL ]        [ AI Python Engine ]        [ Blockchain ]        [ Redis Cache ]
(Relational Data)     (FastAPI + TensorFlow)      (Smart Contracts)     (Session/USSD State)
       │                      │                        │                       │
       │                      ├─► Computer Vision (Disease Detection)          │
       │                      ├─► LLM/NLP (Multilingual Advisory)              │
       │                      └─► Predictive Models (Market/Weather)           │
       ▼                                                                       ▼
[ External Integrations ] ◄────────────────────────────────────────► [ Background Workers ]
(Weather APIs, EthioTelecom, Mobile Money/CBE Birr)                  (Celery / RabbitMQ)`}
            </pre>
          </div>
        </Card>
      </section>

      {/* 2. Folder Structure */}
      <section>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><FolderTree className="w-6 h-6 text-amber-500" /> Monorepo Structure</h2>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-0">
            <CodeBlock language="bash" code={`agri-ethiopia-monorepo/
├── apps/
│   ├── web-dashboard/        # React Web App (Vite + Tailwind + shadcn/ui)
│   ├── mobile-app/           # React Native (WatermelonDB + TF Lite)
│   ├── api-server/           # Node.js Express API (GraphQL & REST)
│   ├── django-core/          # Django Backend (Admin, ORM, Core Logic)
│   └── ussd-service/         # Fast Redis-backed Node.js USSD handler
├── packages/
│   ├── ui/                   # Shared React components
│   ├── db/                   # Database schema (Drizzle ORM / Prisma)
│   └── ai-engine/            # Python FastAPI microservice (TensorFlow)
├── contracts/                # Solidity Smart Contracts for Traceability
├── deployment/               # Kubernetes manifests, Dockerfiles, Terraform
└── locales/                  # Shared translation files (en, am, om)
`} />
          </CardContent>
        </Card>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 3. Django Backend */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Database className="w-5 h-5 text-blue-500" /> Core Backend (Django)</h2>
          <Card className="h-full border-border/50 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Market Aggregator View</CardTitle>
              <CardDescription>Django REST Framework</CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock language="python" code={`# market/views.py
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import MarketPrice
from .serializers import MarketPriceSerializer
from ai_engine.client import get_price_prediction

class MarketPriceViewSet(viewsets.ModelViewSet):
    queryset = MarketPrice.objects.all()
    serializer_class = MarketPriceSerializer

    @action(detail=False, methods=['get'])
    def trends(self, request):
        commodity = request.query_params.get('commodity')
        region = request.query_params.get('region')
        
        # Fetch historical data
        historical = self.queryset.filter(
            commodity=commodity, region=region
        ).order_by('-reported_at')[:30]
        
        # Get AI prediction
        prediction = get_price_prediction(commodity, region)
        
        return Response({
            'historical': MarketPriceSerializer(historical, many=True).data,
            'prediction_30_days': prediction.estimated_price,
            'trend_direction': prediction.trend_direction
        })`} />
            </CardContent>
          </Card>
        </section>

        {/* 4. AI Module */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Cpu className="w-5 h-5 text-emerald-500" /> AI Edge & Cloud Engine</h2>
          <Card className="h-full border-border/50 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Disease Detection Pipeline</CardTitle>
              <CardDescription>TensorFlow + OpenCV processing</CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock language="python" code={`# ai_engine/models/disease_detector.py
import tensorflow as tf
import cv2
import numpy as np

class CropDiseaseDetector:
    def __init__(self):
        # Load quantized model for fast inference
        self.model = tf.keras.models.load_model('models/crop_net_v3.h5')
        self.classes = ['Healthy', 'Coffee_Rust', 'Teff_Rust', 'Maize_Blight']

    def predict(self, image_bytes):
        # Decode and preprocess via OpenCV
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        img = cv2.resize(img, (224, 224))
        img = img / 255.0
        img = np.expand_dims(img, axis=0)

        # Inference
        preds = self.model.predict(img)[0]
        class_idx = np.argmax(preds)
        confidence = float(preds[class_idx])

        return {
            "disease": self.classes[class_idx],
            "confidence": confidence,
            "requires_expert": confidence < 0.85,
            "severity": "high" if "Rust" in self.classes[class_idx] else "low"
        }`} />
            </CardContent>
          </Card>
        </section>

        {/* 5. USSD Handler */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><TerminalSquare className="w-5 h-5 text-purple-500" /> USSD Gateway</h2>
          <Card className="h-full border-border/50 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Feature Phone Interface</CardTitle>
              <CardDescription>High-throughput Node.js handler</CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock language="javascript" code={`// ussd-service/src/handler.js
const express = require('express');
const redis = require('./redis-client');
const app = express();

app.post('/ussd', async (req, res) => {
  const { sessionId, phoneNumber, text } = req.body;
  const inputs = text.split('*');
  const level = inputs.length;

  let response = '';

  if (text === '') {
    // Initial Menu
    response = \`CON Welcome to AgriEthio
1. Market Prices
2. Weather Advisory
3. Expert AI Chat\`;
  } else if (inputs[0] === '1') {
    // Market Prices flow
    if (level === 1) {
      response = \`CON Select Crop:
1. Coffee
2. Teff
3. Sesame\`;
    } else if (level === 2) {
      const prices = await fetchPrices(inputs[1]);
      response = \`END Current Price:
\${prices.latest} ETB/kg
Trend: \${prices.trend}\`;
    }
  }

  res.set('Content-Type', 'text/plain');
  res.send(response);
});`} />
            </CardContent>
          </Card>
        </section>

        {/* 6. Deployment & 7. Localization */}
        <section className="flex flex-col gap-8">
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Cloud className="w-5 h-5 text-cyan-500" /> Deployment Strategy</h2>
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-0">
                <CodeBlock language="yaml" code={`# .github/workflows/deploy.yml
name: Production Deployment
on:
  push:
    branches: [main]

jobs:
  deploy-k8s:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build & Push Docker Images
        run: |
          docker build -t agriethio/api-server:latest ./apps/api-server
          docker build -t agriethio/ai-engine:latest ./packages/ai-engine
          docker push agriethio/api-server:latest
      - name: Deploy to Kubernetes Cluster
        run: |
          kubectl apply -f deployment/k8s/
          kubectl rollout restart deployment/api-server
          kubectl rollout restart deployment/ai-engine`} />
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Globe className="w-5 h-5 text-orange-500" /> Localization (i18n)</h2>
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-0">
                <CodeBlock language="json" code={`// locales/am.json (Amharic)
{
  "dashboard": {
    "welcome": "እንኳን ደህና መጡ",
    "market_prices": "የገበያ ዋጋዎች",
    "weather": "የአየር ሁኔታ"
  },
  "diseases": {
    "coffee_rust": "የቡና ዝገት በሽታ",
    "treatment": "የመዳብ ኬሚካል ይረጩ"
  }
}

// locales/om.json (Afaan Oromo)
{
  "dashboard": {
    "welcome": "Baga nagaan dhuftan",
    "market_prices": "Gatii Gabaa",
    "weather": "Haala Qilleensaa"
  }
}`} />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 8. Blockchain & 9. Micro-Insurance */}
        <section className="lg:col-span-2">
          <Tabs defaultValue="blockchain" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2"><Lock className="w-5 h-5 text-primary" /> Advanced Systems</h2>
              <TabsList className="bg-muted">
                <TabsTrigger value="blockchain">Blockchain Traceability</TabsTrigger>
                <TabsTrigger value="insurance">Micro-Insurance Auto-Payout</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="blockchain">
              <Card className="border-border/50 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle>Crop Traceability Smart Contract</CardTitle>
                  <CardDescription>Immutable ledger for export certification</CardDescription>
                </CardHeader>
                <CardContent>
                  <CodeBlock language="solidity" code={`// contracts/CropTraceability.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CropTraceability {
    struct Batch {
        string batchId;
        uint256 farmerId;
        string cropType;
        uint256 quantityKg;
        string currentStatus;
        uint256 timestamp;
        address registeredBy;
    }

    mapping(string => Batch) public batches;
    mapping(string => string[]) public batchEvents;

    event BatchRegistered(string indexed batchId, uint256 farmerId, string cropType);
    event StatusUpdated(string indexed batchId, string newStatus, uint256 timestamp);

    function registerBatch(string memory _id, uint256 _farmer, string memory _crop, uint256 _qty) public {
        require(batches[_id].timestamp == 0, "Batch already exists");
        
        batches[_id] = Batch({
            batchId: _id,
            farmerId: _farmer,
            cropType: _crop,
            quantityKg: _qty,
            currentStatus: "Harvested",
            timestamp: block.timestamp,
            registeredBy: msg.sender
        });
        
        batchEvents[_id].push("Batch Registered at Farm");
        emit BatchRegistered(_id, _farmer, _crop);
    }

    function updateStatus(string memory _id, string memory _status, string memory _eventDesc) public {
        require(batches[_id].timestamp != 0, "Batch does not exist");
        batches[_id].currentStatus = _status;
        batchEvents[_id].push(_eventDesc);
        
        emit StatusUpdated(_id, _status, block.timestamp);
    }
}`} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insurance">
              <Card className="border-border/50 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle>Parametric Insurance Auto-Payout Engine</CardTitle>
                  <CardDescription>Cron job triggering payouts based on API weather data</CardDescription>
                </CardHeader>
                <CardContent>
                  <CodeBlock language="typescript" code={`// backend/services/insurance/payout-engine.ts
import { db } from '@db';
import { policies, claims } from '@db/schema';
import { getRegionalRainfall } from '../weather/api';
import { initiateMobileMoneyTransfer } from '../payment/cbe-birr';

export async function checkParametricTriggers() {
  // Run daily via Cron
  const activePolicies = await db.query.policies.findMany({
    where: eq(policies.status, 'active')
  });

  for (const policy of activePolicies) {
    if (policy.coverageType === 'drought') {
      // Fetch rainfall data for the farmer's region over the last 30 days
      const rainfallData = await getRegionalRainfall(policy.region, 30);
      
      // If rainfall is below the trigger threshold
      if (rainfallData.totalMm < policy.triggerThresholdMm) {
        
        // 1. Create claim record automatically
        const newClaim = await db.insert(claims).values({
          policyId: policy.id,
          farmerId: policy.farmerId,
          amount: policy.coverageAmountETB,
          status: 'approved',
          autoTriggered: true,
          evidence: JSON.stringify(rainfallData)
        }).returning();

        // 2. Initiate mobile money transfer via EthioTelecom / CBE Birr
        await initiateMobileMoneyTransfer({
          farmerPhone: policy.farmerPhone,
          amount: policy.coverageAmountETB,
          reference: \`Claim-\${newClaim[0].id}\`
        });

        // 3. Mark policy as claimed
        await db.update(policies)
          .set({ status: 'claimed' })
          .where(eq(policies.id, policy.id));
          
        // 4. Send SMS notification to farmer
        await sendSMS(policy.farmerPhone, 
          \`AgriEthio: Your drought insurance payout of \${policy.coverageAmountETB} ETB has been processed due to low rainfall.\`
        );
      }
    }
  }
}`} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </div>
  );
}