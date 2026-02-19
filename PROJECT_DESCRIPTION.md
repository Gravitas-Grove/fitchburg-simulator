# Fitchburg Growth Scenario Simulator — Full Project Description

## What This Is

An interactive urban planning tool for the City of Fitchburg, Wisconsin comprehensive plan update. It visualizes 7 growth scenarios on a Leaflet dark-tile map with parametric metrics (acres consumed, housing units, infrastructure cost, agricultural impact) and an AI-powered conversational planning assistant via the Anthropic Claude API. The app serves 17 real GIS layers fetched from Fitchburg's own ArcGIS portal, CARPC (Capital Area Regional Planning Commission), and OpenStreetMap.

## Tech Stack

**Monorepo with npm workspaces** — two packages: `client/` and `server/`.

| Layer | Tech |
|-------|------|
| Frontend | React 18, TypeScript, Vite 6, Tailwind CSS 3, Zustand, react-leaflet v4 |
| Backend | Express 4, TypeScript, better-sqlite3, Drizzle ORM, @anthropic-ai/sdk |
| Map tiles | CartoDB dark_all |
| Fonts | Instrument Serif (display), DM Sans (body), JetBrains Mono (mono) |
| GIS data pipeline | Python scripts fetching from ArcGIS REST + OSM Overpass |
| AI | Claude Sonnet with streaming SSE, full conversation history persisted in SQLite |

## Running

```bash
npm install
npm run db:seed        # Seeds 7 built-in scenarios into SQLite
npm run dev            # Runs client on :5173 and server on :3001 concurrently
```

```bash
# Fetch GIS data (requires Python 3, optional geopandas for simplification)
python scripts/fetch_fitchburg_gis.py
```

Environment: `server/.env` needs `ANTHROPIC_API_KEY=sk-ant-xxxxx` for AI chat.

---

## Project Structure (every file)

