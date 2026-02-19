"""
process_geojson.py
==================
Cleans and prepares raw GIS downloads for the web simulator.
Outputs lightweight, web-ready GeoJSON files to data/processed/

USAGE:
    pip install geopandas shapely
    python scripts/process_geojson.py

Requires data/raw/ to be populated first (run fetch_gis_data.py)
"""

import json
import os

RAW = os.path.join(os.path.dirname(__file__), '..', 'data', 'raw')
OUT = os.path.join(os.path.dirname(__file__), '..', 'data', 'processed')
os.makedirs(OUT, exist_ok=True)


def load(name):
    path = os.path.join(RAW, f"{name}.geojson")
    if not os.path.exists(path):
        print(f"  ⚠  Missing: data/raw/{name}.geojson — skipping")
        return None
    with open(path) as f:
        return json.load(f)


def save(name, data):
    path = os.path.join(OUT, f"{name}.geojson")
    with open(path, 'w') as f:
        json.dump(data, f, separators=(',', ':'))  # minified
    size_kb = os.path.getsize(path) / 1024
    print(f"  ✓  {name}.geojson  ({size_kb:.1f} KB)  →  data/processed/")


def simplify_properties(features, keep_fields):
    """Strip unnecessary fields to reduce file size."""
    out = []
    for f in features:
        out.append({
            "type": "Feature",
            "geometry": f.get("geometry"),
            "properties": {k: f["properties"].get(k) for k in keep_fields}
        })
    return out


# ─── Process each layer ───────────────────────────────────────────────────────

print("\n🔧  Processing GIS layers for web app")
print("=" * 50)

# City limits
d = load("municipal_boundaries")
if d:
    fitchburg = [f for f in d["features"]
                 if "FITCHBURG" in str(f["properties"]).upper()]
    save("city_limits", {"type": "FeatureCollection", "features": fitchburg})

# Urban Service Area
d = load("urban_service_area")
if d:
    save("urban_service_area", d)

# Wetlands — simplify to just type + area
d = load("wetlands")
if d:
    features = simplify_properties(d["features"], ["WETLAND_TY", "ACRES"])
    save("wetlands", {"type": "FeatureCollection", "features": features})

# Floodplains
d = load("floodplains")
if d:
    # Only keep 100-year floodplain (A zones)
    flood = [f for f in d["features"]
             if str(f["properties"].get("FLD_ZONE", "")).startswith("A")]
    save("floodplains", {"type": "FeatureCollection", "features": flood})

# Streams
d = load("streams")
if d:
    features = simplify_properties(d["features"], ["RIVER_SYS_NAME"])
    save("streams", {"type": "FeatureCollection", "features": features})

# Rail line
d = load("osm_rail")
if d:
    save("rail", d)

# Highway 14
d = load("osm_highway14")
if d:
    save("highway14", d)

# Parcels — strip to essentials for performance
d = load("parcels")
if d:
    features = simplify_properties(d["features"], ["PARCELID", "ZONING", "LANDUSE", "ACRES"])
    save("parcels", {"type": "FeatureCollection", "features": features})

# Soils (if downloaded manually)
d = load("soils")
if d:
    # Filter to Class 1 prime farmland only
    prime = [f for f in d["features"]
             if "prime" in str(f["properties"].get("farmlndcl", "")).lower()]
    save("prime_ag_soils", {"type": "FeatureCollection", "features": prime})

print("\n✅ Done. Data ready in data/processed/")
print("\nNext: open index.html in your browser, or run:")
print("    python -m http.server 8080")
print("    → http://localhost:8080")
