import { create } from 'zustand';
import { fetchScenarioParcels, type ScenarioParcel } from '@/lib/api';

interface ParcelStore {
  parcels: ScenarioParcel[];
  loading: boolean;
  error: string | null;
  scenarioId: string | null;
  selectedParcelNo: string | null;
  hoveredParcelNo: string | null;
  fetchParcels: (scenarioId: string) => Promise<void>;
  setSelectedParcel: (parcelNo: string | null) => void;
  setHoveredParcel: (parcelNo: string | null) => void;
  clearParcels: () => void;
}

export const useParcelStore = create<ParcelStore>((set, get) => ({
  parcels: [],
  loading: false,
  error: null,
  scenarioId: null,
  selectedParcelNo: null,
  hoveredParcelNo: null,

  fetchParcels: async (scenarioId: string) => {
    // Don't refetch if already loaded for this scenario
    if (get().scenarioId === scenarioId && get().parcels.length > 0) return;

    set({ loading: true, error: null, scenarioId });
    try {
      const response = await fetchScenarioParcels(scenarioId);
      set({ parcels: response.parcels, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load parcels',
        loading: false,
        parcels: [],
      });
    }
  },

  setSelectedParcel: (parcelNo) => set({ selectedParcelNo: parcelNo }),
  setHoveredParcel: (parcelNo) => set({ hoveredParcelNo: parcelNo }),
  clearParcels: () => set({ parcels: [], scenarioId: null, selectedParcelNo: null, hoveredParcelNo: null }),
}));
