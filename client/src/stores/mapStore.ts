import { create } from 'zustand';
import { GIS_LAYERS } from '@/data/gisLayerConfig';
import type { BasemapId } from '@/data/basemapConfig';

export type SidebarTab = 'scenarios' | 'scorecard' | 'compare';

interface MapState {
  layerVisibility: Record<string, boolean>;
  gisStatus: string;
  sidebarCollapsed: boolean;
  basemap: BasemapId;
  activeTab: SidebarTab;
  // Timeline state
  currentYear: number;
  isPlaying: boolean;
  playSpeed: number;
  toggleLayer: (layerId: string) => void;
  setGisStatus: (status: string) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setBasemap: (basemap: BasemapId) => void;
  setActiveTab: (tab: SidebarTab) => void;
  setCurrentYear: (year: number) => void;
  togglePlay: () => void;
  setPlaySpeed: (speed: number) => void;
}

const initialVisibility: Record<string, boolean> = {};
for (const layer of GIS_LAYERS) {
  initialVisibility[layer.id] = layer.defaultVisible;
}

export const useMapStore = create<MapState>((set) => ({
  layerVisibility: initialVisibility,
  gisStatus: 'Loading map...',
  sidebarCollapsed: false,
  basemap: 'dark',
  activeTab: 'scenarios',
  toggleLayer: (layerId) =>
    set((state) => ({
      layerVisibility: {
        ...state.layerVisibility,
        [layerId]: !state.layerVisibility[layerId],
      },
    })),
  setGisStatus: (status) => set({ gisStatus: status }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setBasemap: (basemap) => set({ basemap }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  // Timeline
  currentYear: 2025,
  isPlaying: false,
  playSpeed: 1,
  setCurrentYear: (year) => set({ currentYear: Math.max(2025, Math.min(2060, year)) }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setPlaySpeed: (speed) => set({ playSpeed: speed }),
}));