```
fitchburg-simulator/
├── package.json                          # npm workspaces root, scripts: dev/build/start/db:seed
├── CLAUDE.md                             # Instructions for Claude Code
├── index.html                            # Legacy reference (original single-file prototype)
│
├── client/                               # ─── REACT + VITE FRONTEND ───
│   ├── package.json                      # react, leaflet, zustand, tailwind, vite
│   ├── index.html                        # Entry HTML — loads Google Fonts + Leaflet CSS
│   ├── vite.config.ts                    # Vite config with React plugin, path alias @/ → src/
│   ├── tsconfig.json
│   ├── tailwind.config.ts                # Dark theme colors, font families, shadcn variables
│   ├── postcss.config.js
│   │
│   └── src/
│       ├── main.tsx                      # ReactDOM.createRoot entry point
│       ├── App.tsx                       # Renders <MainLayout />
│       ├── globals.css                   # CSS variables (dark navy palette), Leaflet overrides,
│       │                                 #   scrollbar, animations (badgePop, blink, pulse)
│       ├── vite-env.d.ts
│       │
│       ├── types/
│       │   ├── scenario.ts               # Scenario, DensityLevel, AgImpact, MetricsResult interfaces
│       │   ├── chat.ts                   # ChatMessage, ChatSession interfaces
│       │   └── gis.ts                    # Re-exports LayerConfig, LayerCategory from data/
│       │
│       ├── data/
│       │   ├── scenarios.ts              # 7 scenarios with polygon generators based on real Fitchburg
│       │   │                             #   geography (Fish Hatchery Rd, rail corridor, watershed boundaries)
│       │   │                             #   Each has: id, name, sub, color, icon, poly2030, poly2060,
│       │   │                             #   infraMult, agAcres, agImpact, description
│       │   │                             #   Also exports FITCHBURG_CENTER: [42.9957, -89.4695]
│       │   ├── metrics.ts                # Pure computeMetrics(scenario, growthRate, density) function
│       │   │                             #   $68k/acre infra cost, DENSITY_MAP: low=3, med=5, high=7.5 du/ac
│       │   └── gisLayerConfig.ts         # 17 GIS layers with styles, tooltips, gradient colors
│       │                                 #   4 categories: Planning, Infrastructure, Environment, Context
│       │                                 #   LayerConfig interface, LAYER_CATEGORIES array, GIS_FILENAMES map
│       │
│       ├── stores/
│       │   ├── scenarioStore.ts          # Zustand: activeScenario, growthRate (50-200), density (low/med/high),
│       │   │                             #   scenarios array, setters
│       │   ├── mapStore.ts               # Zustand: layerVisibility (Record<string,bool>), gisStatus string,
│       │   │                             #   sidebarCollapsed bool, toggleLayer(), toggleSidebar()
│       │   └── chatStore.ts              # Zustand: messages[], isStreaming, streamingText, sessionId,
│       │                                 #   addMessage(), setStreaming(), appendStreamingText(), etc.
│       │
│       ├── hooks/
│       │   ├── useMetrics.ts             # Calls computeMetrics with current store state, memoized
│       │   ├── useAnimatedValue.ts       # Smooth number animation (for metric counters)
│       │   ├── useGISData.ts             # Fetches GeoJSON from /api/gis/:layer on mount
│       │   └── useStreamingChat.ts       # SSE streaming to /api/ai/chat, parses chunks, updates chatStore
│       │
│       ├── lib/
│       │   ├── cn.ts                     # clsx + tailwind-merge utility
│       │   ├── api.ts                    # Axios-like fetch wrapper, base URL /api
│       │   └── formatters.ts             # highlightMetrics() — wraps numbers in <span class="hl">
│       │
│       └── components/
│           ├── layout/
│           │   ├── MainLayout.tsx         # Flex row: <Sidebar /> + <MapView />, sidebar LEFT
│           │   │                          #   Map margin adjusts on sidebar collapse
│           │   ├── Sidebar.tsx            # 420px left sidebar, scrollable, collapsible with chevron toggle
│           │   │                          #   Contains: Header, ScenarioGrid, GrowthRateSlider, DensityToggle,
│           │   │                          #   LayerToggles, MetricsGrid, AIPanel
│           │   └── Header.tsx             # Inside sidebar: brand tag "FITCHBURG, WI" (mono teal),
│           │                              #   "Growth Simulator" (Instrument Serif), GIS status pill, collapse btn
│           │
│           ├── scenarios/
│           │   ├── ScenarioGrid.tsx        # Maps scenarios array → ScenarioCard list
│           │   └── ScenarioCard.tsx        # 28x28 gradient swatch, name, description, "Active" badge with
│           │                               #   pop animation, hover state
│           │
│           ├── controls/
│           │   ├── GrowthRateSlider.tsx    # Range 50-200 ac/yr, step 25, gold accent thumb
│           │   ├── DensityToggle.tsx       # 3 buttons: Low (3) / Med (5) / High (7.5), gold active state
│           │   └── LayerToggles.tsx        # Categorized accordion (4 categories), each layer has gradient
│           │                               #   swatch + label + description + "On" badge, expandable sections
│           │
│           ├── metrics/
│           │   ├── MetricsGrid.tsx         # 2x2 grid: acres, housing units, infra cost, ag impact
│           │   └── MetricCard.tsx          # Animated counter, 17px mono value, 9px uppercase label
│           │
│           ├── map/
│           │   ├── MapView.tsx             # MapContainer with CartoDB dark tiles, absolute positioned
│           │   ├── ScenarioLayer.tsx        # Renders active scenario's poly2030/poly2060 as GeoJSON polygons
│           │   ├── GISLayers.tsx            # Fetches all 17 GIS layers on mount, renders visible ones as
│           │   │                            #   GeoJSON with styles/tooltips from gisLayerConfig
│           │   └── MapLegend.tsx            # Fixed-position frosted glass legend (backdrop-blur), shows active
│           │                                #   scenario name + color swatch, position adjusts with sidebar
│           │
│           └── ai/
│               ├── AIPanel.tsx             # Chat panel: header with pulse dot, scrollable message list, input
│               ├── ChatInput.tsx           # Quick action buttons + text input + send button
│               │                           #   Builds scenarioContext from current state for AI
│               ├── ChatMessage.tsx         # User bubbles (teal tint), assistant text (paragraph split),
│               │                           #   system messages (centered pill)
│               └── StreamingText.tsx       # Same as ChatMessage but with typing cursor animation
│
├── server/                               # ─── EXPRESS + TYPESCRIPT BACKEND ───
│   ├── package.json                      # express, better-sqlite3, drizzle-orm, @anthropic-ai/sdk
│   ├── tsconfig.json
│   ├── drizzle.config.ts
│   │
│   └── src/
│       ├── index.ts                      # Express app setup, CORS, routes mounting, listens on PORT
│       ├── config.ts                     # Reads .env: PORT, ANTHROPIC_API_KEY, DB_PATH, gisDataPath
│       │
│       ├── middleware/
│       │   ├── errorHandler.ts           # Global error handler
│       │   └── requestLogger.ts          # Logs method/path/status/duration
│       │
│       ├── db/
│       │   ├── index.ts                  # better-sqlite3 connection, Drizzle instance
│       │   ├── schema.ts                 # Tables: scenarios, chatSessions, chatMessages, preferences
│       │   └── seed.ts                   # Seeds 7 scenarios from hardcoded data
│       │
│       ├── routes/
│       │   ├── health.ts                 # GET /api/health
│       │   ├── scenarios.ts              # GET /api/scenarios, GET /api/scenarios/:id
│       │   ├── gis.ts                    # GET /api/gis/layers, GET /api/gis/:layer
│       │   │                             #   Whitelist of 17 layer IDs → filename mappings
│       │   │                             #   Reads from data/processed/, 1hr cache header
│       │   └── ai.ts                     # POST /api/ai/chat (SSE streaming)
│       │                                 #   GET/DELETE /api/ai/sessions, /api/ai/sessions/:id
│       │
│       ├── services/
│       │   ├── gisService.ts             # Reads GeoJSON files from data/processed/, in-memory cache
│       │   ├── scenarioService.ts        # CRUD for scenarios table
│       │   └── claude.ts                 # @anthropic-ai/sdk streaming, constructs messages array,
│       │                                 #   yields SSE text chunks
│       │
│       └── prompts/
│           ├── systemPrompt.ts           # Senior urban planning consultant persona for Fitchburg
│           │                             #   Knows: Nine Springs, Fish Hatchery Rd, gravity sewer costs,
│           │                             #   CARPC oversight, 2009 comp plan criteria
│           ├── analysisPrompt.ts         # Template for single-scenario deep analysis
│           └── comparisonPrompt.ts       # Template for multi-scenario comparison
│
├── scripts/                              # ─── GIS DATA PIPELINE (Python) ───
│   ├── fetch_fitchburg_gis.py            # Main fetch script — 14 ArcGIS layers + 3 OSM layers
│   │                                     #   Fitchburg ArcGIS: City_Limits, Parks, TID_Districts,
│   │                                     #   Flood_Hazard_Zones, Transit_Priority_Areas, Vacant_Land,
│   │                                     #   Urban_Service_Area, Zoning (10k+), Future_Landuse,
│   │                                     #   Building_Footprints (8k+), Sanitary_Sewer, Parcels (20k+),
│   │                                     #   Farmland_Preservation (20k+)
│   │                                     #   CARPC ArcGIS: Environmental_Corridor
│   │                                     #   OSM Overpass: streams, wetlands, rail
│   │                                     #   Supports pagination (1000/page), geopandas simplification
│   ├── fetch_gis_data.py                 # Legacy: Dane County + WI DNR + OSM (endpoints mostly dead)
│   └── process_geojson.py                # Legacy: cleans raw → processed (only useful for OSM rail now)
│
├── data/                                 # ─── GIS DATA (gitignored) ───
│   ├── raw/                              # Raw downloads from fetch scripts
│   ├── processed/                        # Web-ready minified GeoJSON (served by API)
│   │   ├── city_limits.geojson           # 1 feature, 114 KB
│   │   ├── parks.geojson                 # 93 features, 762 KB
│   │   ├── tid_districts.geojson         # 14 features, 135 KB
│   │   ├── flood_hazard.geojson          # 33 features, 1.2 MB
│   │   ├── transit_priority.geojson      # 8 features, 4 KB
│   │   ├── vacant_land.geojson           # 498 features, 1.4 MB
│   │   ├── urban_service_area.geojson    # 1 feature, 124 KB
│   │   ├── zoning.geojson                # 10,428 features, 8.2 MB
│   │   ├── future_land_use.geojson       # 732 features, 771 KB
│   │   ├── building_footprints.geojson   # 8,252 features, 4.0 MB
│   │   ├── sanitary_sewer.geojson        # 2,705 features, 1.1 MB
│   │   ├── env_corridors.geojson         # 2,315 features, 1.6 MB
│   │   ├── parcels.geojson               # 20,860 features, 34.3 MB
│   │   ├── prime_ag_soils.geojson        # 20,206 features, 18.9 MB
│   │   ├── streams.geojson               # 46 features, 22 KB
│   │   ├── wetlands.geojson              # 59 features, 61 KB
│   │   └── rail.geojson                  # 6 features, 2 KB
│   └── fitchburg.db                      # SQLite database (scenarios, chat sessions, messages)
│
└── node_modules/                         # (gitignored)
```

