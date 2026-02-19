import { Polygon, Tooltip, LayerGroup } from 'react-leaflet';
import { useScenarioStore } from '@/stores/scenarioStore';
import type { LatLngExpression } from 'leaflet';

export function ScenarioLayer() {
  const activeScenario = useScenarioStore((s) => s.activeScenario);

  if (!activeScenario) return null;

  // Flip [lng, lat] → [lat, lng] for Leaflet
  const pts2030: LatLngExpression[] = activeScenario.poly2030.map(
    ([lng, lat]) => [lat, lng] as LatLngExpression
  );
  const pts2060: LatLngExpression[] = activeScenario.poly2060.map(
    ([lng, lat]) => [lat, lng] as LatLngExpression
  );

  return (
    <LayerGroup>
      {/* 2060 horizon — dashed, low opacity */}
      <Polygon
        positions={pts2060}
        pathOptions={{
          color: activeScenario.color,
          weight: 1,
          fillColor: activeScenario.color,
          fillOpacity: 0.10,
          dashArray: '4,5',
        }}
      >
        <Tooltip sticky>{activeScenario.name} — 2060 Horizon</Tooltip>
      </Polygon>

      {/* 2030 near-term — solid, higher opacity */}
      <Polygon
        positions={pts2030}
        pathOptions={{
          color: activeScenario.color,
          weight: 2.5,
          fillColor: activeScenario.color,
          fillOpacity: 0.28,
        }}
      >
        <Tooltip sticky>{activeScenario.name} — 2030 Near-Term</Tooltip>
      </Polygon>
    </LayerGroup>
  );
}
