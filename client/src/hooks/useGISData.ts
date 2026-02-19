import { useEffect, useRef } from 'react';
import { useMapStore } from '@/stores/mapStore';
import { GIS_FILENAMES } from '@/data/gisLayerConfig';

// Cache loaded GeoJSON data
const geoJsonCache: Record<string, GeoJSON.FeatureCollection | null> = {};

export function useGISData() {
  const setGisStatus = useMapStore((s) => s.setGisStatus);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    async function loadAll() {
      setGisStatus('Loading GIS data...');
      let loaded = 0;

      for (const [layerId, filename] of Object.entries(GIS_FILENAMES)) {
        try {
          const res = await fetch(`/api/gis/${layerId}`);
          if (!res.ok) {
            geoJsonCache[layerId] = null;
            continue;
          }
          const data = await res.json();
          geoJsonCache[layerId] = data;
          loaded++;
        } catch {
          geoJsonCache[layerId] = null;
        }
      }

      if (loaded > 0) {
        setGisStatus(`GIS data loaded ✓`);
      } else {
        setGisStatus('Base map (add GIS data)');
      }
    }

    loadAll();
  }, [setGisStatus]);

  return geoJsonCache;
}

export function getGeoJsonData(layerId: string): GeoJSON.FeatureCollection | null {
  return geoJsonCache[layerId] ?? null;
}
