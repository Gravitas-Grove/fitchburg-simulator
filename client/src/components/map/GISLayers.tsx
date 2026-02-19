import { useEffect, useState } from 'react';
import { GeoJSON, LayerGroup } from 'react-leaflet';
import { useMapStore } from '@/stores/mapStore';
import { GIS_LAYERS } from '@/data/gisLayerConfig';
import type { Layer } from 'leaflet';

interface GeoJSONData {
  [key: string]: GeoJSON.FeatureCollection | null;
}

export function GISLayers() {
  const layerVisibility = useMapStore((s) => s.layerVisibility);
  const setGisStatus = useMapStore((s) => s.setGisStatus);
  const [geoData, setGeoData] = useState<GeoJSONData>({});

  useEffect(() => {
    let mounted = true;

    async function loadAll() {
      setGisStatus('Loading GIS data...');
      let loaded = 0;
      const data: GeoJSONData = {};

      for (const layer of GIS_LAYERS) {
        try {
          const res = await fetch(`/api/gis/${layer.id}`);
          if (!res.ok) {
            data[layer.id] = null;
            continue;
          }
          const json = await res.json();
          data[layer.id] = json;
          loaded++;
        } catch {
          data[layer.id] = null;
        }
      }

      if (mounted) {
        setGeoData(data);
        setGisStatus(loaded > 0 ? 'GIS data loaded ✓' : 'Base map (add GIS data)');
      }
    }

    loadAll();
    return () => { mounted = false; };
  }, [setGisStatus]);

  return (
    <>
      {GIS_LAYERS.map((layer) => {
        const data = geoData[layer.id];
        if (!data || !layerVisibility[layer.id]) return null;

        return (
          <LayerGroup key={layer.id}>
            <GeoJSON
              key={`${layer.id}-${JSON.stringify(layerVisibility[layer.id])}`}
              data={data}
              style={() => layer.style}
              onEachFeature={(feature, leafletLayer: Layer) => {
                if ('bindTooltip' in leafletLayer) {
                  (leafletLayer as any).bindTooltip(
                    layer.tooltipFn(feature.properties || {}),
                    { sticky: true }
                  );
                }
              }}
            />
          </LayerGroup>
        );
      })}
    </>
  );
}
