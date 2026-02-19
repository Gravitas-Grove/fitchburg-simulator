export type BasemapId = 'dark' | 'light' | 'satellite' | 'terrain' | 'google';

export interface BasemapOption {
  id: BasemapId;
  label: string;
  url: string;
  attribution: string;
  subdomains?: string;
  maxZoom?: number;
}

const hasGoogleKey = !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export const BASEMAPS: Record<BasemapId, BasemapOption> = {
  dark: {
    id: 'dark',
    label: 'Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20,
  },
  light: {
    id: 'light',
    label: 'Light',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20,
  },
  satellite: {
    id: 'satellite',
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri',
    maxZoom: 19,
  },
  terrain: {
    id: 'terrain',
    label: 'Terrain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap',
    subdomains: 'abc',
    maxZoom: 17,
  },
  google: {
    id: 'google',
    label: 'Google',
    url: hasGoogleKey
      ? 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
      : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: hasGoogleKey ? '&copy; Google' : '&copy; Esri',
    maxZoom: 20,
  },
};

// Filter out Google basemap if no API key
export const BASEMAP_LIST: BasemapOption[] = Object.values(BASEMAPS).filter(
  (b) => b.id !== 'google' || hasGoogleKey
);
