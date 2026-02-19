#!/usr/bin/env python3
"""
Fetch GIS data from Fitchburg's ArcGIS REST services and OSM.

Tier 1 — Small datasets (no pagination, fetch directly)
Tier 2 — Large datasets (require pagination via resultOffset/resultRecordCount)
OSM    — OpenStreetMap Overpass API (streams, wetlands)

Output: data/processed/{layer_id}.geojson
"""

import json
import os
import sys
import time
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
from urllib.parse import urlencode

# Optional: geopandas for geometry simplification of large datasets
try:
    import geopandas as gpd
    HAS_GEOPANDAS = True
except ImportError:
    HAS_GEOPANDAS = False

OUTPUT_DIR = Path(__file__).resolve().parent.parent / "data" / "processed"

FITCHBURG_BASE = "https://services1.arcgis.com/1VeK15F7oaitDair/arcgis/rest/services"
CARPC_BASE = "https://services1.arcgis.com/4NZ4Ghri2AQmNOuO/arcgis/rest/services"

# Fitchburg bounding box: W,S,E,N
BBOX = (42.96, -89.50, 43.06, -89.40)  # S, W, N, E for Overpass

# ArcGIS layer definitions: (layer_id, service_name, base_url, tier, simplify_tolerance)
ARCGIS_LAYERS = [
    # Tier 1 — Small datasets
    ("city_limits",     "City_Limits",                    FITCHBURG_BASE, 1, None),
    ("parks",           "Fitchburg_Parks",                FITCHBURG_BASE, 1, None),
    ("tid_districts",   "TID_Districts",                  FITCHBURG_BASE, 1, None),
    ("flood_hazard",    "Fitchburg_Flood_Hazard_Zones",   FITCHBURG_BASE, 1, None),
    ("transit_priority","Transit_Priority_Areas",          FITCHBURG_BASE, 1, None),
    ("vacant_land",     "Vacant_Land",                    FITCHBURG_BASE, 1, None),
    ("urban_service_area", "Urban_Service_Area",          FITCHBURG_BASE, 1, None),

    # Tier 2 — Large datasets (need pagination)
    ("zoning",             "Zoning",                      FITCHBURG_BASE, 2, 0.0001),
    ("future_land_use",    "Future_Landuse",              FITCHBURG_BASE, 2, 0.0001),
    ("building_footprints","Building_Footprints",         FITCHBURG_BASE, 2, 0.0001),
    ("sanitary_sewer",     "Fitchburg_Sanitary_Sewer",    FITCHBURG_BASE, 2, None),
    ("env_corridors",      "Environmental_Corridor",      CARPC_BASE,     2, 0.0001),
    ("parcels",            "Parcels",                     FITCHBURG_BASE, 2, 0.0001),
    ("prime_ag_soils",     "Farmland_Preservation",       FITCHBURG_BASE, 2, 0.0001),
]

# OSM Overpass queries
OSM_LAYERS = {
    "streams": {
        "query": (
            '[out:json][timeout:30];'
            '(way["waterway"~"stream|river|creek"](42.96,-89.50,43.06,-89.40););'
            'out geom;'
        ),
        "geom_type": "LineString",
        "props_fn": lambda tags: {"RIVER_SYS_NAME": tags.get("name", "Stream")},
    },
    "wetlands": {
        "query": (
            '[out:json][timeout:30];'
            '(way["natural"="wetland"](42.96,-89.50,43.06,-89.40);'
            ' relation["natural"="wetland"](42.96,-89.50,43.06,-89.40););'
            'out geom;'
        ),
        "geom_type": "Polygon",
        "props_fn": lambda tags: {"WETLAND_TY": tags.get("wetland", tags.get("natural", "wetland"))},
    },
    "rail": {
        "query": (
            '[out:json][timeout:30];'
            '(way["railway"="rail"](42.96,-89.50,43.06,-89.40);'
            ' way["railway"="light_rail"](42.96,-89.50,43.06,-89.40););'
            'out geom;'
        ),
        "geom_type": "LineString",
        "props_fn": lambda tags: {"name": tags.get("name", "Rail"), "railway": tags.get("railway", "rail")},
    },
}

