# Fitchburg Growth Scenario Simulator

Interactive urban planning tool for the Fitchburg, WI comprehensive plan update.
Built for the Gravitas Grove / Centrix Consulting demo.

## Project Structure

```
fitchburg-simulator/
├── index.html              ← Main application (open this in browser)
├── data/
│   ├── raw/                ← Downloaded GIS files (gitignored — run fetch script)
│   └── processed/          ← Web-ready GeoJSON (gitignored — run process script)
├── scripts/
│   ├── fetch_gis_data.py   ← Downloads real GIS data from Dane County / WI DNR / OSM
│   └── process_geojson.py  ← Cleans and prepares data for the web app
└── README.md
```

---

## Quick Start (Demo Without Real GIS Data)

Just open `index.html` in your browser. The app will:
- Load real Fitchburg streets and geography from CartoDB/OpenStreetMap tiles
- Show all 7 growth scenario overlays with parametric metrics
- Display the AI analysis panel (requires API key — see below)

No build step. No server required. Just open the file.

---

## Getting Real GIS Data (Recommended Before Client Demo)

### Step 1 — Install dependencies
```bash
pip install requests geopandas
```

### Step 2 — Fetch GIS data
```bash
python scripts/fetch_gis_data.py
```

This downloads from:
- **Dane County ArcGIS** — municipal boundaries, Urban Service Area, parcels, zoning
- **Wisconsin DNR** — wetlands (NWI), floodplains (FEMA), streams
- **OpenStreetMap** — rail corridor, Highway 14, city boundary

**Note:** Dane County's ArcGIS REST endpoints occasionally require VPN or have rate limits.
If a layer fails, you can download it manually from:
→ https://www.danecounty.gov/government/departments/landinformation/opendata

### Step 3 — Process for web
```bash
python scripts/process_geojson.py
```

### Step 4 — Get Soil Data (5 min manual step)
1. Go to https://websoilsurvey.nrcs.usda.gov/app/
2. Set AOI to Fitchburg, WI (zoom in, draw box)
3. Download → Soil Data → Shapefile
4. Convert: `ogr2ogr -f GeoJSON data/raw/soils.geojson your_soils_shapefile.shp`
5. Re-run `python scripts/process_geojson.py`

---

## Connecting the AI Analysis Feature

The "Analyze" button calls the Anthropic API. To connect it:

**Option A — Direct (dev only, exposes key in browser)**
In `index.html`, find the `fetch("https://api.anthropic.com/v1/messages"` call
and add your key to the headers:
```js
headers: {
  "Content-Type": "application/json",
  "x-api-key": "sk-ant-YOUR-KEY-HERE",
  "anthropic-version": "2023-06-01"
}
```

**Option B — Backend proxy (for any real deployment)**
Create a simple Express/Flask endpoint that proxies the call server-side.
Claude Code can build this for you — just ask.

---

## Improving the Simulator with Claude Code

Once you have this folder open in Claude Code, here are good prompts:

**GIS accuracy:**
> "Load the real city limits polygon from data/processed/city_limits.geojson and use it to replace the approximate USA overlay on the map."

**Scenario polygon refinement:**
> "The FUDA Lateral polygon doesn't match the real Fitchburg geography. Use the parcels and zoning GeoJSON to generate a more accurate growth boundary for this scenario."

**New analysis layers:**
> "Add a traffic impact layer using OpenStreetMap road network data. For each scenario, calculate how many additional vehicle trips per day would be generated based on the dwelling units."

**Comparison mode:**
> "Add a side-by-side comparison view where the user can select two scenarios and see their metrics and AI analysis side by side."

**Community input:**
> "Add a multilingual public comment widget (English/Spanish) that lets residents drop a pin on the map and explain what matters to them about a specific location."

**Export:**
> "Add a button to export the current scenario as a PDF report including the map screenshot, metrics table, and AI analysis text."

---

## Data Sources & Credits

| Layer | Source | URL |
|-------|--------|-----|
| Base map tiles | CartoDB / OpenStreetMap | https://carto.com |
| Municipal boundaries | Dane County LIO | https://gis.countyofdane.com |
| Parcels / Zoning | Dane County LIO | https://gis.countyofdane.com |
| Wetlands | WI DNR / NWI | https://dnrmaps.wi.gov |
| Floodplains | FEMA via WI DNR | https://dnrmaps.wi.gov |
| Streams | WI DNR | https://dnrmaps.wi.gov |
| Rail / Roads | OpenStreetMap | https://www.openstreetmap.org |
| Prime Ag Soils | USDA NRCS Web Soil Survey | https://websoilsurvey.nrcs.usda.gov |
| Fitchburg 2009 Growth Models | City of Fitchburg Planning Dept. | https://www.fitchburgwi.gov |

---

## Known Issues / TODO

- [ ] Growth scenario polygons are approximate — need real GIS data to make them precise
- [ ] Infrastructure cost model uses flat $/acre assumptions — could be improved with actual Dane County utility extension cost data
- [ ] AI analysis has no memory across scenarios — doesn't compare scenarios to each other
- [ ] No mobile layout yet
- [ ] Parcels layer is slow to load — needs spatial indexing or tile server for production

---

*Built by Gravitas Grove LLC · February 2026*
