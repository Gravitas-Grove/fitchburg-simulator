import { MapContainer, TileLayer } from 'react-leaflet';
import { FITCHBURG_CENTER } from '@/data/scenarios';
import { BASEMAPS } from '@/data/basemapConfig';
import { useMapStore } from '@/stores/mapStore';
import { ScenarioLayer } from './ScenarioLayer';
import { ParcelLayer } from './ParcelLayer';
import { GISLayers } from './GISLayers';
import { MapLegend } from './MapLegend';
import { BasemapSwitcher } from './BasemapSwitcher';
import { TimelineSlider } from './TimelineSlider';
import 'leaflet/dist/leaflet.css';

export function MapView() {
  const basemapId = useMapStore((s) => s.basemap);
  const basemap = BASEMAPS[basemapId];

  return (
    <div className="absolute inset-0" data-basemap={basemapId}>
      <MapContainer
        center={FITCHBURG_CENTER}
        zoom={12}
        zoomControl={true}
        preferCanvas={true}
        className="h-full w-full"
      >
        <TileLayer
          key={basemapId}
          url={basemap.url}
          attribution={basemap.attribution}
          subdomains={basemap.subdomains || ''}
          maxZoom={basemap.maxZoom || 20}
        />
        <GISLayers />
        <ScenarioLayer />
        <ParcelLayer />
      </MapContainer>
      <MapLegend />
      <BasemapSwitcher />
      <TimelineSlider />
    </div>
  );
}
