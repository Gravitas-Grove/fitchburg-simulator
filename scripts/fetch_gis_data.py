"""
fetch_gis_data.py
=================
Downloads real GIS data for the Fitchburg Growth Simulator.
Run this once before starting development.

USAGE:
    pip install requests
    python scripts/fetch_gis_data.py

After this runs, execute:
    python scripts/process_geojson.py
"""

import requests
import json
import os

RAW = os.path.join(os.path.dirname(__file__), '..', 'data', 'raw')
os.makedirs(RAW, exist_ok=True)

# ─── Dane County ArcGIS REST Endpoints ───────────────────────────────────────
# Full catalog: https://gis.countyofdane.com/arcgis/rest/services
FITCHBURG_BBOX = "-89.590,42.940,-89.380,43.090"  # W,S,E,N

DANE_ENDPOINTS = {
    "municipal_boundaries": (
        "https://gis.countyofdane.com/arcgis/rest/services/GeneralReference/"
        "MunicipalBoundaries/MapServer/0/query"
        "?where=MUNIC_NAME+LIKE+'%25FITCHBURG%25'&outFields=*&f=geojson"
    ),
    "urban_service_area": (
        "https://gis.countyofdane.com/arcgis/rest/services/GeneralReference/"
        "UrbanServiceAreas/MapServer/0/query"
        "?where=MUNIC_NAME+LIKE+'%25FITCHBURG%25'&outFields=*&f=geojson"
    ),
    "parcels": (
        "https://gis.countyofdane.com/arcgis/rest/services/Parcels/"
        "Parcels/MapServer/0/query"
        f"?geometry={FITCHBURG_BBOX}&geometryType=esriGeometryEnvelope"
        "&spatialRel=esriSpatialRelIntersects"
        "&outFields=PARCELID,ZONING,LANDUSE,ACRES&f=geojson"
    ),
    "zoning": (
        "https://gis.countyofdane.com/arcgis/rest/services/Zoning/"
        "Zoning/MapServer/0/query"
        f"?geometry={FITCHBURG_BBOX}&geometryType=esriGeometryEnvelope"
        "&spatialRel=esriSpatialRelIntersects&outFields=*&f=geojson"
    ),
}

# ─── Wisconsin DNR Endpoints ──────────────────────────────────────────────────
DNR_ENDPOINTS = {
    "wetlands": (
        "https://dnrmaps.wi.gov/arcgis/rest/services/WT_Wetlands/"
        "WT_WDNR_WTL_WETLAND_POLY_WTM_Ext/MapServer/0/query"
        f"?geometry={FITCHBURG_BBOX}&geometryType=esriGeometryEnvelope"
        "&spatialRel=esriSpatialRelIntersects&outFields=WETLAND_TY,ACRES"
        "&f=geojson&inSR=4326&outSR=4326"
    ),
    "floodplains": (
        "https://dnrmaps.wi.gov/arcgis/rest/services/FM_Flood/"
        "FM_FEMA_FLOOD_HAZARD_AREAS_WTM_Ext/MapServer/0/query"
        f"?geometry={FITCHBURG_BBOX}&geometryType=esriGeometryEnvelope"
        "&spatialRel=esriSpatialRelIntersects&outFields=FLD_ZONE,FLOODWAY"
        "&f=geojson&inSR=4326&outSR=4326"
    ),
    "streams": (
        "https://dnrmaps.wi.gov/arcgis/rest/services/WM_Water/"
        "WM_Hydro_Watercourse_WTM_Ext/MapServer/1/query"
        f"?geometry={FITCHBURG_BBOX}&geometryType=esriGeometryEnvelope"
        "&spatialRel=esriSpatialRelIntersects&outFields=RIVER_SYS_NAME"
        "&f=geojson&inSR=4326&outSR=4326"
    ),
}

# ─── OpenStreetMap (rail, Highway 14, city boundary) ─────────────────────────
OSM_QUERIES = {
    "rail": """[out:json][timeout:30];
(way["railway"="rail"](42.940,-89.590,43.090,-89.380);
 way["railway"="light_rail"](42.940,-89.590,43.090,-89.380););
out geom;""",

    "highway14": """[out:json][timeout:30];
way["ref"="14"](42.940,-89.590,43.090,-89.380);
out geom;""",

    "city_boundary": """[out:json][timeout:30];
relation["name"="Fitchburg"]["admin_level"="6"]["type"="boundary"];
out geom;"""
}


def download_geojson(name, url):
    print(f"  Fetching {name} ...")
    try:
        r = requests.get(url, timeout=30)
        r.raise_for_status()
        data = r.json()
        path = os.path.join(RAW, f"{name}.geojson")
        with open(path, 'w') as f:
            json.dump(data, f)
        n = len(data.get('features', []))
        print(f"  ✓  {name}: {n} features  →  data/raw/{name}.geojson")
    except Exception as e:
        print(f"  ✗  {name}: {e}")


def fetch_osm(name, query):
    print(f"  Fetching OSM {name} ...")
    try:
        r = requests.post("https://overpass-api.de/api/interpreter",
                          data={"data": query}, timeout=30)
        r.raise_for_status()
        data = r.json()
        features = []
        for elem in data.get('elements', []):
            if elem.get('type') == 'way' and 'geometry' in elem:
                coords = [[p['lon'], p['lat']] for p in elem['geometry']]
                features.append({
                    "type": "Feature",
                    "properties": elem.get('tags', {}),
                    "geometry": {"type": "LineString", "coordinates": coords}
                })
            elif elem.get('type') == 'relation':
                # Relations for city boundaries
                for member in elem.get('members', []):
                    if member.get('type') == 'way' and 'geometry' in member:
                        coords = [[p['lon'], p['lat']] for p in member['geometry']]
                        features.append({
                            "type": "Feature",
                            "properties": elem.get('tags', {}),
                            "geometry": {"type": "LineString", "coordinates": coords}
                        })
        geojson = {"type": "FeatureCollection", "features": features}
        path = os.path.join(RAW, f"osm_{name}.geojson")
        with open(path, 'w') as f:
            json.dump(geojson, f)
        print(f"  ✓  osm_{name}: {len(features)} features  →  data/raw/osm_{name}.geojson")
    except Exception as e:
        print(f"  ✗  osm_{name}: {e}")


if __name__ == "__main__":
    print("\n🗺   Fitchburg GIS Data Fetcher")
    print("=" * 50)

    print("\n[1/3] Dane County ArcGIS...")
    for name, url in DANE_ENDPOINTS.items():
        download_geojson(name, url)

    print("\n[2/3] Wisconsin DNR...")
    for name, url in DNR_ENDPOINTS.items():
        download_geojson(name, url)

    print("\n[3/3] OpenStreetMap (Overpass)...")
    for name, query in OSM_QUERIES.items():
        fetch_osm(name, query)

    print("""
─────────────────────────────────────────────────
SOIL DATA (manual download — 5 minutes):
─────────────────────────────────────────────────
1. Go to https://websoilsurvey.nrcs.usda.gov/app/
2. Set Area of Interest to Fitchburg, WI
3. Download → Soil Data → Tabular Data (CSV)
   OR Download Shapefile and convert to GeoJSON:
   ogr2ogr -f GeoJSON data/raw/soils.geojson <shapefile.shp>
4. Key field: farmlndcl = "Prime farmland" = Soil Class 1

─────────────────────────────────────────────────
NEXT STEP:
─────────────────────────────────────────────────
    python scripts/process_geojson.py
""")
