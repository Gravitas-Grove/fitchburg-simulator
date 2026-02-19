import { create } from 'zustand';
import { GIS_LAYERS } from '@/data/gisLayerConfig';

interface MapState {
  layerVisibility: Record<string, boolean>;
  gisStatus: string;
  sidebarCollapsed: boolean;
  toggleLayer: (layerId: string) => void;
  setGisStatus: (status: string) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

const initialVisibility: Record<string, boolean> = {};
for (const layer of GIS_LAYERS) {
  initialVisibility[layer.id] = layer.defaultVisible;
}

export const useMapStore = create<MapState>((set) => ({
  layerVisibility: initialVisibility,
  gisStatus: 'Loading map...',
  sidebarCollapsed: false,
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
}));
