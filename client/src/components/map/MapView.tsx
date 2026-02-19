import { MapContainer, TileLayer } from 'react-leaflet';
import { FITCHBURG_CENTER } from '@/data/scenarios';
import { ScenarioLayer } from './ScenarioLayer';
import { GISLayers } from './GISLayers';
import { MapLegend } from './MapLegend';
import 'leaflet/dist/leaflet.css';

export function MapView() {
  return (
    <div className="absolute inset-0">
      <MapContainer
        center={FITCHBURG_CENTER}
        zoom={12}
        zoomControl={true}
        className="h-full w-full"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />
        <GISLayers />
        <ScenarioLayer />
      </MapContainer>
      <MapLegend />
    </div>
  );
}