---

## The 7 Growth Scenarios

Each scenario models a different spatial growth strategy for Fitchburg through 2030 and 2060. They have different polygon footprints, infrastructure cost multipliers, and agricultural impact:

| # | Name | Color | Infra Mult | Ag Impact | Key Idea |
|---|------|-------|------------|-----------|----------|
| 1 | FUDA Lateral | `#e8a830` | 1.0x | high | Lateral expansion from city edge |
| 2 | Concentric | `#4a90d9` | 0.9x | medium | Radial growth from Fish Hatchery/Lacy center |
| 3 | Rail Corridor / TOD | `#e05050` | 0.85x | low | Transit-oriented along rail line |
| 4 | Utility Service / Gravity Sewer | `#7aad4a` | 0.75x | medium-low | Fiscally optimized gravity sewer zones |
| 5 | Agricultural Preservation | `#c8a050` | 1.1x | very low | Avoids Class 1 prime farmland |
| 6 | Redevelopment / Infill | `#a06cd5` | 0.65x | none | Internal infill only, zero greenfield |
| 7 | Resource Based | `#2d8a6a` | 0.95x | low | Respects watershed boundaries |

## Metrics Model

```
acres = growthRate × years          (growthRate: 50-200 ac/yr, years: 5)
units = acres × densityDU           (low=3, med=5, high=7.5 du/ac)
infraM = acres × $68,000 × scenario.infraMult / 1,000,000
agLand = scenario.agAcres × (growthRate / 75)
```