PAGE_SIZE = 1000
TIMEOUT = 60  # seconds per request
OVERPASS_URL = "https://overpass-api.de/api/interpreter"


def fetch_json(url: str) -> dict:
    """Fetch JSON from a URL with retry logic."""
    for attempt in range(3):
        try:
            req = Request(url, headers={"User-Agent": "FitchburgGIS/1.0"})
            with urlopen(req, timeout=TIMEOUT) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except (URLError, HTTPError, TimeoutError) as e:
            if attempt < 2:
                print(f"    Retry {attempt + 1} after error: {e}")
                time.sleep(2 ** attempt)
            else:
                raise


def build_query_url(base_url: str, service: str, offset: int = 0, count: int = PAGE_SIZE) -> str:
    """Build an ArcGIS REST query URL for GeoJSON output."""
    return (
        f"{base_url}/{service}/FeatureServer/0/query"
        f"?where=1%3D1"
        f"&outFields=*"
        f"&f=geojson"
        f"&resultOffset={offset}"
        f"&resultRecordCount={count}"
    )


def fetch_layer_simple(base_url: str, service: str) -> dict:
    """Fetch a small layer in a single request."""
    url = build_query_url(base_url, service, offset=0, count=10000)
    return fetch_json(url)


def fetch_layer_paginated(base_url: str, service: str) -> dict:
    """Fetch a large layer using pagination, merging all pages."""
    all_features = []
    offset = 0

    while True:
        url = build_query_url(base_url, service, offset=offset, count=PAGE_SIZE)
        data = fetch_json(url)

        features = data.get("features", [])
        if not features:
            break

        all_features.extend(features)
        print(f"    Fetched {len(all_features)} features (offset {offset})...")

        if len(features) < PAGE_SIZE:
            break

        offset += PAGE_SIZE
        time.sleep(0.5)  # Be polite to the server

    # Build merged FeatureCollection
    return {
        "type": "FeatureCollection",
        "features": all_features,
    }


def fetch_osm_layer(layer_id: str, config: dict) -> dict:
    """Fetch features from OSM Overpass API and convert to GeoJSON."""
    query = config["query"]
    geom_type = config["geom_type"]
    props_fn = config["props_fn"]

    data_bytes = urlencode({"data": query}).encode()
    req = Request(OVERPASS_URL, data=data_bytes, headers={"User-Agent": "FitchburgGIS/1.0"})

    with urlopen(req, timeout=TIMEOUT) as resp:
        result = json.loads(resp.read().decode("utf-8"))

    features = []
    for elem in result.get("elements", []):
        tags = elem.get("tags", {})
        props = props_fn(tags)

        if elem.get("type") == "way" and "geometry" in elem:
            coords = [[p["lon"], p["lat"]] for p in elem["geometry"]]
            if geom_type == "Polygon" and len(coords) >= 4:
                # Close the ring if needed
                if coords[0] != coords[-1]:
                    coords.append(coords[0])
                geometry = {"type": "Polygon", "coordinates": [coords]}
            else:
                geometry = {"type": "LineString", "coordinates": coords}
            features.append({"type": "Feature", "properties": props, "geometry": geometry})

        elif elem.get("type") == "relation":
            for member in elem.get("members", []):
                if member.get("type") == "way" and "geometry" in member:
                    coords = [[p["lon"], p["lat"]] for p in member["geometry"]]
                    if geom_type == "Polygon" and len(coords) >= 4:
                        if coords[0] != coords[-1]:
                            coords.append(coords[0])
                        geometry = {"type": "Polygon", "coordinates": [coords]}
                    else:
                        geometry = {"type": "LineString", "coordinates": coords}
                    features.append({"type": "Feature", "properties": props, "geometry": geometry})

    return {"type": "FeatureCollection", "features": features}


