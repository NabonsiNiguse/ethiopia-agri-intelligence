# Workspace

## Overview

AI-Powered Smart Agriculture Advisory and Market Intelligence System for Ethiopia — a full-stack production-level platform serving Ethiopian farmers with AI advisory, crop disease detection, market intelligence, weather forecasting, blockchain traceability, micro-insurance, USSD integration, and more.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + TailwindCSS + Framer Motion
- **Charts**: Recharts

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express 5 API backend (all modules)
│   └── agri-ethiopia/      # React + Vite frontend dashboard
├── lib/
│   ├── api-spec/           # OpenAPI spec (all 50+ endpoints)
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas
│   └── db/                 # Drizzle ORM schema (all 10 domain tables)
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── package.json
```

## System Modules

1. **AI Farming Advisor** — Chat-based AI advisory with multilingual support (en/am/om), session tracking
2. **Crop Disease Detection** — Image-based detection with treatment recommendations, severity scoring
3. **Weather & Climate Advisory** — 7-day forecast, smart farming advisory per region and crop
4. **Market Intelligence** — Real-time commodity price aggregation, trends, predictions
5. **AI Crop Quality Grading** — Coffee/teff/sesame quality grading with grade, moisture, defect analysis
6. **Smart Logistics (Tractor Hub)** — Tractor sharing platform with booking management
7. **Farmer Community Forum** — Multilingual posts, expert verification, community Q&A
8. **Crop Traceability** — Blockchain-based supply chain tracking with hash verification
9. **Micro-Insurance** — Auto-payout parametric insurance tied to weather data triggers
10. **USSD Service** — Interactive *844# menu for feature phone users (5 menu levels)
11. **Farmer Registry** — Complete farmer profiles with GPS, crops, language preferences
12. **Dashboard** — National command center with live metrics, regional stats, crop calendar

## Database Tables

- `farmers` — Farmer profiles with GPS, crops, language preferences
- `advisory_sessions` + `advisory_messages` — AI advisor session tracking
- `disease_detections` — Crop disease detection records with treatment
- `market_prices` — Commodity price data with change tracking
- `grading_records` — AI quality grading results per batch
- `tractors` + `bookings` — Logistics platform
- `forum_posts` + `forum_replies` — Community forum
- `crop_batches` + `supply_chain_events` — Blockchain traceability
- `insurance_policies` + `insurance_claims` — Micro-insurance
- `activity_log` — Platform-wide activity feed

## API Endpoints

50+ REST endpoints across all modules. See `lib/api-spec/openapi.yaml` for the full spec.

Base URL: `/api`

Key groups:
- `/api/farmers` — CRUD farmer profiles
- `/api/advisory/chat` + `/sessions` — AI advisor
- `/api/disease/detect` + `/history` — Disease detection
- `/api/weather/forecast` + `/advisory` — Weather
- `/api/market/prices` + `/trends` — Market data
- `/api/grading/analyze` + `/records` — Quality grading
- `/api/logistics/tractors` + `/bookings` — Logistics
- `/api/forum/posts` + `/replies` — Community forum
- `/api/traceability/batches` + `/trace` — Supply chain
- `/api/insurance/policies` + `/claims` — Insurance
- `/api/ussd/session` — USSD handler (*844#)
- `/api/dashboard/summary` + `/regional-stats` + `/recent-activity` + `/crop-calendar` — Analytics

## Localization

- Supports English (en), Amharic (am), Afaan Oromo (om)
- AI responses include multilingual variants
- Disease names, commodity names, weather conditions in 3 languages
- USSD menus bilingual (English + Amharic)

## Architecture Page

The `/architecture` route in the frontend contains a comprehensive system architecture showcase including:
- Multi-tier architecture diagram
- Full Django/Python backend folder structure
- TensorFlow/OpenCV AI module code samples
- USSD handler implementation
- Blockchain smart contract snippet
- Micro-insurance auto-payout logic
- Deployment strategy (Docker + Kubernetes)
- GitHub Actions CI/CD pipeline
- Localization JSON samples

## Running

```bash
# Start all services
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/agri-ethiopia run dev

# Push DB schema
pnpm --filter @workspace/db run push

# Codegen after spec changes
pnpm --filter @workspace/api-spec run codegen
```