## 17 GIS Layers (organized by category)

**Planning & Land Use**: zoning, future_land_use, city_limits, tid_districts, vacant_land
**Infrastructure**: sanitary_sewer, transit_priority, rail, usa (urban service area)
**Environment & Hazards**: wetlands, streams, flood_hazard, env_corridors, soils (prime ag)
**Context**: parks, building_footprints, parcels

Each has: fill/stroke colors, tooltip function referencing real property names from the ArcGIS data, gradient swatch for the sidebar toggle.

## API Routes

| Method | Route | Purpose |
|--------|-------|---------|
| `POST` | `/api/ai/chat` | Stream AI response (SSE). Body: `{ sessionId?, message, scenarioContext }` |
| `GET` | `/api/ai/sessions` | List chat sessions |
| `GET` | `/api/ai/sessions/:id` | Get session with messages |
| `DELETE` | `/api/ai/sessions/:id` | Delete session |
| `GET` | `/api/scenarios` | List all 7 scenarios |
| `GET` | `/api/scenarios/:id` | Get single scenario |
| `GET` | `/api/gis/layers` | List available GIS layers |
| `GET` | `/api/gis/:layer` | Serve GeoJSON (whitelist-validated, cached) |
| `GET` | `/api/health` | Status check |

## Visual Design

Dark navy theme inspired by professional geo-planning tools:
- **Palette**: `#0c1117` (bg), `#1a2332` (card), `#1f2d3d` (hover), `#4ecdc4` (teal accent), `#f0c674` (gold), `#ff6b6b` (red)
- **Borders**: `rgba(255,255,255,0.06)` subtle, `rgba(255,255,255,0.15)` active
- **Typography**: Instrument Serif for headings, DM Sans for body, JetBrains Mono for data/labels
- **Map controls**: Frosted glass (backdrop-blur), styled Leaflet zoom buttons
- **Sidebar**: Left-aligned, 420px, collapsible with smooth cubic-bezier animation
- **Interactions**: Badge pop animations, gold slider thumb, categorized layer accordion with expand/collapse

## Data Sources

- **Fitchburg ArcGIS**: `https://services1.arcgis.com/1VeK15F7oaitDair/arcgis/rest/services/`
- **CARPC ArcGIS**: `https://services1.arcgis.com/4NZ4Ghri2AQmNOuO/arcgis/rest/services/`
- **OpenStreetMap**: Overpass API for streams, wetlands, rail
- **Map tiles**: CartoDB dark_all