def simplify_geojson(geojson_data: dict, tolerance: float) -> dict:
    """Simplify geometries using geopandas to reduce file size."""
    if not HAS_GEOPANDAS:
        print("    (geopandas not available, skipping simplification)")
        return geojson_data

    gdf = gpd.GeoDataFrame.from_features(geojson_data["features"])
    original_count = len(gdf)

    # Simplify geometries
    gdf["geometry"] = gdf["geometry"].simplify(tolerance, preserve_topology=True)

    # Remove empty geometries
    gdf = gdf[~gdf["geometry"].is_empty]

    print(f"    Simplified: {original_count} -> {len(gdf)} features (tolerance={tolerance})")

    # Convert back to GeoJSON dict
    return json.loads(gdf.to_json())


def write_geojson(layer_id: str, geojson: dict) -> tuple:
    """Write GeoJSON to file, return (feature_count, file_size)."""
    out_path = OUTPUT_DIR / f"{layer_id}.geojson"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(geojson, f, separators=(",", ":"))  # Minified
    return len(geojson.get("features", [])), out_path.stat().st_size


def format_size(size_bytes: int) -> str:
    """Format file size for display."""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.1f} MB"


def main():
    print("=" * 60)
    print("Fitchburg GIS Data Fetcher")
    print("=" * 60)
    print()

    # Ensure output directory exists
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Output directory: {OUTPUT_DIR}")
    print()

    results = []

    # --- ArcGIS Layers ---
    print("--- ArcGIS REST Services ---")
    print()
    for layer_id, service, base_url, tier, simplify_tol in ARCGIS_LAYERS:
        print(f"[{layer_id}] Fetching from {service}...")

        try:
            if tier == 1:
                geojson = fetch_layer_simple(base_url, service)
            else:
                geojson = fetch_layer_paginated(base_url, service)

            feature_count = len(geojson.get("features", []))

            if feature_count == 0:
                print(f"    WARNING: No features returned!")
                results.append((layer_id, 0, 0, "EMPTY"))
                continue

            # Simplify large datasets if geopandas available
            if simplify_tol is not None and feature_count > 100:
                geojson = simplify_geojson(geojson, simplify_tol)

            count, size = write_geojson(layer_id, geojson)
            print(f"    OK: {count} features -> {format_size(size)}")
            results.append((layer_id, count, size, "OK"))

        except Exception as e:
            print(f"    FAIL: {e}")
            results.append((layer_id, 0, 0, f"ERROR: {e}"))

        print()

    # --- OSM Overpass Layers ---
    print("--- OpenStreetMap (Overpass API) ---")
    print()
    for layer_id, config in OSM_LAYERS.items():
        print(f"[{layer_id}] Fetching from Overpass...")

        try:
            geojson = fetch_osm_layer(layer_id, config)
            feature_count = len(geojson.get("features", []))

            if feature_count == 0:
                print(f"    WARNING: No features returned!")
                results.append((layer_id, 0, 0, "EMPTY"))
                continue

            count, size = write_geojson(layer_id, geojson)
            print(f"    OK: {count} features -> {format_size(size)}")
            results.append((layer_id, count, size, "OK"))

        except Exception as e:
            print(f"    FAIL: {e}")
            results.append((layer_id, 0, 0, f"ERROR: {e}"))

        time.sleep(1)  # Overpass rate limit
        print()

    # Summary
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"{'Layer':<22} {'Features':>8} {'Size':>10} {'Status'}")
    print("-" * 60)
    total_size = 0
    for layer_id, count, size, status in results:
        total_size += size
        print(f"{layer_id:<22} {count:>8} {format_size(size):>10} {status}")
    print("-" * 60)
    print(f"{'TOTAL':<22} {'':>8} {format_size(total_size):>10}")
    print()

    ok_count = sum(1 for _, _, _, s in results if s == "OK")
    total = len(ARCGIS_LAYERS) + len(OSM_LAYERS)
    print(f"Successfully fetched {ok_count}/{total} layers.")

    if not HAS_GEOPANDAS:
        print()
        print("NOTE: Install geopandas for geometry simplification of large datasets:")
        print("  pip install geopandas")


if __name__ == "__main__":
    main()
