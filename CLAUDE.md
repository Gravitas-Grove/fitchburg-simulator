# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fitchburg Growth Scenario Simulator — an interactive urban planning tool for the Fitchburg, WI comprehensive plan update. Visualizes 7 growth scenarios on a Leaflet map with parametric metrics and AI-powered conversational analysis via the Anthropic Claude API.

## Architecture

**Monorepo with npm workspaces** — React + Vite frontend (`client/`) and Express + TypeScript backend (`server/`).

### Client (`client/`)
- **React 18 + TypeScript + Vite** — component-based UI with hot module replacement
- **Tailwind CSS** — utility-first styling with Fitchburg dark theme mapped to CSS variables
- **Zustand** — 3 stores: `scenarioStore` (active scenario, growth rate, density), `mapStore` (layer visibility, GIS status), `chatStore` (messages, streaming state, sessions)
- **react-leaflet v4** — declarative map components wrapping Leaflet
- **Key data files**: `src/data/scenarios.ts` (7 scenarios + polygon generators), `src/data/metrics.ts` (pure computation), `src/data/gisLayerConfig.ts` (layer styles)

### Server (`server/`)
- **Express + TypeScript** — API layer running on port 3001
- **SQLite via better-sqlite3 + Drizzle ORM** — scenarios, chat sessions, chat messages, preferences
- **@anthropic-ai/sdk** — typed streaming AI responses with SSE
- **Prompt engineering**: `src/prompts/systemPrompt.ts` (Fitchburg planning consultant persona), `src/prompts/analysisPrompt.ts` (scenario analysis template)

### Data Pipeline (unchanged)
- `scripts/fetch_gis_data.py` — Downloads GIS data from Dane County ArcGIS, WI DNR, and OpenStreetMap
- `scripts/process_geojson.py` — Cleans, simplifies, and minifies GeoJSON for web delivery

## Running the App

```bash
# Install dependencies
npm install

# Seed the database with 7 built-in scenarios
npm run db:seed

# Development (runs both client on :5173 and server on :3001)
npm run dev

# Production build
npm run build
npm start
```

### Environment Variables (`server/.env`)
```
PORT=3001
ANTHROPIC_API_KEY=sk-ant-xxxxx
DB_PATH=./data/fitchburg.db
```

## GIS Data Pipeline

```bash
pip install requests geopandas
python scripts/fetch_gis_data.py
python scripts/process_geojson.py
```

GeoJSON files go into `data/processed/` (gitignored). The app works without them — falls back to base map tiles only. The server serves these files via `GET /api/gis/:layer`.

## API Routes

| Method | Route | Purpose |
|--------|-------|---------|
| `POST` | `/api/ai/chat` | Stream AI response (SSE). Body: `{ sessionId?, message, scenarioContext }` |
| `GET` | `/api/ai/sessions` | List chat sessions |
| `GET` | `/api/ai/sessions/:id` | Get session with full message history |
| `DELETE` | `/api/ai/sessions/:id` | Delete session |
| `GET` | `/api/scenarios` | List all scenarios |
| `GET` | `/api/scenarios/:id` | Get single scenario |
| `GET` | `/api/gis/layers` | List available GIS layers |
| `GET` | `/api/gis/:layer` | Serve GeoJSON (whitelist-validated, cached) |
| `GET` | `/api/health` | Status check |

## Key Technical Details

- **Monorepo**: npm workspaces with `client/` and `server/` packages
- **Frontend**: React 18, Vite 6, TypeScript, Tailwind CSS, Zustand, react-leaflet
- **Backend**: Express 4, SQLite (better-sqlite3), Drizzle ORM, Anthropic SDK
- **Map**: CartoDB dark tiles, Leaflet 1.9.4
- **AI**: Claude Sonnet (`claude-sonnet-4-20250514`) with streaming SSE, full conversation history
- **Fonts**: Playfair Display (headings), IBM Plex Mono (data), IBM Plex Sans (body)
- **Metrics model**: $68k/acre infrastructure cost, growth rate 50–200 ac/yr, density low/med/high (3/5/7.5 DU/acre)
- **Legacy**: Original `index.html` preserved as reference — all data/logic extracted to typed modules

## The 7 Growth Scenarios

Each scenario has a color, icon, spatial polygons (2030/2060), an infrastructure cost multiplier, and agricultural impact acreage:

1. **FUDA Lateral** — Lateral expansion from city edge (high ag impact)
2. **Concentric** — Radial growth from Fish Hatchery/Lacy Road center
3. **Rail Corridor / TOD** — Transit-oriented along rail line (low ag impact)
4. **Utility Service / Gravity Sewer** — Fiscally optimized gravity sewer zones
5. **Agricultural Preservation** — Avoids Class 1 prime farmland (very low ag impact)
6. **Redevelopment / Infill** — Internal infill only (zero ag impact)
7. **Resource Based** — Respects watershed boundaries

## Project Structure

```
fitchburg-simulator/
├── package.json                 # npm workspaces root
├── client/                      # React + Vite frontend
│   ├── src/
│   │   ├── components/          # UI components (map, scenarios, controls, metrics, ai)
│   │   ├── stores/              # Zustand stores (scenario, map, chat)
│   │   ├── data/                # Extracted scenario data, metrics, GIS config
│   │   ├── hooks/               # Custom hooks (useMetrics, useStreamingChat, etc.)
│   │   ├── lib/                 # Utilities (api, formatters, cn)
│   │   └── types/               # TypeScript interfaces
├── server/                      # Express backend
│   ├── src/
│   │   ├── routes/              # API route handlers
│   │   ├── services/            # Claude AI, GIS, scenario services
│   │   ├── db/                  # Drizzle schema, migrations, seed
│   │   ├── prompts/             # AI prompt templates
│   │   └── middleware/          # Error handler, request logger
├── scripts/                     # GIS pipeline (Python, unchanged)
└── data/                        # GIS data (gitignored)
```

## GeoJSON Layers

Served from `data/processed/` via the API:
- `urban_service_area.geojson`, `wetlands.geojson`, `streams.geojson`, `rail.geojson`, `prime_ag_soils.geojson`, `parcels.geojson`
- Additional processed but not currently loaded: `floodplains.geojson`, `highway14.geojson`, `city_limits.geojson`
