import { Polygon, Tooltip, LayerGroup } from 'react-leaflet';
import { useScenarioStore } from '@/stores/scenarioStore';
import { useParcelStore } from '@/stores/parcelStore';
import type { LatLngExpression } from 'leaflet';

export function ScenarioLayer() {
  const activeScenario = useScenarioStore((s) => s.activeScenario);
  const parcelsLoaded = useParcelStore((s) => s.parcels.length > 0);

  if (!activeScenario) return null;

  // Flip [lng, lat] -> [lat, lng] for Leaflet
  const pts2030: LatLngExpression[] = activeScenario.poly2030.map(
    ([lng, lat]) => [lat, lng] as LatLngExpression
  );
  const pts2060: LatLngExpression[] = activeScenario.poly2060.map(
    ([lng, lat]) => [lat, lng] as LatLngExpression
  );

  // When parcels are loaded, show boundaries as subtle reference outlines only
  if (parcelsLoaded) {
    return (
      <LayerGroup>
        <Polygon
          positions={pts2060}
          pathOptions={{
            color: activeScenario.color,
            weight: 1,
            fillOpacity: 0,
            opacity: 0.3,
            dashArray: '6,4',
          }}
        >
          <Tooltip sticky>{activeScenario.name} — 2060 Boundary</Tooltip>
        </Polygon>
        <Polygon
          positions={pts2030}
          pathOptions={{
            color: activeScenario.color,
            weight: 1.5,
            fillOpacity: 0,
            opacity: 0.4,
            dashArray: '4,3',
          }}
        >
          <Tooltip sticky>{activeScenario.name} — 2030 Boundary</Tooltip>
        </Polygon>
      </LayerGroup>
    );
  }

  // Default: full polygon rendering (no parcel data available)
  return (
    <LayerGroup>
      <Polygon
        positions={pts2060}
        pathOptions={{
          color: activeScenario.color,
          weight: 1,
          fillColor: activeScenario.color,
          fillOpacity: 0.08,
          dashArray: '4,5',
        }}
      >
        <Tooltip sticky>{activeScenario.name} — 2060 Horizon</Tooltip>
      </Polygon>
      <Polygon
        positions={pts2030}
        pathOptions={{
          color: activeScenario.color,
          weight: 8,
          fillOpacity: 0,
          opacity: 0.15,
        }}
      />
      <Polygon
        positions={pts2030}
        pathOptions={{
          color: activeScenario.color,
          weight: 2.5,
          fillColor: activeScenario.color,
          fillOpacity: 0.25,
        }}
      >
        <Tooltip sticky>{activeScenario.name} — 2030 Near-Term</Tooltip>
      </Polygon>
    </LayerGroup>
  );
}
